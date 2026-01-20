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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    if (args.title.length === 0) {
      throw new Error("Title cannot be empty");
    }
    if (args.content.length === 0) {
      throw new Error("Content cannot be empty");
    }
    
    const contentPlain = args.content.replace(/<[^>]*>/g, "").trim();
    const contentPreview = contentPlain.slice(0, 200);
    
    const documentId = await ctx.db.insert("documents", {
      userId: identity.subject,
      organizationId: undefined,
      vertical: "musician",
      title: args.title,
      content: args.content,
      contentPlain,
      contentPreview,
      type: "text",
      source: {
        platform: "manual_create",
        url: undefined,
        importedAt: undefined,
        importedBy: undefined,
      },
      chaosMetadata: undefined,
      tags: [],
      autoTags: undefined,
      status: "ready",
      errorMessage: undefined,
      fileId: undefined,
      fileSize: undefined,
      mimeType: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      processedAt: undefined,
      isPublic: false,
    });
    
    return documentId;
  },
});