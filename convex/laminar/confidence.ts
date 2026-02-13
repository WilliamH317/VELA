/**
 * Probabilistic Cluster Membership Scoring
 *
 * Implements a "sensor fusion" approach borrowed from autonomous systems:
 * instead of making a hard cluster assignment (binary 0/1), we compute a
 * full probability distribution over all clusters for every document.
 *
 * **Analogy — Extended Kalman Filter (EKF) measurement uncertainty:**
 * In an EKF, each sensor measurement arrives with a covariance matrix
 * that quantifies *how certain* the reading is. The filter fuses multiple
 * uncertain measurements into a single best estimate. Similarly, a
 * document's distances to cluster centroids are "measurements" of
 * membership. Converting them to probabilities via softmax gives us a
 * covariance-like uncertainty: a document near two cluster boundaries has
 * high entropy (ambiguous), while one deep inside a cluster has low
 * entropy (confident). This lets downstream consumers — like a UI or a
 * retrieval ranker — treat cluster labels as beliefs rather than facts.
 *
 * Pure TypeScript — no external dependencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single cluster membership entry — one (clusterId, probability) pair.
 *
 * Analogous to a single sensor's contribution in an EKF update step:
 * the probability represents how strongly this "sensor" (distance metric)
 * indicates the document belongs to the cluster.
 */
export interface ClusterMembership {
  /** Identifier of the cluster. */
  clusterId: string;
  /** Membership probability in [0, 1]. All memberships for a document sum to 1. */
  probability: number;
}

/**
 * Full confidence report for a single document.
 *
 * Analogous to the EKF state estimate after fusing all sensor readings:
 * `primaryCluster` is the MAP (maximum a-posteriori) estimate, `confidence`
 * is the posterior probability of that estimate, and `isAmbiguous` flags
 * cases where the posterior is nearly bimodal — indicating the "filter"
 * has not converged to a single hypothesis.
 */
export interface DocumentConfidence {
  /** Identifier of the document being scored. */
  documentId: string;
  /** Cluster with the highest membership probability (MAP estimate). */
  primaryCluster: string;
  /** Full probability distribution over all clusters, sorted descending. */
  memberships: ClusterMembership[];
  /** Probability of the primary cluster — value in (0, 1]. */
  confidence: number;
  /** True if the top two clusters are within 15% of each other. */
  isAmbiguous: boolean;
}

// ---------------------------------------------------------------------------
// Core: distance → probability conversion
// ---------------------------------------------------------------------------

/**
 * Convert an array of distances into a probability distribution via softmax
 * over negated distances.
 *
 * **Math:**
 * ```
 * p_i = exp(−d_i / T) / Σ_j exp(−d_j / T)
 * ```
 * where `T` is the temperature parameter.
 *
 * **Numerical stability:**
 * Before exponentiation we subtract the maximum logit (`−d_i / T`) to
 * prevent overflow, a standard technique also used in neural-network
 * softmax layers. This is equivalent to multiplying numerator and
 * denominator by the same constant, so the result is unchanged.
 *
 * **Temperature intuition (EKF analogy):**
 * Temperature controls the "measurement noise" — a low temperature is like
 * a high-precision sensor (sharp distribution, strong preference for the
 * nearest cluster), while a high temperature is like a noisy sensor
 * (flat distribution, uncertain about which cluster fits best).
 *
 * @param distances   - Non-negative distances from a point to each cluster centroid.
 * @param temperature - Softmax temperature. Lower → sharper; higher → flatter.
 *                      Defaults to 1.0. Must be > 0.
 * @returns Probability array that sums to 1, same length as `distances`.
 */
export function distancesToProbabilities(
  distances: number[],
  temperature: number = 1.0,
): number[] {
  const n = distances.length;
  if (n === 0) return [];
  if (n === 1) return [1.0];

  const t = Math.max(temperature, 1e-10); // guard against zero/negative

  // Compute logits: −d / T
  const logits = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    logits[i] = -distances[i] / t;
  }

  // Numerical stability: subtract max logit before exp.
  let maxLogit = -Infinity;
  for (let i = 0; i < n; i++) {
    if (logits[i] > maxLogit) maxLogit = logits[i];
  }

  const exps = new Array<number>(n);
  let sumExp = 0;
  for (let i = 0; i < n; i++) {
    exps[i] = Math.exp(logits[i] - maxLogit);
    sumExp += exps[i];
  }

  // Normalize to get probabilities.
  const probs = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    probs[i] = exps[i] / sumExp;
  }

  return probs;
}

// ---------------------------------------------------------------------------
// Confidence classification
// ---------------------------------------------------------------------------

/** Threshold for ambiguity: top two probabilities within this ratio. */
const AMBIGUITY_THRESHOLD = 0.15;

/**
 * Classify the confidence of a cluster membership distribution.
 *
 * **Confidence** is simply the highest probability in the distribution —
 * the MAP estimate's posterior. In EKF terms, this is analogous to the
 * inverse of the innovation covariance: a tight posterior (high confidence)
 * means the measurement strongly supports one hypothesis.
 *
 * **Ambiguity** is flagged when the top two membership probabilities are
 * within 15% of each other, indicating a near-bimodal posterior. In
 * autonomous systems this would trigger a "multi-hypothesis tracking"
 * alert — the filter hasn't resolved which cluster the document belongs to.
 *
 * @param memberships - Cluster membership array (need not be sorted).
 * @returns Confidence score and ambiguity flag.
 */
export function classifyConfidence(
  memberships: ClusterMembership[],
): { confidence: number; isAmbiguous: boolean } {
  if (memberships.length === 0) {
    return { confidence: 0, isAmbiguous: false };
  }
  if (memberships.length === 1) {
    return { confidence: memberships[0].probability, isAmbiguous: false };
  }

  // Find the top two probabilities.
  let first = -Infinity;
  let second = -Infinity;

  for (const m of memberships) {
    if (m.probability > first) {
      second = first;
      first = m.probability;
    } else if (m.probability > second) {
      second = m.probability;
    }
  }

  const confidence = first;

  // Ambiguous if the gap between top two is within the threshold.
  // We compare the absolute difference to the threshold proportion of the top.
  const isAmbiguous = first - second <= AMBIGUITY_THRESHOLD * first;

  return { confidence, isAmbiguous };
}

// ---------------------------------------------------------------------------
// Full document confidence scoring
// ---------------------------------------------------------------------------

/**
 * Compute the full confidence report for a single document vector against
 * a set of cluster centroids.
 *
 * This is the main entry point — it chains:
 * 1. Euclidean distance computation (document → each centroid).
 * 2. Softmax conversion to probabilities ({@link distancesToProbabilities}).
 * 3. Confidence classification ({@link classifyConfidence}).
 *
 * **EKF analogy end-to-end:**
 * - The document vector is the "sensor measurement."
 * - Each centroid is a "predicted state" from a different hypothesis.
 * - The distances are "innovation residuals" (mismatch between measurement
 *   and prediction).
 * - The softmax converts residuals into posterior hypothesis weights,
 *   just as an EKF computes a Kalman gain that weights the update.
 * - The confidence report is the "fused state estimate" with uncertainty.
 *
 * @param documentVector - The document's TF-IDF (or other) feature vector.
 * @param centroids      - Cluster centroid vectors, shape `[K][D]`.
 * @param clusterIds     - Human-readable IDs for each centroid (same order).
 * @param temperature    - Softmax temperature. Defaults to 1.0.
 * @returns Full {@link DocumentConfidence} report.
 */
export function computeDocumentConfidence(
  documentVector: number[],
  centroids: number[][],
  clusterIds: string[],
  temperature: number = 1.0,
): DocumentConfidence {
  // Compute Euclidean distances to each centroid.
  const distances = centroids.map((centroid) =>
    euclideanDistance(documentVector, centroid),
  );

  // Convert to probabilities.
  const probabilities = distancesToProbabilities(distances, temperature);

  // Build membership array sorted by probability descending.
  const memberships: ClusterMembership[] = clusterIds
    .map((clusterId, i) => ({ clusterId, probability: probabilities[i] }))
    .sort((a, b) => b.probability - a.probability);

  // Classify confidence.
  const { confidence, isAmbiguous } = classifyConfidence(memberships);

  return {
    documentId: "",
    primaryCluster: memberships[0]?.clusterId ?? "",
    memberships,
    confidence,
    isAmbiguous,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Euclidean distance between two vectors.
 *
 * @param a - First vector.
 * @param b - Second vector.
 * @returns `√(Σ (aᵢ − bᵢ)²)`
 */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}
