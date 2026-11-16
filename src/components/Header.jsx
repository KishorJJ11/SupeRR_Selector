import React, { useState, useEffect } from 'react';
import RajasthanRoyalsLogo from './RajasthanRoyalsLogo.jsx';
import { Download, BookOpen } from 'lucide-react';

// Custom Cricket Batsman Icon
function BatsmanIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" />
      <path d="m15 8-3 5-3-2" />
      <path d="M14 11l4-2 3 5-2 1-3-4" />
      <path d="M9 13l-4 7" />
      <path d="M12 13l3 7" />
    </svg>
  );
}

// Custom Cricket Bowler Icon
function BowlerIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" />
      <path d="M7 11c1.5-2 3-3 5-3s3.5 1 5 3" />
      <path d="M12 8v5" />
      <path d="M9 13l-2 7" />
      <path d="M15 13l2 7" />
      <path d="m5 7 3 2" />
      <circle cx="19" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onOpenExport, 
  onOpenMethodology,
  onOpenScout 
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'hitters', label: 'Hitters', icon: BatsmanIcon },
    { id: 'bowlers', label: 'Bowlers', icon: BowlerIcon },
  ];

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-200 ${
      scrolled 
        ? 'bg-[#050D2B]/95 backdrop-blur-md shadow-lg shadow-[#050D2B]/50' 
        : 'bg-[#050D2B]/90 backdrop-blur-sm'
    }`}>
      <div className="w-[min(96vw,1760px)] max-w-[1760px] mx-auto px-6 h-[72px] sm:h-20 flex items-center justify-between gap-2 sm:gap-3">
        
        {/* Left: Official Rajasthan Royals Brand Logo (Uploaded by User, Background Removed) */}
        <div className="flex items-center shrink-0">
          <RajasthanRoyalsLogo className="h-13 sm:h-16" />
        </div>

        {/* Centre: Pill Segmented Control (Compact on mobile) */}
        <nav 
          aria-label="Player category navigation"
          className="flex items-center p-0.5 sm:p-1 rounded-full bg-[#0A1A52]/90 border border-white/10 shadow-inner"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-display uppercase tracking-wider font-bold transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85] ${
                  isActive
                    ? 'bg-[#EA1A85] text-white shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isActive ? 'text-white' : 'text-white/60'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={onOpenMethodology}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-display uppercase tracking-wider font-bold text-white/85 hover:text-white bg-transparent hover:bg-white/10 border border-white/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85]"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#EA1A85]" />
            <span>Model notes</span>
          </button>

          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-display uppercase tracking-wider font-bold text-white bg-[#EA1A85] hover:bg-[#C4106C] border border-[#EA1A85] transition-all shadow-xs active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Export ZIP</span>
            <span className="sm:hidden text-[11px]">ZIP</span>
          </button>
        </div>
      </div>

      {/* Thin Pink Gradient Accent Line at Bottom */}
      <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#EA1A85] to-transparent opacity-80" />
    </header>
  );
}
