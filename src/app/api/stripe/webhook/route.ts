/**
 * Stripe Webhook Handler
 *
 * POST /api/stripe/webhook
 *
 * CRITICAL SECURITY ORDER:
 *   1. Read raw body as text (NOT json — signature requires raw body)
 *   2. Get stripe-signature header
 *   3. constructEvent to verify signature
 *   4. ONLY THEN process event data
 *
 * Handles:
 *   - checkout.session.completed → upgrade user tier
 *   - customer.subscription.deleted → downgrade to free
 *   - customer.subscription.updated → update period end
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Step 1: Read raw body as TEXT — not json()
  const body = await request.text();

  // Step 2: Get signature header
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  // Step 3: Verify signature BEFORE any data processing
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: "Signature verification failed" },
      { status: 400 },
    );
  }

  // Step 4: Process verified event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const tier = session.metadata?.tier as
          | "pro"
          | "enterprise"
          | undefined;

        if (!clerkId || !tier) {
          console.error(
            "[Stripe Webhook] Missing metadata in checkout session",
          );
          break;
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        // Fetch subscription to get current_period_end (on SubscriptionItem in 2026 API)
        let periodEnd: number | undefined;
        if (subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          const firstItem = subscription.items.data[0];
          if (firstItem) {
            periodEnd = firstItem.current_period_end * 1000; // Convert to ms
          }
        }

        await convex.mutation(api.subscriptions.updateUserTier, {
          clerkId,
          tier,
          ...(customerId !== undefined
            ? { stripeCustomerId: customerId }
            : {}),
          ...(subscriptionId !== undefined
            ? { stripeSubscriptionId: subscriptionId }
            : {}),
          ...(periodEnd !== undefined
            ? { currentPeriodEnd: periodEnd }
            : {}),
        });

        console.log(
          `[Stripe Webhook] checkout.session.completed — user ${clerkId} upgraded to ${tier}`,
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data
          .object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        // Look up user by Stripe customer ID
        const user = await convex.query(
          api.subscriptions.getUserByStripeCustomer,
          { stripeCustomerId: customerId },
        );

        if (user) {
          await convex.mutation(api.subscriptions.updateUserTier, {
            clerkId: user.clerkId,
            tier: "free",
          });
          console.log(
            `[Stripe Webhook] subscription.deleted — user ${user.clerkId} downgraded to free`,
          );
        } else {
          console.error(
            `[Stripe Webhook] No user found for Stripe customer ${customerId}`,
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data
          .object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const user = await convex.query(
          api.subscriptions.getUserByStripeCustomer,
          { stripeCustomerId: customerId },
        );

        if (user) {
          // Determine tier from subscription price
          const firstItem = subscription.items.data[0];
          const priceId = firstItem?.price?.id ?? "";
          const priceToTier: Record<string, "pro" | "enterprise"> = {
            [process.env.STRIPE_PRICE_INDIVIDUAL ?? ""]: "pro",
            [process.env.STRIPE_PRICE_TEAM ?? ""]: "enterprise",
          };
          const tier = priceToTier[priceId] ?? "pro";
          const periodEndMs = firstItem
            ? firstItem.current_period_end * 1000
            : undefined;

          await convex.mutation(api.subscriptions.updateUserTier, {
            clerkId: user.clerkId,
            tier,
            ...(periodEndMs !== undefined
              ? { currentPeriodEnd: periodEndMs }
              : {}),
          });
          console.log(
            `[Stripe Webhook] subscription.updated — user ${user.clerkId} period updated`,
          );
        }
        break;
      }

      default:
        // Return 200 for unhandled events (prevents Stripe retry storms)
        break;
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, message);
    // Still return 200 to prevent retries on processing errors
    // The event was verified — the error is in our processing logic
  }

  return NextResponse.json({ received: true });
}
