/**
 * LAMINAR Real-Time Cluster & Temporal Data Queries
 *
 * Convex reactive queries for the ARCHIPELAGOS + CURRENTS UI. All queries:
 * - Check authentication first (return null if not signed in)
 * - Filter by userId === identity.subject for data isolation
 * - Use withIndex for efficient lookups
 * - Return undefined-safe results (handle missing data gracefully)
 *
 * Because these are Convex queries (not actions), they automatically
 * re-run over WebSocket when underlying data changes — giving the UI
 * real-time updates as clustering completes.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

// ============================================================================
// 1. listClusters
//    Returns clusters from the user's latest completed run.
// ============================================================================

export const listClusters = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    // Find the latest completed clustering run via compound index
    const latestRun = await ctx.db
      .query("clusteringRuns")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "completed"),
      )
      .order("desc")
      .first();

    if (!latestRun) return null;

    // Fetch all clusters produced by that run
    const clusters = await ctx.db
      .query("clusters")
      .withIndex("by_run", (q) => q.eq("runId", latestRun._id))
      .collect();

    return {
      run: {
        _id: latestRun._id,
        documentCount: latestRun.documentCount,
        clusterCount: latestRun.clusterCount,
        silhouetteScore: latestRun.silhouetteScore,
        completedAt: latestRun.completedAt,
      },
      clusters: clusters.map((c) => ({
        _id: c._id,
        name: c.name,
        description: c.description,
        documentCount: c.documentCount,
        topKeywords: c.topKeywords,
        coherenceScore: c.coherenceScore,
        color: c.color,
      })),
    };
  },
});

// ============================================================================
// 2. getClusterMembers
//    Returns documents in a cluster with membership probability.
//    Sorted by probability descending.
// ============================================================================

export const getClusterMembers = query({
  args: { clusterId: v.id("clusters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    // Verify cluster exists and belongs to user
    const cluster = await ctx.db.get(args.clusterId);
    if (!cluster || cluster.userId !== userId) return null;

    // Fetch memberships via by_cluster index
    const memberships = await ctx.db
      .query("clusterMemberships")
      .withIndex("by_cluster", (q) => q.eq("clusterId", args.clusterId))
      .collect();

    // Hydrate each membership with its document (exclude heavy fields)
    const members = await Promise.all(
      memberships.map(async (m) => {
        const doc = await ctx.db.get(m.documentId);
        if (!doc) return null;
        return {
          document: {
            _id: doc._id,
            title: doc.title,
            type: doc.type,
            contentPreview: doc.contentPreview,
            tags: doc.tags,
            status: doc.status,
            createdAt: doc.createdAt,
          },
          probability: m.probability,
          isPrimary: m.isPrimary,
          isAmbiguous: m.isAmbiguous,
        };
      }),
    );

    // Filter deleted docs, sort by probability descending
    const validMembers = members
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => b.probability - a.probability);

    return {
      cluster: {
        _id: cluster._id,
        name: cluster.name,
        description: cluster.description,
        documentCount: cluster.documentCount,
        topKeywords: cluster.topKeywords,
        coherenceScore: cluster.coherenceScore,
        color: cluster.color,
      },
      members: validMembers,
    };
  },
});

// ============================================================================
// 3. getClusteringStatus
//    Returns the user's most recent clustering run (any status).
//    Used to show "running" spinner, "completed" results, or "failed" error.
// ============================================================================

export const getClusteringStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    // Most recent run regardless of status — order desc by _creationTime
    const latestRun = await ctx.db
      .query("clusteringRuns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (!latestRun) return null;

    return {
      _id: latestRun._id,
      status: latestRun.status,
      documentCount: latestRun.documentCount,
      clusterCount: latestRun.clusterCount,
      silhouetteScore: latestRun.silhouetteScore,
      startedAt: latestRun.startedAt,
      completedAt: latestRun.completedAt,
      error: latestRun.error,
    };
  },
});

// ============================================================================
// 4. getDocumentClusters
//    Returns all clusters a document belongs to with probabilities.
//    Scoped to the latest completed run so stale memberships don't appear.
//    Sorted by probability descending.
// ============================================================================

export const getDocumentClusters = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    // Verify document belongs to user
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== userId) return null;

    // Find the latest completed run to scope memberships
    const latestRun = await ctx.db
      .query("clusteringRuns")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "completed"),
      )
      .order("desc")
      .first();

    if (!latestRun) return null;

    // Fetch all memberships for this document, then filter to latest run.
    // (by_document index gives us all runs; we filter in-memory since a
    // document typically has only K memberships per run, so this is cheap.)
    const allMemberships = await ctx.db
      .query("clusterMemberships")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    const memberships = allMemberships.filter(
      (m) => m.runId === latestRun._id,
    );

    // Hydrate each membership with cluster details
    const clusters = await Promise.all(
      memberships.map(async (m) => {
        const cluster = await ctx.db.get(m.clusterId);
        if (!cluster) return null;
        return {
          cluster: {
            _id: cluster._id,
            name: cluster.name,
            topKeywords: cluster.topKeywords,
            coherenceScore: cluster.coherenceScore,
            color: cluster.color,
          },
          probability: m.probability,
          isPrimary: m.isPrimary,
          isAmbiguous: m.isAmbiguous,
        };
      }),
    );

    const validClusters = clusters
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.probability - a.probability);

    return {
      document: {
        _id: doc._id,
        title: doc.title,
        type: doc.type,
      },
      clusters: validClusters,
    };
  },
});

// ============================================================================
// 5. getDocumentTrajectory
//    Returns the temporal pattern for a specific document.
//    Shows access rate, trend, periodicity, and predicted relevance.
// ============================================================================

export const getDocumentTrajectory = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    // Verify document belongs to user
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== userId) return null;

    // Fetch temporal pattern via compound index
    const pattern = await ctx.db
      .query("temporalPatterns")
      .withIndex("by_user_and_document", (q) =>
        q.eq("userId", userId).eq("documentId", args.documentId),
      )
      .first();

    if (!pattern) return null;

    return {
      documentId: pattern.documentId,
      accessRate: pattern.accessRate,
      rateOfChange: pattern.rateOfChange,
      trend: pattern.trend,
      periodicity: pattern.periodicity,
      predictedRelevance: pattern.predictedRelevance,
      totalAccesses: pattern.totalAccesses,
      lastComputed: pattern.lastComputed,
    };
  },
});

// ============================================================================
// 6. getRelatedDocuments
//    Returns documents co-occurring with a target document in sessions.
//    Queries both by_document_a and by_document_b indexes since the target
//    doc could appear in either position of the sorted pair.
// ============================================================================

export const getRelatedDocuments = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    // Verify document belongs to user
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== userId) return null;

    // Target doc may be in documentA or documentB position — query both indexes
    const [asDocA, asDocB] = await Promise.all([
      ctx.db
        .query("cooccurrences")
        .withIndex("by_document_a", (q) =>
          q.eq("userId", userId).eq("documentA", args.documentId),
        )
        .collect(),
      ctx.db
        .query("cooccurrences")
        .withIndex("by_document_b", (q) =>
          q.eq("userId", userId).eq("documentB", args.documentId),
        )
        .collect(),
    ]);

    // Extract the *other* document from each pair + deduplicate
    const relatedMap = new Map<string, { strength: number; count: number }>();

    for (const cooc of asDocA) {
      const otherId = cooc.documentB as string;
      const existing = relatedMap.get(otherId);
      if (!existing || cooc.strength > existing.strength) {
        relatedMap.set(otherId, { strength: cooc.strength, count: cooc.count });
      }
    }
    for (const cooc of asDocB) {
      const otherId = cooc.documentA as string;
      const existing = relatedMap.get(otherId);
      if (!existing || cooc.strength > existing.strength) {
        relatedMap.set(otherId, { strength: cooc.strength, count: cooc.count });
      }
    }

    // Sort by strength descending, take top results
    const sorted = [...relatedMap.entries()]
      .sort((a, b) => b[1].strength - a[1].strength)
      .slice(0, 10);

    // Hydrate with document titles and optional trend data
    const results = await Promise.all(
      sorted.map(async ([relatedDocId, { strength }]) => {
        const relatedDoc = await ctx.db.get(
          relatedDocId as typeof args.documentId,
        );
        if (!relatedDoc) return null;

        // Optionally fetch the related doc's trend for display
        const pattern = await ctx.db
          .query("temporalPatterns")
          .withIndex("by_user_and_document", (q) =>
            q.eq("userId", userId).eq("documentId", relatedDoc._id),
          )
          .first();

        return {
          documentId: relatedDoc._id,
          title: relatedDoc.title,
          strength,
          trend: pattern?.trend ?? null,
        };
      }),
    );

    return results.filter(
      (r): r is NonNullable<typeof r> => r !== null,
    );
  },
});

// ============================================================================
// 7. getTrendingDocuments
//    Returns all documents with a "rising" trend.
//    Used for the "Trending in your knowledge base" dashboard widget.
// ============================================================================

export const getTrendingDocuments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    // Fetch rising patterns via compound index
    const risingPatterns = await ctx.db
      .query("temporalPatterns")
      .withIndex("by_user_and_trend", (q) =>
        q.eq("userId", userId).eq("trend", "rising"),
      )
      .collect();

    if (risingPatterns.length === 0) return [];

    // Hydrate with document titles, sort by predicted relevance
    const results = await Promise.all(
      risingPatterns.map(async (pattern) => {
        const doc = await ctx.db.get(pattern.documentId);
        if (!doc) return null;
        return {
          documentId: doc._id,
          title: doc.title,
          accessRate: pattern.accessRate,
          predictedRelevance: pattern.predictedRelevance,
        };
      }),
    );

    return results
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.predictedRelevance - a.predictedRelevance);
  },
});

// ============================================================================
// 8. getTemporalSummary
//    Dashboard overview: count of documents by trend category.
//    Powers the CURRENTS summary card on the HELM dashboard.
// ============================================================================

export const getTemporalSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    // Fetch all user's temporal patterns via user index.
    // Counting by trend in-memory is efficient since a user typically has
    // tens to low hundreds of documents — far cheaper than 4 index queries.
    const patterns = await ctx.db
      .query("temporalPatterns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const counts = { rising: 0, stable: 0, declining: 0, periodic: 0 };
    for (const pattern of patterns) {
      counts[pattern.trend]++;
    }

    return {
      ...counts,
      totalAnalyzed: patterns.length,
    };
  },
});

// ============================================================================
// 9. getDocumentConnections
//    Knowledge graph connections for a specific document.
//    Queries both directions (source and target) of knowledgeEdges.
// ============================================================================

export const getDocumentConnections = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    // Verify document belongs to user
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== userId) return null;

    // Query edges where this doc is source
    const asSource = await ctx.db
      .query("knowledgeEdges")
      .withIndex("by_source", (q) =>
        q.eq("userId", userId).eq("sourceDocId", args.documentId),
      )
      .collect();

    // Query edges where this doc is target
    const asTarget = await ctx.db
      .query("knowledgeEdges")
      .withIndex("by_target", (q) =>
        q.eq("userId", userId).eq("targetDocId", args.documentId),
      )
      .collect();

    // Merge, sort by weight desc, take top 10
    const allEdges = [...asSource, ...asTarget]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    // Resolve connected document titles
    const connections = await Promise.all(
      allEdges.map(async (edge) => {
        const connectedId =
          String(edge.sourceDocId) === String(args.documentId)
            ? edge.targetDocId
            : edge.sourceDocId;
        const connectedDoc = await ctx.db.get(connectedId);
        const signalCount = [
          edge.signals.contentSimilarity,
          edge.signals.structuralLink,
          edge.signals.coAccessStrength,
          edge.signals.temporalProximity,
        ].filter((s) => s > 0).length;

        return {
          documentId: connectedId,
          title: connectedDoc?.title ?? "Unknown document",
          weight: edge.weight,
          signals: edge.signals,
          signalCount,
          isBridge: edge.isBridge,
        };
      }),
    );

    return connections;
  },
});

// ============================================================================
// 10. getBridgeDocuments
//     Documents spanning multiple ARCHIPELAGOS (isAmbiguous in memberships).
// ============================================================================

export const getBridgeDocuments = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    // Find latest completed run to scope memberships
    const latestRun = await ctx.db
      .query("clusteringRuns")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "completed"),
      )
      .order("desc")
      .first();

    if (!latestRun) return [];

    const memberships = await ctx.db
      .query("clusterMemberships")
      .withIndex("by_run", (q) => q.eq("runId", latestRun._id))
      .collect();

    // Collect unique ambiguous document IDs
    const ambiguousDocIds = [
      ...new Set(
        memberships
          .filter((m) => m.isAmbiguous === true)
          .map((m) => m.documentId),
      ),
    ];

    const docs = await Promise.all(
      ambiguousDocIds.slice(0, 20).map(async (id) => {
        const doc = await ctx.db.get(id);
        if (!doc) return null;
        // Get this doc's cluster memberships for display
        const docMemberships = memberships
          .filter((m) => String(m.documentId) === String(id))
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 3);
        return {
          _id: doc._id,
          title: doc.title,
          topMemberships: docMemberships.map((m) => ({
            clusterId: m.clusterId,
            probability: m.probability,
          })),
        };
      }),
    );

    return docs.filter(
      (d): d is NonNullable<typeof d> => d !== null,
    );
  },
});

// ============================================================================
// 11. getAttractorStates
//     Most-connected documents — knowledge centers in the graph.
// ============================================================================

export const getAttractorStates = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    const edges = await ctx.db
      .query("knowledgeEdges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (edges.length === 0) return [];

    // Sum edge weights and connection counts per document
    const weightMap = new Map<string, number>();
    const countMap = new Map<string, number>();
    for (const edge of edges) {
      const src = String(edge.sourceDocId);
      const tgt = String(edge.targetDocId);
      weightMap.set(src, (weightMap.get(src) ?? 0) + edge.weight);
      weightMap.set(tgt, (weightMap.get(tgt) ?? 0) + edge.weight);
      countMap.set(src, (countMap.get(src) ?? 0) + 1);
      countMap.set(tgt, (countMap.get(tgt) ?? 0) + 1);
    }

    // Sort by total weight desc, take top 10
    const sorted = [...weightMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const maxWeight = sorted[0]?.[1] ?? 0;

    const attractors = await Promise.all(
      sorted.map(async ([docId, totalWeight]) => {
        // docId is a string representation of Id<"documents">
        const doc = await ctx.db.get(
          docId as unknown as typeof edges[0]["sourceDocId"],
        );
        return {
          documentId: docId,
          title: doc?.title ?? "Unknown document",
          totalWeight,
          connectionCount: countMap.get(docId) ?? 0,
          classification:
            totalWeight > maxWeight * 0.7
              ? ("strong" as const)
              : totalWeight > maxWeight * 0.3
                ? ("emerging" as const)
                : ("peripheral" as const),
        };
      }),
    );

    return attractors;
  },
});

// ============================================================================
// 12. getGraphSummary
//     High-level stats for the connections page header.
// ============================================================================

export const getGraphSummary = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    const edges = await ctx.db
      .query("knowledgeEdges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const uniqueDocs = new Set<string>();
    let totalWeight = 0;
    let bridgeCount = 0;
    for (const edge of edges) {
      uniqueDocs.add(String(edge.sourceDocId));
      uniqueDocs.add(String(edge.targetDocId));
      totalWeight += edge.weight;
      if (edge.isBridge) bridgeCount++;
    }

    return {
      edgeCount: edges.length,
      documentCount: uniqueDocs.size,
      avgWeight: edges.length > 0 ? totalWeight / edges.length : 0,
      bridgeEdgeCount: bridgeCount,
      lastComputed:
        edges.length > 0
          ? Math.max(...edges.map((e) => e.lastComputed))
          : null,
    };
  },
});
