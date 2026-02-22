// convex/queries.ts — LIGHTHOUSE Query History & Analytics
//
// Tracks AI Q&A interactions for usage analytics, cost monitoring,
// and the "Recent Voyages" UI on the dashboard.
//
// ⚠️  This file's field names MUST match your deployed queries table in schema.ts.
//     If your schema uses different field names (e.g., "question" instead of "query",
//     "sources" instead of "documentIds"), update the insert calls below accordingly.
//
// Pattern: `log` is an internalMutation — only callable from other Convex functions
// (ai.ts actions), never from the client. Update your ai.ts caller to use:
//   import { internal } from "./_generated/api";
//   await ctx.runMutation(internal.queries.log, { ... });

import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────
// Internal Mutations (called by ai.ts actions)
// ─────────────────────────────────────────────

/**
 * Log a LIGHTHOUSE query for analytics and usage tracking.
 *
 * Internal-only — not exposed to clients. Called by the askQuestion
 * action in ai.ts after a successful Claude API response.
 *
 * If your ai.ts currently calls `api.queries.log`, update it to:
 *   import { internal } from "./_generated/api";
 *   await ctx.runMutation(internal.queries.log, { ... });
 */
export const log = internalMutation({
  args: {
    userId: v.string(),
    query: v.string(),
    answer: v.string(),
    documentIds: v.array(v.id("documents")),
    tokensUsed: v.number(),
    responseTimeMs: v.number(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("queries", {
      userId: args.userId,
      query: args.query,
      answer: args.answer,
      documentIds: args.documentIds,
      tokensUsed: args.tokensUsed,
      responseTimeMs: args.responseTimeMs,
      model: args.model,
      timestamp: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/**
 * Get the authenticated user's recent LIGHTHOUSE questions.
 * Powers the "Recent Voyages" section on the dashboard.
 */
export const getUserQueries = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const cap = Math.min(args.limit ?? 10, 50);

    return await ctx.db
      .query("queries")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(cap);
  },
});

/**
 * Get usage statistics for the authenticated user.
 * Powers the analytics panel and tier limit checks.
 *
 * Bounded to the most recent 500 queries to avoid full table scans.
 * For users with heavy usage, this gives accurate recent stats
 * without performance degradation.
 */
export const getUsageStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        totalQueries: 0,
        totalTokens: 0,
        avgResponseTime: 0,
        estimatedCost: "$0.0000",
      };
    }

    const recentQueries = await ctx.db
      .query("queries")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(500);

    const totalQueries = recentQueries.length;

    if (totalQueries === 0) {
      return {
        totalQueries: 0,
        totalTokens: 0,
        avgResponseTime: 0,
        estimatedCost: "$0.0000",
      };
    }

    const totalTokens = recentQueries.reduce(
      (sum, q) => sum + q.tokensUsed,
      0
    );
    const avgResponseTime = Math.round(
      recentQueries.reduce((sum, q) => sum + q.responseTimeMs, 0) /
        totalQueries
    );

    return {
      totalQueries,
      totalTokens,
      avgResponseTime,
      estimatedCost: calculateCost(totalTokens),
    };
  },
});

/**
 * Get a single query by ID (for detail view / sharing).
 * Auth-gated to the owning user.
 */
export const getById = query({
  args: { id: v.id("queries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.id);
    if (!entry || entry.userId !== identity.subject) {
      return null;
    }

    return entry;
  },
});

// ─────────────────────────────────────────────
// Mutations (client-facing)
// ─────────────────────────────────────────────

// TODO: Add markHelpful mutation once schema is updated:
//   1. Add `helpful: v.optional(v.boolean())` to the queries table in schema.ts
//   2. Deploy schema: npx convex dev
//   3. Uncomment the mutation below
//
// export const markHelpful = mutation({
//   args: {
//     queryId: v.id("queries"),
//     helpful: v.boolean(),
//   },
//   handler: async (ctx, args) => {
//     const identity = await ctx.auth.getUserIdentity();
//     if (!identity) throw new Error("Not authenticated");
//
//     const entry = await ctx.db.get(args.queryId);
//     if (!entry) throw new Error("Query not found");
//     if (entry.userId !== identity.subject) throw new Error("Not authorized");
//
//     await ctx.db.patch(args.queryId, { helpful: args.helpful });
//   },
// });

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Estimate API cost based on Claude Sonnet 4 pricing.
 * Input: $3/M tokens, Output: $15/M tokens.
 * Simplified average: ~$9/M tokens (blended).
 */
function calculateCost(tokens: number): string {
  const costPerMillionTokens = 9;
  const cost = (tokens / 1_000_000) * costPerMillionTokens;
  return `$${cost.toFixed(4)}`;
}