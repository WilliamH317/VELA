/**
 * LAMINAR Stage 2 — Temporal Pattern Runner
 *
 * Convex action that orchestrates the full CURRENTS temporal analysis pipeline:
 * fetch access events → estimate trajectories → detect periodicity →
 * build co-occurrence matrix → upsert results.
 *
 * This is an action (not query/mutation) because it performs heavy
 * computation. All database reads/writes go through ctx.runQuery
 * and ctx.runMutation with internal functions.
 */

import {
  action,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import {
  estimateAccessTrajectory,
  computeAccessProbabilityCurve,
  computeHurstExponent,
} from "./temporal";
import {
  buildCoOccurrenceFromSessions,
  normalizeCoOccurrences,
} from "./cooccurrence";

// ============================================================================
// RETURN TYPE (explicit to break circular inference with internal mutations)
// ============================================================================

interface TemporalAnalysisSummary {
  documentsAnalyzed: number;
  patternsUpdated: number;
  cooccurrencesFound: number;
  elapsedMs: number;
}

// ============================================================================
// INTERNAL QUERY — fetch user's access events from within action
// ============================================================================

export const getAccessEventsForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accessEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// ============================================================================
// INTERNAL MUTATIONS — all database writes the action needs
// ============================================================================

/**
 * Batch upsert temporal patterns for a user's documents.
 * For each pattern: query by (userId, documentId) → patch if exists, insert if not.
 */
export const batchUpsertTemporalPatterns = internalMutation({
  args: {
    patterns: v.array(
      v.object({
        userId: v.string(),
        documentId: v.id("documents"),
        accessRate: v.number(),
        rateOfChange: v.number(),
        trend: v.union(
          v.literal("rising"),
          v.literal("stable"),
          v.literal("declining"),
          v.literal("periodic"),
        ),
        periodicity: v.optional(v.number()),
        predictedRelevance: v.number(),
        accessProbabilityCurve: v.optional(v.object({
          day1: v.number(),
          day7: v.number(),
          day30: v.number(),
        })),
        hurstExponent: v.optional(v.number()),
        totalAccesses: v.number(),
      }),
    ),
  },
  handler: async (ctx, args): Promise<number> => {
    const now = Date.now();
    let upserted = 0;

    for (const pattern of args.patterns) {
      const existing = await ctx.db
        .query("temporalPatterns")
        .withIndex("by_user_and_document", (q) =>
          q.eq("userId", pattern.userId).eq("documentId", pattern.documentId),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          accessRate: pattern.accessRate,
          rateOfChange: pattern.rateOfChange,
          trend: pattern.trend,
          periodicity: pattern.periodicity,
          predictedRelevance: pattern.predictedRelevance,
          ...(pattern.accessProbabilityCurve !== undefined
            ? { accessProbabilityCurve: pattern.accessProbabilityCurve }
            : {}),
          ...(pattern.hurstExponent !== undefined
            ? { hurstExponent: pattern.hurstExponent }
            : {}),
          lastComputed: now,
          totalAccesses: pattern.totalAccesses,
        });
      } else {
        await ctx.db.insert("temporalPatterns", {
          userId: pattern.userId,
          documentId: pattern.documentId,
          accessRate: pattern.accessRate,
          rateOfChange: pattern.rateOfChange,
          trend: pattern.trend,
          ...(pattern.periodicity !== undefined ? { periodicity: pattern.periodicity } : {}),
          predictedRelevance: pattern.predictedRelevance,
          ...(pattern.accessProbabilityCurve !== undefined
            ? { accessProbabilityCurve: pattern.accessProbabilityCurve }
            : {}),
          ...(pattern.hurstExponent !== undefined
            ? { hurstExponent: pattern.hurstExponent }
            : {}),
          lastComputed: now,
          totalAccesses: pattern.totalAccesses,
        });
      }
      upserted++;
    }

    return upserted;
  },
});

/**
 * Batch upsert co-occurrence records for a user.
 * For each pair: query by (userId, documentA) + filter documentB →
 * patch if exists, insert if not.
 */
export const batchUpsertCooccurrences = internalMutation({
  args: {
    cooccurrences: v.array(
      v.object({
        userId: v.string(),
        documentA: v.id("documents"),
        documentB: v.id("documents"),
        count: v.number(),
        strength: v.number(),
      }),
    ),
  },
  handler: async (ctx, args): Promise<number> => {
    const now = Date.now();
    let upserted = 0;

    for (const cooc of args.cooccurrences) {
      const existing = await ctx.db
        .query("cooccurrences")
        .withIndex("by_document_a", (q) =>
          q.eq("userId", cooc.userId).eq("documentA", cooc.documentA),
        )
        .filter((q) => q.eq(q.field("documentB"), cooc.documentB))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          count: cooc.count,
          lastSeen: now,
          strength: cooc.strength,
        });
      } else {
        await ctx.db.insert("cooccurrences", {
          userId: cooc.userId,
          documentA: cooc.documentA,
          documentB: cooc.documentB,
          count: cooc.count,
          lastSeen: now,
          strength: cooc.strength,
        });
      }
      upserted++;
    }

    return upserted;
  },
});

// ============================================================================
// MAIN ACTION — CURRENTS temporal analysis pipeline
// ============================================================================

export const runTemporalAnalysis = action({
  args: {},
  handler: async (ctx): Promise<TemporalAnalysisSummary> => {
    // ── 1. Authentication ──────────────────────────────────────────────
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;
    const startTime = Date.now();

    try {
      // ── 2. Fetch all access events for this user ─────────────────────
      const events = await ctx.runQuery(
        internal.laminar.temporalRunner.getAccessEventsForUser,
        { userId },
      );

      if (events.length === 0) {
        console.log("🌊 CURRENTS: No access events found — nothing to analyze");
        return {
          documentsAnalyzed: 0,
          patternsUpdated: 0,
          cooccurrencesFound: 0,
          elapsedMs: Date.now() - startTime,
        };
      }

      // ── 3. Group events by documentId → extract timestamps ───────────
      const docTimestamps = new Map<string, number[]>();
      for (const event of events) {
        const docId = event.documentId as string;
        const timestamps = docTimestamps.get(docId);
        if (timestamps) {
          timestamps.push(event.timestamp);
        } else {
          docTimestamps.set(docId, [event.timestamp]);
        }
      }

      const docCount = docTimestamps.size;
      console.log(
        `🌊 CURRENTS: Analyzing temporal patterns for ${docCount} documents...`,
      );

      // ── 4. Estimate access trajectory for each document ──────────────
      const now = Date.now();
      const patterns: Array<{
        userId: string;
        documentId: Id<"documents">;
        accessRate: number;
        rateOfChange: number;
        trend: "rising" | "stable" | "declining" | "periodic";
        periodicity?: number;
        predictedRelevance: number;
        totalAccesses: number;
      }> = [];

      for (const [docId, timestamps] of docTimestamps) {
        const trajectory = estimateAccessTrajectory(timestamps, now);
        const curve = computeAccessProbabilityCurve(timestamps, now);
        const hurst = computeHurstExponent(timestamps, now);

        // Only include curve if it has meaningful data (>= 3 accesses)
        const hasCurve = curve.day1 > 0 || curve.day7 > 0 || curve.day30 > 0;
        // Only include Hurst if confidence > 0 (>= 4 access events)
        const hasHurst = hurst.confidence > 0;

        patterns.push({
          userId,
          documentId: docId as Id<"documents">,
          accessRate: trajectory.accessRate,
          rateOfChange: trajectory.rateOfChange,
          trend: trajectory.trend,
          // Convert null → omitted (Convex v.optional expects undefined, not null)
          ...(trajectory.periodicity !== null
            ? { periodicity: trajectory.periodicity }
            : {}),
          predictedRelevance: trajectory.predictedRelevance,
          ...(hasCurve ? { accessProbabilityCurve: curve } : {}),
          ...(hasHurst ? { hurstExponent: hurst.H } : {}),
          totalAccesses: timestamps.length,
        });
      }

      // ── 5. Batch upsert temporal patterns ────────────────────────────
      const patternsUpdated = await ctx.runMutation(
        internal.laminar.temporalRunner.batchUpsertTemporalPatterns,
        { patterns },
      );

      console.log(`🌊 CURRENTS: ${patternsUpdated} trajectories estimated`);

      // ── 6. Group events by sessionId → build co-occurrence matrix ────
      const sessions = new Map<string, string[]>();
      for (const event of events) {
        const docs = sessions.get(event.sessionId);
        if (docs) {
          docs.push(event.documentId as string);
        } else {
          sessions.set(event.sessionId, [event.documentId as string]);
        }
      }

      const rawCooccurrences = buildCoOccurrenceFromSessions(sessions);
      const normalizedPairs = normalizeCoOccurrences(
        rawCooccurrences,
        sessions.size,
      );

      // ── 7. Upsert co-occurrence records ──────────────────────────────
      const cooccurrenceRecords = normalizedPairs.map((pair) => ({
        userId,
        documentA: pair.documentA as Id<"documents">,
        documentB: pair.documentB as Id<"documents">,
        count: pair.count,
        strength: pair.strength,
      }));

      let cooccurrencesFound = 0;
      if (cooccurrenceRecords.length > 0) {
        cooccurrencesFound = await ctx.runMutation(
          internal.laminar.temporalRunner.batchUpsertCooccurrences,
          { cooccurrences: cooccurrenceRecords },
        );
      }

      console.log(
        `🌊 CURRENTS: ${cooccurrencesFound} co-occurrence relationships detected`,
      );

      // ── 8. Return summary ────────────────────────────────────────────
      const elapsedMs = Date.now() - startTime;
      console.log(`🌊 CURRENTS: Analysis complete in ${elapsedMs}ms`);

      return {
        documentsAnalyzed: docCount,
        patternsUpdated,
        cooccurrencesFound,
        elapsedMs,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`🌊 CURRENTS: Temporal analysis failed — ${message}`);
      throw error;
    }
  },
});
