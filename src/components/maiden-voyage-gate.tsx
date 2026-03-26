"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import MaidenVoyage from "./maiden-voyage";

/**
 * Thin gate component that queries onboarding status and conditionally
 * renders the MaidenVoyage overlay.
 *
 * CRITICAL: Uses strict equality (=== false), NOT falsy check (!value).
 * useQuery returns undefined during loading — a falsy check would flash
 * the overlay on every page load for every user.
 */
export default function MaidenVoyageGate() {
  const onboardingComplete = useQuery(api.users.isOnboardingComplete);

  // Only show when query has resolved to exactly false
  if (onboardingComplete === false) {
    return <MaidenVoyage />;
  }

  return null;
}
