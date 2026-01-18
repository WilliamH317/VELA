// convex/users.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get current user's data
 * 
 * This is called automatically when user signs in.
 * Returns user data or null if not authenticated.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user identity
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null; // Not authenticated
    }
    
    // Find user in database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => 
        q.eq("clerkId", identity.subject)
      )
      .first();
    
    return user;
  },
});

/**
 * Create user on first sign-in
 * 
 * This mutation is called from the client when a new user signs up.
 * Stores user data in Convex for app-specific features.
 */
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => 
        q.eq("clerkId", args.clerkId)
      )
      .first();
    
    if (existingUser) {
      return existingUser._id; // User already exists
    }
    
    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name ?? "Anonymous",
      imageUrl: args.imageUrl,
      subscription: "free", // Default tier
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return userId;
  },
});