// convex/auth.config.ts

/**
 * Clerk + Convex JWT Configuration
 * 
 * This tells Convex how to verify JWT tokens from Clerk.
 * Without this, ctx.auth.getUserIdentity() won't work.
 */

export default {
  providers: [
    {
      // Must match CLERK_JWT_ISSUER_DOMAIN from .env.local
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      
      // Fixed value - tells Convex this is a Clerk token
      applicationID: "convex",
    },
  ],
};