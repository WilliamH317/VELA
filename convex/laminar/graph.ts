/**
 * LAMINAR Layer 5 — Knowledge Graph Construction Engine
 *
 * Fuses 4 independent signals into weighted cross-document edges:
 *   1. contentSimilarity  — TF-IDF cosine similarity (always available)
 *   2. structuralLink     — Cluster co-membership probability overlap
 *   3. coAccessStrength   — Session co-occurrence from Day 17 pipeline
 *   4. temporalProximity  — Access trajectory alignment
 *
 * The fusion engine uses graceful degradation: if some signals are
 * unavailable (no clusters yet, no access events), it re-normalizes
 * the remaining weights so edges are always produced when content exists.
 *
 * All pure computation functions are defined outside the Convex action
 * for testability. The action orchestrates: fetch → compute → store.
 *
 * Pure TypeScript — no Python, no external ML dependencies.
 */

import {
  action,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Id, Doc } from "../_generated/dataModel";
import { buildVocabulary, computeTFIDF, cosineSimilarity } from "./tfidf";

// ============================================================================
// TYPES
// ============================================================================

interface SignalInputs {
  contentSimilarity: number | null;
  structuralLink: number | null;
  coAccessStrength: number | null;
  temporalProximity: number | null;
}

interface FusionResult {
  weight: number;
  signals: {
    contentSimilarity: number;
    temporalProximity: number;
    coAccessStrength: number;
    structuralLink: number;
  };
}

interface MembershipEntry {
  clusterId: string;
  probability: number;
}

interface TemporalInfo {
  accessRate: number;
  predictedRelevance: number;
  trend: string;
}

interface EdgeRecord {
  userId: string;
  sourceDocId: Id<"documents">;
  targetDocId: Id<"documents">;
  weight: number;
  signals: {
    contentSimilarity: number;
    temporalProximity: number;
    coAccessStrength: number;
    structuralLink: number;
  };
  isBridge: boolean;
  lastComputed: number;
}

interface GraphSummary {
  edgesCreated: number;
  signalAvailability: {
    contentSimilarity: boolean;
    structuralLink: boolean;
    coAccessStrength: boolean;
    temporalProximity: boolean;
  };
  avgWeight: number;
  bridgeDocumentCount: number;
  documentCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum fused weight to persist an edge. */
const EDGE_THRESHOLD = 0.10;

/** Maximum edges per document (keep top N by weight). */
const MAX_EDGES_PER_DOC = 20;

/** Minimum content similarity to compute remaining signals (pre-filter). */
const CONTENT_PREFILTER = 0.05;

/** Batch size for edge inserts (Convex ~8KB argument limit). */
const BATCH_SIZE = 25;

/** Minimum documents required to build graph. */
const MIN_DOCUMENTS = 3;

/** Maximum documents before requiring partitioning (O(n²) guard). */
const MAX_DOCUMENTS = 200;

/**
 * Ideal signal weights for the degradation matrix.
 * Used to compute re-normalized weights when some signals are absent.
 */
const IDEAL_WEIGHTS: Record<keyof SignalInputs, number> = {
  contentSimilarity: 0.35,
  structuralLink: 0.25,
  coAccessStrength: 0.25,
  temporalProximity: 0.15,
};

// ============================================================================
// SIGNAL 1: contentSimilarity (TF-IDF cosine)
// ============================================================================

// Directly uses cosineSimilarity from tfidf.ts — no wrapper needed.
// Vectors are already L2-normalized, so dot product = cosine similarity.
// Range: [0, 1] for non-negative TF-IDF vectors.

// ============================================================================
// SIGNAL 2: structuralLink (cluster co-membership)
// ============================================================================

/**
 * Compute structural link between two documents based on shared cluster
 * membership probabilities.
 *
 * For each cluster both documents belong to, takes the minimum of the
 * two probabilities and sums them. This measures "overlap" in cluster
 * space — documents deeply embedded in the same cluster score high,
 * while documents in different clusters score near zero.
 *
 * @returns Score in [0, 1]. Returns 0 if no shared clusters.
 */
export function computeStructuralLink(
  membershipsA: MembershipEntry[],
  membershipsB: MembershipEntry[],
): number {
  if (membershipsA.length === 0 || membershipsB.length === 0) return 0;

  // Build lookup for B's cluster probabilities
  const bMap = new Map<string, number>();
  for (const m of membershipsB) {
    bMap.set(m.clusterId, m.probability);
  }

  let sum = 0;
  for (const m of membershipsA) {
    const bProb = bMap.get(m.clusterId);
    if (bProb !== undefined) {
      sum += Math.min(m.probability, bProb);
    }
  }

  return Math.min(sum, 1.0);
}

// ============================================================================
// SIGNAL 3: coAccessStrength
// ============================================================================

/**
 * Normalize co-access strength. The cooccurrences table already stores a
 * pre-normalized `strength` field (count / totalSessions), so we use it
 * directly, clamped to [0, 1].
 *
 * @returns Score in [0, 1]. Returns 0 if no cooccurrence record exists.
 */
export function normalizeCoAccess(strength: number): number {
  return Math.min(Math.max(strength, 0), 1.0);
}

// ============================================================================
// SIGNAL 4: temporalProximity
// ============================================================================

/**
 * Compute temporal proximity between two documents based on their
 * access trajectories.
 *
 * Documents with similar access patterns (both rising, both high-rate)
 * score higher. Opposing trends (one rising, one declining) score lower.
 *
 * Formula:
 *   relevanceSim = 1 - |A.predictedRelevance - B.predictedRelevance|
 *   rateSim      = 1 - |A.rate - B.rate| / max(A.rate, B.rate, 0.01)
 *   trendBonus   = same trend ? 0.2 : 0
 *   score        = 0.5 * relevanceSim + 0.3 * rateSim + 0.2 * trendBonus
 *
 * @returns Score in [0, 1]. Returns 0 if either pattern is null.
 */
export function computeTemporalProximity(
  patternA: TemporalInfo | null,
  patternB: TemporalInfo | null,
): number {
  if (!patternA || !patternB) return 0;

  const relevanceSim =
    1 - Math.abs(patternA.predictedRelevance - patternB.predictedRelevance);

  const maxRate = Math.max(patternA.accessRate, patternB.accessRate, 0.01);
  const rateSim =
    1 - Math.abs(patternA.accessRate - patternB.accessRate) / maxRate;

  const trendBonus = patternA.trend === patternB.trend ? 0.2 : 0;

  const score = 0.5 * relevanceSim + 0.3 * rateSim + 0.2 * trendBonus;
  return Math.min(Math.max(score, 0), 1.0);
}

// ============================================================================
// FUSION ENGINE
// ============================================================================

/**
 * Fuse 1–4 signals into a single edge weight using graceful degradation.
 *
 * Instead of a giant if/else chain for every signal combination, we:
 * 1. Collect all non-null signals with their ideal weights.
 * 2. Re-normalize the weights so they sum to 1.0.
 * 3. Compute the weighted sum.
 *
 * This automatically handles any combination of available signals
 * without explicit branching for each case.
 *
 * @returns Fused weight and per-signal breakdown (0 for absent signals).
 */
export function fuseSignals(inputs: SignalInputs): FusionResult {
  // Collect available signals
  const available: Array<{ key: keyof SignalInputs; value: number; idealWeight: number }> = [];

  for (const key of Object.keys(IDEAL_WEIGHTS) as Array<keyof SignalInputs>) {
    if (inputs[key] !== null) {
      available.push({
        key,
        value: inputs[key],
        idealWeight: IDEAL_WEIGHTS[key],
      });
    }
  }

  // No signals → zero weight
  if (available.length === 0) {
    return {
      weight: 0,
      signals: {
        contentSimilarity: 0,
        temporalProximity: 0,
        coAccessStrength: 0,
        structuralLink: 0,
      },
    };
  }

  // Re-normalize weights to sum to 1.0
  const totalIdealWeight = available.reduce((s, a) => s + a.idealWeight, 0);
  let weight = 0;
  for (const a of available) {
    weight += (a.idealWeight / totalIdealWeight) * a.value;
  }

  // Build output signals (0 for absent)
  const signals = {
    contentSimilarity: inputs.contentSimilarity ?? 0,
    temporalProximity: inputs.temporalProximity ?? 0,
    coAccessStrength: inputs.coAccessStrength ?? 0,
    structuralLink: inputs.structuralLink ?? 0,
  };

  return { weight: Math.min(Math.max(weight, 0), 1.0), signals };
}

// ============================================================================
// EDGE CAPPING
// ============================================================================

/**
 * Cap edges to MAX_EDGES_PER_DOC per document, keeping highest weight.
 */
function capEdges(edges: EdgeRecord[]): EdgeRecord[] {
  // Count per document
  const docEdgeCount = new Map<string, number>();
  for (const e of edges) {
    const src = String(e.sourceDocId);
    const tgt = String(e.targetDocId);
    docEdgeCount.set(src, (docEdgeCount.get(src) ?? 0) + 1);
    docEdgeCount.set(tgt, (docEdgeCount.get(tgt) ?? 0) + 1);
  }

  // Check if any doc exceeds limit
  const overLimit = [...docEdgeCount.values()].some(
    (c) => c > MAX_EDGES_PER_DOC,
  );
  if (!overLimit) return edges;

  // Sort all edges by weight descending
  const sorted = [...edges].sort((a, b) => b.weight - a.weight);
  const kept: EdgeRecord[] = [];
  const docCounts = new Map<string, number>();

  for (const edge of sorted) {
    const src = String(edge.sourceDocId);
    const tgt = String(edge.targetDocId);
    const srcCount = docCounts.get(src) ?? 0;
    const tgtCount = docCounts.get(tgt) ?? 0;

    if (srcCount < MAX_EDGES_PER_DOC && tgtCount < MAX_EDGES_PER_DOC) {
      kept.push(edge);
      docCounts.set(src, srcCount + 1);
      docCounts.set(tgt, tgtCount + 1);
    }
  }

  return kept;
}

// ============================================================================
// INTERNAL QUERIES — Read data from within the action
// ============================================================================

export const getUserReadyDocuments = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getLatestCompletedRun = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clusteringRuns")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "completed"),
      )
      .order("desc")
      .first();
  },
});

export const getMembershipsForRun = internalQuery({
  args: { runId: v.id("clusteringRuns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clusterMemberships")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();
  },
});

export const getUserCooccurrences = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cooccurrences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getUserTemporalPatterns = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("temporalPatterns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// ============================================================================
// INTERNAL MUTATIONS — Write edges from within the action
// ============================================================================

export const deleteUserEdges = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<{ deleted: number }> => {
    const edges = await ctx.db
      .query("knowledgeEdges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const edge of edges) {
      await ctx.db.delete(edge._id);
    }
    return { deleted: edges.length };
  },
});

export const insertEdgeBatch = internalMutation({
  args: {
    edges: v.array(
      v.object({
        userId: v.string(),
        sourceDocId: v.id("documents"),
        targetDocId: v.id("documents"),
        weight: v.number(),
        signals: v.object({
          contentSimilarity: v.number(),
          temporalProximity: v.number(),
          coAccessStrength: v.number(),
          structuralLink: v.number(),
        }),
        isBridge: v.boolean(),
        lastComputed: v.number(),
      }),
    ),
  },
  handler: async (ctx, args): Promise<{ inserted: number }> => {
    for (const edge of args.edges) {
      await ctx.db.insert("knowledgeEdges", edge);
    }
    return { inserted: args.edges.length };
  },
});

// ============================================================================
// MAIN ACTION — Knowledge Graph Construction Pipeline
// ============================================================================

export const buildKnowledgeGraph = action({
  args: {},
  handler: async (ctx): Promise<GraphSummary> => {
    // ── 1. AUTH ────────────────────────────────────────────────────────
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    console.log(`[LAMINAR Graph] Starting knowledge graph build for user ${userId}`);

    // ── 2. FETCH ALL INPUTS ───────────────────────────────────────────

    // 2a. All user documents
    const allDocs: Doc<"documents">[] = await ctx.runQuery(
      internal.laminar.graph.getUserReadyDocuments,
      { userId },
    );
    const readyDocs = allDocs.filter(
      (d) => d.status === "ready" && d.contentPlain.length > 0,
    );

    if (readyDocs.length < MIN_DOCUMENTS) {
      console.log(
        `[LAMINAR Graph] Only ${readyDocs.length} ready documents — need at least ${MIN_DOCUMENTS}`,
      );
      return {
        edgesCreated: 0,
        signalAvailability: {
          contentSimilarity: false,
          structuralLink: false,
          coAccessStrength: false,
          temporalProximity: false,
        },
        avgWeight: 0,
        bridgeDocumentCount: 0,
        documentCount: readyDocs.length,
      };
    }

    if (readyDocs.length > MAX_DOCUMENTS) {
      throw new Error(
        `Too many documents (${readyDocs.length}). Graph builder supports up to ${MAX_DOCUMENTS} documents. ` +
          `Partition by cluster for larger sets.`,
      );
    }

    // 2b. Latest completed clustering run + memberships
    const latestRun = await ctx.runQuery(
      internal.laminar.graph.getLatestCompletedRun,
      { userId },
    );

    const membershipsByDoc = new Map<string, MembershipEntry[]>();
    const ambiguousDocIds = new Set<string>();

    if (latestRun) {
      const memberships = await ctx.runQuery(
        internal.laminar.graph.getMembershipsForRun,
        { runId: latestRun._id },
      );

      for (const m of memberships) {
        const docId = String(m.documentId);
        const entries = membershipsByDoc.get(docId);
        const entry: MembershipEntry = {
          clusterId: String(m.clusterId),
          probability: m.probability,
        };
        if (entries) {
          entries.push(entry);
        } else {
          membershipsByDoc.set(docId, [entry]);
        }
        if (m.isAmbiguous) {
          ambiguousDocIds.add(docId);
        }
      }
    }

    // 2c. Cooccurrences → lookup map keyed by canonical pair
    const rawCooccurrences = await ctx.runQuery(
      internal.laminar.graph.getUserCooccurrences,
      { userId },
    );

    const cooccurrenceMap = new Map<string, { count: number; strength: number }>();
    for (const c of rawCooccurrences) {
      const a = String(c.documentA);
      const b = String(c.documentB);
      // Canonical key: smaller ID first
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      cooccurrenceMap.set(key, { count: c.count, strength: c.strength });
    }

    // 2d. Temporal patterns → lookup by docId
    const rawPatterns = await ctx.runQuery(
      internal.laminar.graph.getUserTemporalPatterns,
      { userId },
    );

    const temporalMap = new Map<string, TemporalInfo>();
    for (const p of rawPatterns) {
      temporalMap.set(String(p.documentId), {
        accessRate: p.accessRate,
        predictedRelevance: p.predictedRelevance,
        trend: p.trend,
      });
    }

    // ── 3. SIGNAL AVAILABILITY ────────────────────────────────────────

    const signalAvailability = {
      contentSimilarity: true,
      structuralLink: membershipsByDoc.size > 0,
      coAccessStrength: cooccurrenceMap.size > 0,
      temporalProximity: temporalMap.size > 0,
    };

    console.log(
      `[LAMINAR Graph] Signals: content=✓ structural=${signalAvailability.structuralLink ? "✓" : "✗"} ` +
        `coAccess=${signalAvailability.coAccessStrength ? "✓" : "✗"} ` +
        `temporal=${signalAvailability.temporalProximity ? "✓" : "✗"}`,
    );

    // ── 4. COMPUTE TF-IDF VECTORS ────────────────────────────────────

    const contents = readyDocs.map((d) => d.contentPlain);
    const docIds = readyDocs.map((d) => d._id);

    const vocabulary = buildVocabulary(contents);
    const tfidfMatrix = computeTFIDF(contents, vocabulary);

    console.log(
      `[LAMINAR Graph] TF-IDF: ${vocabulary.length} terms, ${tfidfMatrix.length} vectors`,
    );

    // ── 5. BUILD EDGES ────────────────────────────────────────────────

    const now = Date.now();
    const edgeCandidates: EdgeRecord[] = [];

    for (let i = 0; i < readyDocs.length; i++) {
      for (let j = i + 1; j < readyDocs.length; j++) {
        const docAId = docIds[i]!;
        const docBId = docIds[j]!;
        const vecA = tfidfMatrix[i]!;
        const vecB = tfidfMatrix[j]!;

        // Signal 1: contentSimilarity (always computed)
        const contentSim = cosineSimilarity(vecA, vecB);

        // Pre-filter: skip pairs with very low content similarity
        // UNLESS they have a cooccurrence record (behavioral signal)
        const pairKey =
          String(docAId) < String(docBId)
            ? `${String(docAId)}:${String(docBId)}`
            : `${String(docBId)}:${String(docAId)}`;
        const hasCooccurrence = cooccurrenceMap.has(pairKey);

        if (contentSim < CONTENT_PREFILTER && !hasCooccurrence) {
          continue;
        }

        // Signal 2: structuralLink (cluster co-membership)
        const membA = membershipsByDoc.get(String(docAId));
        const membB = membershipsByDoc.get(String(docBId));
        const structuralLinkScore =
          membA && membB ? computeStructuralLink(membA, membB) : null;

        // Signal 3: coAccessStrength
        const cooc = cooccurrenceMap.get(pairKey);
        const coAccessScore = cooc ? normalizeCoAccess(cooc.strength) : null;

        // Signal 4: temporalProximity
        const tempA = temporalMap.get(String(docAId)) ?? null;
        const tempB = temporalMap.get(String(docBId)) ?? null;
        const temporalScore = computeTemporalProximity(tempA, tempB);
        const temporalInput =
          tempA && tempB ? temporalScore : null;

        // Fuse signals
        const result = fuseSignals({
          contentSimilarity: contentSim,
          structuralLink:
            signalAvailability.structuralLink ? structuralLinkScore : null,
          coAccessStrength:
            signalAvailability.coAccessStrength ? coAccessScore : null,
          temporalProximity:
            signalAvailability.temporalProximity ? temporalInput : null,
        });

        // Threshold: skip weak edges
        if (result.weight < EDGE_THRESHOLD) continue;

        // Bridge detection: either doc is ambiguous in cluster membership
        const isBridge =
          ambiguousDocIds.has(String(docAId)) ||
          ambiguousDocIds.has(String(docBId));

        edgeCandidates.push({
          userId,
          sourceDocId: docAId,
          targetDocId: docBId,
          weight: result.weight,
          signals: result.signals,
          isBridge,
          lastComputed: now,
        });
      }
    }

    console.log(
      `[LAMINAR Graph] ${edgeCandidates.length} candidate edges before capping`,
    );

    // ── 6. CAP EDGES ──────────────────────────────────────────────────

    const finalEdges = capEdges(edgeCandidates);

    console.log(
      `[LAMINAR Graph] ${finalEdges.length} edges after capping (max ${MAX_EDGES_PER_DOC}/doc)`,
    );

    // ── 7. ATOMIC SWAP — delete old, insert new ──────────────────────

    const { deleted } = await ctx.runMutation(
      internal.laminar.graph.deleteUserEdges,
      { userId },
    );

    if (deleted > 0) {
      console.log(`[LAMINAR Graph] Deleted ${deleted} old edges`);
    }

    // Batch insert new edges
    for (let i = 0; i < finalEdges.length; i += BATCH_SIZE) {
      const batch = finalEdges.slice(i, i + BATCH_SIZE);
      await ctx.runMutation(internal.laminar.graph.insertEdgeBatch, {
        edges: batch,
      });
    }

    // ── 8. SUMMARY ────────────────────────────────────────────────────

    const bridgeCount = finalEdges.filter((e) => e.isBridge).length;
    const avgWeight =
      finalEdges.length > 0
        ? finalEdges.reduce((s, e) => s + e.weight, 0) / finalEdges.length
        : 0;

    console.log(
      `[LAMINAR Graph] Complete: ${finalEdges.length} edges, ` +
        `avg weight ${avgWeight.toFixed(3)}, ${bridgeCount} bridge edges, ` +
        `${readyDocs.length} documents`,
    );

    return {
      edgesCreated: finalEdges.length,
      signalAvailability,
      avgWeight,
      bridgeDocumentCount: bridgeCount,
      documentCount: readyDocs.length,
    };
  },
});
