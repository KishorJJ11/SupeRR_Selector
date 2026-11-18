import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart2, Info } from 'lucide-react';
import PlayerVisual from './PlayerVisual.jsx';
import UncertaintyRangeBar from './UncertaintyRangeBar.jsx';
import {
  formatRating,
  formatDelta,
  formatInterval,
  formatPercent,
  formatExpectedRank,
  formatWorkload,
  isDeltaNotSignificant,
  countOverlappingIntervalPairs
} from '../utils/formatters';

export const formatPhaseLabel = (phase) => {
  switch (String(phase || '').toLowerCase()) {
    case 'powerplay': return 'Powerplay';
    case 'middle': return 'Middle';
    case 'death': return 'Death';
    default: return phase || 'Middle';
  }
};

export const getPhaseBadgeColor = (phase) => {
  switch (String(phase || '').toLowerCase()) {
    case 'powerplay':
      return 'bg-[#E6ECFA] text-[#1B3FA0] border-[#1B3FA0]/30';
    case 'middle':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'death':
      return 'bg-[#FDE4F1] text-[#EA1A85] border-[#EA1A85]/40';
    default:
      return 'bg-slate-100 text-[#050D2B] border-slate-300';
  }
};

export const getTierBadgeClass = (tier) => {
  switch (tier) {
    case 'Core':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'Likely':
      return 'bg-blue-50 text-[#1B3FA0] border-blue-300';
    case 'Bubble':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
};

const FIXED_PHASES = ['powerplay', 'middle', 'death'];

export default function BattersView({ batters = [], onSelectPlayer }) {
  const [selectedRole, setSelectedRole] = useState('all');

  // Strictly maintain JSON array order - never client-side sort
  const allBatters = batters;

  // Dynamic axis calculation from visible tab plus 5% padding (Fix D)
  const domain = useMemo(() => {
    const los = allBatters.map(b => b.ratingInterval?.[0]).filter(v => typeof v === 'number');
    const his = allBatters.map(b => b.ratingInterval?.[1]).filter(v => typeof v === 'number');
    const pts = allBatters.map(b => b.pressureRating).filter(v => typeof v === 'number');
    const minVal = Math.min(0, ...(los.length ? los : [0]), ...(pts.length ? pts : [0]));
    const maxVal = Math.max(0, ...(his.length ? his : [50]), ...(pts.length ? pts : [50]));
    const span = maxVal - minVal > 0 ? maxVal - minVal : 1;
    return {
      min: Math.floor(minVal - span * 0.05),
      max: Math.ceil(maxVal + span * 0.05)
    };
  }, [allBatters]);

  // Phase filtering on row.phase in {powerplay, middle, death}
  const filteredBatters = selectedRole === 'all'
    ? allBatters
    : allBatters.filter(p => (p.phase || '').toLowerCase() === selectedRole);

  // Top 3 Podium Batters strictly in JSON order
  const topThree = filteredBatters.slice(0, 3);
  const tableBatters = filteredBatters.slice(3);

  // Computed top-10 interval overlap footnote (X of 45 pairs)
  const overlapCount = countOverlappingIntervalPairs(filteredBatters);
  const footnoteText = `${overlapCount} of 45 pairs of top-10 intervals overlap`;

  return (
    <div className="relative w-full">
      {/* Section Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-[#EA1A85] skew-diagonal inline-block rounded-xs" />
            <span className="text-xs font-ui uppercase tracking-widest text-[#1B3FA0] font-bold">
              Posterior Evaluation Matrix
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#050D2B] font-display">
            Batting Leverage Dossier <span className="text-[#EA1A85]">(Top 10 Under Pressure)</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 font-primary">
            High-leverage batting ratings and posterior uncertainty bounds
          </p>
        </div>

        {/* Phase Role Filter Bar with Fixed Order */}
        <div className="w-full sm:w-auto max-w-full overflow-x-auto no-scrollbar">
          <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-white border border-slate-200 shadow-xs">
            {['all', ...FIXED_PHASES].map((role) => {
              const count = role === 'all'
                ? allBatters.length
                : allBatters.filter(b => (b.phase || '').toLowerCase() === role).length;
              const isActive = selectedRole === role;
              const label = role === 'all' ? 'All Phases' : formatPhaseLabel(role);

              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-ui uppercase tracking-wider font-bold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] cursor-pointer ${
                    isActive
                      ? 'bg-[#EA1A85] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#050D2B] hover:bg-slate-100'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`ml-1.5 text-xs px-1.5 py-0.2 rounded-full font-ui ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          TOP 3 PODIUM SECTION (Royal Blue Band #1B3FA0)
         ========================================================================= */}
      <div className="bg-[#1B3FA0] rounded-3xl p-5 sm:p-6 mb-8 shadow-lg border border-[#1B3FA0]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/20 text-white">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold uppercase tracking-wider text-sm text-white">
              The Podium: Top 3 Batters
            </span>
          </div>
          <span className="text-xs font-ui text-white/80">
            Leading Batting Cohort
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {topThree.map((player) => {
            const formattedRank = player.rank < 10 ? `0${player.rank}` : player.rank;

            return (
              <motion.div
                key={player.name}
                onClick={() => onSelectPlayer(player)}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group cursor-pointer rounded-2xl bg-white text-[#050D2B] overflow-hidden border border-slate-200 hover:border-[#EA1A85]/50 transition-all duration-200 shadow-rr-card hover:shadow-rr-hover flex flex-col justify-between relative h-full"
              >
                {/* Card Header Block */}
                <div className="relative bg-[#050D2B] text-white p-3.5 border-b-2 border-b-[#EA1A85] z-10 h-[88px] flex flex-col justify-between shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-xl text-[#EA1A85] tracking-wider leading-none">
                      #{formattedRank}
                    </span>
                    {/* Consistent RANK chip across all podium cards (Fix G) */}
                    <span className="px-2 py-0.5 rounded-sm text-xs font-display uppercase tracking-wider font-extrabold bg-[#EA1A85] text-white shadow-xs">
                      RANK {player.rank}
                    </span>
                  </div>

                  <div className="mt-1">
                    <h3 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-tight group-hover:text-[#EA1A85] transition-colors truncate player-name leading-tight">
                      {player.name}
                    </h3>
                  </div>
                </div>

                {/* Player Visual (Cutout Badge, Fix P) */}
                <div className="relative w-full h-[230px] sm:h-[250px] bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  <div className="absolute top-2.5 left-3 z-20 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-ui font-bold border shadow-xs ${getPhaseBadgeColor(player.phase)}`}>
                      {formatPhaseLabel(player.phase)}
                    </span>
                    {player.tier && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-ui font-extrabold border shadow-xs ${getTierBadgeClass(player.tier)}`}>
                        {player.tier}
                      </span>
                    )}
                  </div>
                  <PlayerVisual player={player} variant="top3" />
                </div>

                {/* Metrics Section */}
                <div className="p-4 bg-white border-t border-slate-100 flex-1 flex flex-col justify-between z-10">
                  <div className="grid grid-cols-2 gap-2.5 items-start">
                    {/* Left: Pressure Rating + Uncertainty Range Bar */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between h-full">
                      <div>
                        <span className="text-xs text-slate-500 block font-ui uppercase font-bold tracking-wider">
                          Pressure Rating
                        </span>
                        <span className="text-2xl font-black text-[#EA1A85] font-display tabular-nums leading-tight block my-0.5">
                          {formatRating(player.pressureRating)}
                        </span>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/70">
                        <UncertaintyRangeBar
                          ratingInterval={player.ratingInterval}
                          pressureRating={player.pressureRating}
                          bootRankInterval={player.bootRankInterval}
                          domain={domain}
                          compact={true}
                        />
                      </div>
                    </div>

                    {/* Right: Expected Rank, P(Top 10), and Workload */}
                    <div className="space-y-2">
                      <div className="p-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-ui uppercase font-bold tracking-wider">
                          Expected Rank
                        </span>
                        <span className="text-base font-bold text-[#050D2B] font-primary tabular-nums">
                          {formatExpectedRank(player.expectedRank)}
                        </span>
                      </div>

                      <div className="p-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-ui uppercase font-bold tracking-wider">
                            P(Top 10)
                          </span>
                          <span className="text-sm font-bold text-[#EA1A85] font-primary">
                            {formatPercent(player.pTop10Post)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-[#EA1A85] h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, player.pTop10Post ?? 0))}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500 block font-ui uppercase font-bold tracking-wider">
                          Workload
                        </span>
                        <div className="text-xs font-primary font-semibold text-[#050D2B] leading-tight mt-0.5">
                          {formatWorkload(player.pressureBalls, player.pressureInnings)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Single Rating CI and Bag-fit agreement (Fix G & Fix F) */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <span
                      className="font-ui text-slate-600 font-semibold inline-flex items-center gap-1 cursor-help"
                      title="Share of the bagged model fits that place the player in the top 10 (model variance only, not sampling uncertainty)"
                    >
                      <span>Bag-fit agreement:</span>
                      <strong className="text-[#050D2B]">
                        {player.fitStabilityPct !== null ? `${Number(player.fitStabilityPct).toFixed(0)}%` : 'n/a'}
                      </strong>
                      <Info className="w-3 h-3 text-slate-400" />
                    </span>
                    <span className="font-primary text-slate-600 whitespace-nowrap">
                      Rating CI: {formatInterval(player.ratingInterval) || 'n/a'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display uppercase tracking-wider font-bold bg-[#1B3FA0] text-white shadow-xs">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Posterior Matrix Leaderboard</span>
          </div>
        </div>

        <div className="text-xs font-ui text-slate-500">
          <span>10-Player Batting Cohort</span>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP TABLE VIEW (>= 768px)
         ========================================================================= */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-rr-card mb-3">
        <table className="w-full text-left border-collapse table-fixed min-w-[1100px] lg:min-w-full">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr className="bg-[#1B3FA0] text-white text-xs font-ui uppercase tracking-wider select-none border-b-2 border-b-[#EA1A85]">
              <th className="py-3.5 px-3">Rank</th>
              <th className="py-3.5 px-4">Batter</th>
              <th className="py-3.5 px-3">Pressure Rating</th>
              <th className="py-3.5 px-4">Rating Uncertainty</th>
              <th className="py-3.5 px-3 text-center">Expected Rank</th>
              {/* Sorted indicator on P(Top 10) (Fix E) */}
              <th className="py-3.5 px-3 bg-[#163484]" title="Ordered strictly by Posterior P(Top 10)">
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-white font-bold">P(Top 10)</span>
                  <span className="text-[10px] text-[#FDE4F1] font-medium tracking-normal lowercase">
                    sorted by P(Top 10) ▼
                  </span>
                </div>
              </th>
              <th className="py-3.5 px-3">Ordinary Rating</th>
              <th className="py-3.5 px-3">Delta vs Usual</th>
              <th className="py-3.5 pl-6 pr-4 border-l border-white/20">
                Primary phase &amp; Workload
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {tableBatters.length > 0 ? (
              tableBatters.map((player) => {
                const formattedRank = player.rank < 10 ? `0${player.rank}` : player.rank;

                return (
                  <tr
                    key={player.name}
                    onClick={() => onSelectPlayer(player)}
                    className="hover:bg-[#FDE4F1]/30 cursor-pointer transition-all duration-150 group border-l-4 border-l-transparent hover:border-l-[#EA1A85]"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 font-display font-extrabold text-base text-[#EA1A85] group-hover:text-[#050D2B] transition-colors tabular-nums">
                      {formattedRank}
                    </td>

                    {/* Batter Info + Bag-fit tooltip (Fix F) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <PlayerVisual player={player} variant="table" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-primary font-bold text-[#050D2B] group-hover:text-[#EA1A85] transition-colors truncate text-base player-name">
                              {player.name}
                            </span>
                            {player.tier && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-ui font-extrabold border shadow-xs ${getTierBadgeClass(player.tier)}`}>
                                {player.tier}
                              </span>
                            )}
                          </div>
                          {player.fitStabilityPct !== null && (
                            <div
                              className="text-[11px] font-ui text-slate-500 inline-flex items-center gap-1 cursor-help mt-0.5"
                              title="Bag-fit agreement: Share of the bagged model fits that place the player in the top 10 (model variance only, not sampling uncertainty)"
                            >
                              <span>Bag-fit: {Number(player.fitStabilityPct).toFixed(0)}%</span>
                              <Info className="w-3 h-3 text-slate-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Pressure Rating */}
                    <td className="py-3.5 px-3">
                      <span className="font-display font-extrabold text-base text-[#EA1A85] tabular-nums">
                        {formatRating(player.pressureRating)}
                      </span>
                    </td>

                    {/* Uncertainty Range Bar (Fix D) */}
                    <td className="py-3.5 px-4">
                      <UncertaintyRangeBar
                        ratingInterval={player.ratingInterval}
                        pressureRating={player.pressureRating}
                        bootRankInterval={player.bootRankInterval}
                        domain={domain}
                      />
                    </td>

                    {/* Expected Rank */}
                    <td className="py-3.5 px-3 font-primary font-bold text-[#050D2B] text-center tabular-nums text-base">
                      {formatExpectedRank(player.expectedRank)}
                    </td>

                    {/* P(Top 10) */}
                    <td className="py-3.5 px-3 font-primary bg-slate-50/50">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[#EA1A85] text-sm tabular-nums">
                          {formatPercent(player.pTop10Post)}
                        </span>
                        <div className="w-16 bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-[#EA1A85] h-full"
                            style={{ width: `${Math.min(100, Math.max(0, player.pTop10Post ?? 0))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Ordinary Rating (Fix H) */}
                    <td className="py-3.5 px-3 font-primary text-sm text-slate-700 tabular-nums">
                      {formatRating(player.baselineRating)}
                    </td>

                    {/* Delta & Delta Interval (numeric delta, n.s. if spans 0, model-capped badge if !deltaIdentified) */}
                    <td className="py-3.5 px-3 font-primary text-xs">
                      {player.delta !== null ? (
                        <div className="tabular-nums">
                          <div className="flex items-center gap-1">
                            <span className={`font-bold ${player.delta >= 0 ? 'text-[#1B3FA0]' : 'text-[#EA1A85]'}`}>
                              {formatDelta(player.delta)}
                            </span>
                            {isDeltaNotSignificant(player.deltaInterval) && (
                              <span className="font-bold text-slate-500 font-ui text-[11px]" title="Not Significant: 90% CI includes zero">
                                n.s.
                              </span>
                            )}
                            {!player.deltaIdentified && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-ui font-semibold bg-amber-100 text-amber-900 border border-amber-300 cursor-help"
                                title="latent correlation at cap; delta is largely model-driven"
                              >
                                model-capped
                              </span>
                            )}
                          </div>
                          {player.deltaInterval && (
                            <span className="block text-[11px] text-slate-500 font-ui">
                              CI: {formatInterval(player.deltaInterval)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">n/a</span>
                      )}
                    </td>

                    {/* Primary Phase & Workload */}
                    <td className="py-3.5 pl-6 pr-4 border-l border-slate-100">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-ui font-bold border ${getPhaseBadgeColor(player.phase)}`}>
                          {formatPhaseLabel(player.phase)}
                        </span>
                        <span className="text-xs font-primary text-slate-600 leading-tight">
                          {formatWorkload(player.pressureBalls, player.pressureInnings)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : topThree.length > 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-xs text-slate-500 font-primary">
                  All {topThree.length} qualifying player(s) are highlighted in the top podium cards above.
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-slate-500 font-primary">
                  No batters match the selected filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          MOBILE STACKED CARDS LAYOUT (< 768px)
         ========================================================================= */}
      <div className="md:hidden space-y-3 mb-8">
        {tableBatters.map((player) => {
          const formattedRank = player.rank < 10 ? `0${player.rank}` : player.rank;

          return (
            <div
              key={player.name}
              onClick={() => onSelectPlayer(player)}
              className="p-4 rounded-xl bg-white text-[#050D2B] border border-slate-200 shadow-sm active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-display font-extrabold text-lg text-[#EA1A85]">
                    #{formattedRank}
                  </span>
                  <PlayerVisual player={player} variant="table" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-primary font-bold text-base text-[#050D2B] leading-tight player-name">
                        {player.name}
                      </h4>
                      {player.tier && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-ui font-extrabold border shadow-xs ${getTierBadgeClass(player.tier)}`}>
                          {player.tier}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-primary text-slate-500">
                      Expected Rank: {formatExpectedRank(player.expectedRank)} | P(Top 10): {formatPercent(player.pTop10Post)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Stats */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs font-primary">
                <div>
                  <span className="text-xs font-ui text-slate-500 block">Pressure Rating</span>
                  <span className="font-display font-bold text-base text-[#EA1A85]">
                    {formatRating(player.pressureRating)}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-ui text-slate-500 block">Bag-fit agreement</span>
                  <span className="font-bold text-[#050D2B] text-base font-primary">
                    {player.fitStabilityPct !== null ? `${Number(player.fitStabilityPct).toFixed(0)}%` : 'n/a'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-ui text-slate-500 block">Primary Phase &amp; Workload</span>
                  <span className="text-slate-700">
                    {formatWorkload(player.pressureBalls, player.pressureInnings)}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-ui text-slate-500 block">Ordinary Rating</span>
                  <span className="text-slate-700 font-semibold">
                    {formatRating(player.baselineRating)}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-ui text-slate-500 block">Delta vs Usual</span>
                  {player.delta !== null ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`font-semibold ${player.delta >= 0 ? 'text-[#1B3FA0]' : 'text-[#EA1A85]'}`}>
                        {formatDelta(player.delta)}
                      </span>
                      {isDeltaNotSignificant(player.deltaInterval) && (
                        <span className="text-slate-500 font-semibold font-ui text-[11px]" title="Not Significant: 90% CI includes zero">
                          (n.s.)
                        </span>
                      )}
                      {!player.deltaIdentified && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px] font-ui font-semibold bg-amber-100 text-amber-900 border border-amber-300 cursor-help"
                          title="latent correlation at cap; delta is largely model-driven"
                        >
                          model-capped
                        </span>
                      )}
                      {player.deltaInterval && (
                        <span className="text-slate-400 text-[11px] font-ui">
                          (CI: {formatInterval(player.deltaInterval)})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">n/a</span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-ui text-slate-500 block">Rating CI</span>
                  <span className="text-slate-600">
                    {formatInterval(player.ratingInterval) || 'n/a'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Per-Tab Footnote (Fix C) */}
      <p className="text-xs text-slate-500 font-primary italic mt-2 mb-8 text-center sm:text-left">
        {footnoteText}
      </p>
    </div>
  );
}
