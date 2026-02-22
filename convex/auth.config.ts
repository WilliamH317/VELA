// convex/auth.config.ts — Clerk JWT Integration
//
// Tells Convex how to verify JWT tokens from Clerk.
// If CLERK_JWT_ISSUER_DOMAIN is missing, every ctx.auth.getUserIdentity()
// call silently returns null — so we fail fast here instead.
//
// Env var format: https://<your-app>.clerk.accounts.dev
// Set in Convex dashboard → Settings → Environment Variables

const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (!domain) {
  throw new Error(
    "Missing CLERK_JWT_ISSUER_DOMAIN environment variable. " +
      "Set it in the Convex dashboard under Settings → Environment Variables. " +
      "Value should be: https://<your-app>.clerk.accounts.dev"
  );
}

export default {
  providers: [
    {
      domain,
      applicationID: "convex",
    },
  ],
};