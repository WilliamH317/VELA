/**
 * LAMINAR CORE — Document Type Processors
 *
 * BOUNDARY RULE: This file must NEVER import from:
 *   - convex/_generated/
 *   - convex/server
 *   - convex/values
 *   - Any Convex runtime module
 *
 * All functions here are pure TypeScript — no side effects, no DB access.
 * They are fully testable with Vitest without a live Convex environment.
 *
 * Each processor extracts type-specific signals from raw document content.
 * These signals enrich TF-IDF vectorization beyond simple bag-of-words.
 *
 * SC2 Principle: Polymorphism — IProcessable unifies different unit types
 * behind a single interface. CombatManager calls Attack() regardless of race.
 * LAMINAR calls extract() regardless of document type.
 */

import type { DocumentSignals, IProcessable } from "./pipeline";

// ── Tokenization (shared across processors) ─────────────────────────────────

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "this", "that", "these", "those", "it", "its",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

function calculateDensity(terms: string[], rawLength: number): number {
  if (rawLength === 0) return 0;
  const uniqueTerms = new Set(terms).size;
  const estimatedTokens = Math.max(1, rawLength / 5);
  return Math.min(1, uniqueTerms / estimatedTokens);
}

// ── Markdown Processor ───────────────────────────────────────────────────────

export class MarkdownProcessor implements IProcessable {
  extract(content: string): DocumentSignals {
    const headerMatches = (content.match(/^#{1,6}\s/gm) ?? []).length;
    const listMatches = (content.match(/^[-*+]\s/gm) ?? []).length;
    const codeMatches = (content.match(/```/g) ?? []).length / 2;
    const hasFrontMatter = /^---\n/.test(content);

    const structuralWeight = Math.min(
      1,
      (headerMatches * 0.15) + (listMatches * 0.05) + (codeMatches * 0.1)
    );

    const authorityScore = hasFrontMatter ? 0.7 : headerMatches > 3 ? 0.4 : 0.2;

    const plain = content
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const terms = tokenize(plain);
    return {
      terms,
      structuralWeight,
      authorityScore,
      density: calculateDensity(terms, content.length),
      sourceType: "markdown",
    };
  }
}

// ── PDF Processor ─────────────────────────────────────────────────────────────

export class PdfProcessor implements IProcessable {
  extract(content: string): DocumentSignals {
    const hasPageNumbers = /\bpage\s+\d+\b/i.test(content);
    const allCapsLines = (content.match(/^[A-Z][A-Z\s]{5,}$/gm) ?? []).length;
    const hasStructuredTitle = content.length > 100 &&
      /^[^\n]{10,100}\n/.test(content);

    const structuralWeight = Math.min(
      1,
      (allCapsLines * 0.1) + (hasPageNumbers ? 0.2 : 0)
    );

    const authorityScore = hasStructuredTitle
      ? 0.6
      : hasPageNumbers ? 0.4 : 0.15;

    const terms = tokenize(content);
    return {
      terms,
      structuralWeight,
      authorityScore,
      density: calculateDensity(terms, content.length),
      sourceType: "pdf",
    };
  }
}

// ── Plain Text Processor ─────────────────────────────────────────────────────

export class PlaintextProcessor implements IProcessable {
  extract(content: string): DocumentSignals {
    const paragraphCount = content.split(/\n\n+/).length;
    const structuralWeight = Math.min(1, paragraphCount * 0.05);

    const terms = tokenize(content);
    return {
      terms,
      structuralWeight,
      authorityScore: 0.1,
      density: calculateDensity(terms, content.length),
      sourceType: "text",
    };
  }
}

// ── Processor Factory ────────────────────────────────────────────────────────

export function getProcessor(type: "pdf" | "text" | "markdown"): IProcessable {
  switch (type) {
    case "markdown": return new MarkdownProcessor();
    case "pdf":      return new PdfProcessor();
    case "text":     return new PlaintextProcessor();
  }
}

/**
 * Extract DocumentSignals for a batch of documents.
 * Called from runner.ts before TF-IDF vectorization.
 *
 * Convex batch limit: 25 items. Caller is responsible for batching
 * if processing more than 25 documents.
 */
export function extractSignalsBatch(
  documents: Array<{ contentPlain: string; type: "pdf" | "text" | "markdown" }>
): DocumentSignals[] {
  if (documents.length > 25) {
    console.warn(
      `[LAMINAR] extractSignalsBatch called with ${documents.length} docs. ` +
      `Batch limit is 25. Process in chunks.`
    );
  }
  return documents.map(doc =>
    getProcessor(doc.type).extract(doc.contentPlain, doc.type)
  );
}
