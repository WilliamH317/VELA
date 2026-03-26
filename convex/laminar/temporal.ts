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

/** DFT window size in days. */
const DFT_WINDOW_DAYS = 90;

/** Minimum amplitude ratio to declare significant periodicity. */
const FFT_SIGNIFICANCE_THRESHOLD = 0.3;

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

  const now = _now || Date.now();

  // Step 1: Bin timestamps into daily buckets (90-day window)
  const startDay = Math.floor((now - DFT_WINDOW_DAYS * MS_PER_DAY) / MS_PER_DAY);
  const bins = new Array<number>(DFT_WINDOW_DAYS).fill(0);

  for (const ts of sortedTimestamps) {
    const dayIndex = Math.floor(ts / MS_PER_DAY) - startDay;
    if (dayIndex >= 0 && dayIndex < DFT_WINDOW_DAYS) {
      bins[dayIndex] = 1;
    }
  }

  // Step 2: Compute mean and subtract (DC removal)
  let mean = 0;
  for (const b of bins) mean += b;
  mean /= bins.length;
  const centered = bins.map((b) => b - mean);

  // Step 3: Naive DFT — O(n²) for n=90, ~8100 operations
  const n = centered.length;
  let maxAmplitude = 0;
  let dominantFreqIndex = 0;

  // Skip DC component (k=0), start at k=1
  for (let k = 1; k < Math.floor(n / 2); k++) {
    let re = 0;
    let im = 0;
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      re += centered[t]! * Math.cos(angle);
      im -= centered[t]! * Math.sin(angle);
    }
    const amplitude = Math.sqrt(re * re + im * im);

    if (amplitude > maxAmplitude) {
      maxAmplitude = amplitude;
      dominantFreqIndex = k;
    }
  }

  // Step 4: Convert frequency index to period in days
  if (dominantFreqIndex === 0 || maxAmplitude === 0) {
    return null;
  }

  const periodDays = n / dominantFreqIndex;

  // Step 5: Significance check — dominant must exceed threshold relative to mean amplitude
  let totalAmplitude = 0;
  let freqCount = 0;
  for (let k = 1; k < Math.floor(n / 2); k++) {
    let re = 0;
    let im = 0;
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      re += centered[t]! * Math.cos(angle);
      im -= centered[t]! * Math.sin(angle);
    }
    totalAmplitude += Math.sqrt(re * re + im * im);
    freqCount++;
  }
  const meanAmplitude = freqCount > 0 ? totalAmplitude / freqCount : 0;

  if (meanAmplitude > 0 && maxAmplitude < FFT_SIGNIFICANCE_THRESHOLD * (maxAmplitude + meanAmplitude)) {
    return null;
  }

  // Step 6: Filter — only return meaningful periods (1–30 days)
  if (periodDays < 1 || periodDays > 30) {
    return null;
  }

  // Round to nearest common period: 7 (weekly), 14 (biweekly), 30 (monthly)
  const commonPeriods = [7, 14, 30];
  for (const cp of commonPeriods) {
    if (Math.abs(periodDays - cp) < 1.5) {
      return cp;
    }
  }

  return Math.round(periodDays);
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

// ---------------------------------------------------------------------------
// Hurst Exponent via R/S (Rescaled Range) Analysis
// ---------------------------------------------------------------------------

/**
 * Compute the Hurst exponent for a document's access time series.
 *
 * R/S analysis measures long-range dependence in a time series:
 *   H > 0.5 = persistent trend (attractor state — knowledge center)
 *   H < 0.5 = anti-persistent (document relevance is cycling)
 *   H ≈ 0.5 = random walk (no persistent pattern)
 *
 * Uses log-log regression of R/S values across multiple window sizes.
 *
 * @param accessTimestamps - Access event timestamps (epoch ms), any order.
 * @param referenceDate    - Current time (epoch ms).
 * @returns Hurst exponent, classification, and confidence estimate.
 */
export function computeHurstExponent(
  accessTimestamps: number[],
  referenceDate: number,
): {
  H: number;
  classification: "attractor" | "cycling" | "random";
  confidence: number;
} {
  // Minimum data requirement
  if (accessTimestamps.length < 4) {
    return { H: 0.5, classification: "random", confidence: 0 };
  }

  // Step 1: Convert to daily binary time series (90-day window)
  const windowDays = 90;
  const startDay = Math.floor((referenceDate - windowDays * MS_PER_DAY) / MS_PER_DAY);
  const daySeries = new Array<number>(windowDays).fill(0);

  for (const ts of accessTimestamps) {
    const dayIndex = Math.floor(ts / MS_PER_DAY) - startDay;
    if (dayIndex >= 0 && dayIndex < windowDays) {
      daySeries[dayIndex] = 1;
    }
  }

  // Step 2: R/S analysis across window sizes
  // For sparse data (< 40 events), drop 32-day window to avoid instability
  const allWindows = [4, 8, 16, 32];
  const windowSizes = accessTimestamps.length < 40
    ? allWindows.filter((w) => w <= 16)
    : allWindows;

  if (windowSizes.length < 2) {
    return { H: 0.5, classification: "random", confidence: 0 };
  }

  const logW: number[] = [];
  const logRS: number[] = [];

  for (const w of windowSizes) {
    const numSegments = Math.floor(windowDays / w);
    if (numSegments < 1) continue;

    let totalRS = 0;
    let validSegments = 0;

    for (let seg = 0; seg < numSegments; seg++) {
      const segment = daySeries.slice(seg * w, (seg + 1) * w);

      // Mean of segment
      let segSum = 0;
      for (const v of segment) segSum += v;
      const segMean = segSum / w;

      // Deviations from mean and cumulative sum
      const cumDeviation = new Array<number>(w);
      let cumSum = 0;
      for (let t = 0; t < w; t++) {
        cumSum += segment[t]! - segMean;
        cumDeviation[t] = cumSum;
      }

      // Range R = max(cumulative) - min(cumulative)
      let maxCum = -Infinity;
      let minCum = Infinity;
      for (const cd of cumDeviation) {
        if (cd > maxCum) maxCum = cd;
        if (cd < minCum) minCum = cd;
      }
      const R = maxCum - minCum;

      // Standard deviation S
      let varSum = 0;
      for (const v of segment) {
        const diff = v - segMean;
        varSum += diff * diff;
      }
      const S = Math.sqrt(varSum / w);

      // R/S ratio (skip if S is zero — all values identical)
      if (S > 0) {
        totalRS += R / S;
        validSegments++;
      }
    }

    if (validSegments > 0) {
      const avgRS = totalRS / validSegments;
      logW.push(Math.log(w));
      logRS.push(Math.log(Math.max(avgRS, 1e-10)));
    }
  }

  // Step 3: Log-log regression: log(R/S) ~ H * log(W)
  if (logW.length < 2) {
    return { H: 0.5, classification: "random", confidence: 0 };
  }

  // Least-squares slope: H = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
  const n = logW.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += logW[i]!;
    sumY += logRS[i]!;
    sumXY += logW[i]! * logRS[i]!;
    sumXX += logW[i]! * logW[i]!;
  }

  const denominator = n * sumXX - sumX * sumX;
  const H = denominator !== 0
    ? (n * sumXY - sumX * sumY) / denominator
    : 0.5;

  // Clamp to valid range
  const clampedH = Math.min(Math.max(H, 0.01), 0.99);

  // Step 4: Confidence based on data density
  const confidence = Math.min(accessTimestamps.length / 20, 1.0);

  // Step 5: Classification
  const classification: "attractor" | "cycling" | "random" =
    clampedH > 0.60 ? "attractor" :
    clampedH < 0.40 ? "cycling" :
    "random";

  return { H: clampedH, classification, confidence };
}

// ---------------------------------------------------------------------------
// Predictive Access Probability Curve
// ---------------------------------------------------------------------------

/**
 * Compute the probability of a document being accessed at future horizons.
 *
 * Uses exponential decay on inter-access intervals:
 *   P(t) = 1 - exp(-lambda * t)
 *   where lambda = 1 / mean_inter_access_interval_in_days
 *
 * Returns probabilities for 1-day, 7-day, and 30-day horizons.
 * Documents with fewer than 3 accesses return zeros (insufficient data).
 *
 * @param accessTimestamps - Access event timestamps (epoch ms), any order.
 * @param referenceDate    - Current time (epoch ms).
 * @returns Probability object with day1, day7, day30 fields, all in [0, 1].
 */
export function computeAccessProbabilityCurve(
  accessTimestamps: number[],
  referenceDate: number,
): { day1: number; day7: number; day30: number } {
  if (accessTimestamps.length < 3) {
    return { day1: 0, day7: 0, day30: 0 };
  }

  // Sort ascending
  const sorted = [...accessTimestamps].sort((a, b) => a - b);

  // Compute inter-access intervals in days
  let totalIntervalDays = 0;
  let intervalCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    const intervalDays = (sorted[i]! - sorted[i - 1]!) / MS_PER_DAY;
    if (intervalDays > 0) {
      totalIntervalDays += intervalDays;
      intervalCount++;
    }
  }

  // Mean inter-access interval
  const meanInterval = intervalCount > 0 ? totalIntervalDays / intervalCount : 30;

  // Lambda = 1 / mean interval (rate parameter for exponential)
  const lambda = 1 / Math.max(meanInterval, 0.1); // floor at 0.1 to avoid Infinity

  // Also factor in recency: how many days since last access
  const daysSinceLast = (referenceDate - sorted[sorted.length - 1]!) / MS_PER_DAY;

  // Recency-adjusted lambda: if last access was long ago, reduce probability
  const recencyFactor = Math.exp(-daysSinceLast / 30); // decays over 30 days
  const adjustedLambda = lambda * recencyFactor;

  // P(accessed within t days) = 1 - exp(-lambda * t)
  const day1 = clamp(1 - Math.exp(-adjustedLambda * 1), 0, 1);
  const day7 = clamp(1 - Math.exp(-adjustedLambda * 7), 0, 1);
  const day30 = clamp(1 - Math.exp(-adjustedLambda * 30), 0, 1);

  return { day1, day7, day30 };
}
