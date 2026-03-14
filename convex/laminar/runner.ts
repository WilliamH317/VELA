/**
 * LAMINAR CONVEX LAYER — PERSISTENCE & ORCHESTRATION
 *
 * BOUNDARY RULE: This file must NEVER contain:
 *   - Inline math (TF-IDF, K-Means, softmax, cosine similarity)
 *   - Direct ctx.db.query("documents") calls
 *     -> Use internal.documents.getForLaminar instead
 *
 * This layer: reads documents via bridge query, calls pure math functions,
 * persists results to Convex tables, schedules follow-up tasks.
 *
 * SC2 Principle: Separation of Concerns (Game Loop vs. Game Logic)
 */

import { internalMutation, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { v } from "convex/values";

// ============================================================================
// REACTIVE ENTRY POINT — Event-driven pipeline trigger
// ============================================================================

/**
 * Called when a document finishes ingestion (status → "ready").
 * Checks if the user has enough documents to form ARCHIPELAGOS,
 * and if so, enqueues the clustering pipeline via scheduler.
 *
 * This transforms LAMINAR from a manual batch tool into a
 * self-feeding reactive system.
 */
export const onDocumentIngested = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    // Fetch ready documents through the Knowledge Domain bridge
    // NEVER: ctx.db.query("documents") directly
    const docs = await ctx.runQuery(
      internal.documents.getForLaminar,
      { userId }
    );

    // Only trigger clustering when there are enough documents
    // to form meaningful ARCHIPELAGOS (minimum 3)
    if (docs.length < 3) {
      console.log(
        `[LAMINAR] Skipping clustering — only ${docs.length} ready documents for user ${userId}`
      );
      return;
    }

    // Enqueue clustering as a separate scheduled action
    // so it doesn't block the document ingestion response.
    // Auth context is preserved through the scheduler chain.
    await ctx.scheduler.runAfter(
      0,
      internal.laminar.runner.triggerClustering,
      { userId }
    );
  },
});

/**
 * Internal action that delegates to the existing ARCHIPELAGOS pipeline.
 * Separated from onDocumentIngested so the mutation completes instantly
 * while the heavy computation runs asynchronously.
 */
export const triggerClustering = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, { userId }): Promise<void> => {
    console.log(`[LAMINAR] Reactive clustering triggered for user ${userId}`);

    // Delegate to the existing clustering pipeline.
    // engine.run uses auth from the scheduler chain.
    try {
      await ctx.runAction(api.laminar.engine.run, {});
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[LAMINAR] Reactive clustering failed: ${message}`);
      // Don't re-throw — this is a background job, not a user-facing call
    }
  },
});
