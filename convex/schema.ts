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
});