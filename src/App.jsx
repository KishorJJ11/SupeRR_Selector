import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Header from './components/Header.jsx';
import HeroSection from './components/HeroSection.jsx';
import BattersView from './components/BattersView.jsx';
import BowlersView from './components/BowlersView.jsx';
import SquadFitView from './components/SquadFitView.jsx';
import PlayerModal from './components/PlayerModal.jsx';
import ZipExporterModal from './components/ZipExporterModal.jsx';
import MethodologyModal from './components/MethodologyModal.jsx';
import ValidationPanel from './components/ValidationPanel.jsx';
import WhatCountsAsPressure from './components/WhatCountsAsPressure.jsx';
import { batters, bowlers } from './data/cricketData.js';
import consensusJson from './data/consensus_frontend.json';
import { validateConsensusData } from './types/schema.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('batters'); // 'batters', 'bowlers', 'squad_fit'
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isHowToReadOpen, setIsHowToReadOpen] = useState(false); // Collapsed by default (Fix N)

  // Contract Schema Validation Check
  const validation = validateConsensusData(consensusJson);

  // Check if any player has valid bootstrap rank interval (Fix A)
  const hasAnyBootCI = [...batters, ...bowlers].some(
    p => Array.isArray(p.bootRankInterval) && p.bootRankInterval.length === 2 && p.bootRankInterval.every(v => v >= 1)
  );

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#050D2B] flex flex-col relative selection:bg-[#EA1A85] selection:text-white font-primary overflow-x-hidden">
      {/* Schema Validation Error Banner */}
      {!validation.isValid && (
        <div className="bg-red-600 text-white p-4 font-mono text-sm border-b-4 border-red-800 z-50">
          <div className="font-bold text-base mb-1 uppercase tracking-wide flex items-center gap-2">
            <span>⚠ DATA CONTRACT VIOLATION: Required keys missing in consensus_frontend.json</span>
          </div>
          <p className="text-xs text-red-100 mb-2">
            The dataset failed schema contract validation. The following required keys must be provided:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-xs bg-red-700/60 p-2.5 rounded-lg max-h-48 overflow-y-auto">
            {validation.missingKeys.map((key, idx) => (
              <li key={idx} className="font-semibold text-amber-200">{key}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Top Navy Band (Navbar + Edge-to-Edge Hero) */}
      <div className="w-full bg-[#050D2B] text-white">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
        />

        <HeroSection
          onOpenMethodology={() => setIsMethodologyOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-[min(96vw,1760px)] max-w-[1760px] mx-auto px-6 py-5 sm:py-8 pb-20 overflow-x-hidden">
        
        {/* Category Navigation Bar (Batters, Bowlers, Squad Fit) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('batters')}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-display uppercase tracking-wider font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] cursor-pointer ${
                activeTab === 'batters'
                  ? 'text-[#EA1A85]'
                  : 'text-[#050D2B]/70 hover:text-[#050D2B] hover:bg-slate-100'
              }`}
            >
              <span>Batters</span>
              {activeTab === 'batters' && (
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
              <span>Bowlers</span>
              {activeTab === 'bowlers' && (
                <motion.div
                  layoutId="categoryUnderline"
                  className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#EA1A85] rounded-full"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('squad_fit')}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-display uppercase tracking-wider font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] cursor-pointer ${
                activeTab === 'squad_fit'
                  ? 'text-[#EA1A85]'
                  : 'text-[#050D2B]/70 hover:text-[#050D2B] hover:bg-slate-100'
              }`}
            >
              <span>Squad Fit</span>
              {activeTab === 'squad_fit' && (
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
              Top 10 selected by P(Top 10), ordered by Expected Rank
            </span>
          </div>
        </div>

        {/* Selected Category Content */}
        {activeTab === 'batters' && (
          <BattersView
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

        {activeTab === 'squad_fit' && (
          <SquadFitView
            onSelectPlayer={(player) => setSelectedPlayer(player)}
          />
        )}

        {/* What Counts As Pressure Distribution Panel (Fix I - Hidden on squad_fit tab) */}
        {activeTab !== 'squad_fit' && <WhatCountsAsPressure />}

        {/* Validation Panel: Out-of-Sample Reliability (Fix J - Hidden on squad_fit tab) */}
        {activeTab !== 'squad_fit' && (
          <div className="mb-8">
            <ValidationPanel theme="light" />
          </div>
        )}

        {/* Collapsible 'How to read this' Panel - Moved BELOW Rankings (Fix N - Hidden on squad_fit tab) */}
        {activeTab !== 'squad_fit' && (
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
                      Runs added (batters) or saved (bowlers) per 100 pressure balls vs a league-average player in the same situation.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <span className="font-display uppercase font-bold text-[#EA1A85] block tracking-wide">
                      P(Top 10)
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
                      90% credible interval on pressure rating.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <span className="font-display uppercase font-bold text-slate-700 block tracking-wide">
                      Ordinary rating
                    </span>
                    <p className="mt-1 text-slate-700 font-primary leading-relaxed">
                      Baseline performance rating in non-pressure situations (runs added or saved per 100 balls vs a league-average player in the same situation).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <span className="font-display uppercase font-bold text-[#EA1A85] block tracking-wide">
                      Delta vs usual
                    </span>
                    <p className="mt-1 text-slate-700 font-primary leading-relaxed">
                      Pressure rating minus ordinary baseline rating. Measures performance uplift or drop under acute match pressure (n.s. if credible interval spans zero).
                    </p>
                  </div>

                  {hasAnyBootCI && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="font-display uppercase font-bold text-[#1B3FA0] block tracking-wide">
                        Bootstrap Rank CI
                      </span>
                      <p className="mt-1 text-slate-700 font-primary leading-relaxed">
                        90% confidence interval on rank from bootstrap resamples.
                      </p>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <span className="font-display uppercase font-bold text-[#050D2B] block tracking-wide">
                      Bag-fit agreement
                    </span>
                    <p className="mt-1 text-slate-700 font-primary leading-relaxed">
                      Share of the bagged model fits that place the player in the top 10 (model variance only, not sampling uncertainty).
                    </p>
                  </div>
                </div>

                {/* Guide Footnote */}
                <div className="mt-3.5 pt-3 border-t border-slate-200/70 text-[11px] text-slate-500 font-primary italic">
                  Note: 90% intervals include zero (zero = league-average player in the same situation).
                </div>
              </div>
            )}
          </div>
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
