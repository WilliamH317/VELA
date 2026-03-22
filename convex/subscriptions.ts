/**
 * Subscription Management — Tier Queries + Webhook Update
 *
 * getUserTier: Public query for client-side tier checks.
 * updateUserTier: Public mutation called by Stripe webhook handler.
 *   Protected by data flow (webhook verifies Stripe signature before calling).
 *
 * Internal schema values: "free" | "pro" | "enterprise"
 * Marketing names: Free | Individual ($15/mo) | Team ($25/user/mo)
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get the current user's subscription tier.
 * Safe fallback: returns "free" if user not found or not authenticated.
 */
export const getUserTier = query({
  args: {},
  handler: async (ctx): Promise<"free" | "pro" | "enterprise"> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return "free";

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user?.subscription ?? "free";
  },
});

/**
 * Get user limits and usage for the current tier.
 */
export const getUserLimits = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    tier: "free" | "pro" | "enterprise";
    documentCount: number;
    documentLimit: number;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      return { tier: "free", documentCount: 0, documentLimit: 10 };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    const tier = user?.subscription ?? "free";

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const limits: Record<string, number> = {
      free: 10,
      pro: 100,
      enterprise: Infinity,
    };

    return {
      tier,
      documentCount: documents.length,
      documentLimit: limits[tier] ?? 10,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Update a user's subscription tier after Stripe webhook confirmation.
 *
 * Called server-to-server from the Next.js webhook handler (which has
 * already verified the Stripe signature). Not called from client code.
 *
 * Uses conditional spreading for optional Stripe fields
 * to satisfy exactOptionalPropertyTypes.
 */
export const updateUserTier = mutation({
  args: {
    clerkId: v.string(),
    tier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("enterprise"),
    ),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      console.error(
        `[Subscriptions] User not found for clerkId: ${args.clerkId}`,
      );
      return false;
    }

    await ctx.db.patch(user._id, {
      subscription: args.tier,
      updatedAt: Date.now(),
      ...(args.stripeCustomerId !== undefined
        ? { stripeCustomerId: args.stripeCustomerId }
        : {}),
      ...(args.stripeSubscriptionId !== undefined
        ? { stripeSubscriptionId: args.stripeSubscriptionId }
        : {}),
      ...(args.currentPeriodEnd !== undefined
        ? { currentPeriodEnd: args.currentPeriodEnd }
        : {}),
    });

    console.log(
      `[Subscriptions] Updated user ${args.clerkId} to tier: ${args.tier}`,
    );
    return true;
  },
});

/**
 * Look up a user by their Stripe customer ID.
 * Used by the webhook handler for subscription.deleted events.
 */
export const getUserByStripeCustomer = query({
  args: { stripeCustomerId: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{ clerkId: string } | null> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId),
      )
      .first();

    if (!user) return null;
    return { clerkId: user.clerkId };
  },
});
