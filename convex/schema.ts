import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    // === CORE FIELDS ===
    userId: v.string(),              // Clerk user ID (from JWT)
    organizationId: v.optional(v.string()), // For teams (later)
    vertical: v.string(),             // "musician", "customer-support", "sales", etc.
    
    // === CONTENT ===
    title: v.string(),
    content: v.string(),              // Full text content
    contentPlain: v.string(),         // Stripped HTML for search
    contentPreview: v.string(),       // First 200 chars for UI
    
    // === METADATA ===
    type: v.union(
      v.literal("pdf"),
      v.literal("text"),
      v.literal("markdown"),
      v.literal("slack"),
      v.literal("google-doc"),
      v.literal("notion"),
      v.literal("confluence")
    ),
    
    source: v.object({
      platform: v.string(),           // "manual", "slack", "google-drive", etc.
      url: v.optional(v.string()),    // Original URL if imported
      importedAt: v.optional(v.number()),
      importedBy: v.optional(v.string()),
    }),
    
    // === CHAOS THEORY METADATA ===
    // These power VELA's intelligent organization
    chaosMetadata: v.optional(v.object({
      // Stage 1: Feature Extraction
      features: v.optional(v.array(v.string())),  // ["troubleshooting", "api", "billing"]
      
      // Stage 2: Pattern Classification
      patterns: v.optional(v.array(v.object({
        type: v.string(),             // "process", "reference", "troubleshooting"
        confidence: v.number(),       // 0-1
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
    tags: v.array(v.string()),        // User-added tags
    autoTags: v.optional(v.array(v.string())), // AI-generated tags
    
    // === STATUS ===
    status: v.union(
      v.literal("processing"),        // Upload in progress
      v.literal("ready"),             // Ready to query
      v.literal("error")              // Upload failed
    ),
    errorMessage: v.optional(v.string()),
    
    // === FILE STORAGE ===
    fileId: v.optional(v.id("_storage")), // Convex file storage ID
    fileSize: v.optional(v.number()),     // Bytes
    mimeType: v.optional(v.string()),     // "application/pdf", etc.
    
    // === TIMESTAMPS ===
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    processedAt: v.optional(v.number()),  // When AI analysis completed
    
    // === PRIVACY ===
    isPublic: v.boolean(),            // Can other users see it?
  })
    // === INDEXES FOR FAST QUERIES ===
    .index("by_user", ["userId"])                    // Get user's docs
    .index("by_user_vertical", ["userId", "vertical"]) // Filter by vertical
    .index("by_status", ["status"])                  // Find processing docs
    .index("by_organization", ["organizationId"])    // Team docs
    .index("by_created", ["createdAt"])              // Sort by date
    
    // === FULL-TEXT SEARCH INDEX ===
    .searchIndex("search_content", {
      searchField: "contentPlain",
      filterFields: ["userId", "vertical", "type", "status"],
    }),
});