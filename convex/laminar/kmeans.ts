/**
 * K-Means Clustering Engine
 *
 * Pure TypeScript implementation of K-Means clustering with K-Means++
 * initialization and silhouette-based K selection. No external dependencies.
 *
 * Algorithm overview:
 * 1. Initialize K centroids via K-Means++ (smart seeding).
 * 2. Repeat until convergence or max iterations:
 *    a. Assign each vector to the nearest centroid (Euclidean distance).
 *    b. Recompute centroids as the mean of their assigned vectors.
 * 3. Evaluate clustering quality with silhouette scores.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A numeric vector in D-dimensional space. */
export type Vector = number[];

/** Result returned by {@link kMeansCluster}. */
export interface KMeansResult {
  /** Cluster label (0-indexed) for each input vector. */
  labels: number[];
  /** Final centroid positions, shape `[k][dimensions]`. */
  centroids: Vector[];
  /** Number of iterations executed. */
  iterations: number;
  /** Whether the algorithm converged before hitting `maxIterations`. */
  converged: boolean;
}

// ---------------------------------------------------------------------------
// Distance helpers
// ---------------------------------------------------------------------------

/**
 * Compute the squared Euclidean distance between two vectors.
 *
 * Using squared distance avoids a `sqrt` call and preserves ordering,
 * which is sufficient for nearest-centroid comparisons.
 *
 * @param a - First vector.
 * @param b - Second vector.
 * @returns `Σ (aᵢ − bᵢ)²`
 */
function squaredEuclidean(a: Vector, b: Vector): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    sum += d * d;
  }
  return sum;
}

/**
 * Compute the Euclidean distance between two vectors.
 *
 * @param a - First vector.
 * @param b - Second vector.
 * @returns `√(Σ (aᵢ − bᵢ)²)`
 */
function euclidean(a: Vector, b: Vector): number {
  return Math.sqrt(squaredEuclidean(a, b));
}

// ---------------------------------------------------------------------------
// Seeded PRNG (deterministic testing & reproducibility)
// ---------------------------------------------------------------------------

/**
 * Simple mulberry32 PRNG — returns a function that produces values in [0, 1).
 * Used internally so clustering results are reproducible when a seed is given.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// K-Means++ initialization
// ---------------------------------------------------------------------------

/**
 * Select K initial centroids using the K-Means++ algorithm.
 *
 * K-Means++ improves convergence speed and quality over random initialization
 * by spreading initial centroids apart:
 *
 * 1. Choose the first centroid uniformly at random from the data.
 * 2. For each subsequent centroid, pick a data point with probability
 *    proportional to `D(x)²`, where `D(x)` is the distance from `x`
 *    to its nearest already-chosen centroid.
 *
 * @param vectors - Input data points, shape `[N][D]`.
 * @param k       - Number of centroids to select (must be ≤ N).
 * @param seed    - Optional PRNG seed for reproducibility. Defaults to 42.
 * @returns Array of K centroid vectors (copies, not references).
 */
export function initializeCentroids(
  vectors: Vector[],
  k: number,
  seed: number = 42,
): Vector[] {
  const n = vectors.length;
  if (k <= 0) return [];
  if (k >= n) return vectors.map((v) => [...v]);

  const rng = mulberry32(seed);
  const centroids: Vector[] = [];

  // Step 1: first centroid chosen uniformly at random.
  const firstIdx = Math.floor(rng() * n);
  centroids.push([...vectors[firstIdx]!]);

  // Squared distances from each point to nearest chosen centroid.
  const minDist = new Float64Array(n).fill(Infinity);

  for (let c = 1; c < k; c++) {
    // Update minimum distances with the most recently added centroid.
    const lastCentroid = centroids[c - 1]!;
    for (let i = 0; i < n; i++) {
      const d = squaredEuclidean(vectors[i]!, lastCentroid);
      if (d < minDist[i]!) minDist[i] = d;
    }

    // Build cumulative distribution of D(x)².
    let totalDist = 0;
    for (let i = 0; i < n; i++) totalDist += minDist[i]!;

    // Sample next centroid proportional to D(x)².
    const threshold = rng() * totalDist;
    let cumulative = 0;
    let chosen = 0;
    for (let i = 0; i < n; i++) {
      cumulative += minDist[i]!;
      if (cumulative >= threshold) {
        chosen = i;
        break;
      }
    }

    centroids.push([...vectors[chosen]!]);
  }

  return centroids;
}

// ---------------------------------------------------------------------------
// Cluster assignment
// ---------------------------------------------------------------------------

/**
 * Assign each vector to the index of the nearest centroid.
 *
 * Uses squared Euclidean distance (equivalent ordering to Euclidean,
 * avoids unnecessary `sqrt` calls).
 *
 * @param vectors   - Data points, shape `[N][D]`.
 * @param centroids - Current centroids, shape `[K][D]`.
 * @returns Array of length N where `result[i]` is the cluster index for `vectors[i]`.
 */
export function assignClusters(
  vectors: Vector[],
  centroids: Vector[],
): number[] {
  const labels = new Array<number>(vectors.length);

  for (let i = 0; i < vectors.length; i++) {
    let bestDist = Infinity;
    let bestCluster = 0;

    for (let c = 0; c < centroids.length; c++) {
      const d = squaredEuclidean(vectors[i]!, centroids[c]!);
      if (d < bestDist) {
        bestDist = d;
        bestCluster = c;
      }
    }

    labels[i] = bestCluster;
  }

  return labels;
}

// ---------------------------------------------------------------------------
// Centroid update
// ---------------------------------------------------------------------------

/**
 * Recompute centroids as the component-wise mean of each cluster's members.
 *
 * If a cluster has no assigned vectors (empty cluster), its centroid is
 * preserved from the previous iteration to avoid NaN values.
 *
 * @param vectors     - Data points, shape `[N][D]`.
 * @param assignments - Cluster label for each vector (from {@link assignClusters}).
 * @param k           - Number of clusters.
 * @param previous    - Previous centroids, used as fallback for empty clusters.
 * @returns New centroids, shape `[K][D]`.
 */
export function updateCentroids(
  vectors: Vector[],
  assignments: number[],
  k: number,
  previous?: Vector[],
): Vector[] {
  if (vectors.length === 0) return previous ? previous.map((v) => [...v]) : [];

  const dims = vectors[0]!.length;
  const sums: number[][] = Array.from({ length: k }, () => new Array(dims).fill(0));
  const counts = new Array<number>(k).fill(0);

  for (let i = 0; i < vectors.length; i++) {
    const c = assignments[i]!;
    counts[c] = counts[c]! + 1;
    for (let d = 0; d < dims; d++) {
      sums[c]![d] = sums[c]![d]! + vectors[i]![d]!;
    }
  }

  return sums.map((sum, c) => {
    if (counts[c] === 0) {
      // Empty cluster — keep previous centroid if available.
      return previous ? [...previous[c]!] : new Array(dims).fill(0);
    }
    return sum.map((s) => s / counts[c]!);
  });
}

// ---------------------------------------------------------------------------
// Full K-Means algorithm
// ---------------------------------------------------------------------------

/**
 * Run the K-Means clustering algorithm.
 *
 * Steps:
 * 1. Initialize centroids with K-Means++ ({@link initializeCentroids}).
 * 2. Iterate:
 *    a. Assign vectors to nearest centroid ({@link assignClusters}).
 *    b. Recompute centroids ({@link updateCentroids}).
 *    c. Check convergence — stop if no assignments changed.
 * 3. Return labels, centroids, iteration count, and convergence flag.
 *
 * @param vectors       - Data points, shape `[N][D]`.
 * @param k             - Number of clusters (must be ≥ 1 and ≤ N).
 * @param maxIterations - Maximum iterations before stopping. Defaults to 100.
 * @param seed          - Optional PRNG seed for K-Means++ init. Defaults to 42.
 * @returns Clustering result with labels, centroids, iteration count, and convergence status.
 */
export function kMeansCluster(
  vectors: Vector[],
  k: number,
  maxIterations: number = 100,
  seed: number = 42,
): KMeansResult {
  const n = vectors.length;

  if (n === 0 || k <= 0) {
    return { labels: [], centroids: [], iterations: 0, converged: true };
  }

  // Clamp k to the number of data points.
  const effectiveK = Math.min(k, n);

  let centroids = initializeCentroids(vectors, effectiveK, seed);
  let labels = assignClusters(vectors, centroids);
  let converged = false;
  let iterations = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations++;

    centroids = updateCentroids(vectors, labels, effectiveK, centroids);
    const newLabels = assignClusters(vectors, centroids);

    // Check convergence: did any assignment change?
    let changed = false;
    for (let i = 0; i < n; i++) {
      if (newLabels[i] !== labels[i]) {
        changed = true;
        break;
      }
    }

    labels = newLabels;

    if (!changed) {
      converged = true;
      break;
    }
  }

  return { labels, centroids, iterations, converged };
}

// ---------------------------------------------------------------------------
// Silhouette score
// ---------------------------------------------------------------------------

/**
 * Compute the mean silhouette score for a clustering.
 *
 * For each point `i`:
 * - `a(i)` = mean distance to all other points in the **same** cluster.
 * - `b(i)` = minimum over other clusters of the mean distance to that cluster.
 * - `s(i)` = `(b(i) − a(i)) / max(a(i), b(i))`
 *
 * The overall score is the mean of `s(i)` across all points.
 *
 * Interpretation:
 * - +1 → points are well-matched to their cluster.
 * -  0 → points are on cluster boundaries.
 * - −1 → points are likely mis-clustered.
 *
 * @param vectors - Data points, shape `[N][D]`.
 * @param labels  - Cluster assignments for each vector.
 * @returns Mean silhouette coefficient in [−1, 1].
 */
export function calculateSilhouette(
  vectors: Vector[],
  labels: number[],
): number {
  const n = vectors.length;
  if (n <= 1) return 0;

  const k = Math.max(...labels) + 1;

  // If all points belong to one cluster, silhouette is 0 by definition.
  if (k <= 1) return 0;

  // Pre-compute pairwise distances (symmetric, O(N²) space).
  // For very large N this should be streamed, but for typical document
  // clustering (hundreds to low thousands) this is fine.
  const dist: Float64Array[] = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = euclidean(vectors[i]!, vectors[j]!);
      dist[i]![j] = d;
      dist[j]![i] = d;
    }
  }

  // Cluster membership lists.
  const clusters: number[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < n; i++) {
    clusters[labels[i]!]!.push(i);
  }

  let totalSilhouette = 0;

  for (let i = 0; i < n; i++) {
    const myCluster = labels[i]!;
    const myClusterMembers = clusters[myCluster]!;

    // a(i): mean intra-cluster distance.
    let a = 0;
    if (myClusterMembers.length > 1) {
      for (const j of myClusterMembers) {
        if (j !== i) a += dist[i]![j]!;
      }
      a /= myClusterMembers.length - 1;
    }

    // b(i): smallest mean inter-cluster distance.
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === myCluster || clusters[c]!.length === 0) continue;
      let meanDist = 0;
      for (const j of clusters[c]!) {
        meanDist += dist[i]![j]!;
      }
      meanDist /= clusters[c]!.length;
      if (meanDist < b) b = meanDist;
    }

    // s(i)
    const maxAB = Math.max(a, b);
    if (maxAB > 0) {
      totalSilhouette += (b - a) / maxAB;
    }
  }

  return totalSilhouette / n;
}

// ---------------------------------------------------------------------------
// Optimal K suggestion
// ---------------------------------------------------------------------------

/**
 * Suggest an optimal number of clusters using the silhouette method.
 *
 * Tests K from 2 to `min(10, floor(√N))` and returns the K that
 * produces the highest mean silhouette score.
 *
 * Falls back to K = 2 if N < 4 (minimum needed for meaningful evaluation).
 *
 * @param vectors - Data points, shape `[N][D]`.
 * @param seed    - Optional PRNG seed for deterministic results. Defaults to 42.
 * @returns The suggested number of clusters.
 */
export function suggestK(vectors: Vector[], seed: number = 42): number {
  const n = vectors.length;
  if (n < 4) return Math.min(2, n);

  const maxK = Math.min(10, Math.floor(Math.sqrt(n)));
  const minK = 2;

  if (maxK < minK) return minK;

  let bestK = minK;
  let bestScore = -Infinity;

  for (let k = minK; k <= maxK; k++) {
    const { labels } = kMeansCluster(vectors, k, 100, seed);
    const score = calculateSilhouette(vectors, labels);

    if (score > bestScore) {
      bestScore = score;
      bestK = k;
    }
  }

  return bestK;
}
