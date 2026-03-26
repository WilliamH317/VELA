/**
 * LAMINAR Stage 1 — Orchestration Engine
 *
 * Convex action that runs the full ARCHIPELAGOS clustering pipeline:
 * TF-IDF vectorization → K selection → K-Means clustering →
 * confidence scoring → storage.
 *
 * This is an action (not query/mutation) because it performs heavy
 * computation. All database reads/writes go through ctx.runQuery
 * and ctx.runMutation with internal functions.
 */

import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { buildVocabulary, computeTFIDF } from "./tfidf";
import { kMeansCluster, calculateSilhouette, selectOptimalK, assignClusters } from "./kmeans";
import { computeDocumentConfidence, silhouetteToStabilityConfidence } from "./confidence";

// ============================================================================
// CONSTANTS
// ============================================================================

const CLUSTER_COLORS = [
  "#00BCD4", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
];

const MIN_DOCUMENTS = 3;
const TOP_KEYWORDS_COUNT = 5;
const NAME_KEYWORDS_COUNT = 3;
const DRIFT_THRESHOLD = 0.05;

// ============================================================================
// HELPERS (pure functions — no Convex context)
// ============================================================================

/**
 * Compute per-cluster coherence as average cosine similarity of members
 * to their cluster centroid. TF-IDF vectors are L2-normalized but
 * centroids (as means of vectors) are not, so we compute full cosine.
 */
function computePerClusterCoherence(
  matrix: number[][],
  labels: number[],
  centroids: number[][],
  k: number,
): number[] {
  const sums = new Array<number>(k).fill(0);
  const counts = new Array<number>(k).fill(0);

  for (let i = 0; i < labels.length; i++) {
    const c = labels[i]!;
    const vec = matrix[i];
    if (!vec) continue;
    const centroid = centroids[c];
    if (!centroid) continue;

    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let j = 0; j < vec.length; j++) {
      dot += vec[j]! * centroid[j]!;
      normA += vec[j]! * vec[j]!;
      normB += centroid[j]! * centroid[j]!;
    }

    const similarity =
      normA > 0 && normB > 0
        ? dot / (Math.sqrt(normA) * Math.sqrt(normB))
        : 0;

    sums[c] = sums[c]! + similarity;
    counts[c] = counts[c]! + 1;
  }

  return sums.map((sum, c) => (counts[c]! > 0 ? sum / counts[c]! : 0));
}

/**
 * Extract the top N keywords per cluster by average TF-IDF weight
 * across cluster members.
 */
function extractClusterKeywords(
  matrix: number[][],
  labels: number[],
  vocabulary: string[],
  k: number,
  topN: number,
): string[][] {
  const result: string[][] = [];

  for (let c = 0; c < k; c++) {
    const memberIndices: number[] = [];
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] === c) memberIndices.push(i);
    }

    const avgWeights = new Array<number>(vocabulary.length).fill(0);
    for (const idx of memberIndices) {
      for (let t = 0; t < vocabulary.length; t++) {
        avgWeights[t] = avgWeights[t]! + matrix[idx]![t]!;
      }
    }
    if (memberIndices.length > 0) {
      for (let t = 0; t < vocabulary.length; t++) {
        avgWeights[t] = avgWeights[t]! / memberIndices.length;
      }
    }

    const topTerms = avgWeights
      .map((weight, i) => ({ term: vocabulary[i]!, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, topN)
      .map((entry) => entry.term);

    result.push(topTerms);
  }

  return result;
}

// ============================================================================
// NOTE: Document fetching now goes through the Knowledge Domain bridge:
//   internal.documents.getForLaminar
// This file must NEVER query the "documents" table directly.
// ============================================================================

// ============================================================================
// INTERNAL MUTATIONS — all database writes the action needs
// ============================================================================

export const createRun = internalMutation({
  args: {
    userId: v.string(),
    documentCount: v.number(),
    startedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clusteringRuns", {
      userId: args.userId,
      status: "running",
      documentCount: args.documentCount,
      clusterCount: 0,
      startedAt: args.startedAt,
    });
  },
});

export const failRun = internalMutation({
  args: {
    runId: v.id("clusteringRuns"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: "failed" as const,
      error: args.error,
      completedAt: Date.now(),
    });
  },
});

export const completeRun = internalMutation({
  args: {
    runId: v.id("clusteringRuns"),
    documentCount: v.number(),
    clusterCount: v.number(),
    silhouetteScore: v.number(),
    completedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: "completed" as const,
      documentCount: args.documentCount,
      clusterCount: args.clusterCount,
      silhouetteScore: args.silhouetteScore,
      completedAt: args.completedAt,
    });
  },
});

export const insertCluster = internalMutation({
  args: {
    userId: v.string(),
    runId: v.id("clusteringRuns"),
    name: v.string(),
    documentCount: v.number(),
    topKeywords: v.array(v.string()),
    centroid: v.array(v.number()),
    coherenceScore: v.number(),
    stabilityConfidence: v.optional(v.number()),
    color: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clusters", {
      userId: args.userId,
      runId: args.runId,
      name: args.name,
      documentCount: args.documentCount,
      topKeywords: args.topKeywords,
      centroid: args.centroid,
      coherenceScore: args.coherenceScore,
      ...(args.stabilityConfidence !== undefined
        ? { stabilityConfidence: args.stabilityConfidence }
        : {}),
      color: args.color,
      createdAt: args.createdAt,
    });
  },
});

export const batchInsertMemberships = internalMutation({
  args: {
    memberships: v.array(
      v.object({
        userId: v.string(),
        documentId: v.id("documents"),
        clusterId: v.id("clusters"),
        runId: v.id("clusteringRuns"),
        probability: v.number(),
        isPrimary: v.boolean(),
        isAmbiguous: v.boolean(),
        assignedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const m of args.memberships) {
      await ctx.db.insert("clusterMemberships", m);
    }
  },
});

export const batchInsertHistory = internalMutation({
  args: {
    entries: v.array(
      v.object({
        clusterId: v.id("clusters"),
        runId: v.id("clusteringRuns"),
        membershipCount: v.number(),
        accessCount: v.number(),
        coherenceScore: v.number(),
        timestamp: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const entry of args.entries) {
      await ctx.db.insert("clusterHistory", entry);
    }
  },
});

// ============================================================================
// INTERNAL QUERIES — for incremental clustering drift detection
// ============================================================================

/**
 * Fetch the latest completed run's clusters for a user.
 * Used to detect centroid drift before deciding whether to run full K-Means.
 */
export const getExistingClusters = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Find latest completed run
    const latestRun = await ctx.db
      .query("clusteringRuns")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "completed"),
      )
      .order("desc")
      .first();

    if (!latestRun) return null;

    const clusters = await ctx.db
      .query("clusters")
      .withIndex("by_run", (q) => q.eq("runId", latestRun._id))
      .collect();

    return {
      runId: latestRun._id,
      clusters: clusters.map((c) => ({
        _id: c._id,
        centroid: c.centroid,
        documentCount: c.documentCount,
      })),
    };
  },
});

/**
 * Fetch existing memberships for a set of document IDs in a given run.
 * Used by incremental mode to identify which documents already have assignments.
 */
export const getMembershipsForDocIds = internalQuery({
  args: {
    runId: v.id("clusteringRuns"),
    documentIds: v.array(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("clusterMemberships")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();

    const docIdSet = new Set(args.documentIds.map(String));
    return memberships.filter((m) => docIdSet.has(String(m.documentId)));
  },
});

/**
 * Increment documentCount on an existing cluster (used by incremental mode).
 */
export const incrementClusterDocCount = internalMutation({
  args: {
    clusterId: v.id("clusters"),
  },
  handler: async (ctx, args): Promise<void> => {
    const cluster = await ctx.db.get(args.clusterId);
    if (!cluster) return;
    await ctx.db.patch(args.clusterId, {
      documentCount: cluster.documentCount + 1,
    });
  },
});

// ============================================================================
// RETURN TYPE (explicit to break circular inference with internal mutations)
// ============================================================================

interface ClusteringSummary {
  runId: Id<"clusteringRuns">;
  clusterCount: number;
  silhouetteScore: number;
  clusters: Array<{
    name: string;
    documentCount: number;
    topKeywords: string[];
    coherenceScore: number;
  }>;
}

// ============================================================================
// MAIN ACTION — LAMINAR clustering pipeline
// ============================================================================

/**
 * Public action — called from client UI (requires auth context).
 * Delegates to internalRun with userId from identity.
 */
export const run = action({
  args: {},
  handler: async (ctx): Promise<ClusteringSummary> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    return ctx.runAction(internal.laminar.engine.internalRun, {
      userId: identity.subject,
    });
  },
});

/**
 * Internal action — called from scheduler (no auth context).
 * Accepts userId as an explicit argument.
 */
export const internalRun = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, { userId }): Promise<ClusteringSummary> => {
    const startTime = Date.now();

    // ── 2. Create clustering run (status: "running") ───────────────────
    const runId = await ctx.runMutation(internal.laminar.engine.createRun, {
      userId,
      documentCount: 0, // updated on completion
      startedAt: startTime,
    });

    try {
      // ── 3. Fetch ready documents via Knowledge Domain bridge ────────
      const allReadyDocs: Doc<"documents">[] = await ctx.runQuery(
        internal.documents.getForLaminar,
        { userId },
      );

      // ── 4. Filter to documents with content ─────────────────────────
      const readyDocs = allReadyDocs.filter(
        (d) => d.contentPlain.length > 0,
      );
      const contents = readyDocs.map((d) => d.contentPlain);
      const docIds = readyDocs.map((d) => d._id);

      // ── 5. Guard: minimum document count ─────────────────────────────
      if (readyDocs.length < MIN_DOCUMENTS) {
        await ctx.runMutation(internal.laminar.engine.failRun, {
          runId,
          error: "Need at least 3 documents to discover ARCHIPELAGOS",
        });
        return {
          runId,
          clusterCount: 0,
          silhouetteScore: 0,
          clusters: [],
        };
      }

      console.log(
        `[LAMINAR] Clustering ${readyDocs.length} documents for user ${userId}`,
      );

      // ── 6. TF-IDF vectorization ─────────────────────────────────────
      const vocabulary = buildVocabulary(contents);
      const tfidfMatrix = computeTFIDF(contents, vocabulary);

      console.log(
        `[LAMINAR] TF-IDF complete: ${vocabulary.length} terms, ${tfidfMatrix.length} vectors`,
      );

      // ── 6b. Incremental clustering drift check ────────────────────
      const existingClusters = await ctx.runQuery(
        internal.laminar.engine.getExistingClusters,
        { userId },
      );

      if (existingClusters && existingClusters.clusters.length > 0) {
        // Assign all docs to nearest existing centroid
        const existingCentroids = existingClusters.clusters.map((c) => c.centroid);
        const assignments = assignClusters(tfidfMatrix, existingCentroids);

        // Compute updated centroids from new assignments
        const k0 = existingCentroids.length;
        const dim = tfidfMatrix[0]?.length ?? 0;
        const sums = Array.from({ length: k0 }, () => new Array<number>(dim).fill(0));
        const counts = new Array<number>(k0).fill(0);

        for (let i = 0; i < tfidfMatrix.length; i++) {
          const c = assignments[i]!;
          counts[c]!++;
          for (let d = 0; d < dim; d++) {
            sums[c]![d]! += tfidfMatrix[i]![d]!;
          }
        }

        // Mean drift across all clusters
        let totalDrift = 0;
        let clusterCount = 0;
        for (let c = 0; c < k0; c++) {
          if (counts[c]! === 0) continue;
          const newCentroid = sums[c]!.map((s) => s / counts[c]!);
          let dist = 0;
          for (let d = 0; d < dim; d++) {
            const diff = newCentroid[d]! - existingCentroids[c]![d]!;
            dist += diff * diff;
          }
          totalDrift += Math.sqrt(dist);
          clusterCount++;
        }

        const meanDrift = clusterCount > 0 ? totalDrift / clusterCount : 0;

        if (meanDrift < DRIFT_THRESHOLD) {
          console.log(
            `[LAMINAR] Incremental mode: drift ${meanDrift.toFixed(4)} < threshold ${DRIFT_THRESHOLD} — skipping full recompute`,
          );

          // Find documents that need membership assignment for this run.
          // Fetch existing memberships for the previous run to identify unassigned docs.
          const prevRunId = existingClusters.runId;
          const existingMemberships = await ctx.runQuery(
            internal.laminar.engine.getMembershipsForDocIds,
            { runId: prevRunId, documentIds: docIds },
          );
          const assignedDocIds = new Set(
            existingMemberships.map((m: { documentId: string }) => String(m.documentId)),
          );

          // Identify unassigned documents (new uploads since last full K-Means)
          const unassignedIndices: number[] = [];
          for (let i = 0; i < readyDocs.length; i++) {
            if (!assignedDocIds.has(String(docIds[i]!))) {
              unassignedIndices.push(i);
            }
          }

          console.log(
            `[LAMINAR] Incremental: ${unassignedIndices.length} unassigned documents to assign`,
          );

          // Compute soft membership for each unassigned document
          const clusterIdList = existingClusters.clusters.map((c) => c._id);
          const clusterIdStrings = clusterIdList.map((id) => id as string);
          const now = Date.now();
          const newMemberships: Array<{
            userId: string;
            documentId: Id<"documents">;
            clusterId: Id<"clusters">;
            runId: Id<"clusteringRuns">;
            probability: number;
            isPrimary: boolean;
            isAmbiguous: boolean;
            assignedAt: number;
          }> = [];

          // Track which clusters gain new documents
          const clusterDocIncrements = new Map<string, number>();

          for (const idx of unassignedIndices) {
            const confidence = computeDocumentConfidence(
              tfidfMatrix[idx]!,
              existingCentroids,
              clusterIdStrings,
            );

            for (const membership of confidence.memberships) {
              const clusterIdx = clusterIdStrings.indexOf(membership.clusterId);
              if (clusterIdx < 0) continue;

              const isPrimary = membership.clusterId === confidence.primaryCluster;

              newMemberships.push({
                userId,
                documentId: docIds[idx]!,
                clusterId: clusterIdList[clusterIdx]!,
                runId: prevRunId,
                probability: membership.probability,
                isPrimary,
                isAmbiguous: confidence.isAmbiguous,
                assignedAt: now,
              });

              // Count primary assignments per cluster for documentCount update
              if (isPrimary) {
                const cid = String(clusterIdList[clusterIdx]!);
                clusterDocIncrements.set(cid, (clusterDocIncrements.get(cid) ?? 0) + 1);
              }
            }
          }

          // Batch insert memberships (25-item limit)
          for (let i = 0; i < newMemberships.length; i += 25) {
            const batch = newMemberships.slice(i, i + 25);
            await ctx.runMutation(internal.laminar.engine.batchInsertMemberships, {
              memberships: batch,
            });
          }

          // Increment documentCount on clusters that gained new primary members
          for (const [clusterId] of clusterDocIncrements) {
            const increment = clusterDocIncrements.get(clusterId)!;
            for (let n = 0; n < increment; n++) {
              await ctx.runMutation(internal.laminar.engine.incrementClusterDocCount, {
                clusterId: clusterId as Id<"clusters">,
              });
            }
          }

          console.log(
            `[LAMINAR] Incremental: ${newMemberships.length} memberships inserted, ` +
              `${clusterDocIncrements.size} clusters updated`,
          );

          // Complete the run
          const silhouetteScore = calculateSilhouette(tfidfMatrix, assignments);
          await ctx.runMutation(internal.laminar.engine.completeRun, {
            runId,
            documentCount: readyDocs.length,
            clusterCount: k0,
            silhouetteScore,
            completedAt: Date.now(),
          });

          const elapsedMs = Date.now() - startTime;
          console.log(
            `[LAMINAR] Incremental clustering complete in ${elapsedMs}ms — ` +
              `${unassignedIndices.length} new docs assigned, drift below threshold`,
          );

          return {
            runId,
            clusterCount: k0,
            silhouetteScore,
            clusters: existingClusters.clusters.map((c) => ({
              name: "",
              documentCount: c.documentCount + (clusterDocIncrements.get(String(c._id)) ?? 0),
              topKeywords: [],
              coherenceScore: 0,
            })),
          };
        }

        console.log(
          `[LAMINAR] Drift ${meanDrift.toFixed(4)} >= threshold ${DRIFT_THRESHOLD} — running full recompute`,
        );
      }

      // ── 7. Determine optimal K (BIC-based, with silhouette fallback) ─
      const kMax = Math.min(10, Math.floor(readyDocs.length / 2));
      const { optimalK: k, bicScores } = selectOptimalK(tfidfMatrix, kMax);

      console.log(
        `[LAMINAR] BIC K selection: optimal K = ${k} (evaluated K=2..${kMax}, ${bicScores.length} scores)`,
      );

      // ── 8. K-Means clustering ───────────────────────────────────────
      const { labels, centroids, iterations, converged } = kMeansCluster(
        tfidfMatrix,
        k,
      );

      console.log(
        `[LAMINAR] K-Means finished: ${iterations} iterations, converged=${converged}`,
      );

      // Overall silhouette score
      const silhouetteScore = calculateSilhouette(tfidfMatrix, labels);

      console.log(
        `[LAMINAR] Silhouette score: ${silhouetteScore.toFixed(4)}`,
      );

      // ── 8b. Stability confidence from silhouette score ─────────────
      const stability = silhouetteToStabilityConfidence(silhouetteScore);

      console.log(
        `[LAMINAR] Stability: ${stability.label} (confidence: ${stability.confidence})`,
      );

      // ── 9. (computed below after cluster IDs are available) ─────────

      // ── 10. Top 5 keywords per cluster ──────────────────────────────
      const clusterKeywords = extractClusterKeywords(
        tfidfMatrix,
        labels,
        vocabulary,
        k,
        TOP_KEYWORDS_COUNT,
      );

      // ── 11. Cluster names from top 3 keywords ──────────────────────
      const clusterNames = clusterKeywords.map((kw) =>
        kw.slice(0, NAME_KEYWORDS_COUNT).join(" "),
      );

      // Per-cluster coherence scores
      const coherenceScores = computePerClusterCoherence(
        tfidfMatrix,
        labels,
        centroids,
        k,
      );

      // ── 12. Store results ───────────────────────────────────────────
      const now = Date.now();

      // ── 12a. Insert cluster records ─────────────────────────────────
      const clusterIds: Id<"clusters">[] = [];
      const clusterSummaries: Array<{
        name: string;
        documentCount: number;
        topKeywords: string[];
        coherenceScore: number;
      }> = [];

      for (let c = 0; c < k; c++) {
        const memberCount = labels.filter((l) => l === c).length;

        const clusterId = await ctx.runMutation(
          internal.laminar.engine.insertCluster,
          {
            userId,
            runId,
            name: clusterNames[c]!,
            documentCount: memberCount,
            topKeywords: clusterKeywords[c]!,
            centroid: Array.from(centroids[c]!),
            coherenceScore: coherenceScores[c]!,
            stabilityConfidence: stability.confidence,
            color: CLUSTER_COLORS[c % CLUSTER_COLORS.length]!,
            createdAt: now,
          },
        );

        clusterIds.push(clusterId);
        clusterSummaries.push({
          name: clusterNames[c]!,
          documentCount: memberCount,
          topKeywords: clusterKeywords[c]!,
          coherenceScore: coherenceScores[c]!,
        });
      }

      // ── 12b. Compute confidence & build membership records ──────────
      const clusterIdStrings = clusterIds.map((id) => id as string);
      const allMemberships: Array<{
        userId: string;
        documentId: Id<"documents">;
        clusterId: Id<"clusters">;
        runId: Id<"clusteringRuns">;
        probability: number;
        isPrimary: boolean;
        isAmbiguous: boolean;
        assignedAt: number;
      }> = [];

      for (let i = 0; i < readyDocs.length; i++) {
        const confidence = computeDocumentConfidence(
          tfidfMatrix[i]!,
          centroids,
          clusterIdStrings,
        );

        for (const membership of confidence.memberships) {
          const clusterIdx = clusterIdStrings.indexOf(membership.clusterId);
          if (clusterIdx < 0) continue;

          allMemberships.push({
            userId,
            documentId: docIds[i]!,
            clusterId: clusterIds[clusterIdx]!,
            runId,
            probability: membership.probability,
            isPrimary: membership.clusterId === confidence.primaryCluster,
            isAmbiguous: confidence.isAmbiguous,
            assignedAt: now,
          });
        }
      }

      await ctx.runMutation(internal.laminar.engine.batchInsertMemberships, {
        memberships: allMemberships,
      });

      console.log(
        `[LAMINAR] Inserted ${allMemberships.length} membership records`,
      );

      // ── 12c. Insert cluster history records ─────────────────────────
      const historyEntries: Array<{
        clusterId: Id<"clusters">;
        runId: Id<"clusteringRuns">;
        membershipCount: number;
        accessCount: number;
        coherenceScore: number;
        timestamp: number;
      }> = [];

      for (let c = 0; c < k; c++) {
        const memberCount = labels.filter((l) => l === c).length;
        historyEntries.push({
          clusterId: clusterIds[c]!,
          runId,
          membershipCount: memberCount,
          accessCount: 0,
          coherenceScore: coherenceScores[c]!,
          timestamp: now,
        });
      }

      await ctx.runMutation(internal.laminar.engine.batchInsertHistory, {
        entries: historyEntries,
      });

      // ── 12d. Update run to completed ────────────────────────────────
      const elapsedMs = Date.now() - startTime;

      await ctx.runMutation(internal.laminar.engine.completeRun, {
        runId,
        documentCount: readyDocs.length,
        clusterCount: k,
        silhouetteScore,
        completedAt: Date.now(),
      });

      console.log(
        `[LAMINAR] Pipeline complete in ${elapsedMs}ms — ` +
          `${k} ARCHIPELAGOS from ${readyDocs.length} documents ` +
          `(silhouette: ${silhouetteScore.toFixed(4)})`,
      );

      // ── 13. Return summary ──────────────────────────────────────────
      return {
        runId,
        clusterCount: k,
        silhouetteScore,
        clusters: clusterSummaries,
      };
    } catch (error: any) {
      // Update run to "failed" and re-throw
      await ctx.runMutation(internal.laminar.engine.failRun, {
        runId,
        error: error?.message || "Unknown error during clustering",
      });
      throw error;
    }
  },
});
