import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Link as LinkIcon, Crosshair, BarChart3, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { meta, isDeltaSignificant } from '../data/cricketData';
import PlayerVisual from './PlayerVisual.jsx';
import UncertaintyRangeBar from './UncertaintyRangeBar.jsx';

export const getTierBadgeClass = (tier) => {
  if (!tier) return 'bg-[#FDE4F1] text-[#EA1A85] border-[#EA1A85]/30';
  if (tier.includes('Tier A')) return 'bg-[#EA1A85] text-white border-[#EA1A85] font-bold shadow-xs';
  if (tier.includes('Tier B')) return 'bg-[#1B3FA0] text-white border-[#1B3FA0] font-bold shadow-xs';
  if (tier.includes('Tier C')) return 'bg-[#FDE4F1] text-[#EA1A85] border-[#EA1A85]/40 font-bold';
  if (tier.includes('Low Confidence')) return 'bg-slate-100 text-[#050D2B] border-slate-300 border-dashed font-semibold';
  return 'bg-[#FDE4F1] text-[#EA1A85] border-[#EA1A85]/30';
};

export const getPhaseBadgeColor = (role) => {
  switch (role) {
    case 'Powerplay':
      return 'bg-[#E6ECFA] text-[#1B3FA0] border-[#1B3FA0]/30';
    case 'Middle Overs':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'Death Overs':
      return 'bg-[#FDE4F1] text-[#EA1A85] border-[#EA1A85]/40';
    default:
      return 'bg-slate-100 text-[#050D2B] border-slate-300';
  }
};

const getPhaseIcon = (iconName) => {
  switch (iconName) {
    case 'flame':
      return <Flame className="w-3.5 h-3.5 text-[#EA1A85]" />;
    case 'link':
      return <LinkIcon className="w-3.5 h-3.5 text-[#1B3FA0]" />;
    case 'crosshair':
      return <Crosshair className="w-3.5 h-3.5 text-[#EA1A85]" />;
    default:
      return <Flame className="w-3.5 h-3.5 text-[#EA1A85]" />;
  }
};

// Fixed scale for visual uncertainty range bars across all rows
const SCALE_MIN = -15;
const SCALE_MAX = 40;
const SCALE_SPAN = SCALE_MAX - SCALE_MIN;
const ZERO_PERCENT = ((0 - SCALE_MIN) / SCALE_SPAN) * 100;

export default function BowlersView({ bowlers, bowlerPhases, onSelectPlayer }) {
  const [viewMode, setViewMode] = useState('individuals'); // 'individuals' or 'phases'
  const [selectedRole, setSelectedRole] = useState('all');

  // Sort the entire UI based strictly on the rank property provided in the JSON array
  const sortedBowlers = [...bowlers].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

  // Extract unique data-driven phase roles from JSON ('Powerplay', 'Middle Overs', 'Death Overs')
  const availableRoles = ['all', ...Array.from(new Set(sortedBowlers.map(b => b.role).filter(Boolean)))];

  const filteredBowlers = selectedRole === 'all'
    ? sortedBowlers
    : sortedBowlers.filter(p => p.role === selectedRole);

  // Top 3 Bowlers for the Podium Cards strictly sorted by rank
  const topThreeBowlers = filteredBowlers.slice(0, 3);

  // Remaining bowlers for individual table strictly sorted by rank
  const individualBowlers = filteredBowlers.slice(3);

  return (
    <div className="relative w-full">
      {/* Header Section: Navy typography on Light page */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-[#EA1A85] skew-diagonal inline-block rounded-xs" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#1B3FA0] font-bold">
              Consensus Posterior Matrix
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#050D2B] font-display">
            Bowling Surge Dossier <span className="text-[#EA1A85]">(Top 10 Under Pressure)</span>
          </h2>
          {/* Dashboard Subtitle (V12 Lock) */}
          <p className="mt-1 text-xs sm:text-sm text-slate-600 font-sans">
            Ordered by Expected Rank.
          </p>
        </div>

        {/* Dynamic Phase Role Filter Bar */}
        {availableRoles.length > 2 && (
          <div className="w-full sm:w-auto max-w-full overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-white border border-slate-200 shadow-xs">
              {availableRoles.map((role) => {
                const count = role === 'all'
                  ? sortedBowlers.length
                  : sortedBowlers.filter(b => b.role === role).length;
                const isActive = selectedRole === role;

                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-display uppercase tracking-wider font-bold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] ${
                      isActive
                        ? 'bg-[#EA1A85] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#050D2B] hover:bg-slate-100'
                    }`}
                  >
                    <span>{role === 'all' ? 'All Phases' : role}</span>
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          TOP 3 PODIUM SECTION (Framed by a Bold Royal Blue Band #1B3FA0)
         ========================================================================= */}
      <div className="bg-[#1B3FA0] rounded-3xl p-5 sm:p-6 mb-8 shadow-lg border border-[#1B3FA0]">
        
        {/* Section title inside the blue band */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/20 text-white">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold uppercase tracking-wider text-sm text-white">
              The Podium: Top 3 Pressure Match-Winners
            </span>
          </div>
          <span className="text-xs font-mono text-white/80">
            High-leverage Posterior Rank
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {topThreeBowlers.map((bowler) => {
            const formattedRank = bowler.rank < 10 ? `0${bowler.rank}` : bowler.rank;
            const isRankOne = bowler.rank === 1;
            const isSigDelta = isDeltaSignificant(bowler.deltaInterval);

            return (
              <motion.div
                key={bowler.name}
                onClick={() => onSelectPlayer(bowler)}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group cursor-pointer rounded-2xl bg-white text-[#050D2B] overflow-hidden border transition-all duration-200 shadow-rr-card hover:shadow-rr-hover flex flex-col justify-between relative h-full ${
                  isRankOne 
                    ? 'border-[#EA1A85] ring-2 ring-[#EA1A85]' 
                    : 'border-slate-200 hover:border-[#EA1A85]/50'
                }`}
              >
                {/* Card Header Block: Navy with diagonal pink cut, about 90px height */}
                <div className="relative bg-[#050D2B] text-white p-3.5 border-b-2 border-b-[#EA1A85] z-10 h-[88px] flex flex-col justify-between shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-xl text-[#EA1A85] tracking-wider leading-none">
                        #{formattedRank}
                      </span>
                      {isRankOne && (
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-display uppercase tracking-wider font-extrabold bg-[#EA1A85] text-white skew-diagonal shadow-xs">
                          <span className="unskew-diagonal inline-block">RANK 1</span>
                        </span>
                      )}
                    </div>

                    {/* Tier chip placed cleanly at top-right without watermark overlap */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getTierBadgeClass(bowler.tier)}`}>
                      {bowler.tier}
                    </span>
                  </div>

                  {/* Bowler Name */}
                  <div className="mt-1">
                    <h3 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-tight group-hover:text-[#EA1A85] transition-colors truncate player-name leading-tight">
                      {bowler.name}
                    </h3>
                  </div>
                </div>

                {/* Player Visual Area: 190-210px tall, bottom-anchored, identical across all 3 cards */}
                <div className="relative w-full h-[200px] bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-end justify-center overflow-hidden shrink-0">
                  {/* Watermark 01/02/03 outline behind player at 7% opacity */}
                  <div className="absolute bottom-1 right-2 select-none pointer-events-none font-display font-black text-7xl sm:text-8xl text-black/[0.07] z-0">
                    {formattedRank}
                  </div>

                  {/* Phase badge on top-left of player area */}
                  <div className="absolute top-2.5 left-3 z-20">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shadow-xs ${getPhaseBadgeColor(bowler.role)}`}>
                      {bowler.role}
                    </span>
                  </div>

                  {/* Player Visual (Cutout or Placeholder with badge) */}
                  <div className="relative z-10 w-full h-full flex items-end justify-center">
                    <PlayerVisual player={bowler} variant="top3" />
                  </div>
                </div>

                {/* Metrics Section: Section padding 16px, Pressure Rating & Range Bar on Left, Expected Rank, P(Top 10) & Workload on Right */}
                <div className="p-4 bg-white border-t border-slate-100 flex-1 flex flex-col justify-between z-10">
                  <div className="grid grid-cols-2 gap-2.5 items-start">
                    {/* Left: Pressure Rating big + Uncertainty Range Bar */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between h-full">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-display uppercase font-bold tracking-wider">
                          Pressure Rating
                        </span>
                        <span className="text-2xl font-black text-[#EA1A85] font-mono tabular-nums leading-tight block my-0.5">
                          {bowler.pressureRating >= 0 ? `+${bowler.pressureRating}` : bowler.pressureRating}
                        </span>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/70">
                        <UncertaintyRangeBar
                          ratingInterval={bowler.ratingInterval}
                          pressureRating={bowler.pressureRating}
                          bootRankInterval={bowler.bootRankInterval}
                          compact={true}
                        />
                      </div>
                    </div>

                    {/* Right: Expected Rank, P(Top 10), and Workload with 8px gaps */}
                    <div className="space-y-2">
                      {/* Expected Rank */}
                      <div className="p-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-display uppercase font-bold tracking-wider">
                          Expected Rank
                        </span>
                        <span className="text-sm font-extrabold text-[#050D2B] font-mono tabular-nums">
                          {bowler.expectedRank}
                        </span>
                      </div>

                      {/* P(Top 10) with mini progress bar */}
                      <div className="p-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-display uppercase font-bold tracking-wider">
                            P(Top 10)
                          </span>
                          <span className="text-xs font-mono font-bold text-[#EA1A85]">
                            {bowler.pTop10Post}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-[#EA1A85] h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, bowler.pTop10Post))}%` }}
                          />
                        </div>
                      </div>

                      {/* Workload */}
                      <div className="p-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-display uppercase font-bold tracking-wider">
                          Workload
                        </span>
                        <div className="text-[10px] font-mono font-semibold text-[#050D2B] leading-tight mt-0.5">
                          <div>{bowler.pressureBalls} balls in {bowler.pressureInnings} innings</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom details row: Delta chip and 'Model fits: 25/25' on one row; CI lines side-by-side on ONE row */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {isSigDelta ? (
                        <div 
                          title="Pressure rating minus ordinary (non-pressure) rating."
                          className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border inline-flex items-center gap-1.5 cursor-help ${
                            bowler.delta >= 0 
                              ? 'bg-[#E6ECFA] text-[#1B3FA0] border-[#1B3FA0]/30' 
                              : 'bg-[#FDE4F1] text-[#EA1A85] border-[#EA1A85]/30'
                          }`}
                        >
                          {bowler.delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>Delta: {bowler.delta >= 0 ? `+${bowler.delta}` : bowler.delta}</span>
                          <span className="text-[10px] opacity-80 whitespace-nowrap">
                            CI: [{bowler.deltaInterval[0]}, {bowler.deltaInterval[1]}]
                          </span>
                        </div>
                      ) : (
                        <span 
                          title="Pressure rating minus ordinary (non-pressure) rating."
                          className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200 inline-block font-semibold whitespace-nowrap cursor-help"
                        >
                          Delta: Indistinguishable from noise
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-500 font-medium whitespace-nowrap">
                        Fit agreement: {bowler.top10SharePct}% of 25 fits
                      </span>
                    </div>

                    {/* 'Rating CI: [a, b]' and 'Bootstrap Rank CI: [c, d]' side by side on ONE row (font-size 12px, white-space: nowrap) */}
                    <div className="flex items-center justify-between gap-2 text-[12px] font-mono text-slate-600 whitespace-nowrap pt-0.5">
                      <span>Rating CI: [{bowler.ratingInterval?.[0]}, {bowler.ratingInterval?.[1]}]</span>
                      <span>Bootstrap Rank CI: [{bowler.bootRankInterval?.[0]}, {bowler.bootRankInterval?.[1]}]</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Control Bar: Clean Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode('individuals')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-display uppercase tracking-wider font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] ${
              viewMode === 'individuals'
                ? 'bg-[#EA1A85] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#050D2B] hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Bowlers Roster</span>
          </button>

          <button
            onClick={() => setViewMode('phases')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-display uppercase tracking-wider font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] ${
              viewMode === 'phases'
                ? 'bg-[#EA1A85] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#050D2B] hover:bg-slate-100'
            }`}
          >
            <span>Phase Breakdown</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display uppercase tracking-wider font-bold bg-[#1B3FA0] text-white shadow-xs">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>V14 Consensus Rank Order</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pr-1 text-xs font-mono text-slate-500">
          <span>Ranks 04–10 Posterior Leaderboard</span>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: PHASES BREAKDOWN
         ========================================================================= */}
      {viewMode === 'phases' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-rr-card mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1B3FA0] text-white text-[11px] font-display uppercase tracking-wider select-none border-b-2 border-b-[#EA1A85]">
                <th className="py-3.5 px-4 w-16">Rank</th>
                <th className="py-3.5 px-4">Career Phase</th>
                <th className="py-3.5 px-4">Confidence Tier</th>
                <th className="py-3.5 px-4 w-1/3">Pressure Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {bowlerPhases.map((phase) => (
                <tr key={phase.role} className="group hover:bg-[#FDE4F1]/30 cursor-pointer transition-colors duration-150 border-l-4 border-l-transparent hover:border-l-[#EA1A85]">
                  <td className="py-3.5 px-4 font-display font-extrabold text-[#EA1A85] text-base">
                    0{phase.rank}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-[#050D2B]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#FDE4F1] border border-pink-200 flex items-center justify-center">
                        {getPhaseIcon(phase.icon)}
                      </div>
                      <span>{phase.role}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#EA1A85] text-white border border-[#EA1A85] shadow-xs">
                      Tier A
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-[#050D2B] font-mono text-xs">
                    {phase.pressureUplift}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* =========================================================================
            VIEW MODE 2: RANKS 4-10 LEADERBOARD (Desktop Table + Mobile Cards)
           ========================================================================= */
        <>
          {/* Desktop Table View (>= 768px) with Fixed Widths: Rank 5%, Bowler 19%, Rating 7%, Uncertainty 17%, Expected rank 8%, P(top 10) 9%, Delta 17%, Phase & workload 18% (Sum = 100%) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-rr-card mb-3">
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px] lg:min-w-full">
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '19%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                {/* Table Header: Royal Blue (#1B3FA0) */}
                <tr className="bg-[#1B3FA0] text-white text-[11px] font-display uppercase tracking-wider select-none border-b-2 border-b-[#EA1A85]">
                  <th className="py-3.5 px-3">Rank</th>
                  <th className="py-3.5 px-4">Bowler</th>
                  <th className="py-3.5 px-3">Rating</th>
                  <th className="py-3.5 px-4">Rating Uncertainty</th>
                  <th className="py-3.5 px-3 text-center">Expected Rank</th>
                  <th className="py-3.5 px-3">P(Top 10)</th>
                  <th className="py-3.5 px-3" title="Pressure rating minus ordinary (non-pressure) rating.">Delta vs Usual</th>
                  <th className="py-3.5 pl-7 pr-5 border-l border-white/20" style={{ paddingLeft: '28px', paddingRight: '20px', whiteSpace: 'normal' }}>
                    Phase &amp; Workload
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {individualBowlers.length > 0 ? (
                  individualBowlers.map((bowler) => {
                    const formattedRank = bowler.rank < 10 ? `0${bowler.rank}` : bowler.rank;
                    const isSigDelta = isDeltaSignificant(bowler.deltaInterval);

                    return (
                      <tr
                        key={bowler.name}
                        onClick={() => onSelectPlayer(bowler)}
                        className="hover:bg-[#FDE4F1]/30 cursor-pointer transition-all duration-150 group border-l-4 border-l-transparent hover:border-l-[#EA1A85]"
                      >
                        {/* Rank (5%) */}
                        <td className="py-3.5 px-3 font-display font-extrabold text-base text-[#EA1A85] group-hover:text-[#050D2B] transition-colors tabular-nums">
                          {formattedRank}
                        </td>

                        {/* Player Info (19%) */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <PlayerVisual player={bowler} variant="table" />
                            
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-[#050D2B] group-hover:text-[#EA1A85] transition-colors truncate text-sm player-name">
                                {bowler.name}
                              </div>
                              
                              {/* Tier chip and Fits on separate lines with clear spacing */}
                              <div className="mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getTierBadgeClass(bowler.tier)}`}>
                                  {bowler.tier}
                                </span>
                              </div>
                              <div className="mt-1 text-[10px] font-mono text-slate-500 whitespace-nowrap">
                                Fit agreement: {bowler.top10SharePct}% of 25 fits
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Pressure Rating (7%) */}
                        <td className="py-3.5 px-3">
                          <span className="font-mono font-extrabold text-sm text-[#EA1A85] tabular-nums">
                            {bowler.pressureRating >= 0 ? `+${bowler.pressureRating}` : bowler.pressureRating}
                          </span>
                        </td>

                        {/* Uncertainty Range Bar (17%) */}
                        <td className="py-3.5 px-4">
                          <UncertaintyRangeBar
                            ratingInterval={bowler.ratingInterval}
                            pressureRating={bowler.pressureRating}
                            bootRankInterval={bowler.bootRankInterval}
                          />
                        </td>

                        {/* Expected Rank (8%) */}
                        <td className="py-3.5 px-3 font-mono font-bold text-[#050D2B] text-center tabular-nums text-sm">
                          {bowler.expectedRank ?? bowler.medianRank}
                        </td>

                        {/* P(Top 10) (9%) */}
                        <td className="py-3.5 px-3 font-mono">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-[#EA1A85]">{bowler.pTop10Post}%</span>
                            <div className="w-14 bg-slate-200 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-[#EA1A85] h-full"
                                style={{ width: `${Math.min(100, Math.max(0, bowler.pTop10Post))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Delta vs Usual (17%) - max-width: 100%, white-space: normal, font-size: 11px, padding: 4px 8px */}
                        <td className="py-3.5 px-3">
                          {isSigDelta ? (
                            <div
                              title="Pressure rating minus ordinary (non-pressure) rating."
                              className={`rounded text-[11px] font-mono font-bold border inline-block leading-snug break-words cursor-help ${
                                bowler.delta >= 0 
                                  ? 'bg-[#E6ECFA] text-[#1B3FA0] border-[#1B3FA0]/30' 
                                  : 'bg-[#FDE4F1] text-[#EA1A85] border-[#EA1A85]/30'
                              }`}
                              style={{ maxWidth: '100%', whiteSpace: 'normal', padding: '4px 8px', fontSize: '11px' }}
                            >
                              <div>Delta: {bowler.delta >= 0 ? `+${bowler.delta}` : bowler.delta}</div>
                              <div className="text-[10px] font-mono text-slate-500 font-normal">
                                CI: [{bowler.deltaInterval[0]}, {bowler.deltaInterval[1]}]
                              </div>
                            </div>
                          ) : (
                            <span
                              title="Pressure rating minus ordinary (non-pressure) rating."
                              className="inline-block text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200 font-semibold leading-snug break-words cursor-help"
                              style={{ maxWidth: '100%', whiteSpace: 'normal', padding: '4px 8px', fontSize: '11px' }}
                            >
                              Delta: Indistinguishable from noise
                            </span>
                          )}
                        </td>

                        {/* Phase & Workload (18%) - padding-left: 28px, padding-right: 20px, white-space: normal with 1px divider */}
                        <td
                          className="py-3.5 pl-7 pr-5 border-l border-slate-100"
                          style={{ paddingLeft: '28px', paddingRight: '20px', whiteSpace: 'normal' }}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getPhaseBadgeColor(bowler.role)}`}>
                              {bowler.role}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 leading-tight">
                              {bowler.pressureBalls} balls in {bowler.pressureInnings} innings
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : topThreeBowlers.length > 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-xs text-slate-500">
                      All {topThreeBowlers.length} qualifying bowler(s) are highlighted in the top podium cards above.
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                      No bowlers match the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards Layout (< 768px) keeping ALL data points strictly visible */}
          <div className="md:hidden space-y-3 mb-4">
            {individualBowlers.map((bowler) => {
              const formattedRank = bowler.rank < 10 ? `0${bowler.rank}` : bowler.rank;
              const isSigDelta = isDeltaSignificant(bowler.deltaInterval);

              return (
                <div
                  key={bowler.name}
                  onClick={() => onSelectPlayer(bowler)}
                  className="p-4 rounded-xl bg-white text-[#050D2B] border border-slate-200 shadow-sm active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-extrabold text-lg text-[#EA1A85]">
                        #{formattedRank}
                      </span>
                      <PlayerVisual player={bowler} variant="table" />
                      <div>
                        <h4 className="font-bold text-sm text-[#050D2B] leading-tight player-name">
                          {bowler.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          Expected Rank: {bowler.expectedRank} | P(Top 10): {bowler.pTop10Post}%
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${getTierBadgeClass(bowler.tier)}`}>
                      {bowler.tier}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Pressure Rating</span>
                      <span className="font-bold text-[#EA1A85]">
                        {bowler.pressureRating >= 0 ? `+${bowler.pressureRating}` : bowler.pressureRating}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Workload</span>
                      <span className="text-slate-700">
                        {bowler.pressureBalls}b / {bowler.pressureInnings} inn
                      </span>
                    </div>
                    <div className="col-span-2 text-[10px] text-slate-600">
                      Rating CI: [{bowler.ratingInterval?.[0]}, {bowler.ratingInterval?.[1]}] · Boot: [{bowler.bootRankInterval?.[0]}, {bowler.bootRankInterval?.[1]}]
                    </div>
                    <div className="col-span-2">
                      {isSigDelta ? (
                        <span 
                          title="Pressure rating minus ordinary (non-pressure) rating."
                          className="text-[11px] font-bold text-[#1B3FA0] cursor-help"
                        >
                          Delta: {bowler.delta >= 0 ? `+${bowler.delta}` : bowler.delta} (CI: [{bowler.deltaInterval[0]}, {bowler.deltaInterval[1]}])
                        </span>
                      ) : (
                        <span 
                          title="Pressure rating minus ordinary (non-pressure) rating."
                          className="text-[11px] text-slate-500 cursor-help"
                        >
                          Delta: Indistinguishable from noise
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-[10px] text-slate-500">
                      Fit agreement: {bowler.top10SharePct}% of 25 fits
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* One-line Footnote under Table (Copy Change #3) */}
          <p className="text-xs text-slate-500 font-sans italic mt-2 mb-8 text-center sm:text-left">
            Most rating intervals include 0, so many players are not statistically separable from the average eligible player.
          </p>
        </>
      )}
    </div>
  );
}
