/**
 * Stripe Checkout Session Creator
 *
 * POST /api/stripe/checkout
 * Body: { priceId: string }
 * Returns: { checkoutUrl: string }
 *
 * Auth: Clerk server-side auth (userId from auth()).
 * Stripe session metadata includes clerkId for webhook processing.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body: { priceId: string } = await request.json();
    if (!body.priceId) {
      return NextResponse.json(
        { error: "Missing priceId" },
        { status: 400 },
      );
    }

    // Map price ID to internal tier name for webhook metadata
    const priceToTier: Record<string, string> = {
      [process.env.STRIPE_PRICE_INDIVIDUAL ?? ""]: "pro",
      [process.env.STRIPE_PRICE_TEAM ?? ""]: "enterprise",
    };

    const tier = priceToTier[body.priceId] ?? "pro";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: body.priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${APP_URL}/upgrade`,
      metadata: {
        clerkId: userId,
        tier,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Stripe Checkout] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
