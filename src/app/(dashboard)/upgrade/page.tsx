"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import LoadingWave from "@/components/loading-wave";

// ============================================================================
// TIER CARD DATA
// ============================================================================

interface TierCard {
  name: string;
  internalTier: "free" | "pro" | "enterprise";
  price: string;
  period: string;
  features: string[];
  priceEnvKey: string | null;
  featured: boolean;
}

const TIERS: TierCard[] = [
  {
    name: "Free",
    internalTier: "free",
    price: "$0",
    period: "",
    features: [
      "10 documents",
      "20 LIGHTHOUSE queries / month",
      "COMPASS full-text search",
      "ARCHIPELAGOS preview (blurred)",
      "CURRENTS preview (blurred)",
    ],
    priceEnvKey: null,
    featured: false,
  },
  {
    name: "Individual",
    internalTier: "pro",
    price: "$15",
    period: "/month",
    features: [
      "100 documents",
      "Unlimited LIGHTHOUSE queries",
      "Full ARCHIPELAGOS access",
      "Full CURRENTS access",
      "CHARTS read-only access",
    ],
    priceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL",
    featured: false,
  },
  {
    name: "Team",
    internalTier: "enterprise",
    price: "$25",
    period: "/user/month",
    features: [
      "Unlimited documents",
      "Unlimited LIGHTHOUSE queries (priority)",
      "Full ARCHIPELAGOS access",
      "Full CURRENTS + CHARTS access",
      "CASCADE butterfly effect",
      "DEPTHS fractal wisdom",
    ],
    priceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_TEAM",
    featured: true,
  },
];

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function UpgradePage() {
  const userLimits = useQuery(api.subscriptions.getUserLimits);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  if (userLimits === undefined) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16">
        <LoadingWave message="Navigating your knowledge sea..." />
      </div>
    );
  }

  const currentTier = userLimits.tier;

  const handleCheckout = async (priceEnvKey: string) => {
    setLoadingTier(priceEnvKey);
    try {
      // Price IDs are set via env vars on the server.
      // The client sends the env key name, the checkout route resolves it.
      const priceMap: Record<string, string> = {
        NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL:
          process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL ?? "",
        NEXT_PUBLIC_STRIPE_PRICE_TEAM:
          process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM ?? "",
      };
      const priceId = priceMap[priceEnvKey];
      if (!priceId) {
        console.error("Price ID not configured:", priceEnvKey);
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data: { checkoutUrl?: string; error?: string } =
        await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        console.error("Checkout failed:", data.error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[#1B3D5C]">
          Chart your course
        </h1>
        <p className="text-[#1B3D5C]/60 mt-2 max-w-lg mx-auto">
          Unlock LAMINAR intelligence to discover how your knowledge
          self-organizes, connects, and predicts.
        </p>
      </div>

      {/* Tier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {TIERS.map((tier) => {
          const isCurrent = tier.internalTier === currentTier;
          const isUpgrade =
            !isCurrent &&
            (tier.internalTier === "pro" || tier.internalTier === "enterprise");

          return (
            <div
              key={tier.internalTier}
              className={`relative rounded-xl border p-6 flex flex-col ${
                tier.featured
                  ? "border-[#00BCD4] bg-gradient-to-b from-[#1B3D5C]/[0.03] to-transparent"
                  : "border-[#1B3D5C]/10 bg-white"
              }`}
            >
              {/* Featured badge */}
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] text-white text-xs font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier name */}
              <h3 className="text-lg font-semibold text-[#1B3D5C]">
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mt-3 mb-6">
                <span className="text-3xl font-bold text-[#1B3D5C]">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-sm text-[#1B3D5C]/50">
                    {tier.period}
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-[#1B3D5C]/70"
                  >
                    <svg
                      className="h-4 w-4 text-[#00BCD4] mt-0.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full rounded-xl px-5 py-3 text-sm font-medium bg-[#1B3D5C]/5 text-[#1B3D5C]/40 cursor-not-allowed"
                >
                  Current plan
                </button>
              ) : isUpgrade && tier.priceEnvKey ? (
                <button
                  onClick={() => handleCheckout(tier.priceEnvKey!)}
                  disabled={loadingTier !== null}
                  className="w-full rounded-xl px-5 py-3 text-sm font-medium bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] text-white hover:shadow-lg hover:shadow-[#00BCD4]/20 transition-all disabled:opacity-60"
                >
                  {loadingTier === tier.priceEnvKey ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-1 w-12 bg-white/30 rounded-full overflow-hidden inline-block">
                        <span className="h-full w-full bg-white/80 rounded-full animate-pulse block" />
                      </span>
                      Navigating to checkout...
                    </span>
                  ) : (
                    `Upgrade to ${tier.name}`
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full rounded-xl px-5 py-3 text-sm font-medium bg-[#1B3D5C]/5 text-[#1B3D5C]/30 cursor-not-allowed"
                >
                  {tier.internalTier === "free"
                    ? "Start free"
                    : "Downgrade"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Test card notice (dev only) */}
      {process.env.NODE_ENV !== "production" && (
        <div className="text-center text-xs text-[#1B3D5C]/30 border border-dashed border-[#1B3D5C]/10 rounded-lg p-4">
          Test mode — use card{" "}
          <code className="bg-[#1B3D5C]/5 px-1.5 py-0.5 rounded">
            4242 4242 4242 4242
          </code>{" "}
          with any expiry and CVC
        </div>
      )}
    </div>
  );
}
