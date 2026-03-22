// convex/documents.ts — Document Management (PORT + COMPASS)
//
// Core CRUD operations for VELA's document system:
//   - list / getById / search — Queries (real-time, cached)
//   - create / createFromFile — Mutations (transactional writes)
//   - generateUploadUrl — Mutation (signed URL for client upload)
//   - processFile — Internal action (background text extraction)
//
// Auth pattern: queries return [] or null on unauthenticated (graceful failure).
// Mutations throw — the client shouldn't call them unauthenticated.

import {
  query,
  mutation,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ===================================================================
// QUERIES
// ===================================================================

/**
 * LIST: Get all user's documents.
 * Returns documents in reverse chronological order.
 * Returns [] if unauthenticated (graceful for loading states).
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

/**
 * GET BY ID: Fetch a single document for viewing.
 * Returns null if not found or not owned by the user.
 */
export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const document = await ctx.db.get(args.id);

    // Verify ownership
    if (!document || document.userId !== identity.subject) {
      return null;
    }

    return document;
  },
});

/**
 * COMPASS Search — Full-text search across user's documents.
 * Uses Convex search index for fast, relevant results.
 * Returns top 20 results ordered by relevance.
 */
export const search = query({
  args: {
    query: v.string(),
    type: v.optional(
      v.union(v.literal("pdf"), v.literal("text"), v.literal("markdown"))
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const trimmedQuery = args.query.trim();
    if (trimmedQuery.length === 0) {
      return [];
    }

    const searchQuery = ctx.db
      .query("documents")
      .withSearchIndex("search_content", (q) =>
        q.search("contentPlain", trimmedQuery).eq("userId", identity.subject)
      );

    // Type filter requires in-memory filtering (search index limitation)
    if (args.type) {
      const results = await searchQuery.take(100);
      return results.filter((doc) => doc.type === args.type).slice(0, 20);
    }

    return await searchQuery.take(20);
  },
});

/**
 * DEBUG: Check authentication status.
 * Internal-only — not exposed to clients in production.
 * Run from Convex dashboard for troubleshooting.
 */
export const debugAuth = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    return {
      hasIdentity: !!identity,
      subject: identity?.subject,
      issuer: identity?.issuer,
      tokenIdentifier: identity?.tokenIdentifier,
    };
  },
});

// ===================================================================
// MUTATIONS — Manual Document Creation
// ===================================================================

/**
 * CREATE: Manually create a document (text input).
 * Includes duplicate detection via content hash.
 *
 * ⚠️  The insert payload below MUST match your deployed documents schema.
 *     If you've added/removed optional fields, update accordingly.
 *     Optional fields are OMITTED (not set to undefined) to satisfy
 *     exactOptionalPropertyTypes.
 */
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    vertical: v.string(),
    type: v.union(v.literal("pdf"), v.literal("text"), v.literal("markdown")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Validation
    if (args.title.length === 0) {
      throw new Error("Title cannot be empty");
    }
    if (args.content.length > 1_000_000) {
      throw new Error("Content too large (max 1MB)");
    }

    // Document limit enforcement
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    const tier = user?.subscription ?? "free";
    const limits: Record<string, number> = {
      free: 10,
      pro: 100,
      enterprise: Infinity,
    };
    const docLimit = limits[tier] ?? 10;

    if (docLimit !== Infinity) {
      const currentDocs = await ctx.db
        .query("documents")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();
      if (currentDocs.length >= docLimit) {
        throw new Error(
          "Your cargo hold is full — upgrade your plan to carry more knowledge",
        );
      }
    }

    // Duplicate detection
    const contentHash = generateSimpleHash(args.title + args.content);

    const existingDuplicate = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.or(
          q.eq(q.field("contentHash"), contentHash),
          q.and(
            q.eq(q.field("title"), args.title),
            q.eq(q.field("content"), args.content)
          )
        )
      )
      .first();

    if (existingDuplicate) {
      throw new Error(
        `⚓ This cargo is already aboard! A document with identical content exists: "${existingDuplicate.title}"`
      );
    }

    // Data transformation
    const contentPlain = stripHtml(args.content);
    const contentPreview = contentPlain.slice(0, 200);

    // Insert — only include optional fields when they have values
    const documentId = await ctx.db.insert("documents", {
      userId: identity.subject,
      vertical: args.vertical,
      title: args.title,
      content: args.content,
      contentPlain,
      contentPreview,
      contentHash,
      type: args.type,
      source: {
        platform: "manual",
        importedAt: Date.now(),
      },
      tags: args.tags ?? [],
      status: "ready",
      createdAt: Date.now(),
      isPublic: false,
    });

    // Silent LAMINAR trigger — non-blocking, does not affect response time
    // Only runs if user has >= 3 ready documents (guard inside onDocumentIngested)
    await ctx.scheduler.runAfter(
      0,
      internal.laminar.runner.onDocumentIngested,
      { documentId, userId: identity.subject }
    );

    return documentId;
  },
});

// ===================================================================
// MUTATIONS — File Upload (PORT)
// ===================================================================

/**
 * GENERATE UPLOAD URL
 * Returns a signed URL for client to upload files directly to Convex storage.
 *
 * Client flow:
 *   1. Call generateUploadUrl → signed URL
 *   2. POST file to signed URL → storageId
 *   3. Call createFromFile with storageId → document created
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(
        "🚫 Not authenticated - please sign in to bring knowledge to PORT"
      );
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * CREATE FROM FILE
 * Creates a document record after file upload, then schedules background
 * text extraction. The UI shows a "processing" badge in real-time.
 *
 * ⚠️  Optional fields are OMITTED (not set to undefined) to satisfy
 *     exactOptionalPropertyTypes. If your schema requires additional
 *     fields, add them here with actual values.
 */
export const createFromFile = mutation({
  args: {
    fileId: v.id("_storage"),
    title: v.string(),
    type: v.union(v.literal("pdf"), v.literal("text"), v.literal("markdown")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(
        "🚫 Not authenticated - please sign in to bring knowledge to PORT"
      );
    }

    if (args.title.length === 0) {
      throw new Error("Document title cannot be empty");
    }
    if (args.title.length > 500) {
      throw new Error("Document title too long (max 500 characters)");
    }

    // Document limit enforcement
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    const tier = user?.subscription ?? "free";
    const fileLimits: Record<string, number> = {
      free: 10,
      pro: 100,
      enterprise: Infinity,
    };
    const fileDocLimit = fileLimits[tier] ?? 10;

    if (fileDocLimit !== Infinity) {
      const currentDocs = await ctx.db
        .query("documents")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();
      if (currentDocs.length >= fileDocLimit) {
        throw new Error(
          "Your cargo hold is full — upgrade your plan to carry more knowledge",
        );
      }
    }

    const mimeTypeMap: Record<string, string> = {
      pdf: "application/pdf",
      text: "text/plain",
      markdown: "text/markdown",
    };

    const now = Date.now();

    // Insert with "processing" status.
    // Content fields are empty — processFile will fill them.
    // Optional fields (contentHash, chaosMetadata, autoTags, errorMessage,
    // updatedAt, processedAt, organizationId) are OMITTED, not set to undefined.
    const documentId = await ctx.db.insert("documents", {
      userId: identity.subject,
      vertical: "agency",
      title: args.title,
      content: "",
      contentPlain: "",
      contentPreview: "",
      type: args.type,
      source: {
        platform: "file_upload",
        importedAt: now,
        importedBy: identity.subject,
      },
      tags: [],
      status: "processing",
      fileId: args.fileId,
      fileSize: 0,
      mimeType: mimeTypeMap[args.type] ?? "application/octet-stream",
      createdAt: now,
      isPublic: false,
    });

    // Schedule background text extraction (runs immediately)
    await ctx.scheduler.runAfter(0, internal.documents.processFile, {
      documentId,
    });

    return documentId;
  },
});

// ===================================================================
// INTERNAL — Background Processing
// ===================================================================

/**
 * PROCESS FILE (Background Job)
 * Extracts text from uploaded files, generates content hash,
 * and updates the document to "ready" status.
 *
 * PDF parsing is temporarily disabled — text/markdown work fully.
 */
export const processFile = internalAction({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    try {
      const doc = await ctx.runQuery(internal.documents.getByIdInternal, {
        id: args.documentId,
      });

      if (!doc) {
        throw new Error("Document not found");
      }
      if (!doc.fileId) {
        throw new Error("Document has no file attached");
      }

      // Download from Convex storage
      const file = await ctx.storage.get(doc.fileId);
      if (!file) {
        throw new Error("File not found in storage");
      }

      // Extract text based on file type
      let extractedText = "";
      let fileSize = 0;

      if (doc.type === "pdf") {
        // PDF text extraction — placeholder until pdf-parse is resolved
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fileSize = buffer.length;

        extractedText = `📄 PDF Document Received

🚢 Your PDF has been safely docked at PORT!

File: ${doc.title}
Size: ${(fileSize / 1024).toFixed(2)} KB
Status: Ready for viewing

⚙️ Note: Full PDF text extraction is coming soon!
For now, you can view and manage this PDF in your knowledge base.

📝 Text files (.txt, .md) are fully supported with instant text extraction.`;

        console.log(
          `📄 PDF uploaded: ${doc.title} (${(fileSize / 1024).toFixed(2)} KB)`
        );
      } else {
        // Plain text / markdown — works fully
        try {
          extractedText = await file.text();
          fileSize = extractedText.length;
          console.log(
            `✅ Text file processed: ${extractedText.length} characters`
          );
        } catch (textError) {
          console.error("❌ Text extraction error:", textError);
          throw new Error(`Text file reading failed: ${textError}`);
        }
      }

      if (extractedText.length === 0) {
        throw new Error("No text could be extracted from the file");
      }

      const contentPreview = extractedText.trim().slice(0, 200);
      const contentPlain = extractedText
        .replace(/<[^>]*>/g, "")
        .replace(/[#*_~`]/g, "")
        .trim();
      const contentHash = generateSimpleHash(doc.title + extractedText);

      // Update document with extracted content
      await ctx.runMutation(internal.documents.updateAfterProcessing, {
        id: args.documentId,
        content: extractedText,
        contentPlain,
        contentPreview,
        contentHash,
        fileSize,
        status: "ready",
      });

      console.log(
        `✅ Document ${args.documentId} processed successfully — smooth sailing! 🚢`
      );
    } catch (error) {
      console.error("❌ Stormy seas! File processing failed:", error);

      await ctx.runMutation(internal.documents.updateStatus, {
        id: args.documentId,
        status: "error",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Unknown processing error — navigate to calmer waters and try again",
      });
    }
  },
});

/**
 * UPDATE AFTER PROCESSING (Internal)
 * Called by processFile after successful text extraction.
 */
export const updateAfterProcessing = internalMutation({
  args: {
    id: v.id("documents"),
    content: v.string(),
    contentPlain: v.string(),
    contentPreview: v.string(),
    contentHash: v.string(),
    fileSize: v.number(),
    status: v.literal("ready"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.id, {
      content: args.content,
      contentPlain: args.contentPlain,
      contentPreview: args.contentPreview,
      contentHash: args.contentHash,
      fileSize: args.fileSize,
      status: args.status,
      processedAt: now,
      updatedAt: now,
    });

    // Silent LAMINAR trigger — document is now "ready" after file processing
    const doc = await ctx.db.get(args.id);
    if (doc) {
      await ctx.scheduler.runAfter(
        0,
        internal.laminar.runner.onDocumentIngested,
        { documentId: args.id, userId: doc.userId }
      );
    }
  },
});

/**
 * UPDATE STATUS (Internal)
 * Called by processFile when processing fails.
 */
export const updateStatus = internalMutation({
  args: {
    id: v.id("documents"),
    status: v.union(
      v.literal("processing"),
      v.literal("ready"),
      v.literal("error")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
      ...(args.errorMessage !== undefined && {
        errorMessage: args.errorMessage,
      }),
    });
  },
});

/**
 * KNOWLEDGE DOMAIN BRIDGE — Intelligence Context Access Point
 *
 * This is the ONLY authorized entry point for LAMINAR to read document data.
 * The Intelligence Domain (convex/laminar/) must NEVER call ctx.db.query("documents")
 * directly. It must always go through this function.
 *
 * Why: When multi-tenant team features land, per-workspace filtering logic
 * lives here — in one place. LAMINAR files don't need to change.
 *
 * SC2 Principle: Bounded Contexts — 'Resource' means different things
 * to different parts of the system. Keep definitions separate.
 */
export const getForLaminar = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "ready"))
      .collect();
  },
});

/**
 * GET BY ID — Internal (no auth check).
 * Used by processFile action to fetch document server-side.
 */
export const getByIdInternal = internalQuery({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ===================================================================
// HELPERS
// ===================================================================

/**
 * Simple hash for duplicate detection (DJB2 variant).
 * Not cryptographic — just for fast content fingerprinting.
 */
function generateSimpleHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/** Strip HTML tags for creating plain text search field. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}