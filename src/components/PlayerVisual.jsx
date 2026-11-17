import React from 'react';

// Neutral Athletic Silhouette (SVG Bust)
function SilhouetteBust({ className = "w-full h-full text-white/30" }) {
  return (
    <svg viewBox="0 0 100 120" fill="currentColor" className={className} preserveAspectRatio="xMidYMax meet">
      {/* Head */}
      <circle cx="50" cy="38" r="20" />
      {/* Neck */}
      <path d="M44 54 H56 V64 H44 Z" />
      {/* Shoulders & Athletic Torso */}
      <path d="M12 118 C12 86, 26 66, 50 66 C74 66, 88 86, 88 118 Z" />
    </svg>
  );
}

/**
 * PlayerVisual renders generic athletic silhouettes (no duplicated photos)
 * with the player's initials on Rajasthan Royals pink-to-blue gradient.
 */
export default function PlayerVisual({ player, variant = 'top3' }) {
  const initials = player.initials || player.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  // Variant 1: Podium Top 3 (190-210px tall, bottom-anchored, all identical size)
  if (variant === 'top3') {
    return (
      <div className="relative w-full h-[200px] flex items-end justify-center overflow-hidden">
        <div className="relative w-44 sm:w-48 h-[195px] rounded-t-2xl bg-gradient-to-tr from-[#EA1A85] via-[#7B1FA2] to-[#1B3FA0] flex flex-col items-center justify-end p-3 shadow-md border-t border-x border-white/20 overflow-hidden">
          <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
            <SilhouetteBust className="w-full h-full text-white/25" />
          </div>
          <div className="relative z-10 mb-4 text-center select-none">
            <span className="font-display font-black text-3xl sm:text-4xl text-white tracking-widest drop-shadow-md">
              {initials}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Variant 2: Table Rows 4-10 (tile about 80px tall)
  if (variant === 'table') {
    const tileClass = "w-14 sm:w-16 h-18 sm:h-20 rounded-xl flex items-end justify-center overflow-hidden shrink-0 relative";
    return (
      <div className={`${tileClass} bg-gradient-to-tr from-[#EA1A85] via-[#7B1FA2] to-[#1B3FA0] p-1 shadow-xs border border-white/20`}>
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
          <SilhouetteBust className="w-full h-full text-white/30" />
        </div>
        <span className="relative z-10 font-display font-black text-base sm:text-lg text-white tracking-wider mb-1 select-none">
          {initials}
        </span>
      </div>
    );
  }

  // Default / Modal Variant
  return (
    <div className="w-20 h-24 rounded-2xl bg-gradient-to-tr from-[#EA1A85] via-[#7B1FA2] to-[#1B3FA0] flex flex-col items-center justify-end p-2 shadow-lg border border-white/20 overflow-hidden shrink-0 relative">
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
        <SilhouetteBust className="w-full h-full text-white/30" />
      </div>
      <span className="relative z-10 font-display font-black text-2xl text-white tracking-wider mb-2 select-none">
        {initials}
      </span>
    </div>
  );
}
