import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Claude API client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * LIGHTHOUSE Action: Ask Claude a question about documents
 * 
 * This is a Convex action (not query/mutation) because:
 * - Calls external API (Claude)
 * - Doesn't need real-time reactivity
 * - Handles long-running operations
 * - Can run internal mutations for logging
 */
export const askQuestion = action({
  args: {
    query: v.string(),
    documentIds: v.array(v.id("documents")),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
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
  }> => {
    // ===== STEP 1: AUTHENTICATION =====
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("⚓ Not authenticated - please sign in to navigate");
    }

    // ===== STEP 2: VALIDATION =====
    if (args.query.trim().length === 0) {
      throw new Error("🧭 Your COMPASS needs direction - please ask a question");
    }

    if (args.query.length > 1000) {
      throw new Error("⛵ Question too long - keep it under 1000 characters");
    }

    if (args.documentIds.length === 0) {
      throw new Error("📚 No documents selected - add knowledge to search");
    }

    if (args.documentIds.length > 20) {
      throw new Error("🌊 Too many documents - limit to 20 for best results");
    }

    // ===== STEP 3: FETCH DOCUMENTS =====
    const documents: Doc<"documents">[] = await Promise.all(
      args.documentIds.map(async (id): Promise<Doc<"documents">> => {
        // Use runQuery to fetch documents in action context
        const doc = await ctx.runQuery(api.documents.getById, { id });
        if (!doc) {
          throw new Error(`📄 Document ${id} not found`);
        }
        // Security: Verify user owns the document
        if (doc.userId !== identity.subject) {
          throw new Error(`🔒 Unauthorized access to document ${id}`);
        }
        return doc;
      })
    );

    // ===== STEP 4: PREPARE CONTEXT =====
    const context: string = documents
      .map((doc: Doc<"documents">, index: number) => {
        return `
Document ${index + 1}: ${doc.title}
Type: ${doc.type}
Content:
${doc.contentPlain}

---
`;
      })
      .join("\n");

    // ===== STEP 5: CALL CLAUDE API =====
    const startTime = Date.now();
    let response: Anthropic.Message;
    let tokensUsed = 0;

    try {
      response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
        max_tokens: args.maxTokens || parseInt(process.env.ANTHROPIC_MAX_TOKENS || "2048"),
        messages: [
          {
            role: "user",
            content: `You are the LIGHTHOUSE - VELA's intelligent knowledge navigator. Your mission is to illuminate answers from documents with precision and clarity.

CONTEXT (User's Documents):
${context}

USER QUESTION:
${args.query}

INSTRUCTIONS:
1. Answer based ONLY on the provided documents
2. Be specific and cite which document(s) support your answer
3. If the answer isn't in the documents, say "⛵ These documents don't contain that information"
4. Use clear, professional language (no emojis in the answer itself)
5. Keep answers concise but complete
6. Structure longer answers with bullet points for clarity

ANSWER:`,
          },
        ],
      });

      // Extract token usage
      tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    } catch (error: any) {
      // ===== STEP 6: ERROR HANDLING =====
      console.error("Claude API Error:", error);

      // Handle specific error types
      if (error?.status === 429) {
        throw new Error("🌊 High tide of requests - please wait a moment and try again");
      }
      
      if (error?.status === 401) {
        throw new Error("🔑 API authentication failed - check configuration");
      }

      if (error?.status === 500 || error?.status === 503) {
        throw new Error("⛈️ Claude API temporarily unavailable - try again in a moment");
      }

      // Generic error
      throw new Error(`💨 Stormy seas encountered: ${error?.message || "Unknown error"}`);
    }

    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    // ===== STEP 7: EXTRACT ANSWER =====
    const answerText: string = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as Anthropic.TextBlock).text)
      .join("\n");

    // ===== STEP 8: LOG QUERY (for analytics) =====
    try {
      await ctx.runMutation(api.queries.log, {
        userId: identity.subject,
        query: args.query,
        answer: answerText,
        documentIds: args.documentIds,
        tokensUsed,
        responseTimeMs,
        model: response.model,
      });
    } catch (logError) {
      // Don't fail the whole request if logging fails
      console.error("Failed to log query:", logError);
    }

    // ===== STEP 9: RETURN RESPONSE =====
    return {
      answer: answerText,
      sources: documents.map((doc: Doc<"documents">) => ({
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
 * Test action to verify Claude API connection
 * Use this to test your API key before building UI
 */
export const testConnection = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    message: string;
    model?: string;
    apiKeyValid: boolean;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    try {
      const response: Anthropic.Message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Reply with exactly: 'VELA LIGHTHOUSE operational ⚓'",
          },
        ],
      });

      const text: string = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as Anthropic.TextBlock).text)
        .join("");

      return {
        success: true,
        message: text,
        model: response.model,
        apiKeyValid: true,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || "Connection failed",
        apiKeyValid: false,
      };
    }
  },
});