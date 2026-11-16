import React, { useState } from 'react';

// Single config flag controlling placeholder photo usage
export const USE_PLACEHOLDER_PHOTOS = true;

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
 * PlayerVisual renders:
 * 1. Verified Cutout PNG from /players/cutouts/{id}.png if file exists (no placeholder badge).
 * 2. If USE_PLACEHOLDER_PHOTOS = true:
 *    - Existing player.avatar mapping rendered large & bottom-anchored in image slot.
 *    - Podium (190-210px tall): alt="Placeholder portrait of {name}" and tiny "PLACEHOLDER" badge (9px, bottom-left, grey).
 *    - Table (ranks 4-10 tile, ~80px tall): alt="Placeholder portrait of {name}" and title tooltip.
 * 3. Fallback (if flag false or image fails): neutral athletic silhouette with initials on pink-to-blue gradient tile.
 */
export default function PlayerVisual({ player, variant = 'top3' }) {
  const [cutoutFailed, setCutoutFailed] = useState(false);
  const [placeholderFailed, setPlaceholderFailed] = useState(false);

  const initials = player.initials || player.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const cutoutSrc = `/players/cutouts/${player.id}.png`;
  const placeholderSrc = player.avatar;

  // Variant 1: Podium Top 3 (190-210px tall, bottom-anchored, all identical size)
  if (variant === 'top3') {
    const cardHeight = 'h-[200px]';

    // 1. Try verified cutout first
    if (!cutoutFailed) {
      return (
        <div className={`relative w-full ${cardHeight} flex items-end justify-center overflow-hidden`}>
          <img
            src={cutoutSrc}
            alt={player.name}
            loading="lazy"
            className="w-full h-full object-contain object-bottom select-none pointer-events-none transition-transform duration-250 group-hover:scale-[1.03]"
            style={{ filter: 'drop-shadow(0 18px 24px rgba(5,13,43,0.35))' }}
            onError={() => setCutoutFailed(true)}
          />
        </div>
      );
    }

    // 2. If USE_PLACEHOLDER_PHOTOS = true, use existing avatar with bottom-left grey badge
    if (USE_PLACEHOLDER_PHOTOS && placeholderSrc && !placeholderFailed) {
      return (
        <div className={`relative w-full ${cardHeight} flex items-end justify-center overflow-hidden`}>
          {/* Pink-to-blue gradient tile behind */}
          <div className="relative w-44 sm:w-48 h-[195px] rounded-t-2xl bg-gradient-to-tr from-[#EA1A85]/25 via-[#7B1FA2]/20 to-[#1B3FA0]/25 flex items-end justify-center border-t border-x border-white/20 overflow-hidden shadow-sm">
            <img
              src={placeholderSrc}
              alt={`Placeholder portrait of ${player.name}`}
              loading="lazy"
              className="w-full h-full object-cover object-top select-none pointer-events-none transition-transform duration-250 group-hover:scale-105"
              onError={() => setPlaceholderFailed(true)}
            />
            {/* Tiny PLACEHOLDER badge (9px, bottom-left, grey) */}
            <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-900/80 text-slate-300 border border-white/10 select-none z-20 backdrop-blur-xs">
              PLACEHOLDER
            </span>
          </div>
        </div>
      );
    }

    // 3. Fallback: Neutral athletic silhouette
    return (
      <div className={`relative w-full ${cardHeight} flex items-end justify-center overflow-hidden`}>
        <div className="relative w-44 sm:w-48 h-[195px] rounded-t-2xl bg-gradient-to-tr from-[#EA1A85] via-[#7B1FA2] to-[#1B3FA0] flex flex-col items-center justify-end p-3 shadow-md border-t border-x border-white/20 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 top-2 flex items-end justify-center pointer-events-none">
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

    // 1. Try verified cutout
    if (!cutoutFailed) {
      return (
        <div className={`${tileClass} bg-gradient-to-b from-[#1B3FA0]/15 to-slate-100 border border-slate-200`}>
          <img
            src={cutoutSrc}
            alt={player.name}
            loading="lazy"
            className="w-full h-full object-contain object-bottom select-none pointer-events-none"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(5,13,43,0.25))' }}
            onError={() => setCutoutFailed(true)}
          />
        </div>
      );
    }

    // 2. If USE_PLACEHOLDER_PHOTOS = true, use existing avatar with title tooltip
    if (USE_PLACEHOLDER_PHOTOS && placeholderSrc && !placeholderFailed) {
      return (
        <div
          className={`${tileClass} bg-gradient-to-tr from-[#EA1A85]/20 via-[#7B1FA2]/15 to-[#1B3FA0]/20 border border-slate-200 shadow-xs`}
          title={`Placeholder portrait of ${player.name}`}
        >
          <img
            src={placeholderSrc}
            alt={`Placeholder portrait of ${player.name}`}
            loading="lazy"
            className="w-full h-full object-cover object-top select-none pointer-events-none"
            onError={() => setPlaceholderFailed(true)}
          />
        </div>
      );
    }

    // 3. Fallback: Neutral silhouette
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
  if (USE_PLACEHOLDER_PHOTOS && placeholderSrc && !placeholderFailed) {
    return (
      <div
        className="w-20 h-24 rounded-2xl bg-gradient-to-tr from-[#EA1A85]/20 via-[#7B1FA2]/15 to-[#1B3FA0]/20 border border-slate-200 shadow-md overflow-hidden shrink-0 relative"
        title={`Placeholder portrait of ${player.name}`}
      >
        <img
          src={placeholderSrc}
          alt={`Placeholder portrait of ${player.name}`}
          loading="lazy"
          className="w-full h-full object-cover object-top select-none pointer-events-none"
          onError={() => setPlaceholderFailed(true)}
        />
        <span className="absolute bottom-1 left-1.5 px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-slate-900/80 text-slate-300 border border-white/10 select-none z-20">
          PLACEHOLDER
        </span>
      </div>
    );
  }

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
