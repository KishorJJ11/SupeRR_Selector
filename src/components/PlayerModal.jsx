import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, TrendingUp, TrendingDown, ShieldCheck, MessageSquare } from 'lucide-react';
import { meta, getTierBadgeClass, isDeltaSignificant } from '../data/cricketData';
import PlayerVisual from './PlayerVisual.jsx';

export default function PlayerModal({ player, onClose, onAskScout }) {
  if (!player) return null;

  const isSigDelta = isDeltaSignificant(player.deltaInterval);

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
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-[#EA1A85] text-white/80 hover:text-white transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Neutral Athlete Silhouette with Initials on Gradient */}
              <div className="shrink-0">
                <PlayerVisual player={player} variant="modal" />
              </div>

              {/* Title & Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono font-bold text-[#EA1A85] uppercase tracking-wider mb-1">
                  <Crown className="w-4 h-4 fill-[#EA1A85]/20" />
                  <span>Rank #{player.rank} · {player.role}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-tight truncate">
                  {player.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#FDE4F1] font-mono mt-1 font-bold">
                  Expected Rank: {player.expectedRank ?? player.medianRank} | P(Top 10): {player.pTop10Post}%
                </p>

                {/* Badges strip */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getTierBadgeClass(player.tier)}`}>
                    {player.tier}
                  </span>

                  {isSigDelta ? (
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border inline-flex items-center gap-1.5 ${
                      player.delta >= 0 
                        ? 'bg-[#E6ECFA] text-[#1B3FA0] border-[#1B3FA0]/30' 
                        : 'bg-[#FDE4F1] text-[#EA1A85] border-[#EA1A85]/30'
                    }`}>
                      {player.delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>Delta: {player.delta >= 0 ? `+${player.delta}` : player.delta}</span>
                      <span className="text-[10px] opacity-80">
                        CI: [{player.deltaInterval[0]}, {player.deltaInterval[1]}]
                      </span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 text-white/90 border border-white/20 font-semibold">
                      Delta: Indistinguishable from noise
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1">
            {/* Match-Level Confidence Intervals Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold font-display uppercase text-sm">Pressure Rating:</span>
                <span className="text-[#EA1A85] font-extrabold text-lg tabular-nums">
                  {player.pressureRating >= 0 ? `+${player.pressureRating}` : player.pressureRating}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 space-y-1 text-slate-700">
                <div className="font-semibold">
                  Rating CI: [{player.ratingInterval?.[0]}, {player.ratingInterval?.[1]}]
                </div>
                <div className="font-semibold">
                  Bootstrap Rank CI: [{player.bootRankInterval?.[0]}, {player.bootRankInterval?.[1]}]
                </div>
                {isSigDelta ? (
                  <div className="font-semibold text-[#EA1A85]">
                    Delta CI: [{player.deltaInterval[0]}, {player.deltaInterval[1]}]
                  </div>
                ) : (
                  <div className="text-slate-500 font-medium">
                    Delta: Indistinguishable from noise
                  </div>
                )}
              </div>
            </div>

            {/* Profile narrative */}
            <div>
              <h4 className="text-xs font-display uppercase font-bold tracking-wider text-slate-500 mb-2">
                Machine Learning Pressure Profile &amp; Role Classification
              </h4>
              <p className="text-xs sm:text-sm text-[#050D2B] leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                {player.clutchSummary || `${player.name} is classified as a premier ${player.role}, displaying sustained leverage conversion under acute match pressure.`}
              </p>
            </div>

            {/* 4-Box Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-display font-bold text-slate-500">Expected Rank</span>
                <div className="text-lg font-extrabold text-[#EA1A85] font-mono tabular-nums">
                  {player.expectedRank ?? player.medianRank}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-display font-bold text-slate-500">P(Top 10)</span>
                <div className="text-lg font-extrabold text-[#EA1A85] font-mono tabular-nums">
                  {player.pTop10Post}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-display font-bold text-slate-500">Model Fits</span>
                <div className="text-lg font-extrabold text-[#050D2B] font-mono tabular-nums">
                  {player.modelFitsEligible}/{meta.model_fits}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-display font-bold text-slate-500">Workload</span>
                <div className="text-xs font-bold text-[#050D2B] font-mono mt-1">
                  {player.pressureBalls}b ({player.pressureInnings} inn)
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Strip */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#EA1A85]" />
              Verified by Rajasthan Royals Analytics Lab · V14 Run-Expectancy WP Leverage Engine
            </span>

            <button
              onClick={() => {
                onClose();
                onAskScout(`Analyze ${player.name}'s performance as a ${player.role} and value over replacement for Rajasthan Royals.`);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-display uppercase tracking-wider font-bold text-white bg-[#EA1A85] hover:bg-[#C4106C] shadow-sm active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask AI Scout about {player.name.split(' ')[0]}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
