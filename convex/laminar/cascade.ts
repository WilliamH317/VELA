/**
 * LAMINAR Stage 4 — CASCADE: Butterfly Effect Prediction
 *
 * BFS traversal across the multi-signal knowledge graph with exponential
 * decay to predict downstream document impact. Chaos theory–grounded:
 * small changes in one document propagate with diminishing intensity
 * through connected documents.
 *
 * Features:
 *   - Bidirectional BFS (forward: "what breaks?" + reverse: "what depends on this?")
 *   - Adaptive decay based on dominant edge signal type
 *   - Bootstrap confidence intervals (N=50) on high-impact documents
 *
 * Bounded context: reads edges via internalQuery, writes impacts via internalMutation.
 * Documents accessed only via internal.documents.getForLaminar bridge.
 */

import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_THRESHOLD = 0.30;
const DEFAULT_MAX_DEPTH = 3;
const N_BOOTSTRAP = 50;
const EDGE_WEIGHT_VARIANCE = 0.12;

// ============================================================================
// D3 — ADAPTIVE DECAY BY SIGNAL COMPOSITION
// ============================================================================

/**
 * Compute decay rate based on the dominant signal in an edge.
 *
 * Structural links (explicit references) decay slower because a cited
 * document stays relevant longer than a behaviorally co-accessed one.
 *
 * @returns Decay rate in [0.75, 0.88]
 */
function adaptiveDecay(signals: {
  contentSimilarity: number;
  embeddingSimilarity: number | undefined;
  temporalProximity: number;
  coAccessStrength: number;
  structuralLink: number;
}): number {
  if (signals.structuralLink > 0.5) return 0.88;     // Explicit reference — slow decay
  if (signals.temporalProximity > 0.5) return 0.82;  // Temporal co-occurrence — medium
  if (signals.coAccessStrength > 0.5) return 0.75;   // Behavioral — faster decay
  return 0.80;                                        // Default
}

// ============================================================================
// TYPES
// ============================================================================

interface EdgeData {
  sourceDocId: string;
  targetDocId: string;
  weight: number;
  signals: {
    contentSimilarity: number;
    embeddingSimilarity: number | undefined;
    temporalProximity: number;
    coAccessStrength: number;
    structuralLink: number;
  };
}

interface ImpactResult {
  documentId: string;
  impactScore: number;
  depth: number;
  direction: "forward" | "reverse";
  confidenceLow?: number;
  confidenceHigh?: number;
  pathDescription?: string;
}

interface CascadeSummary {
  runId: Id<"cascadeRuns">;
  totalAffected: number;
  maxDepthReached: number;
  forwardCount: number;
  reverseCount: number;
  elapsedMs: number;
}

// ============================================================================
// INTERNAL QUERIES
// ============================================================================

export const getUserEdges = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("knowledgeEdges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

export const createCascadeRun = internalMutation({
  args: {
    userId: v.string(),
    sourceDocId: v.id("documents"),
    decayRate: v.number(),
    threshold: v.number(),
  },
  handler: async (ctx, args): Promise<Id<"cascadeRuns">> => {
    return ctx.db.insert("cascadeRuns", {
      userId: args.userId,
      sourceDocId: args.sourceDocId,
      status: "running",
      totalAffected: 0,
      maxDepth: 0,
      decayRate: args.decayRate,
      threshold: args.threshold,
      createdAt: Date.now(),
    });
  },
});

export const completeCascadeRun = internalMutation({
  args: {
    runId: v.id("cascadeRuns"),
    totalAffected: v.number(),
    maxDepth: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.runId, {
      status: "completed" as const,
      totalAffected: args.totalAffected,
      maxDepth: args.maxDepth,
      completedAt: Date.now(),
    });
  },
});

export const failCascadeRun = internalMutation({
  args: {
    runId: v.id("cascadeRuns"),
    error: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.runId, {
      status: "failed" as const,
      error: args.error,
      completedAt: Date.now(),
    });
  },
});

export const batchInsertCascadeImpacts = internalMutation({
  args: {
    impacts: v.array(
      v.object({
        userId: v.string(),
        runId: v.id("cascadeRuns"),
        documentId: v.id("documents"),
        impactScore: v.number(),
        depth: v.number(),
        direction: v.optional(
          v.union(v.literal("forward"), v.literal("reverse")),
        ),
        confidenceLow: v.optional(v.number()),
        confidenceHigh: v.optional(v.number()),
        pathDescription: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args): Promise<void> => {
    for (const impact of args.impacts) {
      await ctx.db.insert("cascadeImpacts", impact);
    }
  },
});

// ============================================================================
// BFS TRAVERSAL ENGINE
// ============================================================================

/**
 * Run BFS traversal with adaptive exponential decay.
 *
 * @param edges     - All edges for this user's knowledge graph
 * @param sourceId  - Starting document ID
 * @param direction - "forward" (what breaks) or "reverse" (what depends)
 * @param threshold - Minimum impact score to continue traversal
 * @param maxDepth  - Maximum hops from source
 * @param perturbation - Optional edge weight perturbation for bootstrap sampling
 */
function bfsTraverse(
  edges: EdgeData[],
  sourceId: string,
  direction: "forward" | "reverse",
  threshold: number,
  maxDepth: number,
  perturbation?: Map<string, number>,
): ImpactResult[] {
  // Build adjacency list based on direction
  const adjacency = new Map<string, Array<{ targetId: string; edge: EdgeData }>>();

  for (const edge of edges) {
    const fromId = direction === "forward" ? edge.sourceDocId : edge.targetDocId;
    const toId = direction === "forward" ? edge.targetDocId : edge.sourceDocId;

    const neighbors = adjacency.get(fromId);
    if (neighbors) {
      neighbors.push({ targetId: toId, edge });
    } else {
      adjacency.set(fromId, [{ targetId: toId, edge }]);
    }

    // Edges are bidirectional in the graph — also add reverse neighbor
    const reverseNeighbors = adjacency.get(toId);
    if (reverseNeighbors) {
      reverseNeighbors.push({ targetId: fromId, edge });
    } else {
      adjacency.set(toId, [{ targetId: fromId, edge }]);
    }
  }

  const impacts: ImpactResult[] = [];
  const visited = new Set<string>();
  visited.add(sourceId);

  // BFS queue: [documentId, currentImpactScore, currentDepth, pathSoFar]
  const queue: Array<[string, number, number, string[]]> = [];

  // Seed: neighbors of source at depth 1
  const sourceNeighbors = adjacency.get(sourceId) ?? [];
  for (const { targetId, edge } of sourceNeighbors) {
    if (visited.has(targetId)) continue;

    const edgeKey = `${edge.sourceDocId}:${edge.targetDocId}`;
    const weight = perturbation?.has(edgeKey)
      ? perturbation.get(edgeKey)!
      : edge.weight;

    const decay = adaptiveDecay(edge.signals);
    const impact = weight * decay;

    if (impact >= threshold) {
      queue.push([targetId, impact, 1, [sourceId, targetId]]);
    }
  }

  while (queue.length > 0) {
    const [docId, currentImpact, depth, path] = queue.shift()!;

    if (visited.has(docId)) continue;
    visited.add(docId);

    impacts.push({
      documentId: docId,
      impactScore: currentImpact,
      depth,
      direction,
      pathDescription: path.join(" → "),
    });

    // Continue traversal if within depth limit
    if (depth >= maxDepth) continue;

    const neighbors = adjacency.get(docId) ?? [];
    for (const { targetId, edge } of neighbors) {
      if (visited.has(targetId)) continue;

      const edgeKey = `${edge.sourceDocId}:${edge.targetDocId}`;
      const weight = perturbation?.has(edgeKey)
        ? perturbation.get(edgeKey)!
        : edge.weight;

      const decay = adaptiveDecay(edge.signals);
      const propagated = currentImpact * weight * decay;

      if (propagated >= threshold) {
        queue.push([targetId, propagated, depth + 1, [...path, targetId]]);
      }
    }
  }

  return impacts;
}

// ============================================================================
// D2 — BOOTSTRAP CONFIDENCE INTERVALS
// ============================================================================

/**
 * Compute bootstrap confidence intervals for a set of cascade impacts.
 *
 * Runs N_BOOTSTRAP resamplings with perturbed edge weights (±12% Gaussian noise).
 * Only computes for impacts with score >= 0.3 and depth <= 2.
 *
 * @returns Updated impacts with confidenceLow/confidenceHigh populated
 */
function addBootstrapCI(
  impacts: ImpactResult[],
  edges: EdgeData[],
  sourceId: string,
  direction: "forward" | "reverse",
  threshold: number,
  maxDepth: number,
): ImpactResult[] {
  // Only bootstrap significant, shallow impacts
  const eligibleDocs = new Set(
    impacts
      .filter((i) => i.impactScore >= 0.3 && i.depth <= 2)
      .map((i) => i.documentId),
  );

  if (eligibleDocs.size === 0) return impacts;

  // Collect bootstrap samples per document
  const samples = new Map<string, number[]>();
  for (const docId of eligibleDocs) {
    samples.set(docId, []);
  }

  for (let b = 0; b < N_BOOTSTRAP; b++) {
    // Generate perturbed edge weights
    const perturbation = new Map<string, number>();
    for (const edge of edges) {
      const key = `${edge.sourceDocId}:${edge.targetDocId}`;
      // Gaussian approximation via Box-Muller (using only one uniform)
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
      const perturbedWeight = Math.min(
        Math.max(edge.weight * (1 + EDGE_WEIGHT_VARIANCE * z), 0),
        1,
      );
      perturbation.set(key, perturbedWeight);
    }

    // Run BFS with perturbed weights
    const bootImpacts = bfsTraverse(
      edges,
      sourceId,
      direction,
      threshold,
      maxDepth,
      perturbation,
    );

    // Record scores for eligible documents
    const bootScoreMap = new Map<string, number>();
    for (const bi of bootImpacts) {
      bootScoreMap.set(bi.documentId, bi.impactScore);
    }

    for (const docId of eligibleDocs) {
      const score = bootScoreMap.get(docId) ?? 0;
      samples.get(docId)!.push(score);
    }
  }

  // Compute percentiles and attach to impacts
  return impacts.map((impact) => {
    const docSamples = samples.get(impact.documentId);
    if (!docSamples || docSamples.length === 0) return impact;

    docSamples.sort((a, b) => a - b);
    const p5Index = Math.floor(0.05 * docSamples.length);
    const p95Index = Math.floor(0.95 * docSamples.length);

    return {
      ...impact,
      confidenceLow: docSamples[p5Index]!,
      confidenceHigh: docSamples[p95Index]!,
    };
  });
}

// ============================================================================
// MAIN ACTION — CASCADE Prediction
// ============================================================================

/**
 * Public action — called from client UI (requires auth context).
 * Delegates to internalRunCascade with userId from identity.
 */
export const runCascade = action({
  args: {
    sourceDocId: v.id("documents"),
    direction: v.optional(
      v.union(
        v.literal("forward"),
        v.literal("reverse"),
        v.literal("both"),
      ),
    ),
  },
  handler: async (ctx, args): Promise<CascadeSummary> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return ctx.runAction(internal.laminar.cascade.internalRunCascade, {
      sourceDocId: args.sourceDocId,
      userId: identity.subject,
      ...(args.direction !== undefined ? { direction: args.direction } : {}),
    });
  },
});

/**
 * Internal action — called from scheduler or other internal actions (no auth context).
 * Accepts userId as an explicit argument per CLAUDE.md Rule 3b.
 */
export const internalRunCascade = internalAction({
  args: {
    sourceDocId: v.id("documents"),
    userId: v.string(),
    direction: v.optional(
      v.union(
        v.literal("forward"),
        v.literal("reverse"),
        v.literal("both"),
      ),
    ),
  },
  handler: async (ctx, args): Promise<CascadeSummary> => {
    const userId = args.userId;
    const startTime = Date.now();
    const cascadeDirection = args.direction ?? "both";

    // Create cascade run
    const runId = await ctx.runMutation(
      internal.laminar.cascade.createCascadeRun,
      {
        userId,
        sourceDocId: args.sourceDocId,
        decayRate: 0.80, // Nominal — actual decay is adaptive per edge
        threshold: DEFAULT_THRESHOLD,
      },
    );

    try {
      // Fetch all edges
      const rawEdges = await ctx.runQuery(
        internal.laminar.cascade.getUserEdges,
        { userId },
      );

      if (rawEdges.length === 0) {
        await ctx.runMutation(internal.laminar.cascade.completeCascadeRun, {
          runId,
          totalAffected: 0,
          maxDepth: 0,
        });
        return {
          runId,
          totalAffected: 0,
          maxDepthReached: 0,
          forwardCount: 0,
          reverseCount: 0,
          elapsedMs: Date.now() - startTime,
        };
      }

      // Convert to EdgeData
      const edges: EdgeData[] = rawEdges.map((e) => ({
        sourceDocId: String(e.sourceDocId),
        targetDocId: String(e.targetDocId),
        weight: e.weight,
        signals: {
          contentSimilarity: e.signals.contentSimilarity,
          embeddingSimilarity: e.signals.embeddingSimilarity ?? undefined,
          temporalProximity: e.signals.temporalProximity,
          coAccessStrength: e.signals.coAccessStrength,
          structuralLink: e.signals.structuralLink,
        },
      }));

      const sourceId = String(args.sourceDocId);
      let allImpacts: ImpactResult[] = [];

      // Forward cascade: "if this document changes, what is affected?"
      if (cascadeDirection === "forward" || cascadeDirection === "both") {
        let forwardImpacts = bfsTraverse(
          edges,
          sourceId,
          "forward",
          DEFAULT_THRESHOLD,
          DEFAULT_MAX_DEPTH,
        );
        forwardImpacts = addBootstrapCI(
          forwardImpacts,
          edges,
          sourceId,
          "forward",
          DEFAULT_THRESHOLD,
          DEFAULT_MAX_DEPTH,
        );
        allImpacts.push(...forwardImpacts);
      }

      // Reverse cascade: "what upstream documents does this depend on?"
      if (cascadeDirection === "reverse" || cascadeDirection === "both") {
        let reverseImpacts = bfsTraverse(
          edges,
          sourceId,
          "reverse",
          DEFAULT_THRESHOLD,
          DEFAULT_MAX_DEPTH,
        );
        reverseImpacts = addBootstrapCI(
          reverseImpacts,
          edges,
          sourceId,
          "reverse",
          DEFAULT_THRESHOLD,
          DEFAULT_MAX_DEPTH,
        );
        allImpacts.push(...reverseImpacts);
      }

      // Deduplicate: same doc may appear in both directions
      const uniqueDocIds = new Set(allImpacts.map((i) => i.documentId));
      const maxDepthReached = allImpacts.length > 0
        ? Math.max(...allImpacts.map((i) => i.depth))
        : 0;

      const forwardCount = allImpacts.filter((i) => i.direction === "forward").length;
      const reverseCount = allImpacts.filter((i) => i.direction === "reverse").length;

      console.log(
        `[CASCADE] ${allImpacts.length} impacts (${forwardCount} forward, ${reverseCount} reverse), ` +
          `max depth ${maxDepthReached}, ${uniqueDocIds.size} unique documents`,
      );

      // Persist impacts in batches of 25
      for (let i = 0; i < allImpacts.length; i += 25) {
        const batch = allImpacts.slice(i, i + 25).map((impact) => ({
          userId,
          runId,
          documentId: impact.documentId as Id<"documents">,
          impactScore: impact.impactScore,
          depth: impact.depth,
          direction: impact.direction,
          ...(impact.confidenceLow !== undefined
            ? { confidenceLow: impact.confidenceLow }
            : {}),
          ...(impact.confidenceHigh !== undefined
            ? { confidenceHigh: impact.confidenceHigh }
            : {}),
          ...(impact.pathDescription !== undefined
            ? { pathDescription: impact.pathDescription }
            : {}),
        }));

        await ctx.runMutation(
          internal.laminar.cascade.batchInsertCascadeImpacts,
          { impacts: batch },
        );
      }

      // Complete run
      await ctx.runMutation(internal.laminar.cascade.completeCascadeRun, {
        runId,
        totalAffected: uniqueDocIds.size,
        maxDepth: maxDepthReached,
      });

      const elapsedMs = Date.now() - startTime;
      console.log(`[CASCADE] Complete in ${elapsedMs}ms`);

      return {
        runId,
        totalAffected: uniqueDocIds.size,
        maxDepthReached,
        forwardCount,
        reverseCount,
        elapsedMs,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.laminar.cascade.failCascadeRun, {
        runId,
        error: message,
      });
      throw error;
    }
  },
});
