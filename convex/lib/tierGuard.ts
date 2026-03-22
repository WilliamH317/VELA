/**
 * LAMINAR Tier Guard — Pure TypeScript (Zero Convex Imports)
 *
 * Maps subscription tiers to LAMINAR feature access levels.
 * Internal schema values: "free" | "pro" | "enterprise"
 * Marketing names: Free | Individual ($15/mo) | Team ($25/user/mo)
 *
 * SC2 Rule: This file must NEVER import from convex/_generated/ or convex/server.
 */

// ============================================================================
// TYPES
// ============================================================================

type SubscriptionTier = "free" | "pro" | "enterprise";
type LaminarLayer =
  | "ARCHIPELAGOS"
  | "CURRENTS"
  | "CHANNELS"
  | "CASCADE"
  | "DEPTHS";
type AccessMode = "full" | "preview" | "hidden";

// ============================================================================
// TIER ACCESS MATRIX
// ============================================================================

/**
 * Tier → Layer → Access Mode
 *
 * Free:       ARCHIPELAGOS preview, CURRENTS preview, rest hidden
 * Pro:        ARCHIPELAGOS full, CURRENTS full, CHANNELS read-only (preview), rest hidden
 * Enterprise: ALL layers full access
 */
const TIER_MATRIX: Record<SubscriptionTier, Record<LaminarLayer, AccessMode>> =
  {
    free: {
      ARCHIPELAGOS: "preview",
      CURRENTS: "preview",
      CHANNELS: "hidden",
      CASCADE: "hidden",
      DEPTHS: "hidden",
    },
    pro: {
      ARCHIPELAGOS: "full",
      CURRENTS: "full",
      CHANNELS: "preview",
      CASCADE: "hidden",
      DEPTHS: "hidden",
    },
    enterprise: {
      ARCHIPELAGOS: "full",
      CURRENTS: "full",
      CHANNELS: "full",
      CASCADE: "full",
      DEPTHS: "full",
    },
  };

// ============================================================================
// DOCUMENT LIMITS
// ============================================================================

const DOCUMENT_LIMITS: Record<SubscriptionTier, number> = {
  free: 10,
  pro: 100,
  enterprise: Infinity,
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Check whether a tier can access a LAMINAR layer at all (full or preview).
 */
export function canAccessLaminarLayer(tier: string, layer: string): boolean {
  const mode = getLaminarPreviewMode(tier, layer);
  return mode !== "hidden";
}

/**
 * Get the access mode for a tier + layer combination.
 * Returns 'full' | 'preview' | 'hidden'.
 *
 * Unknown tiers default to "free". Unknown layers default to "hidden".
 */
export function getLaminarPreviewMode(
  tier: string,
  layer: string,
): AccessMode {
  const validTier = isValidTier(tier) ? tier : "free";
  const validLayer = isValidLayer(layer) ? layer : null;
  if (!validLayer) return "hidden";
  return TIER_MATRIX[validTier][validLayer];
}

/**
 * Get the document upload limit for a tier.
 */
export function getDocumentLimit(tier: string): number {
  const validTier = isValidTier(tier) ? tier : "free";
  return DOCUMENT_LIMITS[validTier];
}

/**
 * Map internal tier name to marketing display name.
 */
export function getTierDisplayName(tier: string): string {
  switch (tier) {
    case "pro":
      return "Individual";
    case "enterprise":
      return "Team";
    default:
      return "Free";
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

function isValidTier(tier: string): tier is SubscriptionTier {
  return tier === "free" || tier === "pro" || tier === "enterprise";
}

function isValidLayer(layer: string): layer is LaminarLayer {
  return ["ARCHIPELAGOS", "CURRENTS", "CHANNELS", "CASCADE", "DEPTHS"].includes(
    layer,
  );
}
