import React from 'react';
import { motion } from 'motion/react';
import { Code2, ArrowRight } from 'lucide-react';
import { meta, getStatusBadgeClass } from '../data/cricketData';

export default function HeroSection({ onOpenScout, onOpenMethodology, onOpenExport }) {
  return (
    <div
      className="relative w-full overflow-hidden bg-[#050D2B] clip-diagonal-hero pb-4 shadow-2xl flex flex-col justify-between"
      style={{ minHeight: 'clamp(640px, 74vh, 780px)' }}
    >
      {/* Stadium Backdrop with high visibility across whole hero (background-position: center 35%) */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/aistudio/image_347ddeed.png"
          alt="Rajasthan Royals Stadium Atmosphere"
          aria-hidden="true"
          className="w-full h-full object-cover pointer-events-none select-none"
          style={{ objectPosition: 'center 35%', opacity: 0.95 }}
        />
        {/* Full-bleed gradient overlay: 90deg fade from deep navy to soft pink + smooth bottom fade to page background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 65%, #050D2B 100%), linear-gradient(90deg, rgba(5,13,43,.88) 0%, rgba(5,13,43,.55) 38%, rgba(5,13,43,.12) 72%, rgba(234,26,133,.18) 100%)'
          }}
        />
      </div>

      {/* Hero Content: Status chips top, title middle, KPI cards bottom with 32px spacing */}
      <div
        className="relative z-10 w-[min(96vw,1760px)] max-w-[1760px] mx-auto px-6 py-6 sm:py-8 flex-1 flex flex-col justify-between"
        style={{ minHeight: 'clamp(640px, 74vh, 780px)' }}
      >
        
        {/* Top: Machine Learning Status Chips */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Batters Status Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#050D2B]/85 backdrop-blur-md border border-white/15 text-xs font-mono text-slate-100 shadow-sm">
            <span className="font-semibold text-white">Batters:</span>
            <span>Status: <span className={getStatusBadgeClass(meta.status?.bat)}>{meta.status?.bat}</span></span>
            <span className="text-white/30">|</span>
            <span>Expected True Hits: <span className="font-bold text-white font-mono">{meta.expected_hits?.bat}/10</span></span>
          </div>

          {/* Bowlers Status Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#050D2B]/85 backdrop-blur-md border border-white/15 text-xs font-mono text-slate-100 shadow-sm">
            <span className="font-semibold text-white">Bowlers:</span>
            <span>Status: <span className={getStatusBadgeClass(meta.status?.bow)}>{meta.status?.bow}</span></span>
            <span className="text-white/30">|</span>
            <span>Expected True Hits: <span className="font-bold text-white font-mono">{meta.expected_hits?.bow}/10</span></span>
          </div>
        </div>

        {/* Middle: Main Title & Diagonal Pink Accent Bar */}
        <div className="my-auto py-8 max-w-3xl">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-1.5 bg-[#EA1A85] skew-diagonal rounded-xs" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#FDE4F1] font-bold">
              Rajasthan Royals Analytics
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white font-display leading-[0.95]"
          >
            SupeRR Selector
            <span className="block text-[#EA1A85] text-xl sm:text-2xl lg:text-3xl mt-1 tracking-normal font-extrabold">
              The Clutch Dossier
            </span>
          </motion.h1>

          <p className="mt-2 text-xs sm:text-sm text-slate-200 font-sans max-w-xl leading-relaxed">
            High-leverage T20 decision intelligence ranking match-winners under acute match pressure.
          </p>

          {/* Existing Hero Chips - EXACT Labels */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#1B3FA0]/40 text-[#E6ECFA] border border-[#1B3FA0]/60 backdrop-blur-sm">
              WP Leverage Index
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EA1A85]/30 text-[#FDE4F1] border border-[#EA1A85]/50 backdrop-blur-sm">
              Confidence Tiers
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#0A1A52]/80 text-[#E6ECFA] border border-[#1B3FA0]/50 backdrop-blur-sm">
              Posterior Ranking
            </span>
          </div>
        </div>

        {/* Bottom: 4 Clean Glass KPI Cards & Action with 32px spacing (pt-8) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-8 border-t border-white/10">
          {/* Key Metrics Cards with Thin Pink Top Border */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 max-w-4xl">
            <div className="p-2.5 rounded-xl bg-[#050D2B]/85 backdrop-blur-md border border-white/10 border-t-2 border-t-[#EA1A85] shadow-sm">
              <span className="text-[10px] text-slate-300 block font-display uppercase tracking-wider font-bold">
                Deliveries Analyzed
              </span>
              <span className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">
                196,343
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#050D2B]/85 backdrop-blur-md border border-white/10 border-t-2 border-t-[#EA1A85] shadow-sm">
              <span className="text-[10px] text-slate-300 block font-display uppercase tracking-wider font-bold">
                Statistical Model
              </span>
              <span className="text-base sm:text-lg font-bold text-[#EA1A85] font-display uppercase">
                Posterior Ranking
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#050D2B]/85 backdrop-blur-md border border-white/10 border-t-2 border-t-[#EA1A85] shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-300 block font-display uppercase tracking-wider font-bold truncate">
                Primary Metric
              </span>
              <span className="text-xs sm:text-xs font-bold text-[#EA1A85] font-sans block leading-tight mt-0.5" title="Pressure Rating (runs per 100 pressure balls vs eligible peers)">
                Pressure Rating (runs per 100 pressure balls vs eligible peers)
              </span>
            </div>

            {/* Expected Rank */}
            <div className="p-2.5 rounded-xl bg-[#050D2B]/85 backdrop-blur-md border border-white/10 border-t-2 border-t-[#EA1A85] shadow-sm">
              <span className="text-[10px] text-slate-300 block font-display uppercase tracking-wider font-bold">
                Expected Rank
              </span>
              <span className="text-xs sm:text-sm font-bold text-white font-mono">
                Posterior expected rank
              </span>
            </div>
          </div>

          {/* Action Button: Methodology only */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenMethodology}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-display uppercase tracking-wider font-bold text-[#FDE4F1] hover:text-white bg-transparent hover:bg-[#EA1A85] border-2 border-[#EA1A85] transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span>Methodology</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
