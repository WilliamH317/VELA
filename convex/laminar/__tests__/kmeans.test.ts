import { describe, it, expect } from "vitest";
import {
  initializeCentroids,
  assignClusters,
  updateCentroids,
  kMeansCluster,
} from "../kmeans";

describe("initializeCentroids", () => {
  it("returns k centroids from data", () => {
    const vectors = [
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 0],
      [2, 2],
    ];
    const centroids = initializeCentroids(vectors, 3);
    expect(centroids.length).toBe(3);
    // Each centroid should have same dimensionality
    for (const c of centroids) {
      expect(c.length).toBe(2);
    }
  });

  it("returns copies, not references", () => {
    const vectors = [[1, 2], [3, 4]];
    const centroids = initializeCentroids(vectors, 2);
    centroids[0]![0] = 999;
    expect(vectors[0]![0]).toBe(1);
  });
});

describe("assignClusters", () => {
  it("assigns each vector to nearest centroid", () => {
    const vectors = [
      [0, 0],
      [1, 0],
      [10, 10],
      [11, 10],
    ];
    const centroids = [
      [0, 0],
      [10, 10],
    ];
    const labels = assignClusters(vectors, centroids);
    expect(labels[0]).toBe(0);
    expect(labels[1]).toBe(0);
    expect(labels[2]).toBe(1);
    expect(labels[3]).toBe(1);
  });
});

describe("updateCentroids", () => {
  it("computes mean of assigned vectors", () => {
    const vectors = [
      [0, 0],
      [2, 2],
      [10, 10],
      [12, 12],
    ];
    const assignments = [0, 0, 1, 1];
    const centroids = updateCentroids(vectors, assignments, 2);
    expect(centroids[0]).toEqual([1, 1]);
    expect(centroids[1]).toEqual([11, 11]);
  });
});

describe("kMeansCluster", () => {
  const vectors = [
    [0.0, 0.0],
    [0.1, 0.1],
    [0.2, 0.0],
    [10.0, 10.0],
    [10.1, 10.1],
    [10.2, 10.0],
  ];

  it("k=2 on 6 vectors: all assigned, no empty clusters", () => {
    const result = kMeansCluster(vectors, 2);
    expect(result.labels.length).toBe(6);

    // Both clusters should have members
    const clusterCounts = new Map<number, number>();
    for (const label of result.labels) {
      clusterCounts.set(label, (clusterCounts.get(label) ?? 0) + 1);
    }
    expect(clusterCounts.size).toBe(2);
    for (const count of clusterCounts.values()) {
      expect(count).toBeGreaterThan(0);
    }
  });

  it("k=1: all docs in cluster 0", () => {
    const result = kMeansCluster(vectors, 1);
    expect(result.labels.length).toBe(6);
    for (const label of result.labels) {
      expect(label).toBe(0);
    }
  });

  it("k equals doc count: each doc gets own cluster", () => {
    const result = kMeansCluster(vectors, 6);
    expect(result.labels.length).toBe(6);
    expect(result.centroids.length).toBe(6);
  });

  it("returns iterations > 0", () => {
    const result = kMeansCluster(vectors, 2);
    expect(result.iterations).toBeGreaterThan(0);
  });

  it("handles empty input gracefully", () => {
    const result = kMeansCluster([], 3);
    expect(result.labels.length).toBe(0);
    expect(result.centroids.length).toBe(0);
    expect(result.converged).toBe(true);
  });
});
