// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // === USER ACCOUNTS (Day 8) ===
  users: defineTable({
    clerkId: v.string(),           // Clerk user ID (from identity.subject)
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
  })
    .index("by_clerk_id", ["clerkId"]),

  // === DOCUMENTS (Day 7 + Multi-Vertical Support) ===
  // ✅ DAY 11 READY: Schema already includes all file upload fields!
  documents: defineTable({
    // === USER & ORGANIZATION ===
    userId: v.string(),                    // Clerk user ID (from JWT)
    organizationId: v.optional(v.string()), // For teams (later)
    vertical: v.string(),                   // "musician", "customer_support", "sales", etc.
    
    // === CONTENT ===
    title: v.string(),
    content: v.string(),                    // Full text content (extracted from PDF on Day 11)
    contentPlain: v.string(),               // Stripped HTML for search (searchable after Day 11 processing)
    contentPreview: v.string(),             // First 200 chars for UI
    
    // === DUPLICATE DETECTION (Day 10) ===
    contentHash: v.optional(v.string()),    // SHA-256 hash of title + content for duplicate detection
    
    // === METADATA ===
    type: v.union(
      v.literal("pdf"),                     // 📄 Day 11: PDF upload
      v.literal("text"),                    // 📝 Day 11: .txt upload
      v.literal("markdown"),                // 📋 Day 11: .md upload
      v.literal("slack"),
      v.literal("google-doc"),
      v.literal("notion"),
      v.literal("confluence")
    ),
    
    // 🚢 DAY 11: Upload metadata stored here
    source: v.object({
      platform: v.string(),                 // Day 11: Set to "file_upload"
      url: v.optional(v.string()),          // Not used for file uploads
      importedAt: v.optional(v.number()),   // Day 11: Set to Date.now() on upload
      importedBy: v.optional(v.string()),   // Day 11: Set to identity.subject (Clerk user ID)
    }),
    
    // === CHAOS THEORY METADATA (Days 16-20) ===
    chaosMetadata: v.optional(v.object({
      // Stage 1: Feature Extraction
      features: v.optional(v.array(v.string())),  // ["troubleshooting", "api", "billing"]
      
      // Stage 2: Pattern Classification
      patterns: v.optional(v.array(v.object({
        type: v.string(),                   // "process", "reference", "troubleshooting"
        confidence: v.number(),             // 0-1
        keywords: v.array(v.string()),
      }))),
      
      // Stage 3: Relationship Discovery
      relatedDocs: v.optional(v.array(v.id("documents"))),
      similarityScores: v.optional(v.array(v.number())),
      
      // Stage 4: Clustering
      clusterIds: v.optional(v.array(v.id("clusters"))),
      
      // Stage 5: Predictive Metadata
      predictedTopics: v.optional(v.array(v.string())),
      accessFrequency: v.optional(v.number()),
      lastAccessedAt: v.optional(v.number()),
    })),
    
    // === SEARCH & TAGS ===
    tags: v.array(v.string()),              // User-added tags
    autoTags: v.optional(v.array(v.string())), // AI-generated tags
    
    // === STATUS (Day 11: Essential for upload flow!) ===
    // 🚢 DAY 11: Upload workflow states
    status: v.union(
      v.literal("processing"),              // ⚙️ Day 11: PDF text extraction in progress
      v.literal("ready"),                   // ✅ Day 11: Document processed and searchable
      v.literal("error")                    // ❌ Day 11: Upload/processing failed
    ),
    errorMessage: v.optional(v.string()),   // Day 11: Error details for debugging
    
    // === FILE STORAGE (Day 11: Core upload fields!) ===
    // 📦 DAY 11: File upload essentials
    fileId: v.optional(v.id("_storage")),   // Day 11: Convex storage ID (from upload)
    fileSize: v.optional(v.number()),       // Day 11: File size in bytes (for validation)
    mimeType: v.optional(v.string()),       // Day 11: "application/pdf", "text/plain", etc.
    
    // === TIMESTAMPS ===
    createdAt: v.number(),                  // Day 11: When document record created
    updatedAt: v.optional(v.number()),      // Updated when edited
    processedAt: v.optional(v.number()),    // Day 11: When text extraction completed
    
    // === PRIVACY ===
    isPublic: v.boolean(),                  // Can other users see it?
  })
    // === INDEXES FOR FAST QUERIES ===
    .index("by_user", ["userId"])                      // Get user's docs
    .index("by_user_vertical", ["userId", "vertical"]) // Filter by vertical
    .index("by_user_and_status", ["userId", "status"]) // 🚢 Day 11: Find user's "processing" docs
    .index("by_status", ["status"])                    // 🚢 Day 11: Find all processing docs globally
    .index("by_organization", ["organizationId"])      // Team docs
    .index("by_created", ["createdAt"])                // Sort by date
    .index("by_user_and_hash", ["userId", "contentHash"]) // Duplicate detection
    
    // === FULL-TEXT SEARCH INDEX ===
    // 🔍 DAY 11: Documents become searchable after text extraction
    .searchIndex("search_content", {
      searchField: "contentPlain",                     // Day 11: Extracted PDF text goes here
      filterFields: ["userId", "vertical", "type", "status"],
    }),

  // === AI QUERY LOGS (Day 13) ===
  // 🏮 LIGHTHOUSE: Track all questions asked to Claude API
  queries: defineTable({
    // === USER ===
    userId: v.string(),                    // Clerk user ID (who asked the question)
    
    // === QUESTION & ANSWER ===
    query: v.string(),                     // User's question to the LIGHTHOUSE
    answer: v.string(),                    // Claude's response
    
    // === CONTEXT ===
    documentIds: v.array(v.id("documents")), // Which docs were searched
    
    // === PERFORMANCE METRICS ===
    tokensUsed: v.number(),                // Input + output tokens (for cost tracking)
    responseTimeMs: v.number(),            // How long Claude took to respond
    model: v.string(),                     // Which Claude model was used
    
    // === TIMESTAMP ===
    timestamp: v.number(),                 // When the question was asked
  })
    .index("by_user", ["userId"])          // Get user's query history
    .index("by_timestamp", ["timestamp"])  // Sort queries by date
    .index("by_user_and_timestamp", ["userId", "timestamp"]), // User's recent queries

  // ============================================================
  // === LAMINAR TABLES (Day 16) — ARCHIPELAGOS Self-Organization
  // ============================================================
  // 🌊 LAMINAR Stage 1: Chaos theory-powered document clustering
  // Documents auto-organize into ARCHIPELAGOS (knowledge islands)
  // without manual folder creation. Uses TF-IDF + K-Means + softmax
  // confidence scoring (autonomous systems sensor fusion pattern).

  // === CLUSTERING RUNS ===
  // Tracks each execution of the LAMINAR algorithm.
  // One record per time the clustering pipeline runs.
  clusteringRuns: defineTable({
    userId: v.string(),                    // Clerk user ID (who triggered clustering)
    status: v.union(
      v.literal("running"),                // ⚙️ Pipeline in progress
      v.literal("completed"),              // ✅ ARCHIPELAGOS charted successfully
      v.literal("failed")                  // ❌ Stormy seas — pipeline error
    ),
    documentCount: v.number(),             // How many documents were clustered
    clusterCount: v.number(),              // How many ARCHIPELAGOS were discovered
    silhouetteScore: v.optional(v.number()), // Clustering quality: -1 to +1 (target > 0.3)
    startedAt: v.number(),                 // Pipeline start timestamp
    completedAt: v.optional(v.number()),   // Pipeline end timestamp
    error: v.optional(v.string()),         // Error message if status === "failed"
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  // === CLUSTERS (ARCHIPELAGOS) ===
  // The knowledge islands themselves — each cluster represents a
  // thematic grouping of documents discovered by LAMINAR.
  clusters: defineTable({
    userId: v.string(),                    // Cluster owner
    runId: v.id("clusteringRuns"),         // Which run produced this cluster
    name: v.string(),                      // Derived from top keywords (e.g., "mixing & reverb & vocals")
    description: v.optional(v.string()),   // Optional summary of cluster contents
    documentCount: v.number(),             // Documents in this ARCHIPELAGO
    topKeywords: v.array(v.string()),      // Top TF-IDF terms for this cluster
    centroid: v.array(v.number()),         // TF-IDF centroid vector (for distance calculations)
    coherenceScore: v.number(),            // Per-cluster silhouette (displayed as "coherence")
    color: v.optional(v.string()),         // For UI visualization (auto-assigned)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_run", ["runId"]),

  // === CLUSTER MEMBERSHIPS ===
  // Probabilistic membership — the key autonomous systems enhancement.
  // Instead of binary "doc belongs to cluster 3," we store a full
  // probability distribution: 72% cluster A, 18% cluster B, 10% cluster C.
  // This is the sensor fusion pattern from EKF navigation systems.
  clusterMemberships: defineTable({
    userId: v.string(),                    // For auth filtering
    documentId: v.id("documents"),         // Which document
    clusterId: v.id("clusters"),           // Which ARCHIPELAGO
    runId: v.id("clusteringRuns"),         // Which run produced this membership
    probability: v.number(),               // 0.0–1.0 from softmax (sensor fusion confidence)
    isPrimary: v.boolean(),                // Highest probability cluster for this document?
    isAmbiguous: v.boolean(),              // Top two clusters within 15%? (bridge document)
    assignedAt: v.number(),
  })
    .index("by_document", ["documentId"])  // All clusters a doc belongs to
    .index("by_cluster", ["clusterId"])    // All docs in a cluster
    .index("by_user", ["userId"])          // User's memberships
    .index("by_run", ["runId"]),           // All memberships from a run

  // === CLUSTER HISTORY ===
  // Tracks how ARCHIPELAGOS evolve over time across clustering runs.
  // Pre-built for Day 17 (CURRENTS — temporal pattern detection).
  // "Schema now, logic later" pattern from autonomous systems spec.
  clusterHistory: defineTable({
    clusterId: v.id("clusters"),           // Which ARCHIPELAGO
    runId: v.id("clusteringRuns"),         // Which run snapshot
    membershipCount: v.number(),           // How many docs at this point in time
    accessCount: v.number(),               // Total access events (populated Day 17+)
    coherenceScore: v.number(),            // Cluster quality at this snapshot
    timestamp: v.number(),                 // When this snapshot was recorded
  })
    .index("by_cluster", ["clusterId"])
    .index("by_cluster_time", ["clusterId", "timestamp"]),

  // ADD to convex/schema.ts — inside defineSchema({...})

  // Day 17: Temporal Pattern Detection
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

  temporalPatterns: defineTable({
    userId: v.string(),
    documentId: v.id("documents"),
    accessRate: v.number(),           // accesses per day (current window)
    rateOfChange: v.number(),         // acceleration/deceleration
    trend: v.union(
      v.literal("rising"),
      v.literal("stable"),
      v.literal("declining"),
      v.literal("periodic")
    ),
    periodicity: v.optional(v.number()),  // days between peaks, if periodic
    predictedRelevance: v.number(),       // 0-1 score for T+7 prediction
    lastComputed: v.number(),             // when this pattern was last calculated
    totalAccesses: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_document", ["documentId"])
    .index("by_user_and_document", ["userId", "documentId"])
    .index("by_user_and_trend", ["userId", "trend"]),

  // Co-occurrence: which documents are accessed together?
  cooccurrences: defineTable({
    userId: v.string(),
    documentA: v.id("documents"),
    documentB: v.id("documents"),
    count: v.number(),                // how many sessions they co-occurred in
    lastSeen: v.number(),             // last session timestamp
    strength: v.number(),             // normalized 0-1 co-occurrence strength
  })
    .index("by_user", ["userId"])
    .index("by_document_a", ["userId", "documentA"])
    .index("by_document_b", ["userId", "documentB"]),
});