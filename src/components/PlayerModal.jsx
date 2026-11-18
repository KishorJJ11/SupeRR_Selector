import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, ShieldCheck, Info } from 'lucide-react';
import {
  formatRating,
  formatDelta,
  formatInterval,
  formatPercent,
  formatExpectedRank,
  formatWorkload,
  isDeltaNotSignificant
} from '../utils/formatters';
import PlayerVisual from './PlayerVisual.jsx';

export default function PlayerModal({ player, onClose }) {
  if (!player) return null;

  const hasValidBoot = Array.isArray(player.bootRankInterval) &&
                       player.bootRankInterval.length === 2 &&
                       player.bootRankInterval.every(v => typeof v === 'number' && v >= 1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl rounded-3xl bg-white text-[#050D2B] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-white/20"
        >
          {/* Navy Header Block with Pink Accent Line */}
          <div className="relative bg-[#050D2B] text-white p-6 pb-5 border-b-2 border-b-[#EA1A85] shrink-0">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-[#EA1A85] text-white/80 hover:text-white transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Initials-only badge */}
              <div className="shrink-0">
                <PlayerVisual player={player} variant="modal" />
              </div>

              {/* Title & Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-ui font-bold text-[#EA1A85] uppercase tracking-wider mb-1">
                  <Crown className="w-4 h-4 fill-[#EA1A85]/20" />
                  <span>Rank #{player.rank} · {player.role}</span>
                  {player.tier && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      player.tier === 'Core'
                        ? 'bg-emerald-500 text-white'
                        : player.tier === 'Likely'
                        ? 'bg-[#1B3FA0] text-white'
                        : 'bg-amber-500 text-white'
                    }`}>
                      {player.tier}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-tight truncate">
                  {player.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#FDE4F1] font-primary mt-1 font-bold">
                  Expected Rank: {formatExpectedRank(player.expectedRank)} | P(Top 10): {formatPercent(player.pTop10Post)}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1">
            {/* Match-Level Rating & Uncertainty Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-primary shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold font-display uppercase text-sm">Pressure Rating:</span>
                <span className="text-[#EA1A85] font-extrabold text-xl font-display tabular-nums">
                  {formatRating(player.pressureRating)}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 space-y-1 text-slate-700 text-xs sm:text-sm">
                <div className="font-semibold">
                  Rating CI: {formatInterval(player.ratingInterval) || 'n/a'}
                </div>
                {hasValidBoot && (
                  <div className="font-semibold text-slate-500">
                    Bootstrap Rank CI: [{player.bootRankInterval[0]}, {player.bootRankInterval[1]}]
                  </div>
                )}
                {player.baselineRating !== null && (
                  <div className="text-slate-600">
                    Ordinary Baseline Rating: {formatRating(player.baselineRating)}
                  </div>
                )}
                {player.delta !== null && (
                  <div className="font-semibold text-[#1B3FA0] flex items-center gap-1.5 flex-wrap">
                    <span>Delta vs Usual: {formatDelta(player.delta)}</span>
                    {isDeltaNotSignificant(player.deltaInterval) && (
                      <span className="text-slate-500 font-ui font-bold text-xs" title="Not Significant: 90% CI includes zero">
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
                      <span className="text-slate-500 font-normal text-xs font-ui">
                        (CI: {formatInterval(player.deltaInterval)})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile narrative */}
            <div>
              <h4 className="text-xs font-ui uppercase font-bold tracking-wider text-slate-500 mb-2">
                Statistical Pressure Evaluation &amp; Primary Phase
              </h4>
              <p className="text-xs sm:text-sm text-[#050D2B] leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs font-primary">
                {player.name} is classified in the {player.role} phase, evaluated via empirical Bayes rate shrinkage under acute win-probability leverage situations.
              </p>
            </div>

            {/* 4-Box Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs uppercase font-ui font-bold text-slate-500">Expected Rank</span>
                <div className="text-xl font-bold text-[#EA1A85] font-primary tabular-nums">
                  {formatExpectedRank(player.expectedRank)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs uppercase font-ui font-bold text-slate-500">P(Top 10)</span>
                <div className="text-xl font-bold text-[#EA1A85] font-primary tabular-nums">
                  {formatPercent(player.pTop10Post)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="text-xs uppercase font-ui font-bold">Bag-fit</span>
                  <Info className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-xl font-bold text-[#050D2B] font-primary tabular-nums">
                  {player.fitStabilityPct !== null ? `${Number(player.fitStabilityPct).toFixed(0)}%` : 'n/a'}
                </div>
                <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                  model variance only
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs uppercase font-ui font-bold text-slate-500">Workload</span>
                <div className="text-xs font-bold text-[#050D2B] font-primary mt-1">
                  {formatWorkload(player.pressureBalls, player.pressureInnings)}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Strip */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-600 flex items-center gap-1.5 font-primary">
              <ShieldCheck className="w-4 h-4 text-[#EA1A85]" />
              Empirical Bayes Posterior Leverage Dossier
            </span>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-full text-xs font-display uppercase tracking-wider font-bold text-slate-700 hover:text-[#050D2B] bg-slate-200/80 hover:bg-slate-300 shadow-xs active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
