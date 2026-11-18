import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cpu, CheckCircle, Code, Copy, Check } from 'lucide-react';
import { methodologyInfo } from '../data/cricketData.js';
import ValidationPanel from './ValidationPanel.jsx';

export default function MethodologyModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' or 'code'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonScript = `# Rajasthan Royals Pressure Analytics Pipeline
# Run-Expectancy Matrices, Win-Probability Leverage, Empirical Bayes Shrinkage
import pandas as pd
import numpy as np

# 1. Terminal Run Expectancy (RE) Fitted via Monotonic Gradient Boosting
# 2. Win Probability (WP) & Leverage Index: LI = E_{outcome}[ |WP_next - WP_curr| ] / mean(LI)
# 3. High Leverage Pressure Filter: Top 20% acute match leverage (lev_p = 1)
# 4. Iterative Multi-Factor Opposition Adjustments (Backfitting)
# 5. Empirical Bayes Rate Shrinkage (Per 100 Pressure Balls)
# 6. Posterior Ranking: E_{posterior}[Rank | Data]
# 7. Cluster Bootstrap: p_top10 and 90% Bayesian Credible Intervals [lo, hi]
top10_batters = bat_elig.sort_values(by='pTop10Post', ascending=False).head(10)
top10_bowlers = bow_elig.sort_values(by='pTop10Post', ascending=False).head(10)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-3xl rounded-3xl bg-[#050D2B] p-6 sm:p-8 border border-white/20 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-white"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-[#EA1A85] text-white/80 hover:text-white transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85]"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-[#EA1A85]/20 border border-[#EA1A85]/50 flex items-center justify-center text-[#EA1A85] shadow-xs shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-tight">
                {methodologyInfo.title}
              </h3>
              <p className="text-xs text-[#FDE4F1] font-ui font-bold">
                {methodologyInfo.version}
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 mb-4 p-1 rounded-full bg-[#0A1A52]/80 border border-white/10">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex-1 py-2 text-xs font-ui uppercase tracking-wider font-bold rounded-full transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-[#EA1A85] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Methodology &amp; Mathematical Formulas
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 py-2 text-xs font-ui uppercase tracking-wider font-bold rounded-full transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-[#EA1A85] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Python ML Pipeline Code</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {activeTab === 'pipeline' ? (
              <>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-primary">
                  {methodologyInfo.description}
                </p>

                {/* Analytical Pillars */}
                <div className="space-y-3">
                  {methodologyInfo.factors.map((f, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-[#0A1A52]/70 border border-white/10 space-y-1.5 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-white font-display uppercase tracking-wide">
                          {f.name}
                        </h4>
                        <span className="text-xs font-ui px-2.5 py-0.5 rounded-full bg-[#EA1A85]/20 text-[#FDE4F1] border border-[#EA1A85]/40 font-bold">
                          {f.formula}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-primary">
                        {f.meaning}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Validation Panel Bound Directly to Metadata */}
                <ValidationPanel theme="dark" />

                <div className="p-3.5 rounded-2xl bg-[#0A1A52]/80 border border-emerald-500/40 flex items-center gap-3 text-xs text-emerald-300 shadow-sm font-primary">
                  <CheckCircle className="w-4 h-4 text-[#10e588] shrink-0" />
                  <span>
                    Directly integrated with the machine learning script saved at <code>ml_model/rr_pressure_system.py</code>.
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-ui text-[#FDE4F1] font-semibold">
                    ml_model/rr_pressure_system.py
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EA1A85] text-xs font-ui uppercase tracking-wider font-bold text-white hover:bg-[#C4106C] shadow-sm transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[360px]">
                  <pre className="whitespace-pre">{pythonScript}</pre>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0A1A52]/70 border border-white/10 text-xs text-slate-200 shadow-sm font-primary">
                  <strong className="text-[#EA1A85] font-display uppercase tracking-wider">Instructions for your CSVs:</strong>
                  <p className="mt-1 text-slate-300 font-primary">
                    Place your <code>ball_by_ball.csv</code> and <code>matches.csv</code> inside the extracted folder and run <code>python ml_model/rr_pressure_system.py</code> to regenerate custom team analytics.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
