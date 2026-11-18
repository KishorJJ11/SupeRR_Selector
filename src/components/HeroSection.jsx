import React from 'react';
import { motion } from 'motion/react';
import { Code2, ArrowRight, ShieldCheck, Database, Sliders } from 'lucide-react';
import { meta, getStatusBadgeClass } from '../data/cricketData';
import { formatExpectedHits } from '../utils/formatters';

export default function HeroSection({ onOpenMethodology }) {
  const estimatorName = meta.estimator || 'n/a';
  const batHits = meta.expected_hits?.bat !== undefined ? formatExpectedHits(meta.expected_hits.bat) : 'n/a';
  const bowHits = meta.expected_hits?.bow !== undefined ? formatExpectedHits(meta.expected_hits.bow) : 'n/a';
  const expectedHitsLabel = meta.expected_hits_label || 'Expected hits (model-implied, not OOS-validated)';
  const deliveriesAnalyzed = typeof meta.deliveries_used === 'number'
    ? meta.deliveries_used.toLocaleString()
    : (meta.deliveries_used || 'n/a');
  const rankingRule = meta.ranking_rule || 'n/a';

  return (
    <div
      className="relative w-full overflow-hidden bg-[#050D2B] clip-diagonal-hero pb-4 shadow-2xl flex flex-col justify-between"
      style={{ minHeight: 'clamp(640px, 74vh, 780px)' }}
    >
      {/* Stadium Backdrop */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/aistudio/image_347ddeed.png"
          alt="Rajasthan Royals Stadium Atmosphere"
          aria-hidden="true"
          className="w-full h-full object-cover pointer-events-none select-none"
          style={{ objectPosition: 'center 35%', opacity: 0.95 }}
        />
        {/* Full-bleed gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 65%, #050D2B 100%), linear-gradient(90deg, rgba(5,13,43,.88) 0%, rgba(5,13,43,.55) 38%, rgba(5,13,43,.12) 72%, rgba(234,26,133,.18) 100%)'
          }}
        />
      </div>

      {/* Hero Content */}
      <div
        className="relative z-10 w-[min(96vw,1760px)] max-w-[1760px] mx-auto px-6 py-6 sm:py-8 flex-1 flex flex-col justify-between"
        style={{ minHeight: 'clamp(640px, 74vh, 780px)' }}
      >
        {/* Top: Status Chips */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Batters Status Chip */}
          <div
            title={meta.status_rule || undefined}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#050D2B]/85 backdrop-blur-md border border-white/15 text-xs font-ui text-slate-100 shadow-sm cursor-help"
          >
            <span className="font-semibold text-white">Batters:</span>
            <span>Status: <span className={getStatusBadgeClass(meta.status?.bat)}>{meta.status?.bat || 'n/a'}</span></span>
            <span className="text-white/30">|</span>
            <span>Expected Hits <span className="text-white/70 text-[11px] font-normal">(model-implied, not OOS-validated)</span>: <span className="font-bold text-white font-ui">{batHits}</span></span>
          </div>

          {/* Bowlers Status Chip */}
          <div
            title={meta.status_rule || undefined}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#050D2B]/85 backdrop-blur-md border border-white/15 text-xs font-ui text-slate-100 shadow-sm cursor-help"
          >
            <span className="font-semibold text-white">Bowlers:</span>
            <span>Status: <span className={getStatusBadgeClass(meta.status?.bow)}>{meta.status?.bow || 'n/a'}</span></span>
            <span className="text-white/30">|</span>
            <span>Expected Hits <span className="text-white/70 text-[11px] font-normal">(model-implied, not OOS-validated)</span>: <span className="font-bold text-white font-ui">{bowHits}</span></span>
          </div>
        </div>

        {/* Middle: Main Title & Subtitle */}
        <div className="my-auto py-8 max-w-3xl">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-1.5 bg-[#EA1A85] skew-diagonal rounded-xs" />
            <span className="text-xs font-ui uppercase tracking-widest text-[#FDE4F1] font-bold">
              Rajasthan Royals Analytics Lab
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white font-display leading-[0.95]"
          >
            Pressure-Adjusted Value Dossier
          </motion.h1>

          <p className="mt-2 text-sm sm:text-base text-slate-200 font-primary max-w-xl leading-relaxed">
            Players ranked by estimated performance in high-leverage situations.
          </p>

          {/* Hero Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="px-3 py-1 rounded-full text-xs font-ui font-bold bg-[#1B3FA0]/40 text-[#E6ECFA] border border-[#1B3FA0]/60 backdrop-blur-sm">
              WP Leverage Index
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-ui font-bold bg-[#EA1A85]/30 text-[#FDE4F1] border border-[#EA1A85]/50 backdrop-blur-sm">
              Posterior P(Top 10)
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-ui font-bold bg-[#0A1A52]/80 text-[#E6ECFA] border border-[#1B3FA0]/50 backdrop-blur-sm">
              Empirical Bayes Shrinkage
            </span>
          </div>
        </div>

        {/* Bottom: KPI Cards & Methodology Action */}
        <div className="pt-8 border-t border-white/10 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 max-w-4xl">
              <div className="p-2.5 rounded-xl bg-[#050D2B]/85 backdrop-blur-md border border-white/10 border-t-2 border-t-[#EA1A85] shadow-sm">
                <span className="text-xs text-slate-300 block font-display uppercase tracking-wider font-bold">
                  Deliveries Analyzed
                </span>
                <span className="text-base sm:text-lg font-bold text-white font-display tabular-nums">
                  {deliveriesAnalyzed}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#050D2B]/85 backdrop-blur-md border border-white/10 border-t-2 border-t-[#EA1A85] shadow-sm">
                <span className="text-xs text-slate-300 block font-display uppercase tracking-wider font-bold">
                  Statistical Model
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#EA1A85] font-display uppercase block leading-tight mt-0.5" title={estimatorName}>
                  {estimatorName}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#050D2B]/85 backdrop-blur-md border border-white/10 border-t-2 border-t-[#EA1A85] shadow-sm">
                <span className="text-xs text-slate-300 block font-display uppercase tracking-wider font-bold truncate">
                  Primary Metric
                </span>
                <span className="text-xs font-bold text-white font-primary block leading-tight mt-0.5" title="Pressure Rating (runs per 100 pressure balls vs a league-average player in the same situation)">
                  Pressure Rating (runs / 100b)
                </span>
              </div>

              {/* Ranking Rule */}
              <div className="p-2.5 rounded-xl bg-[#050D2B]/85 backdrop-blur-md border border-white/10 border-t-2 border-t-[#EA1A85] shadow-sm">
                <span className="text-xs text-slate-300 block font-display uppercase tracking-wider font-bold">
                  Ranking Rule
                </span>
                <span className="text-xs sm:text-sm font-bold text-white font-primary block leading-tight mt-0.5" title={rankingRule}>
                  {rankingRule}
                </span>
              </div>
            </div>

            {/* Methodology Action Button */}
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

          {/* Model Pipeline Metadata Strip (Fix K) */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-300/80 pt-2 border-t border-white/5">
            <span className="inline-flex items-center gap-1.5">
              <Database className="w-3 h-3 text-[#EA1A85]" />
              <span>data_md5: <strong className="text-white">{meta.data_md5 || 'n/a'}</strong></span>
            </span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-[#1B3FA0]" />
              <span>model_fits: <strong className="text-white">{meta.model_fits ?? 'n/a'}</strong></span>
            </span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>extras_mode: <strong className="text-white">{meta.extras_mode || 'n/a'}</strong></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
