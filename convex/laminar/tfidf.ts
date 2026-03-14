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
 * TF-IDF Vectorization Engine
 *
 * Pure TypeScript implementation of Term Frequency–Inverse Document Frequency
 * for document similarity scoring. No external dependencies.
 *
 * Mathematical foundation:
 * - TF(t,d)  = 1 + log(raw count of t in d)          [sublinear scaling]
 * - IDF(t,D) = log(N / (1 + df(t)))                   [smoothed inverse document frequency]
 * - TF-IDF   = TF × IDF
 * - Each document vector is L2-normalized so cosine similarity = dot product.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single token — always lowercase, stripped of punctuation. */
export type Token = string;

/** An ordered list of unique terms that defines vector dimensions. */
export type Vocabulary = string[];

/**
 * A TF-IDF matrix where rows are documents and columns are vocabulary terms.
 * `matrix[docIndex][termIndex]` gives the L2-normalized TF-IDF weight.
 */
export type TFIDFMatrix = number[][];

/** A single L2-normalized TF-IDF vector for one document. */
export type TFIDFVector = number[];

// ---------------------------------------------------------------------------
// Stop words  (127 common English stop words)
// ---------------------------------------------------------------------------

const STOP_WORDS: ReadonlySet<string> = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an",
  "and", "any", "are", "aren't", "as", "at", "be", "because", "been",
  "before", "being", "below", "between", "both", "but", "by", "can",
  "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does",
  "doesn't", "doing", "don't", "down", "during", "each", "few", "for",
  "from", "further", "get", "got", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "her", "here", "hers", "herself",
  "him", "himself", "his", "how", "i", "if", "in", "into", "is", "isn't",
  "it", "it's", "its", "itself", "just", "let", "me", "might", "more",
  "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off",
  "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves",
  "out", "over", "own", "same", "shan't", "she", "should", "shouldn't",
  "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
  "themselves", "then", "there", "these", "they", "this", "those",
  "through", "to", "too", "under", "until", "up", "very", "was", "wasn't",
  "we", "were", "weren't", "what", "when", "where", "which", "while",
  "who", "whom", "why", "will", "with", "won't", "would", "wouldn't",
  "you", "your", "yours", "yourself", "yourselves",
]);

/** Maximum vocabulary size — keeps vectors bounded for large corpora. */
const MAX_VOCABULARY_SIZE = 1000;

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

/**
 * Tokenize a text string into an array of cleaned tokens.
 *
 * Steps:
 * 1. Lowercase the input.
 * 2. Split on any non-alphanumeric character (whitespace, punctuation, etc.).
 * 3. Discard tokens shorter than 2 characters.
 * 4. Remove English stop words.
 *
 * @param text - Raw input text.
 * @returns Array of cleaned, lowercase tokens.
 */
export function tokenize(text: string): Token[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

// ---------------------------------------------------------------------------
// Vocabulary construction
// ---------------------------------------------------------------------------

/**
 * Build a vocabulary of the most common terms across a document corpus.
 *
 * For every unique term the *document frequency* (number of documents
 * containing the term) is computed. Terms are ranked by descending document
 * frequency and truncated to {@link MAX_VOCABULARY_SIZE} (1 000).
 *
 * @param documents - Array of raw document texts.
 * @returns Sorted vocabulary array (max 1 000 terms).
 */
export function buildVocabulary(documents: string[]): Vocabulary {
  /** Map from term → number of documents containing that term. */
  const df = new Map<string, number>();

  for (const doc of documents) {
    // Use a Set so each term is counted at most once per document.
    const unique = new Set(tokenize(doc));
    for (const term of unique) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  // Sort by document frequency descending, then alphabetically for stability.
  return [...df.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_VOCABULARY_SIZE)
    .map(([term]) => term);
}

// ---------------------------------------------------------------------------
// TF-IDF computation
// ---------------------------------------------------------------------------

/**
 * Compute an L2-normalized TF-IDF matrix for a corpus.
 *
 * **Term Frequency (sublinear):**
 * ```
 * tf(t, d) = 1 + log(count(t, d))   if count > 0
 *            0                        otherwise
 * ```
 *
 * **Inverse Document Frequency (smoothed):**
 * ```
 * idf(t) = log(N / (1 + df(t)))
 * ```
 * where N = total documents, df(t) = documents containing t.
 *
 * **L2 normalization:**
 * Each row vector is divided by its Euclidean norm so that
 * `cosineSimilarity` reduces to a simple dot product.
 *
 * @param documents  - Array of raw document texts.
 * @param vocabulary - Ordered term list (defines column indices).
 * @returns Matrix of shape `[documents.length][vocabulary.length]`.
 */
export function computeTFIDF(
  documents: string[],
  vocabulary: Vocabulary,
): TFIDFMatrix {
  const N = documents.length;

  // Build a quick lookup: term → column index
  const termIndex = new Map<string, number>();
  for (let i = 0; i < vocabulary.length; i++) {
    termIndex.set(vocabulary[i]!, i);
  }

  // --- Pass 1: document frequency for IDF ----------------------------------
  const df = new Float64Array(vocabulary.length);

  const tokenizedDocs: Token[][] = documents.map((doc) => tokenize(doc));

  for (const tokens of tokenizedDocs) {
    const seen = new Set<number>();
    for (const t of tokens) {
      const idx = termIndex.get(t);
      if (idx !== undefined && !seen.has(idx)) {
        df[idx] = df[idx]! + 1;
        seen.add(idx);
      }
    }
  }

  // Pre-compute IDF for each vocabulary term.
  const idf = new Float64Array(vocabulary.length);
  for (let i = 0; i < vocabulary.length; i++) {
    idf[i] = Math.log(N / (1 + df[i]!));
  }

  // --- Pass 2: TF-IDF per document -----------------------------------------
  const matrix: TFIDFMatrix = [];

  for (const tokens of tokenizedDocs) {
    // Raw term counts (only for vocabulary terms).
    const tf = new Float64Array(vocabulary.length);
    for (const t of tokens) {
      const idx = termIndex.get(t);
      if (idx !== undefined) {
        tf[idx] = tf[idx]! + 1;
      }
    }

    // Sublinear TF × IDF
    const vec = new Array<number>(vocabulary.length);
    for (let i = 0; i < vocabulary.length; i++) {
      vec[i] = tf[i]! > 0 ? (1 + Math.log(tf[i]!)) * idf[i]! : 0;
    }

    // L2 normalize
    l2Normalize(vec);

    matrix.push(vec);
  }

  return matrix;
}

// ---------------------------------------------------------------------------
// Cosine similarity
// ---------------------------------------------------------------------------

/**
 * Compute the cosine similarity between two L2-normalized vectors.
 *
 * Because the vectors are already unit-length, cosine similarity is simply
 * their dot product:
 *
 * ```
 * cos(a, b) = Σ aᵢ·bᵢ
 * ```
 *
 * The result is in the range [−1, 1]. For TF-IDF vectors (non-negative
 * weights) the effective range is [0, 1].
 *
 * @param a - First L2-normalized vector.
 * @param b - Second L2-normalized vector.
 * @returns Cosine similarity score.
 */
export function cosineSimilarity(a: TFIDFVector, b: TFIDFVector): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i]! * b[i]!;
  }
  return dot;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * L2-normalize a vector **in place**.
 *
 * After normalization `‖vec‖₂ = 1`. If the vector is all zeros it is left
 * unchanged (avoids division by zero).
 *
 * @param vec - Mutable numeric array to normalize.
 */
function l2Normalize(vec: number[]): void {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i]! * vec[i]!;
  }
  if (sumSq === 0) return;
  const norm = Math.sqrt(sumSq);
  for (let i = 0; i < vec.length; i++) {
    vec[i] = vec[i]! / norm;
  }
}

// ---------------------------------------------------------------------------
// Signal-aware TF-IDF (Phase 5 additive export)
// ---------------------------------------------------------------------------

/**
 * Build TF-IDF vectors from DocumentSignals instead of raw strings.
 *
 * Advantages over buildVocabulary + computeTFIDF:
 * - Uses pre-tokenized, type-specific terms (not generic contentPlain)
 * - Can incorporate structuralWeight and authorityScore as feature signals
 * - Preserves document type context for downstream stages
 *
 * Current implementation: uses terms only (drop-in replacement).
 * Future: weight term frequencies by structuralWeight + authorityScore.
 *
 * SC2 Principle: Polymorphism -- same function handles all document types
 * via the DocumentSignals interface.
 */
export function buildTFIDFFromSignals(signals: Array<{ terms: string[] }>): {
  vocabulary: Vocabulary;
  vectors: TFIDFMatrix;
} {
  // Reconstruct raw strings from pre-extracted terms for compatibility
  // with the existing TF-IDF pipeline
  const documents = signals.map(s => s.terms.join(" "));
  const vocabulary = buildVocabulary(documents);
  const vectors = computeTFIDF(documents, vocabulary);
  return { vocabulary, vectors };
}
