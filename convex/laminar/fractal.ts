/**
 * LAMINAR Stage 5 — DEPTHS: Fractal Wisdom Distillation
 *
 * Multi-scale pattern recognition + cross-vertical intelligence compounding.
 * Uses Hurst exponent (from temporal.ts) to identify attractor documents
 * and cross-vertical transfer scoring to detect patterns that transfer
 * across operational domains.
 *
 * Bounded context: reads documents via internal.documents.getForLaminar,
 * reads temporal patterns and clusters via internalQuery.
 */

import {
  action,
  internalQuery,
  internalMutation,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { computeHurstExponent } from "./temporal";
import { cosineSimilarity } from "./tfidf";

// ============================================================================
// TYPES — Cross-Vertical Pattern Transfer
// ============================================================================

/**
 * A vector representation of a recurring pattern extracted from a vertical corpus.
 * Derived from: cluster centroid vectors + temporal access signatures.
 */
export interface PatternEmbedding {
  verticalTag: string;
  patternVector: number[];
  documentCount: number;
  hurstMean: number;
}

interface DepthsInsight {
  documentId: string;
  title: string;
  hurstExponent: number;
  classification: "attractor" | "cycling" | "random";
  confidence: number;
}

interface DepthsSummary {
  documentsAnalyzed: number;
  attractorCount: number;
  cyclingCount: number;
  randomCount: number;
  insights: DepthsInsight[];
  crossVerticalScore: number;
  elapsedMs: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TRANSFER_THRESHOLD = 0.75;

// ============================================================================
// E2 — CROSS-VERTICAL PATTERN TRANSFER SCORING
// ============================================================================

/**
 * Compute similarity between patterns extracted from different vertical corpora.
 *
 * This is the technical mechanism that makes Patent Claim 3 patent-eligible:
 * transforms abstract "cross-vertical learning" into a specific mathematical
 * operation (cosine similarity in pattern embedding space).
 *
 * For single-vertical (agency-only) mode: returns transferScore ≈ 1.0
 * (trivially — same vertical). The real cross-vertical behavior activates
 * when the second vertical launches.
 */
export function computeCrossVerticalTransferScore(
  patternA: PatternEmbedding,
  patternB: PatternEmbedding,
): {
  transferScore: number;
  isTransferable: boolean;
  transferDirection: string;
} {
  // Handle zero-length vectors
  if (patternA.patternVector.length === 0 || patternB.patternVector.length === 0) {
    return {
      transferScore: 0,
      isTransferable: false,
      transferDirection: `${patternA.verticalTag} → ${patternB.verticalTag}`,
    };
  }

  // Pad shorter vector with zeros if dimensions differ
  const maxLen = Math.max(patternA.patternVector.length, patternB.patternVector.length);
  const vecA = [...patternA.patternVector];
  const vecB = [...patternB.patternVector];
  while (vecA.length < maxLen) vecA.push(0);
  while (vecB.length < maxLen) vecB.push(0);

  const transferScore = cosineSimilarity(vecA, vecB);

  return {
    transferScore,
    isTransferable: transferScore >= TRANSFER_THRESHOLD,
    transferDirection: `${patternA.verticalTag} → ${patternB.verticalTag}`,
  };
}

// ============================================================================
// INTERNAL QUERIES
// ============================================================================

export const getUserTemporalPatterns = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return ctx.db
      .query("temporalPatterns")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const getUserClusters = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Get latest completed run
    const latestRun = await ctx.db
      .query("clusteringRuns")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", identity.subject).eq("status", "completed"),
      )
      .order("desc")
      .first();

    if (!latestRun) return [];

    return ctx.db
      .query("clusters")
      .withIndex("by_run", (q) => q.eq("runId", latestRun._id))
      .collect();
  },
});

export const getUserAccessEvents = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("accessEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});


// ============================================================================
// MAIN ACTION — DEPTHS Analysis
// ============================================================================

export const runDepthsAnalysis = action({
  args: {},
  handler: async (ctx): Promise<DepthsSummary> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const startTime = Date.now();
    const now = Date.now();

    // Fetch documents via Knowledge Domain bridge
    const allDocs: Doc<"documents">[] = await ctx.runQuery(
      internal.documents.getForLaminar,
      { userId },
    );

    if (allDocs.length === 0) {
      return {
        documentsAnalyzed: 0,
        attractorCount: 0,
        cyclingCount: 0,
        randomCount: 0,
        insights: [],
        crossVerticalScore: 0,
        elapsedMs: Date.now() - startTime,
      };
    }

    // Fetch access events grouped by document
    const accessEvents = await ctx.runQuery(
      internal.laminar.fractal.getUserAccessEvents,
      { userId },
    );

    const docTimestamps = new Map<string, number[]>();
    for (const event of accessEvents) {
      const docId = String(event.documentId);
      const timestamps = docTimestamps.get(docId);
      if (timestamps) {
        timestamps.push(event.timestamp);
      } else {
        docTimestamps.set(docId, [event.timestamp]);
      }
    }

    // Compute Hurst exponent for each document
    const insights: DepthsInsight[] = [];
    let attractorCount = 0;
    let cyclingCount = 0;
    let randomCount = 0;

    for (const doc of allDocs) {
      const timestamps = docTimestamps.get(String(doc._id)) ?? [];
      const hurst = computeHurstExponent(timestamps, now);

      insights.push({
        documentId: String(doc._id),
        title: doc.title,
        hurstExponent: hurst.H,
        classification: hurst.classification,
        confidence: hurst.confidence,
      });

      switch (hurst.classification) {
        case "attractor":
          attractorCount++;
          break;
        case "cycling":
          cyclingCount++;
          break;
        case "random":
          randomCount++;
          break;
      }
    }

    console.log(
      `[DEPTHS] Hurst analysis: ${attractorCount} attractors, ` +
        `${cyclingCount} cycling, ${randomCount} random out of ${allDocs.length} docs`,
    );

    // Cross-vertical transfer scoring
    // In single-vertical mode (all agency), build patterns from clusters
    const clusters = await ctx.runQuery(
      internal.laminar.fractal.getUserClusters,
      {},
    );

    let crossVerticalScore = 0;

    if (clusters.length >= 2) {
      // Build pattern embeddings from cluster centroids + Hurst means
      const patterns: PatternEmbedding[] = clusters.map((cluster) => {
        // Compute mean Hurst exponent for documents in this cluster
        // (approximate: use all docs' Hurst values weighted by cluster membership)
        const clusterInsights = insights.filter((i) =>
          i.confidence > 0,
        );
        const hurstMean = clusterInsights.length > 0
          ? clusterInsights.reduce((s, i) => s + i.hurstExponent, 0) / clusterInsights.length
          : 0.5;

        return {
          verticalTag: "agency", // Single vertical for now
          patternVector: cluster.centroid,
          documentCount: cluster.documentCount,
          hurstMean,
        };
      });

      // Compute pairwise transfer scores between cluster patterns
      let totalScore = 0;
      let pairCount = 0;
      for (let i = 0; i < patterns.length; i++) {
        for (let j = i + 1; j < patterns.length; j++) {
          const result = computeCrossVerticalTransferScore(
            patterns[i]!,
            patterns[j]!,
          );
          totalScore += result.transferScore;
          pairCount++;
        }
      }
      crossVerticalScore = pairCount > 0 ? totalScore / pairCount : 0;

      console.log(
        `[DEPTHS] Cross-vertical score: ${crossVerticalScore.toFixed(3)} ` +
          `(${pairCount} pattern pairs, single-vertical baseline)`,
      );
    }

    // Write Hurst exponents to temporalPatterns via the temporal runner's mutation
    // (We update documents that have existing temporalPatterns rows)
    // This is done via scheduler to not block the response
    for (const insight of insights) {
      if (insight.confidence > 0) {
        await ctx.scheduler.runAfter(
          0,
          internal.laminar.fractal.updateHurstExponent,
          {
            userId,
            documentId: insight.documentId as Id<"documents">,
            hurstExponent: insight.hurstExponent,
          },
        );
      }
    }

    const elapsedMs = Date.now() - startTime;
    console.log(`[DEPTHS] Analysis complete in ${elapsedMs}ms`);

    return {
      documentsAnalyzed: allDocs.length,
      attractorCount,
      cyclingCount,
      randomCount,
      insights: insights
        .filter((i) => i.confidence > 0)
        .sort((a, b) => b.hurstExponent - a.hurstExponent)
        .slice(0, 20),
      crossVerticalScore,
      elapsedMs,
    };
  },
});

// ============================================================================
// INTERNAL MUTATION — Write Hurst exponent to temporalPatterns
// ============================================================================

export const updateHurstExponent = internalMutation({
  args: {
    userId: v.string(),
    documentId: v.id("documents"),
    hurstExponent: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    const existing = await ctx.db
      .query("temporalPatterns")
      .withIndex("by_user_and_document", (q) =>
        q.eq("userId", args.userId).eq("documentId", args.documentId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        hurstExponent: args.hurstExponent,
      });
    }
    // If no temporalPatterns row exists, skip — Hurst is supplementary data
  },
});
