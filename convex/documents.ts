import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all documents for authenticated user
export const list = query({
  // No arguments needed (gets current user from JWT)
  handler: async (ctx) => {
    // 1. Check authentication
    const identity = await ctx.auth.getUserIdentity();
    
    // If not authenticated, return empty array
    if (!identity) {
      return [];
    }
    
    // 2. Query documents using index
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", q => q.eq("userId", identity.subject))
      .order("desc")  // Newest first
      .collect();
    
    // 3. Return results
    return documents;
  },
});

// Create a new document
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
  },
  handler: async (ctx, args) => {
    // 1. Check authentication
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // 2. Validate input
    if (args.title.trim().length === 0) {
      throw new Error("Title cannot be empty");
    }
    
    if (args.content.length > 5_000_000) {  // 5MB limit
      throw new Error("Content too large (max 5MB)");
    }
    
    // 3. Strip HTML for search
    const contentPlain = stripHtml(args.content);
    const contentPreview = contentPlain.slice(0, 200) + "...";
    
    // 4. Insert document
    const documentId = await ctx.db.insert("documents", {
      userId: identity.subject,
      vertical: args.vertical,
      title: args.title,
      content: args.content,
      contentPlain,
      contentPreview,
      type: args.type,
      source: {
        platform: "manual",
      },
      tags: [],
      status: "ready",
      isPublic: false,
      createdAt: Date.now(),
    });
    
    // 5. Return ID of created document
    return documentId;
  },
});

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  // Remove all HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Normalize whitespace
  return text.replace(/\s+/g, ' ').trim();
}