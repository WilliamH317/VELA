// convex/users.ts — Captain Management (User CRUD + Clerk Sync)
//
// Called by the UserSetup client component on every authenticated page load.
// Pattern: Clerk handles auth → JWT verified by Convex → user record created/synced.
//
// Schema (from schema.ts):
//   users: { clerkId, email, name, imageUrl?, subscription, createdAt, updatedAt }
//   Index: by_clerk_id → ["clerkId"]

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/**
 * Get the currently authenticated user's record.
 * Uses JWT identity — no args needed from the client.
 * Returns null if the user record hasn't been created yet
 * (e.g., UserSetup hasn't run yet on first sign-in).
 */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

/**
 * Look up a user by their Clerk ID.
 * Auth-gated: only the authenticated user can query their own record.
 * Used internally by other Convex functions that need user metadata.
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Users can only look up their own record
    if (identity.subject !== args.clerkId) {
      throw new Error("Not authorized");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/**
 * Create or sync a user record from Clerk identity data.
 *
 * Called by the UserSetup component on every authenticated page load:
 * - First sign-in: creates the user record with "free" defaults
 * - Return visits: syncs profile fields (name, email, avatar) in case
 *   the user updated their Clerk profile
 *
 * Returns the user's Convex document ID.
 */
export const createOrSync = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing user
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      // Sync profile fields if Clerk data has changed
      const updates: Record<string, string | number> = {
        updatedAt: now,
      };
      let hasChanges = false;

      if (args.email !== existing.email) {
        updates.email = args.email;
        hasChanges = true;
      }
      if (args.name !== existing.name) {
        updates.name = args.name;
        hasChanges = true;
      }
      if (args.imageUrl !== existing.imageUrl && args.imageUrl !== undefined) {
        updates.imageUrl = args.imageUrl;
        hasChanges = true;
      }

      if (hasChanges) {
        await ctx.db.patch(existing._id, updates);
      }

      return existing._id;
    }

    // First sign-in — welcome aboard, Captain
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      ...(args.imageUrl !== undefined && { imageUrl: args.imageUrl }),
      subscription: "free",
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * @deprecated Use createOrSync instead. Kept for backward compatibility
 * with any existing UserSetup components that call `api.users.create`.
 */
export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      ...(args.imageUrl !== undefined && { imageUrl: args.imageUrl }),
      subscription: "free",
      createdAt: now,
      updatedAt: now,
    });
  },
});