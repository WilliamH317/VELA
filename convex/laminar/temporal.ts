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
 * Temporal Analysis Engine — LAMINAR Stage 2
 *
 * Detects temporal patterns in document access events: how often a document
 * is accessed, whether that rate is accelerating or decelerating, and whether
 * accesses follow a periodic rhythm (e.g., weekly standup notes).
 *
 * **Autonomous Systems Analogy — Kalman Filter State Estimation:**
 *
 * In an autonomous vehicle's navigation stack, a Kalman filter maintains a
 * "state estimate" — position, velocity, acceleration — updated each time a
 * new sensor measurement arrives. Between measurements it *predicts* where
 * the vehicle will be using a motion model.
 *
 * This module applies the same conceptual framework to document access:
 *
 * | Navigation KF           | Temporal Analysis              |
 * |-------------------------|--------------------------------|
 * | Sensor measurements     | Access events (view, search…)  |
 * | Position estimate       | Access rate (accesses/day)     |
 * | Velocity vector         | Rate of change (trend)         |
 * | Periodic motion model   | Periodicity detection          |
 * | Predicted position      | Predicted relevance at T+7    |
 *
 * Just as a KF fuses noisy GPS/IMU readings into a smooth trajectory, we
 * fuse sparse, noisy access timestamps into a smooth relevance trajectory
 * that downstream systems (ranking, recommendations) can consume.
 *
 * Pure TypeScript — no Convex imports, no external dependencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Temporal trajectory of a document's access pattern.
 *
 * Analogous to a Kalman filter's state vector: position (accessRate),
 * velocity (rateOfChange), motion model (trend), and predicted future
 * state (predictedRelevance).
 */
export interface AccessTrajectory {
  /** Current access rate in accesses per day (7-day window). */
  accessRate: number;
  /** Rate of change: (7-day rate − 30-day rate) / 30-day rate. */
  rateOfChange: number;
  /** Classified trend direction — the "velocity vector" of relevance. */
  trend: "rising" | "stable" | "declining" | "periodic";
  /** Detected period in days, or null if not periodic. */
  periodicity: number | null;
  /** Predicted relevance score at T+7, clamped to [0, 1]. */
  predictedRelevance: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;

/** Time windows for rate calculation. */
const WINDOW_7D = 7 * MS_PER_DAY;
const WINDOW_14D = 14 * MS_PER_DAY;
const WINDOW_30D = 30 * MS_PER_DAY;

/** Minimum events required for periodicity detection. */
const MIN_EVENTS_FOR_PERIODICITY = 6;

/** Coefficient of variation threshold for "regular" intervals. */
const CV_THRESHOLD = 0.3;

/** Trend classification thresholds for rate of change. */
const RISING_THRESHOLD = 0.2;
const DECLINING_THRESHOLD = -0.2;

// ---------------------------------------------------------------------------
// Periodicity Detection
// ---------------------------------------------------------------------------

/**
 * Detect periodicity in a series of access timestamps.
 *
 * Uses the coefficient of variation (CV = σ/μ) of inter-access intervals
 * to determine if accesses occur at a regular rhythm. A CV below 0.3
 * indicates the intervals are sufficiently uniform to declare periodicity.
 *
 * **Autonomous systems analogy:**
 * This is akin to detecting a periodic disturbance in IMU data — if the
 * vehicle encounters a regular bump pattern (e.g., expansion joints on a
 * bridge), the navigation system can anticipate the next disturbance
 * rather than treating each one as a surprise.
 *
 * @param sortedTimestamps - Access timestamps in ascending order (epoch ms).
 * @param _now             - Current time in epoch ms (reserved for future
 *                           windowed analysis; currently unused).
 * @returns Period in days if regular pattern detected, otherwise null.
 *          Period must be between 1 and 30 days.
 */
export function detectPeriodicity(
  sortedTimestamps: number[],
  _now: number,
): number | null {
  if (sortedTimestamps.length < MIN_EVENTS_FOR_PERIODICITY) {
    return null;
  }

  // Compute inter-access intervals in days.
  const intervals: number[] = [];
  for (let i = 1; i < sortedTimestamps.length; i++) {
    const intervalDays =
      (sortedTimestamps[i]! - sortedTimestamps[i - 1]!) / MS_PER_DAY;
    intervals.push(intervalDays);
  }

  // Mean interval.
  let sum = 0;
  for (const interval of intervals) {
    sum += interval;
  }
  const mean = sum / intervals.length;

  // Guard: mean must be in [1, 30] days to be a meaningful period.
  if (mean < 1 || mean > 30) {
    return null;
  }

  // Standard deviation.
  let varianceSum = 0;
  for (const interval of intervals) {
    const diff = interval - mean;
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / intervals.length);

  // Coefficient of variation.
  const cv = stdDev / mean;

  if (cv < CV_THRESHOLD) {
    return mean;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Trajectory Estimation
// ---------------------------------------------------------------------------

/**
 * Estimate the access trajectory for a document from its access history.
 *
 * Computes a multi-window rate analysis (7-day, 14-day, 30-day) and
 * classifies the trend direction. This is the temporal equivalent of a
 * Kalman filter's "predict + update" cycle:
 *
 * - **Measurement update:** Each access event is a "sensor reading" that
 *   confirms the document is still relevant.
 * - **State prediction:** The trend and predicted relevance extrapolate
 *   the current trajectory forward, just as a KF uses a motion model to
 *   predict the next state.
 *
 * @param accessTimestamps - Access timestamps in any order (epoch ms).
 * @param now              - Current time in epoch ms.
 * @returns Full {@link AccessTrajectory} for the document.
 */
export function estimateAccessTrajectory(
  accessTimestamps: number[],
  now: number,
): AccessTrajectory {
  // --- Edge case: no access events ---
  if (accessTimestamps.length === 0) {
    return {
      accessRate: 0,
      rateOfChange: 0,
      trend: "stable",
      periodicity: null,
      predictedRelevance: 0.1,
    };
  }

  // --- Edge case: single access event ---
  if (accessTimestamps.length === 1) {
    return {
      accessRate: 0,
      rateOfChange: 0,
      trend: "stable",
      periodicity: null,
      predictedRelevance: 0.5,
    };
  }

  // --- Compute windowed rates (accesses per day) ---
  const rate7d = countInWindow(accessTimestamps, now, WINDOW_7D) / 7;
  const rate14d = countInWindow(accessTimestamps, now, WINDOW_14D) / 14;
  const rate30d = countInWindow(accessTimestamps, now, WINDOW_30D) / 30;

  // Use the finest-grain rate as the "current" rate.
  const accessRate = rate7d;

  // --- Rate of change: compare short-term vs long-term ---
  // Guard against division by zero when there are no events in the 30-day
  // window. Fall back to comparing against the 14-day rate.
  let rateOfChange: number;
  if (rate30d > 0) {
    rateOfChange = (rate7d - rate30d) / rate30d;
  } else if (rate14d > 0) {
    rateOfChange = (rate7d - rate14d) / rate14d;
  } else {
    // All events are very recent (within 7 days) with no broader baseline.
    // If there are events in the 7-day window, that's a rising signal.
    rateOfChange = rate7d > 0 ? 1.0 : 0;
  }

  // --- Periodicity detection ---
  const sorted = [...accessTimestamps].sort((a, b) => a - b);
  const periodicity = detectPeriodicity(sorted, now);

  // --- Trend classification ---
  let trend: AccessTrajectory["trend"];
  if (periodicity !== null) {
    trend = "periodic";
  } else if (rateOfChange > RISING_THRESHOLD) {
    trend = "rising";
  } else if (rateOfChange < DECLINING_THRESHOLD) {
    trend = "declining";
  } else {
    trend = "stable";
  }

  // --- Predicted relevance (T+7 forecast) ---
  // Base relevance from current activity level.
  // A rate of 1 access/day maps to ~0.7 base relevance via a saturating curve.
  const baseRelevance = 1 - Math.exp(-accessRate * 1.2);

  // Trend modifier: rising boosts, declining dampens.
  let trendModifier: number;
  switch (trend) {
    case "rising":
      trendModifier = 0.15;
      break;
    case "periodic":
      trendModifier = 0.1;
      break;
    case "stable":
      trendModifier = 0;
      break;
    case "declining":
      trendModifier = -0.15;
      break;
  }

  // Recency bonus: how recently was the last access?
  const mostRecent = sorted[sorted.length - 1]!;
  const daysSinceLastAccess = (now - mostRecent) / MS_PER_DAY;
  const recencyBonus =
    daysSinceLastAccess < 1 ? 0.1 : daysSinceLastAccess < 7 ? 0.05 : 0;

  const rawRelevance = baseRelevance + trendModifier + recencyBonus;
  const predictedRelevance = clamp(rawRelevance, 0, 1);

  return {
    accessRate,
    rateOfChange,
    trend,
    periodicity,
    predictedRelevance,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Count how many timestamps fall within `[now - windowMs, now]`.
 */
function countInWindow(
  timestamps: number[],
  now: number,
  windowMs: number,
): number {
  const cutoff = now - windowMs;
  let count = 0;
  for (const ts of timestamps) {
    if (ts >= cutoff && ts <= now) {
      count++;
    }
  }
  return count;
}

/**
 * Clamp a value to the range [min, max].
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
