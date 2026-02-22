// convex/migrations.ts — Batched Data Migrations
//
// Convex mutations have execution time limits. Large migrations MUST process
// in batches using the self-scheduling pattern: process a batch → schedule
// the next batch via ctx.scheduler → repeat until done.
//
// All migrations are internalMutations (not callable from clients).
// Run them from the Convex dashboard → Functions → select the mutation → Run.
//
// ⚠️  Before running any migration:
//   1. Add the new field to schema.ts as v.optional(...) first
//   2. Deploy schema: npx convex dev
//   3. THEN run the migration from the dashboard
//   4. After migration completes, optionally make the field required

import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────

/** Documents processed per batch. Keep under ~100 to stay within mutation time limits. */
const BATCH_SIZE = 50;

// ─────────────────────────────────────────────
// Shared Helpers
// ─────────────────────────────────────────────

/**
 * Simple hash function for content deduplication.
 * Produces a hex string from a DJB2-variant hash.
 * Not cryptographic — just for fast content fingerprinting.
 */
function generateSimpleHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// ─────────────────────────────────────────────
// Migration: Backfill contentHash on documents
// ─────────────────────────────────────────────
//
// Prerequisites:
//   - Add to documents table in schema.ts:
//       contentHash: v.optional(v.string()),
//   - Deploy: npx convex dev
//
// Run from dashboard:
//   convex/migrations:backfillContentHash (no args needed for first call)
//
// The migration self-schedules until all documents are processed,
// then logs "COMPLETE" to the Convex console.

export const backfillContentHash = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    totalUpdated: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const runningTotal = args.totalUpdated ?? 0;

    // Paginate using _creationTime as a stable cursor
    let query = ctx.db.query("documents").order("asc");

    if (args.cursor) {
      const cursorTime = parseFloat(args.cursor);
      query = query.filter((q) =>
        q.gt(q.field("_creationTime"), cursorTime)
      );
    }

    const batch = await query.take(BATCH_SIZE);

    if (batch.length === 0) {
      console.log(
        `[MIGRATION] backfillContentHash COMPLETE — ${runningTotal} documents updated`
      );
      return { status: "complete", totalUpdated: runningTotal };
    }

    let batchUpdated = 0;

    for (const doc of batch) {
      // Read the raw document to check for existing field.
      // Using bracket notation since contentHash may not be in
      // the TypeScript type yet (it's v.optional and just added).
      const raw = doc as Record<string, unknown>;

      if (raw.contentHash) {
        continue; // Already has a hash — skip
      }

      const hash = generateSimpleHash(
        (doc.title ?? "") + (doc.contentPlain ?? "")
      );

      await ctx.db.patch(doc._id, {
        contentHash: hash,
      } as Record<string, unknown>);

      batchUpdated++;
    }

    const lastDoc = batch[batch.length - 1];
    // lastDoc is guaranteed defined since batch.length > 0
    const nextCursor = String(lastDoc!._creationTime);
    const newTotal = runningTotal + batchUpdated;

    console.log(
      `[MIGRATION] backfillContentHash — batch done: ${batchUpdated} updated, ` +
        `${batch.length} scanned, ${newTotal} total. Scheduling next batch...`
    );

    // Self-schedule the next batch immediately (0ms delay)
    await ctx.scheduler.runAfter(0, internal.migrations.backfillContentHash, {
      cursor: nextCursor,
      totalUpdated: newTotal,
    });

    return { status: "running", batchUpdated, totalUpdated: newTotal };
  },
});

// ─────────────────────────────────────────────
// Migration Template
// ─────────────────────────────────────────────
//
// Copy this template for future migrations. Replace:
//   - Function name
//   - Table name in the query
//   - Skip condition (what already has the field)
//   - Patch payload (what to write)
//
// export const backfillNewField = internalMutation({
//   args: {
//     cursor: v.optional(v.string()),
//     totalUpdated: v.optional(v.number()),
//   },
//   handler: async (ctx, args) => {
//     const runningTotal = args.totalUpdated ?? 0;
//
//     let query = ctx.db.query("YOUR_TABLE").order("asc");
//     if (args.cursor) {
//       const cursorTime = parseFloat(args.cursor);
//       query = query.filter((q) =>
//         q.gt(q.field("_creationTime"), cursorTime)
//       );
//     }
//
//     const batch = await query.take(BATCH_SIZE);
//
//     if (batch.length === 0) {
//       console.log(`[MIGRATION] backfillNewField COMPLETE — ${runningTotal} updated`);
//       return { status: "complete", totalUpdated: runningTotal };
//     }
//
//     let batchUpdated = 0;
//     for (const doc of batch) {
//       const raw = doc as Record<string, unknown>;
//       if (raw.newField) continue; // Skip if already backfilled
//
//       await ctx.db.patch(doc._id, {
//         newField: computeValue(doc),
//       } as Record<string, unknown>);
//       batchUpdated++;
//     }
//
//     const nextCursor = String(batch[batch.length - 1]!._creationTime);
//     const newTotal = runningTotal + batchUpdated;
//
//     console.log(`[MIGRATION] backfillNewField — ${batchUpdated} updated, ${newTotal} total`);
//
//     await ctx.scheduler.runAfter(0, internal.migrations.backfillNewField, {
//       cursor: nextCursor,
//       totalUpdated: newTotal,
//     });
//
//     return { status: "running", batchUpdated, totalUpdated: newTotal };
//   },
// });