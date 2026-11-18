import React, { useState } from 'react';

export const PLAYER_IMAGE_MAP = {
  // Batters (Background Removed Transparent PNGs)
  'Abhishek Sharma': '/assets/players/Abhishek Sharma.png',
  'Suryakumar Yadav': '/assets/players/Suryakumar Yadav.png',
  'Heinrich Klaasen': '/assets/players/Heinrich Klaasen.png',
  'Tim David': '/assets/players/Tim David.png',
  'Shreyas Iyer': '/assets/players/Shreyas Iyer.png',
  'Jos Buttler': '/assets/players/Jos Buttler.png',
  'Mitchell Marsh': '/assets/players/Mitchell Marsh.png',
  'Prabhsimran Singh': '/assets/players/Prabhsimran Singh.png',
  'Sanju Samson': '/assets/players/Sanju Samson.png',
  'Glenn Maxwell': '/assets/players/Glenn Maxwell.png',

  // Bowlers (Background Removed Transparent PNGs)
  'Sunil Narine': '/assets/players/Sunil Narine.png',
  'Jasprit Bumrah': '/assets/players/Jasprit Bumrah.png',
  'Josh Hazlewood': '/assets/players/Josh Hazlewood.png',
  'Kuldeep Yadav': '/assets/players/Kuldeep Yadav.png',
  'Varun Chakravarthy': '/assets/players/Varun Chakravarthy.png',
  'Rashid Khan': '/assets/players/Rashid Khan.png',
  'Ravindra Jadeja': '/assets/players/Ravindra Jadeja.png',
  'Mustafizur Rahman': '/assets/players/Mustafizur Rahman.png',
  'Axar Patel': '/assets/players/Axar Patel.png',
  'Noor Ahmad': '/assets/players/Noor Ahmad.png',
};

/**
 * PlayerVisual renders real player cutouts when available,
 * with fallback to initials-only badges using Rajasthan Royals colors.
 */
export default function PlayerVisual({ player, variant = 'top3' }) {
  const [hasError, setHasError] = useState(false);
  const initials = player?.initials || (player?.name ? player.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '??');
  const imageSrc = !hasError && (player?.image || (player?.name && PLAYER_IMAGE_MAP[player.name]) || null);

  // Variant 1: Podium Top 3 (Expanded Size & Premium Styling)
  if (variant === 'top3') {
    return (
      <div className="relative w-full h-full min-h-[225px] flex items-center justify-center overflow-hidden p-2">
        {imageSrc ? (
          <div className="w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/60 bg-gradient-to-tr from-[#050D2B] via-[#1B3FA0] to-[#EA1A85] flex items-center justify-center select-none group-hover:scale-105 transition-transform duration-300 relative group/avatar">
            {/* Subtle inner radial glow */}
            <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-black/30 pointer-events-none" />
            <img
              src={imageSrc}
              alt={player?.name || 'Player'}
              className="w-full h-full object-contain object-bottom drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] select-none pt-1"
              onError={() => setHasError(true)}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-3xl bg-gradient-to-tr from-[#050D2B] via-[#1B3FA0] to-[#EA1A85] flex items-center justify-center shadow-2xl border-2 border-white/20 select-none">
            <span className="font-display font-black text-5xl sm:text-6xl md:text-7xl text-white tracking-widest drop-shadow-md">
              {initials}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Variant 2: Table Rows 4-10 / Mobile Card Avatar (Significantly Enlarged)
  if (variant === 'table') {
    if (imageSrc) {
      return (
        <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl overflow-hidden shadow-sm border border-slate-200/90 bg-gradient-to-tr from-[#050D2B]/10 via-[#1B3FA0]/15 to-[#EA1A85]/20 flex items-center justify-center select-none shrink-0 p-1 group-hover:border-[#EA1A85]/50 transition-colors">
          <img
            src={imageSrc}
            alt={player?.name || 'Player'}
            className="w-full h-full object-contain object-bottom drop-shadow-sm select-none"
            onError={() => setHasError(true)}
            loading="lazy"
          />
        </div>
      );
    }
    return (
      <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-[#050D2B] via-[#1B3FA0] to-[#EA1A85] flex items-center justify-center shadow-xs border border-white/20 select-none shrink-0">
        <span className="font-display font-black text-lg sm:text-xl text-white tracking-wider">
          {initials}
        </span>
      </div>
    );
  }

  // Default / Modal Variant (Enlarged)
  if (imageSrc) {
    return (
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-xl border-2 border-white/50 bg-gradient-to-tr from-[#050D2B] via-[#1B3FA0] to-[#EA1A85] flex items-center justify-center select-none shrink-0 p-1">
        <img
          src={imageSrc}
          alt={player?.name || 'Player'}
          className="w-full h-full object-contain object-bottom drop-shadow-md select-none"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#050D2B] via-[#1B3FA0] to-[#EA1A85] flex items-center justify-center shadow-xl border border-white/20 select-none shrink-0">
      <span className="font-display font-black text-4xl sm:text-5xl text-white tracking-wider">
        {initials}
      </span>
    </div>
  );
}
