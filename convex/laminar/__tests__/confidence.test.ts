import { describe, it, expect } from "vitest";
import {
  distancesToProbabilities,
  classifyConfidence,
} from "../confidence";

describe("distancesToProbabilities", () => {
  it("sums to ~1.0 for typical distances", () => {
    const probs = distancesToProbabilities([0.2, 0.8, 1.4]);
    const sum = probs.reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(0.999);
    expect(sum).toBeLessThan(1.001);
  });

  it("produces all finite values", () => {
    const probs = distancesToProbabilities([0.2, 0.8, 1.4]);
    for (const p of probs) {
      expect(Number.isFinite(p)).toBe(true);
    }
  });

  it("handles extreme distances without Infinity", () => {
    const probs = distancesToProbabilities([1000, 2000, 3000]);
    for (const p of probs) {
      expect(Number.isFinite(p)).toBe(true);
      expect(p).not.toBe(Infinity);
    }
    const sum = probs.reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(0.999);
    expect(sum).toBeLessThan(1.001);
  });

  it("returns [1.0] for single distance", () => {
    const probs = distancesToProbabilities([5.0]);
    expect(probs).toEqual([1.0]);
  });

  it("returns [] for empty input", () => {
    const probs = distancesToProbabilities([]);
    expect(probs).toEqual([]);
  });

  it("closer distance gets higher probability", () => {
    const probs = distancesToProbabilities([0.1, 0.5, 2.0]);
    expect(probs[0]!).toBeGreaterThan(probs[1]!);
    expect(probs[1]!).toBeGreaterThan(probs[2]!);
  });
});

describe("classifyConfidence", () => {
  it("flags ambiguous when top two are close (gap < 15%)", () => {
    // 0.52 and 0.40: gap = 0.12, threshold = 0.15 * 0.52 = 0.078
    // gap 0.12 > 0.078, so NOT ambiguous by the actual formula
    // Let's use values that ARE ambiguous: gap <= 0.15 * first
    const memberships = [
      { clusterId: "a", probability: 0.50 },
      { clusterId: "b", probability: 0.45 },
      { clusterId: "c", probability: 0.05 },
    ];
    const result = classifyConfidence(memberships);
    // gap = 0.05, threshold = 0.15 * 0.50 = 0.075
    // 0.05 <= 0.075 → ambiguous
    expect(result.isAmbiguous).toBe(true);
    expect(result.confidence).toBe(0.50);
  });

  it("not ambiguous when dominant cluster is clear", () => {
    const memberships = [
      { clusterId: "a", probability: 0.85 },
      { clusterId: "b", probability: 0.10 },
      { clusterId: "c", probability: 0.05 },
    ];
    const result = classifyConfidence(memberships);
    // gap = 0.75, threshold = 0.15 * 0.85 = 0.1275
    // 0.75 > 0.1275 → NOT ambiguous
    expect(result.isAmbiguous).toBe(false);
    expect(result.confidence).toBe(0.85);
  });

  it("handles single membership", () => {
    const memberships = [{ clusterId: "only", probability: 1.0 }];
    const result = classifyConfidence(memberships);
    expect(result.confidence).toBe(1.0);
    expect(result.isAmbiguous).toBe(false);
  });

  it("handles empty memberships", () => {
    const result = classifyConfidence([]);
    expect(result.confidence).toBe(0);
    expect(result.isAmbiguous).toBe(false);
  });
});
