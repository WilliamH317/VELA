import { describe, it, expect } from "vitest";
import {
  tokenize,
  buildVocabulary,
  computeTFIDF,
  cosineSimilarity,
} from "../tfidf";

describe("tokenize", () => {
  it("lowercases and splits on non-alphanumeric", () => {
    const tokens = tokenize("Hello, World! Test-case 123");
    expect(tokens).toContain("hello");
    expect(tokens).toContain("world");
    expect(tokens).toContain("test");
    expect(tokens).toContain("case");
    expect(tokens).toContain("123");
  });

  it("removes stop words", () => {
    const tokens = tokenize("the quick brown fox is a dog");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("is");
    expect(tokens).not.toContain("a");
    expect(tokens).toContain("quick");
    expect(tokens).toContain("brown");
    expect(tokens).toContain("fox");
  });

  it("filters tokens shorter than 2 characters", () => {
    const tokens = tokenize("I am a b c developer");
    expect(tokens).not.toContain("i");
    expect(tokens).not.toContain("b");
    expect(tokens).not.toContain("c");
    expect(tokens).toContain("developer");
  });
});

describe("buildVocabulary", () => {
  it("returns unique terms sorted by document frequency", () => {
    const vocab = buildVocabulary([
      "project management tools",
      "project timeline review",
      "design tools review",
    ]);
    expect(vocab.length).toBeGreaterThan(0);
    // "project" appears in 2 docs, should be early
    expect(vocab.indexOf("project")).toBeLessThan(vocab.indexOf("management"));
  });
});

describe("computeTFIDF", () => {
  const docs = [
    "client brief marketing strategy campaign goals",
    "project timeline deliverables milestones deadline",
    "client brief marketing budget allocation spend",
  ];

  it("produces finite values for every entry in 3-doc corpus", () => {
    const vocab = buildVocabulary(docs);
    const matrix = computeTFIDF(docs, vocab);
    expect(matrix.length).toBe(3);
    for (const vec of matrix) {
      for (const val of vec) {
        expect(Number.isFinite(val)).toBe(true);
      }
    }
  });

  it("produces L2-normalized vectors (norm ≈ 1.0)", () => {
    const vocab = buildVocabulary(docs);
    const matrix = computeTFIDF(docs, vocab);
    for (const vec of matrix) {
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      // Norm should be 1.0 (or 0 if empty doc)
      if (norm > 0) {
        expect(Math.abs(norm - 1.0)).toBeLessThan(0.01);
      }
    }
  });

  it("produces identical vectors for identical documents", () => {
    const identicalDocs = [
      "marketing strategy campaign brief",
      "marketing strategy campaign brief",
    ];
    const vocab = buildVocabulary(identicalDocs);
    const matrix = computeTFIDF(identicalDocs, vocab);
    for (let i = 0; i < matrix[0]!.length; i++) {
      expect(matrix[0]![i]).toBe(matrix[1]![i]);
    }
  });
});

describe("cosineSimilarity", () => {
  it("returns 1.0 for identical vectors", () => {
    const v = [0.5, 0.5, 0.5, 0.5];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  it("returns 0.0 for orthogonal vectors", () => {
    const a = [1, 0, 0, 0];
    const b = [0, 1, 0, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
  });

  it("returns 0 for zero vector without NaN", () => {
    const zero = [0, 0, 0, 0];
    const other = [0.5, 0.5, 0, 0];
    const result = cosineSimilarity(zero, other);
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(0);
  });
});
