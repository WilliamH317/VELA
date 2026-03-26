// convex/schema.ts — VELA Database Schema
//
// Design principles:
//   1. Auth-scoped: Every user-facing table has userId + by_user index
//   2. Index everything filtered: If you query by it, index it
//   3. Search-optimized: contentPlain field for full-text search
//   4. Schema now, logic later: Tables for upcoming days added early
//      so schema deploys don't block feature development
//
// Tables by feature:
//   Core ............ users, documents, queries
//   LAMINAR 16 ...... clusteringRuns, clusters, clusterMemberships, clusterHistory
//   LAMINAR 17 ...... accessEvents, temporalPatterns, cooccurrences
//   LAMINAR 18 ...... knowledgeEdges
//   LAMINAR 19 ...... cascadeRuns, cascadeImpacts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─────────────────────────────────────────────
  // CORE: Users (Day 8)
  // ─────────────────────────────────────────────

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    subscription: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Stripe billing (Day 23)
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()), // Unix timestamp ms

    // Rate limiting (Day 25)
    queriesThisMonth: v.optional(v.number()),
    lastQueryReset: v.optional(v.number()), // Unix timestamp ms

    // Onboarding (Day 24)
    onboardingComplete: v.optional(v.boolean()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_stripe_customer", ["stripeCustomerId"]),

  // ─────────────────────────────────────────────
  // CORE: Documents (Days 7-11)
  // ─────────────────────────────────────────────
  // PORT uploads create documents with status:"processing",
  // then processFile background job fills content fields
  // and flips status to "ready".

  documents: defineTable({
    // Ownership
    userId: v.string(),
    organizationId: v.optional(v.string()), // Future: team workspaces
    vertical: v.string(), // "agency", "customer_support", etc.

    // Content
    title: v.string(),
    content: v.string(),
    contentPlain: v.string(), // Stripped text for search index
    contentPreview: v.string(), // First 200 chars for UI cards

    // Duplicate detection
    contentHash: v.optional(v.string()), // DJB2 hash of title + content

    // Document type
    type: v.union(
      v.literal("pdf"),
      v.literal("text"),
      v.literal("markdown"),
      v.literal("slack"),
      v.literal("google-doc"),
      v.literal("notion"),
      v.literal("confluence")
    ),

    // Source tracking
    source: v.object({
      platform: v.string(), // "manual", "file_upload", "api"
      url: v.optional(v.string()),
      importedAt: v.optional(v.number()),
      importedBy: v.optional(v.string()),
    }),

    // LAMINAR chaos theory metadata (Days 16-20)
    chaosMetadata: v.optional(
      v.object({
        // Stage 1: Feature extraction
        features: v.optional(v.array(v.string())),
        // Stage 2: Pattern classification
        patterns: v.optional(
          v.array(
            v.object({
              type: v.string(),
              confidence: v.number(),
              keywords: v.array(v.string()),
            })
          )
        ),
        // Stage 3: Relationships
        relatedDocs: v.optional(v.array(v.id("documents"))),
        similarityScores: v.optional(v.array(v.number())),
        // Stage 4: Clustering
        clusterIds: v.optional(v.array(v.id("clusters"))),
        // Stage 5: Predictive
        predictedTopics: v.optional(v.array(v.string())),
        accessFrequency: v.optional(v.number()),
        lastAccessedAt: v.optional(v.number()),
      })
    ),

    // Tags
    tags: v.array(v.string()),
    autoTags: v.optional(v.array(v.string())),

    // Status (processing → ready | error)
    status: v.union(
      v.literal("processing"),
      v.literal("ready"),
      v.literal("error")
    ),
    errorMessage: v.optional(v.string()),

    // File storage (populated for PORT uploads)
    fileId: v.optional(v.id("_storage")),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    processedAt: v.optional(v.number()),

    // Privacy
    isPublic: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_vertical", ["userId", "vertical"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_status", ["status"])
    .index("by_organization", ["organizationId"])
    .index("by_created", ["createdAt"])
    .index("by_user_and_hash", ["userId", "contentHash"])
    .searchIndex("search_content", {
      searchField: "contentPlain",
      filterFields: ["userId", "vertical", "type", "status"],
    }),

  // ─────────────────────────────────────────────
  // CORE: AI Query Logs (Day 13)
  // ─────────────────────────────────────────────
  // LIGHTHOUSE tracks every question asked to Claude API.
  // Used by queries.ts getUsageStats for analytics.

  queries: defineTable({
    userId: v.string(),
    query: v.string(),
    answer: v.string(),
    documentIds: v.array(v.id("documents")),
    tokensUsed: v.number(),
    responseTimeMs: v.number(),
    model: v.string(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_and_timestamp", ["userId", "timestamp"]),

  // ─────────────────────────────────────────────
  // LAMINAR Stage 1: ARCHIPELAGOS (Day 16)
  // ─────────────────────────────────────────────
  // TF-IDF + K-Means + softmax confidence scoring.
  // Documents auto-organize into knowledge islands.

  /** Tracks each execution of the clustering pipeline. */
  clusteringRuns: defineTable({
    userId: v.string(),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    documentCount: v.number(),
    clusterCount: v.number(),
    silhouetteScore: v.optional(v.number()), // -1 to +1 (target > 0.3)
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  /** Knowledge islands — thematic groupings discovered by LAMINAR. */
  clusters: defineTable({
    userId: v.string(),
    runId: v.id("clusteringRuns"),
    name: v.string(), // Derived from top keywords
    description: v.optional(v.string()),
    documentCount: v.number(),
    topKeywords: v.array(v.string()),
    centroid: v.array(v.number()), // TF-IDF centroid vector
    coherenceScore: v.number(), // Per-cluster silhouette
    color: v.optional(v.string()), // UI visualization
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_run", ["runId"]),

  /**
   * Probabilistic memberships — sensor fusion pattern.
   * Instead of binary assignment, stores full probability distribution:
   * 72% cluster A, 18% cluster B, 10% cluster C.
   */
  clusterMemberships: defineTable({
    userId: v.string(),
    documentId: v.id("documents"),
    clusterId: v.id("clusters"),
    runId: v.id("clusteringRuns"),
    probability: v.number(), // 0.0–1.0 from softmax
    isPrimary: v.boolean(), // Highest probability cluster?
    isAmbiguous: v.boolean(), // Top two within 15%? (bridge document)
    assignedAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_cluster", ["clusterId"])
    .index("by_user", ["userId"])
    .index("by_run", ["runId"]),

  /** Tracks how clusters evolve across runs (pre-built for Day 17). */
  clusterHistory: defineTable({
    clusterId: v.id("clusters"),
    runId: v.id("clusteringRuns"),
    membershipCount: v.number(),
    accessCount: v.number(), // Populated Day 17+
    coherenceScore: v.number(),
    timestamp: v.number(),
  })
    .index("by_cluster", ["clusterId"])
    .index("by_cluster_time", ["clusterId", "timestamp"]),

  // ─────────────────────────────────────────────
  // LAMINAR Stage 2: CURRENTS (Day 17)
  // ─────────────────────────────────────────────
  // Temporal pattern detection: access trajectories,
  // co-occurrence tracking, relevance prediction.

  /** Raw access events — the behavioral signal for LAMINAR. */
  accessEvents: defineTable({
    documentId: v.id("documents"),
    userId: v.string(),
    sessionId: v.string(),
    timestamp: v.number(),
    action: v.union(
      v.literal("view"),
      v.literal("search_hit"),
      v.literal("ai_query"),
      v.literal("ai_cited")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_document", ["documentId"])
    .index("by_user_and_document", ["userId", "documentId"])
    .index("by_session", ["sessionId"])
    .index("by_timestamp", ["timestamp"]),

  /** Computed access trajectories per document. */
  temporalPatterns: defineTable({
    userId: v.string(),
    documentId: v.id("documents"),
    accessRate: v.number(), // Accesses per day (current window)
    rateOfChange: v.number(), // Acceleration/deceleration
    trend: v.union(
      v.literal("rising"),
      v.literal("stable"),
      v.literal("declining"),
      v.literal("periodic")
    ),
    periodicity: v.optional(v.number()), // Days between peaks
    predictedRelevance: v.number(), // 0-1 score for T+7
    lastComputed: v.number(),
    totalAccesses: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_document", ["documentId"])
    .index("by_user_and_document", ["userId", "documentId"])
    .index("by_user_and_trend", ["userId", "trend"]),

  /** Which documents are accessed together within sessions? */
  cooccurrences: defineTable({
    userId: v.string(),
    documentA: v.id("documents"),
    documentB: v.id("documents"),
    count: v.number(), // Sessions they co-occurred in
    lastSeen: v.number(),
    strength: v.number(), // Normalized 0-1
  })
    .index("by_user", ["userId"])
    .index("by_document_a", ["userId", "documentA"])
    .index("by_document_b", ["userId", "documentB"]),

  // ─────────────────────────────────────────────
  // LAMINAR Stage 3: Cross-Document Intelligence (Day 18)
  // ─────────────────────────────────────────────
  // Knowledge graph edges combining 4 signal types:
  // content similarity, temporal proximity, co-access,
  // and structural links. Multi-signal fusion architecture.

  /**
   * Weighted edges in the knowledge graph.
   * Each edge stores both the combined weight and the per-signal
   * breakdown so the system can learn which signals matter most.
   */
  knowledgeEdges: defineTable({
    userId: v.string(),
    sourceDocId: v.id("documents"),
    targetDocId: v.id("documents"),
    weight: v.number(), // Combined 0-1 score
    // Per-signal breakdown (for adaptive weighting)
    signals: v.object({
      contentSimilarity: v.number(), // TF-IDF cosine similarity
      temporalProximity: v.number(), // Access time correlation
      coAccessStrength: v.number(), // From cooccurrences table
      structuralLink: v.number(), // Shared clusters, tags, etc.
    }),
    isBridge: v.boolean(), // Connects otherwise separate clusters?
    lastComputed: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_source", ["userId", "sourceDocId"])
    .index("by_target", ["userId", "targetDocId"]),

  // ─────────────────────────────────────────────
  // LAMINAR Stage 4: Butterfly Effect (Day 19)
  // ─────────────────────────────────────────────
  // Cascade prediction: when a document changes, which
  // other documents might be affected? BFS traversal
  // with exponential decay across the knowledge graph.

  /** One record per cascade analysis run. */
  cascadeRuns: defineTable({
    userId: v.string(),
    sourceDocId: v.id("documents"), // Document that triggered analysis
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    totalAffected: v.number(), // Documents above threshold
    maxDepth: v.number(), // Deepest cascade level reached
    decayRate: v.number(), // Decay factor used (default 0.8)
    threshold: v.number(), // Minimum impact threshold (default 0.3)
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_source", ["userId", "sourceDocId"]),

  /** Individual impact predictions from a cascade run. */
  cascadeImpacts: defineTable({
    userId: v.string(),
    runId: v.id("cascadeRuns"),
    documentId: v.id("documents"), // Affected document
    impactScore: v.number(), // 0-1 propagated impact
    depth: v.number(), // Hops from source document
    pathDescription: v.optional(v.string()), // Human-readable path
  })
    .index("by_run", ["runId"])
    .index("by_document", ["userId", "documentId"]),
});