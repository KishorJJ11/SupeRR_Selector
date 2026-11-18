/**
 * Rajasthan Royals Pressure Analytics & Machine Learning Dataset
 * DYNAMIC DATA BINDING: Directly imported from src/data/consensus_frontend.json
 * Statistical Integrity Rule:
 * - Render players strictly in JSON array order. Never client-side sort.
 * - Show rank from JSON.
 * - No fallback defaults (no 0, [0, 0] or 25).
 * - Ordering rule everywhere = "Posterior P(Top 10), tie-break Expected Rank".
 */

import consensusData from './consensus_frontend.json';
import {
  formatRating,
  formatDelta,
  formatInterval,
  formatPercent,
  formatExpectedRank,
  formatExpectedHits,
  formatWorkload,
  isDeltaSignificant,
  isDeltaNotSignificant,
  cleanAxisTick,
  countOverlappingIntervalPairs,
  assertNonIncreasingPTop10
} from '../utils/formatters';

export {
  formatRating,
  formatDelta,
  formatInterval,
  formatPercent,
  formatExpectedRank,
  formatExpectedHits,
  formatWorkload,
  isDeltaSignificant,
  isDeltaNotSignificant,
  cleanAxisTick,
  countOverlappingIntervalPairs
};

export const meta = consensusData.meta || {};
export const squadFit = consensusData.meta?.squad_fit || consensusData.squad_fit || null;

// Dev-time assertion: verify pTop10Post is non-increasing
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
  assertNonIncreasingPTop10(consensusData.batters, 'Batters');
  assertNonIncreasingPTop10(consensusData.bowlers, 'Bowlers');
}

export const getStatusBadgeClass = (statusStr) => {
  const s = String(statusStr || '').toUpperCase();
  if (s.includes('MODERATE')) {
    return 'bg-[#1B3FA0] text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs inline-block';
  }
  if (s.includes('LOW')) {
    return 'bg-amber-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs inline-block';
  }
  if (s.includes('UNSTABLE')) {
    return 'bg-rose-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs inline-block';
  }
  return 'bg-amber-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs inline-block';
};

export const mapPlayerData = (p, idx) => ({
  rank: p.rank !== undefined && p.rank !== null ? p.rank : (idx + 1),
  id: p.id ? String(p.id) : null,
  name: p.name,
  image: p.image || null,
  phase: p.phase ? String(p.phase).toLowerCase() : (p.role ? String(p.role).toLowerCase() : null),
  role: p.role ?? null,
  tier: p.tier ?? null,
  deltaIdentified: p.deltaIdentified !== undefined ? Boolean(p.deltaIdentified) : null,
  expectedRank: p.expectedRank !== undefined && p.expectedRank !== null ? Number(p.expectedRank) : null,
  pressureBalls: p.pressureBalls !== undefined && p.pressureBalls !== null ? Number(p.pressureBalls) : null,
  pressureInnings: p.pressureInnings !== undefined && p.pressureInnings !== null ? Number(p.pressureInnings) : null,
  pressureRating: p.pressureRating !== undefined && p.pressureRating !== null ? Number(p.pressureRating) : null,
  ratingInterval: Array.isArray(p.ratingInterval) && p.ratingInterval.length === 2 ? p.ratingInterval : null,
  bootRankInterval: Array.isArray(p.bootRankInterval) && p.bootRankInterval.length === 2 && p.bootRankInterval.every(v => v >= 1) ? p.bootRankInterval : null,
  baselineRating: p.baselineRating !== undefined && p.baselineRating !== null ? Number(p.baselineRating) : null,
  delta: p.delta !== undefined && p.delta !== null ? Number(p.delta) : null,
  deltaInterval: Array.isArray(p.deltaInterval) && p.deltaInterval.length === 2 ? p.deltaInterval : null,
  pTop10Post: p.pTop10Post !== undefined && p.pTop10Post !== null ? Number(p.pTop10Post) : null,
  fitStabilityPct: p.fitStabilityPct !== undefined && p.fitStabilityPct !== null ? Number(p.fitStabilityPct) : null,
  initials: p.name ? p.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() : ''
});

// UI acts as a strictly bound component: relies 100% on the exact sequential order provided in consensus_frontend.json
export const batters = (consensusData.batters || []).map(mapPlayerData);
export const bowlers = (consensusData.bowlers || []).map(mapPlayerData);

export const methodologyInfo = {
  title: 'Pressure-Adjusted Value Dossier',
  estimator: meta.estimator || 'n/a',
  totalBalls: meta.deliveries_used ?? 'n/a',
  totalMatches: meta.matches_used ?? 'n/a',
  description: 'Analysis of deliveries in acute match pressure situations.',
  orderingRule: meta.ranking_rule || 'Top 10 selected by P(Top 10), ordered by Expected Rank',
  factors: [
    {
      name: 'Ranking Rule',
      formula: meta.ranking_rule || 'Top 10 selected by P(Top 10), ordered by Expected Rank',
      meaning: meta.ranking_rule || 'Top 10 selected by P(Top 10), ordered by Expected Rank'
    },
    {
      name: 'Posterior P(Top 10)',
      formula: 'P(Top 10) = Mean(Rank_{posterior} <= 10)',
      meaning: 'Posterior probability of being among the true top 10 under acute match pressure.'
    },
    {
      name: 'Win-Probability Leverage Index (LI)',
      formula: 'LI = E_{outcome}[ |WP_{next} - WP_{current}| ] / E_{mean}[LI]',
      meaning: 'Measures the swing in match win probability on each legal delivery. Pressure states are strictly identified by high leverage (top 20% acute leverage situations).'
    },
    {
      name: 'Run-Expectancy Value (RE24 Matrix)',
      formula: 'BV = Runs + ΔRE(balls_rem, wkts_lost, inn)',
      meaning: 'Calculates the change in expected terminal team runs produced by every ball, crediting both run containment and dismissals on an equal run scale.'
    },
    {
      name: 'Empirical Bayes Rate Shrinkage',
      formula: 'Rate_Shrunk = Global_Mean + w_i × (Rate_i - Global_Mean)',
      meaning: 'Shrinks raw per-ball rates toward the player ordinary baseline talent, preventing sample variance from distorting rankings.'
    }
  ]
};
