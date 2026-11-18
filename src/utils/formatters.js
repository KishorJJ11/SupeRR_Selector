/**
 * Unified statistical number formatting helpers
 * Adheres strictly to the statistical-integrity rules:
 * - Ratings: 2 dp with explicit sign (+34.00, -12.36)
 * - Intervals: 1 dp ([25.3, 42.7])
 * - Percentages: 1 dp (75.3%)
 * - Expected Hits: "x.x / 10" (7.5 / 10)
 * - Expected Rank: 1 dp (1.4)
 * - No trailing-zero dropping
 * - No fallback defaults to 0; if null/undefined returns 'n/a'
 */

export const formatRating = (val) => {
  if (val === null || val === undefined) return 'n/a';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return 'n/a';
  const formatted = num.toFixed(2);
  return num >= 0 ? `+${formatted}` : formatted;
};

export const formatDelta = (val) => {
  if (val === null || val === undefined) return 'n/a';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return 'n/a';
  const formatted = num.toFixed(2);
  return num >= 0 ? `+${formatted}` : formatted;
};

export const formatInterval = (interval, explicitSign = false) => {
  if (!interval || !Array.isArray(interval) || interval.length < 2) return null;
  const lo = Number(interval[0]);
  const hi = Number(interval[1]);
  if (isNaN(lo) || isNaN(hi)) return null;
  const fmtLo = explicitSign && lo >= 0 ? `+${lo.toFixed(1)}` : lo.toFixed(1);
  const fmtHi = explicitSign && hi >= 0 ? `+${hi.toFixed(1)}` : hi.toFixed(1);
  return `[${fmtLo}, ${fmtHi}]`;
};

export const formatPercent = (val) => {
  if (val === null || val === undefined) return 'n/a';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return 'n/a';
  return `${num.toFixed(1)}%`;
};

export const formatExpectedRank = (val) => {
  if (val === null || val === undefined) return 'n/a';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return 'n/a';
  return num.toFixed(1);
};

export const formatExpectedHits = (val) => {
  if (val === null || val === undefined) return 'n/a';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return 'n/a';
  return `${num.toFixed(1)} / 10`;
};

export const formatWorkload = (balls, innings) => {
  if ((balls === null || balls === undefined) && (innings === null || innings === undefined)) {
    return 'n/a';
  }
  const b = balls !== null && balls !== undefined ? `${balls} balls` : 'n/a';
  const i = innings !== null && innings !== undefined ? `${innings} innings` : 'n/a';
  return `${b} in ${i}`;
};

export const isDeltaSignificant = (interval) => {
  if (!interval || !Array.isArray(interval) || interval.length < 2) return false;
  const lo = Number(interval[0]);
  const hi = Number(interval[1]);
  if (isNaN(lo) || isNaN(hi)) return false;
  return (lo > 0 && hi > 0) || (lo < 0 && hi < 0);
};

// Returns true if interval contains 0 (i.e. Lo <= 0 and Hi >= 0)
export const isDeltaNotSignificant = (interval) => {
  if (!interval || !Array.isArray(interval) || interval.length < 2) return false;
  const lo = Number(interval[0]);
  const hi = Number(interval[1]);
  if (isNaN(lo) || isNaN(hi)) return false;
  return lo <= 0 && hi >= 0;
};

// Fix for Axis negative zero bug using Math.round(v) || 0
export const cleanAxisTick = (v) => {
  const rounded = Math.round(v) || 0;
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
};

/**
 * Counts how many pairs among the top-10 player rating intervals overlap.
 * In a cohort of 10 players, there are exactly 10*9/2 = 45 possible pairs.
 */
export const countOverlappingIntervalPairs = (players) => {
  const top10 = (players || []).slice(0, 10);
  let count = 0;
  for (let i = 0; i < top10.length; i++) {
    for (let j = i + 1; j < top10.length; j++) {
      const a = top10[i]?.ratingInterval;
      const b = top10[j]?.ratingInterval;
      if (Array.isArray(a) && a.length === 2 && Array.isArray(b) && b.length === 2) {
        const aLo = Number(a[0]);
        const aHi = Number(a[1]);
        const bLo = Number(b[0]);
        const bHi = Number(b[1]);
        if (!isNaN(aLo) && !isNaN(aHi) && !isNaN(bLo) && !isNaN(bHi)) {
          if (Math.max(aLo, bLo) <= Math.min(aHi, bHi)) {
            count++;
          }
        }
      }
    }
  }
  return count;
};

/**
 * Dev-time assertion helper to ensure pTop10Post is non-increasing.
 */
export const assertNonIncreasingPTop10 = (list, tabName = 'List') => {
  if (!Array.isArray(list)) return;
  for (let i = 1; i < list.length; i++) {
    const prev = list[i - 1]?.pTop10Post;
    const curr = list[i]?.pTop10Post;
    if (prev !== undefined && curr !== undefined && curr > prev + 1e-6) {
      console.error(
        `[Statistical Integrity Violation] ${tabName}: pTop10Post is not non-increasing! ` +
        `Row ${i - 1} (${list[i - 1]?.name}) = ${prev} vs Row ${i} (${list[i]?.name}) = ${curr}`
      );
    }
  }
};
