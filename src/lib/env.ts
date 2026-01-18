// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  // Convex
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  CONVEX_DEPLOYMENT: z.string().optional(),
  
  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_JWT_ISSUER_DOMAIN: z.string().url(),
  
  // Optional for now
  ANTHROPIC_API_KEY: z.string().optional(),
});

// Validate on module load
export const env = envSchema.parse(process.env);

// TypeScript will error if env vars are missing or invalid