/**
 * LAMINAR Real-Time Cluster Data Queries
 *
 * Convex reactive queries for the ARCHIPELAGOS UI. All queries:
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
