import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Log a query for analytics and usage tracking
 * Called internally by askQuestion action
 */
export const log = mutation({
  args: {
    userId: v.string(),
    query: v.string(),
    answer: v.string(),
    documentIds: v.array(v.id("documents")),
    tokensUsed: v.number(),
    responseTimeMs: v.number(),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"queries">> => {
    // No auth check needed - only called by authenticated actions
    
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

/**
 * Get user's query history
 * Useful for showing "Recent Questions" in UI
 */
export const getUserQueries = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Doc<"queries">[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("queries")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(args.limit || 10);
  },
});

/**
 * Get token usage statistics
 * For cost tracking and analytics
 */
export const getUsageStats = query({
  args: {},
  handler: async (ctx): Promise<{
    totalQueries: number;
    totalTokens: number;
    avgResponseTime: number;
    estimatedCost: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const queries: Doc<"queries">[] = await ctx.db
      .query("queries")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const totalQueries = queries.length;
    const totalTokens = queries.reduce((sum, q) => sum + q.tokensUsed, 0);
    const avgResponseTime = totalQueries > 0 
      ? queries.reduce((sum, q) => sum + q.responseTimeMs, 0) / totalQueries 
      : 0;

    return {
      totalQueries,
      totalTokens,
      avgResponseTime: Math.round(avgResponseTime),
      estimatedCost: calculateCost(totalTokens),
    };
  },
});

// Helper: Calculate cost based on Claude pricing
// Sonnet 4: $3 per million input tokens, $15 per million output tokens
// Simplified: Average $9 per million tokens
function calculateCost(tokens: number): string {
  const costPerMillionTokens = 9; // USD
  const cost = (tokens / 1_000_000) * costPerMillionTokens;
  return `$${cost.toFixed(4)}`;
}