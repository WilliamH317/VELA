// convex/laminar/access.ts
import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";

/**
 * Log a document access event.
 * Called from frontend whenever a user views, searches, or queries a document.
 *
 * Session IDs group related accesses for co-occurrence detection.
 * A "session" = a browser tab session (generated client-side, stored in sessionStorage).
 */
export const logAccess = mutation({
  args: {
    documentId: v.id("documents"),
    sessionId: v.string(),
    action: v.union(
      v.literal("view"),
      v.literal("search_hit"),
      v.literal("ai_query"),
      v.literal("ai_cited")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Deduplicate: don't log the same doc+action+session within 30 seconds
    const recentEvents = await ctx.db
      .query("accessEvents")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(5);

    const isDuplicate = recentEvents.some(
      (e) =>
        e.documentId === args.documentId &&
        e.action === args.action &&
        Date.now() - e.timestamp < 30_000
    );

    if (isDuplicate) return null;

    const eventId = await ctx.db.insert("accessEvents", {
      documentId: args.documentId,
      userId: identity.subject,
      sessionId: args.sessionId,
      timestamp: Date.now(),
      action: args.action,
    });

    return eventId;
  },
});

/**
 * Internal mutation for logging access from server-side actions (e.g., AI queries).
 * Bypasses auth check since the calling action already verified identity.
 */
export const logAccessInternal = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    sessionId: v.string(),
    action: v.union(
      v.literal("view"),
      v.literal("search_hit"),
      v.literal("ai_query"),
      v.literal("ai_cited")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("accessEvents", {
      ...args,
      timestamp: Date.now(),
    });
  },
});