// convex/migrations.ts (create this file)
import { internalMutation } from "./_generated/server";

/**
 * ONE-TIME MIGRATION: Add contentHash to existing documents
 * Run this once after schema update, then delete this file
 */
export const backfillContentHash = internalMutation({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();
    
    let updated = 0;
    for (const doc of documents) {
      // Skip if already has hash
      if (doc.contentHash) continue;
      
      // Generate hash
      const hash = generateSimpleHash(doc.title + doc.content);
      
      // Update document
      await ctx.db.patch(doc._id, {
        contentHash: hash,
      });
      
      updated++;
    }
    
    console.log(`Backfilled ${updated} documents with contentHash`);
    return { updated };
  },
});

// Simple hash function (same as in documents.ts)
function generateSimpleHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}