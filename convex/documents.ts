// convex/documents.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const debugAuth = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    // Return debug info
    return {
      hasIdentity: !!identity,
      subject: identity?.subject,
      issuer: identity?.issuer,
      tokenIdentifier: identity?.tokenIdentifier,
    };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    vertical: v.string(),
    type: v.union(
      v.literal("pdf"),
      v.literal("text"),
      v.literal("markdown")
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // 1. Authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // 2. Validation
    if (args.title.length === 0) {
      throw new Error("Title cannot be empty");
    }
    if (args.content.length > 1_000_000) {
      throw new Error("Content too large (max 1MB)");
    }
    
    // 3. Generate content hash for duplicate detection
    const contentHash = generateSimpleHash(args.title + args.content);
    
    // 4. Check for duplicates using FILTER (works with optional contentHash)
    // This checks ALL user's documents, including old ones without hash
    const existingDuplicate = await ctx.db
      .query("documents")
      .withIndex("by_user", q => q.eq("userId", identity.subject))
      .filter(q => 
        q.or(
          // Check by hash (for new documents that have it)
          q.eq(q.field("contentHash"), contentHash),
          // Check by title + content (for old documents without hash)
          q.and(
            q.eq(q.field("title"), args.title),
            q.eq(q.field("content"), args.content)
          )
        )
      )
      .first();
    
    if (existingDuplicate) {
      throw new Error(`⚓ This cargo is already aboard! A document with identical content exists: "${existingDuplicate.title}"`);
    }
    
    // 5. Data transformation
    const contentPlain = stripHtml(args.content);
    const contentPreview = contentPlain.slice(0, 200);
    
    // 6. Insert document
    const documentId = await ctx.db.insert("documents", {
      // User & Organization
      userId: identity.subject,
      vertical: args.vertical,
      
      // Content
      title: args.title,
      content: args.content,
      contentPlain,
      contentPreview,
      contentHash, // ✅ Include hash for new docs
      
      // Metadata
      type: args.type,
      source: {
        platform: "manual",
        importedAt: Date.now(),
      },
      
      // Search & Tags
      tags: args.tags ?? [],
      
      // Status
      status: "ready",
      
      // Timestamps
      createdAt: Date.now(),
      
      // Privacy
      isPublic: false,
    });
    
    return documentId;
  },
});

// Helper: Simple hash function
function generateSimpleHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Helper: Strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}