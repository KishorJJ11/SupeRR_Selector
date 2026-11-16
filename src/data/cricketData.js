/**
 * SupeRR Selector: The Clutch Dossier
 * T20 Pressure Analytics & Machine Learning Dataset for Rajasthan Royals (RR)
 * Official Rankings: V14 Posterior Ranking & Confidence Tiers
 * DYNAMIC DATA BINDING: Directly imported from src/data/consensus_frontend.json
 * Primary Metric: Confidence Tiers & Expected Rank (Mean score deprecated due to scale variance)
 */

import consensusData from './consensus_frontend.json';

export const meta = {
  ...consensusData.meta,
  model_fits: consensusData.meta?.model_fits ?? consensusData.meta?.model_fits_in_ensemble ?? 1,
  valid_runs_bat: consensusData.meta?.valid_runs_bat ?? 1,
  valid_runs_bow: consensusData.meta?.valid_runs_bow ?? 1,
  status: consensusData.meta?.status ?? { bat: 'MODERATE', bow: 'MODERATE' },
  expected_hits: consensusData.meta?.expected_hits ?? { bat: 5.1, bow: 5.2 }
};
export const clusters = [];

// Helper to standardize status strings to uppercase without hardcoding (MODERATE, LOW_CONFIDENCE, UNSTABLE)
export const formatStatus = (status, role = null) => {
  if (!status) return 'MODERATE';
  if (typeof status === 'string') return status.toUpperCase();
  if (typeof status === 'object') {
    if (role === 'bow' || role === 'bowler') {
      const val = status.bow || 'LOW_CONFIDENCE';
      return String(val).toUpperCase();
    }
    if (role === 'bat' || role === 'batter') {
      const val = status.bat || 'MODERATE';
      return String(val).toUpperCase();
    }
    const bat = status.bat ? String(status.bat).toUpperCase() : 'MODERATE';
    const bow = status.bow ? String(status.bow).toUpperCase() : 'LOW_CONFIDENCE';
    return `${bat} (Bat) · ${bow} (Bow)`;
  }
  return String(status).toUpperCase();
};

export const getStatusBadgeClass = (statusStr) => {
  const s = String(statusStr || '').toUpperCase();
  if (s.includes('MODERATE') || s.includes('OK')) {
    return 'bg-[#1B3FA0] text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs inline-block';
  }
  if (s.includes('LOW_CONFIDENCE')) {
    return 'bg-[#EA1A85] text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs inline-block';
  }
  if (s.includes('UNSTABLE')) {
    return 'bg-rose-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs inline-block';
  }
  return 'bg-[#1B3FA0] text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs inline-block';
};

// Returns true if the CI interval does not include zero (i.e. both bounds > 0 or both < 0)
export const isDeltaSignificant = (interval) => {
  if (!interval || !Array.isArray(interval) || interval.length < 2) return false;
  const [lo, hi] = interval;
  return (lo > 0 && hi > 0) || (lo < 0 && hi < 0);
};

const batterPhotos = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80"
];

const bowlerPhotos = [
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80"
];

// Helper to color code tiers with Rajasthan Royals Royal Pink theme (clean & flat)
export const getTierBadgeClass = (tier) => {
  if (!tier) return 'bg-[#EA1A85]/10 text-[#EA1A85] border-[#EA1A85]/30';
  if (tier.includes('Tier A')) return 'bg-[#EA1A85] text-white border-[#EA1A85] font-bold shadow-sm';
  if (tier.includes('Tier B')) return 'bg-[#EA1A85]/85 text-white border-[#EA1A85] font-semibold shadow-sm';
  if (tier.includes('Tier C')) return 'bg-[#EA1A85]/15 text-[#EA1A85] border-[#EA1A85]/40 font-semibold';
  if (tier.includes('Low Confidence')) return 'bg-slate-100 text-[#001D48] border-slate-300 border-dashed font-medium';
  return 'bg-[#EA1A85]/10 text-[#EA1A85] border-[#EA1A85]/30';
};

// UI acts as a DUMB component: strictly sorted by rank directly from src/data/consensus_frontend.json
export const batters = (consensusData.batters || [])
  .slice()
  .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  .map((b, idx) => ({
  ...b,
  rank: b.rank || (idx + 1),
  name: b.name,
  role: b.role,
  tier: b.tier || 'Tier A',
  expectedRank: b.expectedRank !== undefined ? (typeof b.expectedRank === 'number' ? Number(b.expectedRank.toFixed(1)) : b.expectedRank) : (b.medianRank ?? (idx + 1)),
  medianRank: b.expectedRank !== undefined ? (typeof b.expectedRank === 'number' ? Number(b.expectedRank.toFixed(1)) : b.expectedRank) : (b.medianRank ?? (idx + 1)),
  scoreRange: b.scoreRange,
  top10SharePct: b.top10SharePct !== undefined ? b.top10SharePct : 100,
  top10Share: b.singleFitShare ?? b.top10Share ?? 100,
  singleFitShare: b.singleFitShare ?? b.top10Share ?? 100,
  pTop10Boot: b.pTop10Post ?? b.pTop10Boot ?? 0,
  pTop10Post: b.pTop10Post ?? b.pTop10Boot ?? 0,
  runsInTop10: b.runsInTop10,
  runsEligible: b.modelFitsEligible ?? b.runsEligible ?? meta.model_fits,
  modelFitsEligible: b.modelFitsEligible ?? b.runsEligible ?? meta.model_fits,
  validRuns: meta.model_fits || 1,
  pressureBalls: b.pressureBalls ?? 0,
  pressureInnings: b.pressureInnings ?? 25,
  pressureRating: b.pressureRating ?? 0,
  ratingInterval: b.ratingInterval || [0, 0],
  bootRankInterval: b.bootRankInterval || [0, 0],
  delta: b.delta ?? 0,
  deltaInterval: b.deltaInterval || [0, 0],
  confidenceMetricFormatted: `Expected Rank: ${b.expectedRank} | P(Top 10): ${b.pTop10Post ?? b.pTop10Boot ?? 0}%`,
  modelFitsFormatted: `Fit agreement: ${b.top10SharePct !== undefined ? b.top10SharePct : 100}% of 25 fits`,
  ratingCiFormatted: `Rating CI: [${b.ratingInterval?.[0]}, ${b.ratingInterval?.[1]}]`,
  rankCiFormatted: `Bootstrap Rank CI: [${b.bootRankInterval?.[0]}, ${b.bootRankInterval?.[1]}]`,
  deltaFormatted: `Delta: ${(b.delta ?? 0) >= 0 ? `+${b.delta}` : b.delta}`,
  deltaCiFormatted: `Delta CI: [${b.deltaInterval?.[0] ?? 0}, ${b.deltaInterval?.[1] ?? 0}]`,
  top10ShareFormatted: `${Math.round(b.singleFitShare ?? b.top10Share ?? 100)}%`,
  stabilityFormatted: `Fit agreement: ${b.top10SharePct !== undefined ? b.top10SharePct : 100}% of 25 fits`,
  workloadFormatted: `${b.pressureBalls ?? 0} balls in ${b.pressureInnings ?? 25} innings`,
  eligibilityFormatted: `Fit agreement: ${b.top10SharePct !== undefined ? b.top10SharePct : 100}% of 25 fits`,
  pressureUplift: `${b.pressureBalls ?? 0} balls in ${b.pressureInnings ?? 25} innings`,
  avatar: batterPhotos[idx % batterPhotos.length],
  initials: b.name.split(' ').map(p => p[0]).join('').slice(0, 2)
}));

export const bowlers = (consensusData.bowlers || [])
  .slice()
  .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  .map((b, idx) => ({
  ...b,
  rank: b.rank || (idx + 1),
  name: b.name,
  role: b.role,
  tier: b.tier || 'Tier A',
  expectedRank: b.expectedRank !== undefined ? (typeof b.expectedRank === 'number' ? Number(b.expectedRank.toFixed(1)) : b.expectedRank) : (b.medianRank ?? (idx + 1)),
  medianRank: b.expectedRank !== undefined ? (typeof b.expectedRank === 'number' ? Number(b.expectedRank.toFixed(1)) : b.expectedRank) : (b.medianRank ?? (idx + 1)),
  scoreRange: b.scoreRange,
  top10SharePct: b.top10SharePct !== undefined ? b.top10SharePct : 100,
  top10Share: b.singleFitShare ?? b.top10Share ?? 100,
  singleFitShare: b.singleFitShare ?? b.top10Share ?? 100,
  pTop10Boot: b.pTop10Post ?? b.pTop10Boot ?? 0,
  pTop10Post: b.pTop10Post ?? b.pTop10Boot ?? 0,
  runsInTop10: b.runsInTop10,
  runsEligible: b.modelFitsEligible ?? b.runsEligible ?? meta.model_fits,
  modelFitsEligible: b.modelFitsEligible ?? b.runsEligible ?? meta.model_fits,
  validRuns: meta.model_fits || 1,
  pressureBalls: b.pressureBalls ?? 0,
  pressureInnings: b.pressureInnings ?? 25,
  pressureRating: b.pressureRating ?? 0,
  ratingInterval: b.ratingInterval || [0, 0],
  bootRankInterval: b.bootRankInterval || [0, 0],
  delta: b.delta ?? 0,
  deltaInterval: b.deltaInterval || [0, 0],
  confidenceMetricFormatted: `Expected Rank: ${b.expectedRank} | P(Top 10): ${b.pTop10Post ?? b.pTop10Boot ?? 0}%`,
  modelFitsFormatted: `Fit agreement: ${b.top10SharePct !== undefined ? b.top10SharePct : 100}% of 25 fits`,
  ratingCiFormatted: `Rating CI: [${b.ratingInterval?.[0]}, ${b.ratingInterval?.[1]}]`,
  rankCiFormatted: `Bootstrap Rank CI: [${b.bootRankInterval?.[0]}, ${b.bootRankInterval?.[1]}]`,
  deltaFormatted: `Delta: ${(b.delta ?? 0) >= 0 ? `+${b.delta}` : b.delta}`,
  deltaCiFormatted: `Delta CI: [${b.deltaInterval?.[0] ?? 0}, ${b.deltaInterval?.[1] ?? 0}]`,
  top10ShareFormatted: `${Math.round(b.singleFitShare ?? b.top10Share ?? 100)}%`,
  stabilityFormatted: `Fit agreement: ${b.top10SharePct !== undefined ? b.top10SharePct : 100}% of 25 fits`,
  workloadFormatted: `${b.pressureBalls ?? 0} balls in ${b.pressureInnings ?? 25} innings`,
  eligibilityFormatted: `Fit agreement: ${b.top10SharePct !== undefined ? b.top10SharePct : 100}% of 25 fits`,
  pressureUplift: `${b.pressureBalls ?? 0} balls in ${b.pressureInnings ?? 25} innings`,
  avatar: bowlerPhotos[idx % bowlerPhotos.length],
  initials: b.name.split(' ').map(p => p[0]).join('').slice(0, 2)
}));

export const bowlerPhases = [
  {
    rank: 1,
    role: 'Death Overs',
    icon: 'flame',
    totalRunsSaved: 'Tier A',
    pressureUplift: '720 pressure balls',
    upliftPercent: 70.8,
    description: 'High-leverage overs 17-20 where target defense or boundary containment determines match outcome.'
  },
  {
    rank: 2,
    role: 'Middle Overs',
    icon: 'link',
    totalRunsSaved: 'Tier A',
    pressureUplift: '612 pressure balls',
    upliftPercent: 52.4,
    description: 'Middle-overs strike impact breaking partnerships under steep RRR or momentum shifts.'
  },
  {
    rank: 3,
    role: 'Powerplay',
    icon: 'crosshair',
    totalRunsSaved: 'Tier A',
    pressureUplift: '532 pressure balls',
    upliftPercent: 45.1,
    description: 'Early overs 1-6 restriction capitalizing on swing and fielding restrictions.'
  }
];

export const methodologyInfo = {
  title: 'SupeRR V14 Posterior Ranking & Confidence Tiers',
  version: 'V14 Posterior Ranking & Confidence Tiers',
  totalBalls: 196343,
  totalMatches: 833,
  description: 'Posterior ranking and confidence tier stratification across 196,343 deliveries analyzed.',
  factors: [
    {
      name: 'Confidence Tiers',
      formula: 'Tier A (>=90%) | Tier B (75-89%) | Tier C (60-74%) | Low Confidence (<60%)',
      meaning: 'Categorizes players by their stability frequency in the top 10 across model runs.'
    },
    {
      name: 'Posterior Ranking',
      formula: 'Expected_Rank = E_{posterior}[Rank | Data]',
      meaning: 'Ranks players by posterior expected rank rather than raw mean score, eliminating scale variance distortions across parameter grids.'
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
      meaning: 'Shrinks raw per-ball rates toward the global tournament mean according to sample size and variance (SE), preventing low-volume outliers from distorting rankings.'
    }
  ]
};

export const sampleScoutQA = [
  {
    q: 'How does Posterior Ranking and Confidence Tiers work?',
    a: 'Rather than averaging mean scores across runs (which suffers from scale variance), the model ranks players ordinally, calculating their Expected Rank and assigning Confidence Tiers: Tier A (>=90%), Tier B (75-89%), Tier C (60-74%), and Low Confidence (<60%).'
  },
  {
    q: 'What is Expected Rank and P(Top 10)?',
    a: 'Expected Rank represents the posterior expected ranking of the player across consensus specifications, while P(Top 10) measures the bootstrap probability of ranking within the top 10 under acute match pressure.'
  },
  {
    q: 'What is top10Share and runsEligible?',
    a: 'top10Share indicates the percentage of pipeline specifications where the player achieved a top-10 ranking, while runsEligible tracks how many specifications the player met volume qualification thresholds.'
  }
];
