// convex/ai.ts — LIGHTHOUSE: AI-Powered Knowledge Navigator
//
// Two modes of operation:
//   askQuestion    — User selects specific documents (Manual Selection)
//   generateAnswer — AI auto-searches for relevant docs (Smart Search)
//
// Both call Claude API via the Anthropic SDK, log results via
// internal.queries.log, and return structured LighthouseResponse.
//
// Usage stats are handled by the getUsageStats *query* in queries.ts
// (real-time, no action overhead). Don't duplicate that here.

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// CONFIGURATION
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 2048;
const MAX_DOCUMENTS = 20;
const MAX_CHARS_PER_DOC = 8000;
const MAX_QUERY_LENGTH = 1000;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LighthouseResponse {
  answer: string;
  sources: Array<{
    id: Id<"documents">;
    title: string;
    type: string;
  }>;
  metadata: {
    tokensUsed: number;
    responseTimeMs: number;
    model: string;
    documentsSearched: number;
  };
}

interface ConnectionTestResponse {
  success: boolean;
  message: string;
  model?: string;
  apiKeyValid: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildSystemPrompt(): string {
  return `You are the LIGHTHOUSE - VELA's intelligent knowledge navigator. Your mission is to illuminate answers from documents with precision and clarity.

You help professional teams — especially agency and consulting teams — find information across their client documents, project history, institutional knowledge, and process documentation. You surface answers from client briefs, statements of work, meeting notes, strategy documents, competitive analyses, brand guidelines, project plans, and internal process docs.

CORE PRINCIPLES:
1. Answer based ONLY on the provided documents
2. Be specific and cite which document(s) support your answer
3. If the answer isn't in the documents, say "⛵ These documents don't contain that information"
4. Use clear, professional language (no emojis in the answer itself)
5. Keep answers concise but complete (2-4 paragraphs ideal)
6. Structure longer answers with bullet points for clarity

CITATION FORMAT:
- Use: "According to [Document Title]..."
- Use: "As mentioned in [Document Title]..."
- Use: "Based on [Document Title] and [Document Title]..."
- Always cite specific documents when making claims

TONE & STYLE:
- Professional but warm (like a knowledgeable navigator guiding a captain)
- Confident when information is present in documents
- Honest and helpful when information is missing or unclear
- Encouraging and supportive
- Avoid: Corporate jargon, overly technical language, vagueness

TERMINOLOGY:
- Use professional services language: "engagement" not "job", "client" not "customer", "deliverable" not "output", "SOW" not "contract", "account" not "project"
- Mirror the user's own terminology when possible
- Typical queries: "What deliverables did we promise in the Acme Q4 SOW?", "Summarize our competitive research on the FinTech sector", "What's our standard client onboarding process?"

ANSWER STRUCTURE:
- Start with direct answer to the question
- Provide supporting details with citations
- End with actionable insights or next steps when relevant
- Use bullet points for lists of 3+ items
- Keep paragraphs to 3-5 sentences

WHEN INFORMATION IS MISSING:
- Don't guess or make assumptions
- Clearly state what's missing: "These documents don't mention X"
- Suggest what additional documents might help
- Offer to answer related questions based on available info`;
}

function buildDocumentContext(documents: Doc<"documents">[]): string {
  return documents
    .map((doc, index) => {
      const content =
        doc.contentPlain.length > MAX_CHARS_PER_DOC
          ? doc.contentPlain.slice(0, MAX_CHARS_PER_DOC) +
            "\n\n[Content truncated for length - this document contains more information]"
          : doc.contentPlain;

      return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT ${index + 1}: ${doc.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: ${doc.type.toUpperCase()}
Document ID: ${doc._id}

CONTENT:
${content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    })
    .join("\n\n");
}

function buildUserPrompt(query: string, context: string): string {
  return `AVAILABLE DOCUMENTS:
${context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER QUESTION:
${query}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please provide a comprehensive answer based on the documents above. Remember to cite specific documents when making claims and structure your answer clearly.`;
}

function handleClaudeError(error: unknown): never {
  console.error("[LIGHTHOUSE] Claude API Error:", error);

  // Use the SDK's own error class for safe status access
  const status =
    error instanceof Anthropic.APIError ? error.status : undefined;
  const message =
    error instanceof Error ? error.message : "Unknown error occurred";

  if (status === 429) {
    throw new Error(
      "🌊 High tide of requests - please wait a moment and try again"
    );
  }
  if (status === 401 || status === 403) {
    throw new Error(
      "🔑 API authentication failed - check your API key configuration"
    );
  }
  if (status === 500 || status === 503) {
    throw new Error(
      "⛈️ Claude API temporarily unavailable - navigating through stormy seas, try again in a moment"
    );
  }
  if (status === 400) {
    throw new Error(
      "⚠️ Invalid request - check your question and selected documents"
    );
  }
  if (status === 413) {
    throw new Error(
      "🌊 Request too large - try selecting fewer documents or asking a shorter question"
    );
  }

  throw new Error(`💨 Stormy seas encountered: ${message}`);
}

function extractAnswerText(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

function validateQuery(query: string): void {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    throw new Error(
      "🧭 Your COMPASS needs direction - please ask a question"
    );
  }
  if (trimmedQuery.length > MAX_QUERY_LENGTH) {
    throw new Error(
      `⛵ Question too long - keep it under ${MAX_QUERY_LENGTH} characters`
    );
  }
}

function validateDocumentIds(documentIds: Id<"documents">[]): void {
  if (documentIds.length === 0) {
    throw new Error(
      "📚 No documents selected - choose at least one document to search"
    );
  }
  if (documentIds.length > MAX_DOCUMENTS) {
    throw new Error(
      `🌊 Too many documents - limit to ${MAX_DOCUMENTS} for best results`
    );
  }
}

// ============================================================================
// MAIN ACTIONS
// ============================================================================

/**
 * APPROACH 1: Manual Document Selection
 *
 * User explicitly selects which documents to search.
 * Best for focused queries where user knows relevant documents.
 */
export const askQuestion = action({
  args: {
    query: v.string(),
    documentIds: v.array(v.id("documents")),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<LighthouseResponse> => {
    const startTime = Date.now();

    // Authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("⚓ Not authenticated - please sign in to navigate");
    }

    // Input Validation
    validateQuery(args.query);
    validateDocumentIds(args.documentIds);

    const trimmedQuery = args.query.trim();

    // Fetch and Verify Documents
    console.log(`[LIGHTHOUSE] Question: "${trimmedQuery}"`);
    console.log(
      `[LIGHTHOUSE] Fetching ${args.documentIds.length} documents...`
    );

    const documents: Doc<"documents">[] = await Promise.all(
      args.documentIds.map(async (id): Promise<Doc<"documents">> => {
        const doc = await ctx.runQuery(api.documents.getById, { id });

        if (!doc) {
          throw new Error(`📄 Document not found: ${id}`);
        }

        // Security: Verify user owns the document
        if (doc.userId !== identity.subject) {
          throw new Error(
            `🔒 Unauthorized access to document: ${doc.title}`
          );
        }

        return doc;
      })
    );

    console.log(`[LIGHTHOUSE] ✓ Retrieved ${documents.length} documents`);

    // Build Context for Claude
    const systemPrompt = buildSystemPrompt();
    const documentContext = buildDocumentContext(documents);
    const userPrompt = buildUserPrompt(trimmedQuery, documentContext);

    // Call Claude API
    console.log(`[LIGHTHOUSE] Calling Claude API...`);
    let response: Anthropic.Message;

    try {
      response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens:
          args.maxTokens ||
          parseInt(
            process.env.ANTHROPIC_MAX_TOKENS || String(DEFAULT_MAX_TOKENS)
          ),
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
    } catch (error) {
      handleClaudeError(error);
    }

    const responseTimeMs = Date.now() - startTime;

    // Extract and Process Answer
    const answerText = extractAnswerText(response);
    const tokensUsed =
      response.usage.input_tokens + response.usage.output_tokens;

    console.log(`[LIGHTHOUSE] ✓ Answer generated in ${responseTimeMs}ms`);
    console.log(
      `[LIGHTHOUSE] ✓ Used ${tokensUsed} tokens (${response.usage.input_tokens} in / ${response.usage.output_tokens} out)`
    );

    // Log Query for Analytics (non-blocking — failure won't break the response)
    try {
      await ctx.runMutation(internal.queries.log, {
        userId: identity.subject,
        query: trimmedQuery,
        answer: answerText.slice(0, 500),
        documentIds: args.documentIds,
        tokensUsed,
        responseTimeMs,
        model: response.model,
      });
      console.log(`[LIGHTHOUSE] ✓ Query logged`);
    } catch (logError) {
      console.error("[LIGHTHOUSE] ⚠ Failed to log query:", logError);
    }

    // Silent accessEvent emission for LAMINAR behavioral signals
    // Fire-and-forget via scheduler — zero latency impact on AI response
    for (const doc of documents) {
      await ctx.scheduler.runAfter(0, internal.laminar.access.logAccessInternal, {
        documentId: doc._id,
        userId: identity.subject,
        sessionId: `lighthouse-${Date.now()}`,
        action: "ai_query" as const,
      });
    }

    // Return Structured Response
    return {
      answer: answerText,
      sources: documents.map((doc) => ({
        id: doc._id,
        title: doc.title,
        type: doc.type,
      })),
      metadata: {
        tokensUsed,
        responseTimeMs,
        model: response.model,
        documentsSearched: documents.length,
      },
    };
  },
});

/**
 * APPROACH 2: Automatic Document Search (Smart Search)
 *
 * Automatically searches for relevant documents using full-text search.
 * Best for quick queries where user doesn't know which docs are relevant.
 */
export const generateAnswer = action({
  args: {
    query: v.string(),
    maxSources: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<LighthouseResponse> => {
    const startTime = Date.now();

    // Authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("⚓ Not authenticated - please sign in to navigate");
    }

    // Input Validation
    validateQuery(args.query);

    const trimmedQuery = args.query.trim();
    const maxSources = Math.min(args.maxSources || 5, MAX_DOCUMENTS);

    // Auto-Search for Relevant Documents
    console.log(`[LIGHTHOUSE] Auto-search for: "${trimmedQuery}"`);
    console.log(
      `[LIGHTHOUSE] Looking for top ${maxSources} relevant documents...`
    );

    const searchResults = await ctx.runQuery(api.documents.search, {
      query: trimmedQuery,
    });

    // Limit results to maxSources
    const limitedResults = searchResults.slice(0, maxSources);

    if (limitedResults.length === 0) {
      console.log(`[LIGHTHOUSE] ⚠ No documents found`);

      return {
        answer: `⛵ I couldn't find any relevant documents in your knowledge base to answer this question.

**Suggestions:**
- Upload documents about "${trimmedQuery.split(" ").slice(0, 3).join(" ")}"
- Rephrase your question with different keywords
- Check if you have documents that cover this topic
- Try a broader or more specific question

**What I can help with:**
Once you upload relevant documents, I'll be able to search them and provide detailed answers with citations.`,
        sources: [],
        metadata: {
          tokensUsed: 0,
          responseTimeMs: Date.now() - startTime,
          model: DEFAULT_MODEL,
          documentsSearched: 0,
        },
      };
    }

    console.log(
      `[LIGHTHOUSE] ✓ Found ${limitedResults.length} relevant documents`
    );

    // Build Context for Claude
    const systemPrompt = buildSystemPrompt();
    const documentContext = buildDocumentContext(limitedResults);
    const userPrompt = buildUserPrompt(trimmedQuery, documentContext);

    // Call Claude API
    console.log(`[LIGHTHOUSE] Calling Claude API...`);
    let response: Anthropic.Message;

    try {
      response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens:
          args.maxTokens ||
          parseInt(
            process.env.ANTHROPIC_MAX_TOKENS || String(DEFAULT_MAX_TOKENS)
          ),
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
    } catch (error) {
      handleClaudeError(error);
    }

    const responseTimeMs = Date.now() - startTime;

    // Extract and Process Answer
    const answerText = extractAnswerText(response);
    const tokensUsed =
      response.usage.input_tokens + response.usage.output_tokens;

    console.log(`[LIGHTHOUSE] ✓ Answer generated in ${responseTimeMs}ms`);
    console.log(
      `[LIGHTHOUSE] ✓ Used ${tokensUsed} tokens (${response.usage.input_tokens} in / ${response.usage.output_tokens} out)`
    );

    // Log Query for Analytics (non-blocking — failure won't break the response)
    try {
      await ctx.runMutation(internal.queries.log, {
        userId: identity.subject,
        query: trimmedQuery,
        answer: answerText.slice(0, 500),
        documentIds: limitedResults.map((d) => d._id),
        tokensUsed,
        responseTimeMs,
        model: response.model,
      });
      console.log(`[LIGHTHOUSE] ✓ Query logged`);
    } catch (logError) {
      console.error("[LIGHTHOUSE] ⚠ Failed to log query:", logError);
    }

    // Silent accessEvent emission for LAMINAR behavioral signals
    // Fire-and-forget via scheduler — zero latency impact on AI response
    for (const doc of limitedResults) {
      await ctx.scheduler.runAfter(0, internal.laminar.access.logAccessInternal, {
        documentId: doc._id,
        userId: identity.subject,
        sessionId: `lighthouse-${Date.now()}`,
        action: "ai_query" as const,
      });
    }

    // Return Structured Response
    return {
      answer: answerText,
      sources: limitedResults.map((doc) => ({
        id: doc._id,
        title: doc.title,
        type: doc.type,
      })),
      metadata: {
        tokensUsed,
        responseTimeMs,
        model: response.model,
        documentsSearched: limitedResults.length,
      },
    };
  },
});

// ============================================================================
// UTILITY ACTIONS
// ============================================================================

/**
 * Test Claude API Connection
 */
export const testConnection = action({
  args: {},
  handler: async (ctx): Promise<ConnectionTestResponse> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("⚓ Not authenticated - please sign in");
    }

    console.log("[LIGHTHOUSE] Testing Claude API connection...");

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Reply with exactly: 'VELA LIGHTHOUSE operational ⚓'",
          },
        ],
      });

      const text = extractAnswerText(response);
      const tokensUsed =
        response.usage.input_tokens + response.usage.output_tokens;

      console.log(
        `[LIGHTHOUSE] ✓ Connection successful (${tokensUsed} tokens used)`
      );

      return {
        success: true,
        message: text,
        model: response.model,
        apiKeyValid: true,
      };
    } catch (error) {
      console.error("[LIGHTHOUSE] ✗ Connection failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Connection failed - check API key in .env.local";

      return {
        success: false,
        message,
        apiKeyValid: false,
      };
    }
  },
});

// NOTE: Usage stats are served by the real-time query in queries.ts
// (api.queries.getUsageStats). No need for an action wrapper — queries
// are reactive, cached, and don't count against action rate limits.