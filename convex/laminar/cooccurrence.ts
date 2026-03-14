/**
 * LAMINAR CORE — PURE COMPUTATION LAYER
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
 * SC2 Principle: Separation of Concerns (Game Logic vs. Game Loop)
 * The engine renders frames; the domain calculates damage.
 * These functions calculate; runner.ts persists.
 */

/**
 * Co-occurrence Engine — LAMINAR Stage 2
 *
 * Discovers which documents are accessed together within the same session,
 * enabling "Captains who navigated to X also charted course to Y"-style
 * recommendations (the nautical equivalent of Amazon's "customers who
 * bought X also bought Y").
 *
 * **How it works:**
 * A "session" is a browser tab lifetime (ID stored in sessionStorage).
 * When a user views, searches, or AI-queries multiple documents within
 * the same session, those documents co-occur. Repeated co-occurrence
 * across many sessions is a strong signal that the documents are
 * contextually related — even if they share no keywords or clusters.
 *
 * **Why session-based, not time-window?**
 * Session IDs capture *intent continuity* better than arbitrary time
 * windows. A user might leave for lunch mid-session and return — the
 * session still represents a single research thread. Conversely, two
 * quick searches in separate tabs are distinct intents despite being
 * temporally close.
 *
 * Pure TypeScript — no Convex imports, no external dependencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A normalized co-occurrence pair with strength score. */
export interface CoOccurrencePair {
  /** First document ID (lexicographically smaller). */
  documentA: string;
  /** Second document ID (lexicographically larger). */
  documentB: string;
  /** Number of sessions in which both documents were accessed. */
  count: number;
  /** Normalized strength: count / totalSessions, in [0, 1]. */
  strength: number;
}

/** A related document suggestion derived from co-occurrence data. */
export interface RelatedSuggestion {
  /** The co-occurring document ID. */
  documentId: string;
  /** Co-occurrence strength with the target document. */
  strength: number;
}

// ---------------------------------------------------------------------------
// Co-occurrence Extraction
// ---------------------------------------------------------------------------

/**
 * Build a co-occurrence count map from session access data.
 *
 * For each session that contains 2+ distinct documents, generates all
 * unique unordered pairs and counts how many sessions each pair appears in.
 *
 * Pair keys are formatted as `docA|docB` where docA < docB lexicographically,
 * ensuring (A,B) and (B,A) map to the same entry.
 *
 * **Combinatorics:** A session with N documents produces C(N,2) = N*(N-1)/2
 * pairs. A session with 5 documents produces 10 pairs.
 *
 * @param sessions - Map of sessionId → array of document IDs accessed in that session.
 * @returns Map of `"docA|docB"` → co-occurrence count across sessions.
 */
export function buildCoOccurrenceFromSessions(
  sessions: Map<string, string[]>,
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const [, docIds] of sessions) {
    // Deduplicate documents within a session (viewing the same doc
    // twice in one session shouldn't create a self-pair).
    const unique = [...new Set(docIds)];

    // Sessions with fewer than 2 documents produce no pairs.
    if (unique.length < 2) continue;

    // Sort so we can generate pairs in canonical order.
    unique.sort();

    // Generate all unique pairs (i < j guarantees no duplicates).
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const key = `${unique[i]}|${unique[j]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize raw co-occurrence counts into strength-scored pairs.
 *
 * Strength is the fraction of total sessions in which the pair co-occurs:
 * `strength = count / totalSessions`. This normalizes for activity volume —
 * a pair that co-occurs in 5/10 sessions (strength 0.5) is a stronger
 * signal than 5/1000 (strength 0.005).
 *
 * @param coOccurrences  - Raw co-occurrence map from {@link buildCoOccurrenceFromSessions}.
 * @param totalSessions  - Total number of sessions (denominator for normalization).
 * @returns Array of {@link CoOccurrencePair} sorted by strength descending.
 */
export function normalizeCoOccurrences(
  coOccurrences: Map<string, number>,
  totalSessions: number,
): CoOccurrencePair[] {
  const safeDenominator = Math.max(totalSessions, 1);
  const pairs: CoOccurrencePair[] = [];

  for (const [key, count] of coOccurrences) {
    const separatorIndex = key.indexOf("|");
    const documentA = key.slice(0, separatorIndex);
    const documentB = key.slice(separatorIndex + 1);

    pairs.push({
      documentA,
      documentB,
      count,
      strength: count / safeDenominator,
    });
  }

  pairs.sort((a, b) => b.strength - a.strength);
  return pairs;
}

// ---------------------------------------------------------------------------
// Suggestion
// ---------------------------------------------------------------------------

/** Maximum number of related document suggestions to return. */
const MAX_SUGGESTIONS = 5;

/**
 * Suggest documents related to a target document based on co-occurrence.
 *
 * "Captains who navigated to X also charted course to Y."
 *
 * Scans all normalized co-occurrence pairs for those involving the target
 * document, extracts the *other* document in each pair, and returns the
 * top 5 by strength.
 *
 * @param targetDocId       - The document to find related documents for.
 * @param normalizedPairs   - Normalized co-occurrence pairs from {@link normalizeCoOccurrences}.
 * @returns Up to 5 {@link RelatedSuggestion} entries sorted by strength descending.
 *          Empty array if the target document has no co-occurrences.
 */
export function suggestRelated(
  targetDocId: string,
  normalizedPairs: CoOccurrencePair[],
): RelatedSuggestion[] {
  const suggestions: RelatedSuggestion[] = [];

  for (const pair of normalizedPairs) {
    if (pair.documentA === targetDocId) {
      suggestions.push({ documentId: pair.documentB, strength: pair.strength });
    } else if (pair.documentB === targetDocId) {
      suggestions.push({ documentId: pair.documentA, strength: pair.strength });
    }
  }

  // normalizedPairs is already sorted by strength descending,
  // so suggestions inherit that order. Just cap at MAX_SUGGESTIONS.
  return suggestions.slice(0, MAX_SUGGESTIONS);
}
