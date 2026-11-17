import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Header from './components/Header.jsx';
import HeroSection from './components/HeroSection.jsx';
import HittersView from './components/HittersView.jsx';
import BowlersView from './components/BowlersView.jsx';
import PlayerModal from './components/PlayerModal.jsx';
import ZipExporterModal from './components/ZipExporterModal.jsx';
import MethodologyModal from './components/MethodologyModal.jsx';
import ValidationPanel from './components/ValidationPanel.jsx';
import { batters, bowlers } from './data/cricketData.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('hitters'); // 'hitters', 'bowlers'
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isHowToReadOpen, setIsHowToReadOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#050D2B] flex flex-col relative selection:bg-[#EA1A85] selection:text-white font-primary overflow-x-hidden">
      
      {/* Top Navy Band (Navbar + Full Bleed Edge-to-Edge Hero) */}
      <div className="w-full bg-[#050D2B] text-white">
        {/* Sticky Navy Navigation Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
        />

        {/* Full-bleed Edge-to-Edge Hero Section */}
        <HeroSection
          onOpenMethodology={() => setIsMethodologyOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
        />
      </div>

      {/* Light Content Area Below Hero (#F4F6FB) Aligned to min(96vw, 1760px) container with 80px bottom padding */}
      <main className="relative z-10 flex-1 w-[min(96vw,1760px)] max-w-[1760px] mx-auto px-6 py-5 sm:py-8 pb-20 overflow-x-hidden">
        
        {/* Category Navigation Bar on Light Background */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('hitters')}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-display uppercase tracking-wider font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] cursor-pointer ${
                activeTab === 'hitters'
                  ? 'text-[#EA1A85]'
                  : 'text-[#050D2B]/70 hover:text-[#050D2B] hover:bg-slate-100'
              }`}
            >
              <span>Batting leverage</span>
              {activeTab === 'hitters' && (
                <motion.div
                  layoutId="categoryUnderline"
                  className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#EA1A85] rounded-full"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('bowlers')}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-display uppercase tracking-wider font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] cursor-pointer ${
                activeTab === 'bowlers'
                  ? 'text-[#EA1A85]'
                  : 'text-[#050D2B]/70 hover:text-[#050D2B] hover:bg-slate-100'
              }`}
            >
              <span>Bowling surge</span>
              {activeTab === 'bowlers' && (
                <motion.div
                  layoutId="categoryUnderline"
                  className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#EA1A85] rounded-full"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 pr-3">
            <span className="text-xs font-ui text-slate-500 font-semibold">
              V14 Consensus Engine
            </span>
          </div>
        </div>

        {/* Visible Confidence Tier Legend Bar (Item 4) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-display uppercase tracking-wider font-bold text-xs sm:text-sm text-[#050D2B]">
              Confidence Tier Legend:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-ui font-bold text-xs bg-[#EA1A85] text-white shadow-xs">
              <span>Tier A</span>
              <span className="opacity-90 font-normal">(&ge; 90%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-ui font-bold text-xs bg-[#1B3FA0] text-white shadow-xs">
              <span>Tier B</span>
              <span className="opacity-90 font-normal">(&ge; 75%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-ui font-bold text-xs bg-[#FDE4F1] text-[#EA1A85] border border-[#EA1A85]/40">
              <span>Tier C</span>
              <span className="opacity-90 font-normal">(&ge; 60%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-ui font-semibold text-xs bg-slate-100 text-[#050D2B] border border-slate-300 border-dashed">
              <span>Low Confidence</span>
              <span className="text-slate-500 font-normal">(&lt; 60%)</span>
            </span>
          </div>
        </div>

        {/* Collapsible 'How to read this' Panel with Exact Definitions (Copy Change #2) */}
        <div className="mb-4 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden transition-all">
          <button
            onClick={() => setIsHowToReadOpen(!isHowToReadOpen)}
            className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-50/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] cursor-pointer"
            aria-expanded={isHowToReadOpen}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#EA1A85]" />
              <span className="font-display font-bold uppercase tracking-wider text-xs sm:text-sm text-[#050D2B]">
                How to read this (Model Notes)
              </span>
              <span className="text-xs text-slate-400 font-primary hidden sm:inline">
                (Click to {isHowToReadOpen ? 'collapse' : 'expand'} metric definitions)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-ui font-semibold text-[#1B3FA0]">
              <span>{isHowToReadOpen ? 'Hide Guide' : 'Metric Definitions'}</span>
              {isHowToReadOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isHowToReadOpen && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/40">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="font-display uppercase font-bold text-[#EA1A85] block tracking-wide">
                    Pressure Rating
                  </span>
                  <p className="mt-1 text-slate-700 font-primary leading-relaxed">
                    Runs added (batters) or saved (bowlers) per 100 pressure balls vs eligible peers.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="font-display uppercase font-bold text-[#EA1A85] block tracking-wide">
                    P(top 10)
                  </span>
                  <p className="mt-1 text-slate-700 font-primary leading-relaxed">
                    Posterior probability of being among the true top 10 under match pressure.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="font-display uppercase font-bold text-[#050D2B] block tracking-wide">
                    Expected Rank
                  </span>
                  <p className="mt-1 text-slate-700 font-primary leading-relaxed">
                    Mean rank across posterior simulations (lower is better).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="font-display uppercase font-bold text-[#1B3FA0] block tracking-wide">
                    Rating CI
                  </span>
                  <p className="mt-1 text-slate-700 font-primary leading-relaxed">
                    90% credible interval on rating.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="font-display uppercase font-bold text-[#1B3FA0] block tracking-wide">
                    Bootstrap Rank CI
                  </span>
                  <p className="mt-1 text-slate-700 font-primary leading-relaxed">
                    90% confidence interval on rank from bootstrap resamples.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="font-display uppercase font-bold text-[#EA1A85] block tracking-wide">
                    Delta vs Usual
                  </span>
                  <p className="mt-1 text-slate-700 font-primary leading-relaxed">
                    Pressure rating minus ordinary (non-pressure) rating.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs md:col-span-2 lg:col-span-3">
                  <span className="font-display uppercase font-bold text-[#050D2B] block tracking-wide">
                    Model-fragility flag
                  </span>
                  <p className="mt-1 text-slate-700 font-primary leading-relaxed">
                    Model-fragility flag: indicates significant divergence (&gt;30%) between ensemble fits and mixture posterior top 10 probability.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validation Panel Below Model Notes (Item 5) */}
        <div className="mb-8">
          <ValidationPanel theme="light" />
        </div>

        {/* Selected Category Content */}
        {activeTab === 'hitters' && (
          <HittersView
            batters={batters}
            onSelectPlayer={(player) => setSelectedPlayer(player)}
          />
        )}

        {activeTab === 'bowlers' && (
          <BowlersView
            bowlers={bowlers}
            onSelectPlayer={(player) => setSelectedPlayer(player)}
          />
        )}
      </main>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* ZIP Codebase Exporter Modal */}
      <ZipExporterModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* ML Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
}
