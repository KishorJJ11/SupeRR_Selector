import React from 'react';

export default function RajasthanRoyalsLogo({ className = "h-13 sm:h-16", alt = "Rajasthan Royals" }) {
  return (
    <div className="flex items-center shrink-0">
      <img 
        src="/assets/RR_logo.png" 
        alt={alt} 
        className={`w-auto object-contain select-none transition-transform hover:scale-105 duration-200 ${className}`}
      />
    </div>
  );
}

