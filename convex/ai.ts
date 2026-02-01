import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// VELA LIGHTHOUSE - AI-Powered Knowledge Navigator
// ============================================================================

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

interface UsageStats {
  totalQueries: number;
  totalTokens: number;
  avgTokensPerQuery: number;
  avgResponseTime: number;
  estimatedCost: string;
  period: {
    from: string;
    to: string;
  } | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildSystemPrompt(): string {
  return `You are the LIGHTHOUSE - VELA's intelligent knowledge navigator. Your mission is to illuminate answers from documents with precision and clarity.

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
- Professional but warm (like a knowledgeable librarian)
- Confident when information is present in documents
- Honest and helpful when information is missing or unclear
- Encouraging and supportive
- Avoid: Corporate jargon, overly technical language, vagueness

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
    .map((doc: Doc<"documents">, index: number) => {
      const content = doc.contentPlain.length > MAX_CHARS_PER_DOC
        ? doc.contentPlain.slice(0, MAX_CHARS_PER_DOC) + "\n\n[Content truncated for length - this document contains more information]"
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

function handleClaudeError(error: any): never {
  console.error("[LIGHTHOUSE] Claude API Error:", error);

  if (error?.status === 429) {
    throw new Error("🌊 High tide of requests - please wait a moment and try again");
  }

  if (error?.status === 401 || error?.status === 403) {
    throw new Error("🔑 API authentication failed - check your API key configuration");
  }

  if (error?.status === 500 || error?.status === 503) {
    throw new Error("⛈️ Claude API temporarily unavailable - navigating through stormy seas, try again in a moment");
  }

  if (error?.status === 400) {
    throw new Error("⚠️ Invalid request - check your question and selected documents");
  }

  if (error?.status === 413) {
    throw new Error("🌊 Request too large - try selecting fewer documents or asking a shorter question");
  }

  const message = error?.message || "Unknown error occurred";
  throw new Error(`💨 Stormy seas encountered: ${message}`);
}

function extractAnswerText(response: Anthropic.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("\n");
}

function validateQuery(query: string): void {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    throw new Error("🧭 Your COMPASS needs direction - please ask a question");
  }

  if (trimmedQuery.length > MAX_QUERY_LENGTH) {
    throw new Error(`⛵ Question too long - keep it under ${MAX_QUERY_LENGTH} characters`);
  }
}

function validateDocumentIds(documentIds: Id<"documents">[]): void {
  if (documentIds.length === 0) {
    throw new Error("📚 No documents selected - choose at least one document to search");
  }

  if (documentIds.length > MAX_DOCUMENTS) {
    throw new Error(`🌊 Too many documents - limit to ${MAX_DOCUMENTS} for best results`);
  }
}

// ============================================================================
// MAIN ACTIONS
// ============================================================================

/**
 * APPROACH 1: Manual Document Selection (askQuestion)
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
    console.log(`[LIGHTHOUSE] Fetching ${args.documentIds.length} documents...`);

    const documents: Doc<"documents">[] = await Promise.all(
      args.documentIds.map(async (id): Promise<Doc<"documents">> => {
        const doc = await ctx.runQuery(api.documents.getById, { id });
        
        if (!doc) {
          throw new Error(`📄 Document not found: ${id}`);
        }

        // Security: Verify user owns the document
        if (doc.userId !== identity.subject) {
          throw new Error(`🔒 Unauthorized access to document: ${doc.title}`);
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
        max_tokens: args.maxTokens || parseInt(process.env.ANTHROPIC_MAX_TOKENS || String(DEFAULT_MAX_TOKENS)),
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });
    } catch (error) {
      handleClaudeError(error);
    }

    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    // Extract and Process Answer
    const answerText = extractAnswerText(response);
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    console.log(`[LIGHTHOUSE] ✓ Answer generated in ${responseTimeMs}ms`);
    console.log(`[LIGHTHOUSE] ✓ Used ${tokensUsed} tokens (${response.usage.input_tokens} in / ${response.usage.output_tokens} out)`);

    // Log Query for Analytics
    try {
      await ctx.runMutation(api.queries.log, {
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
 * APPROACH 2: Automatic Document Search (generateAnswer)
 * 
 * Automatically searches for relevant documents using full-text search.
 * Best for quick queries where user doesn't know relevant documents.
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
    console.log(`[LIGHTHOUSE] Looking for top ${maxSources} relevant documents...`);

    // FIXED: Use the correct search function signature from your documents.ts
    const searchResults = await ctx.runQuery(api.documents.search, {
      query: trimmedQuery,
      // Note: If your search function doesn't support limit, 
      // we'll slice the results after
    });

    // Limit results to maxSources
    const limitedResults = searchResults.slice(0, maxSources);

    if (limitedResults.length === 0) {
      console.log(`[LIGHTHOUSE] ⚠ No documents found`);
      
      return {
        answer: `⛵ I couldn't find any relevant documents in your knowledge base to answer this question.

**Suggestions:**
- Upload documents about "${trimmedQuery.split(' ').slice(0, 3).join(' ')}"
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

    console.log(`[LIGHTHOUSE] ✓ Found ${limitedResults.length} relevant documents`);

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
        max_tokens: args.maxTokens || parseInt(process.env.ANTHROPIC_MAX_TOKENS || String(DEFAULT_MAX_TOKENS)),
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });
    } catch (error) {
      handleClaudeError(error);
    }

    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    // Extract and Process Answer
    const answerText = extractAnswerText(response);
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    console.log(`[LIGHTHOUSE] ✓ Answer generated in ${responseTimeMs}ms`);
    console.log(`[LIGHTHOUSE] ✓ Used ${tokensUsed} tokens (${response.usage.input_tokens} in / ${response.usage.output_tokens} out)`);

    // Log Query for Analytics
    try {
      await ctx.runMutation(api.queries.log, {
        userId: identity.subject,
        query: trimmedQuery,
        answer: answerText.slice(0, 500),
        documentIds: limitedResults.map(d => d._id),
        tokensUsed,
        responseTimeMs,
        model: response.model,
      });
      console.log(`[LIGHTHOUSE] ✓ Query logged`);
    } catch (logError) {
      console.error("[LIGHTHOUSE] ⚠ Failed to log query:", logError);
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
      const response: Anthropic.Message = await anthropic.messages.create({
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
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      console.log(`[LIGHTHOUSE] ✓ Connection successful (${tokensUsed} tokens used)`);

      return {
        success: true,
        message: text,
        model: response.model,
        apiKeyValid: true,
      };
    } catch (error: any) {
      console.error("[LIGHTHOUSE] ✗ Connection failed:", error);

      return {
        success: false,
        message: error?.message || "Connection failed - check API key in .env.local",
        apiKeyValid: false,
      };
    }
  },
});

/**
 * Get Claude API Usage Statistics
 * 
 * FIXED: Uses getUserQueries from your queries.ts instead of getHistory
 */
export const getUsageStats = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<UsageStats> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("⚓ Not authenticated");
    }

    console.log(`[LIGHTHOUSE] Calculating usage stats...`);

    // FIXED: Use getUserQueries from your actual queries.ts file
    // Note: getUserQueries automatically filters by authenticated user
    const queries = await ctx.runQuery(api.queries.getUserQueries, {
      limit: args.limit || 100,
    });

    // Calculate aggregate statistics with proper TypeScript types
    const totalQueries = queries.length;
    const totalTokens = queries.reduce((sum: number, q: any) => sum + (q.tokensUsed || 0), 0);
    const avgTokensPerQuery = totalQueries > 0 ? Math.round(totalTokens / totalQueries) : 0;
    const avgResponseTime = totalQueries > 0
      ? Math.round(queries.reduce((sum: number, q: any) => sum + (q.responseTimeMs || 0), 0) / totalQueries)
      : 0;

    // Estimate cost based on Claude Sonnet 4 pricing
    // Input: $3/M tokens, Output: $15/M tokens
    // Using rough 50/50 split: average of $9/M tokens
    const estimatedCost = (totalTokens / 1_000_000) * 9;

    console.log(`[LIGHTHOUSE] ✓ Stats calculated:`);
    console.log(`  - ${totalQueries} queries`);
    console.log(`  - ${totalTokens.toLocaleString()} tokens`);
    console.log(`  - ${avgTokensPerQuery} avg tokens/query`);
    console.log(`  - ${avgResponseTime}ms avg response time`);
    console.log(`  - $${estimatedCost.toFixed(4)} estimated cost`);

    return {
      totalQueries,
      totalTokens,
      avgTokensPerQuery,
      avgResponseTime,
      estimatedCost: estimatedCost.toFixed(4),
      period: queries.length > 0 
        ? {
            from: new Date(queries[queries.length - 1].timestamp).toISOString(),
            to: new Date(queries[0].timestamp).toISOString(),
          }
        : null,
    };
  },
});