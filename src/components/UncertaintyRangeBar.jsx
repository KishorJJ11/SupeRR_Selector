import React from 'react';

const SCALE_MIN = -15;
const SCALE_MAX = 40;
const SCALE_SPAN = SCALE_MAX - SCALE_MIN; // 55
const ZERO_PERCENT = ((0 - SCALE_MIN) / SCALE_SPAN) * 100; // 27.27%

export default function UncertaintyRangeBar({
  ratingInterval = [0, 0],
  pressureRating = 0,
  bootRankInterval = [0, 0],
  compact = false
}) {
  const lo = ratingInterval?.[0] ?? 0;
  const hi = ratingInterval?.[1] ?? 0;
  const pt = typeof pressureRating === 'number' ? pressureRating : 0;

  const bootLo = bootRankInterval?.[0] ?? 0;
  const bootHi = bootRankInterval?.[1] ?? 0;

  const leftPercent = Math.max(0, Math.min(100, ((lo - SCALE_MIN) / SCALE_SPAN) * 100));
  const widthPercent = Math.max(2, Math.min(100 - leftPercent, ((hi - lo) / SCALE_SPAN) * 100));
  const ptPercent = Math.max(0, Math.min(100, ((pt - SCALE_MIN) / SCALE_SPAN) * 100));

  return (
    <div className="w-full select-none">
      {/* Horizontal Range Track */}
      <div className="relative w-full h-2.5 sm:h-3 bg-slate-100 rounded-full border border-slate-200 overflow-hidden shadow-inner">
        {/* Visible Zero Benchmark Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
          style={{ left: `${ZERO_PERCENT}%` }}
          title="Zero rating benchmark"
        />

        {/* [ci_lo, ci_hi] Range Bar */}
        <div
          className="absolute top-0.5 bottom-0.5 rounded-full bg-[#1B3FA0]/75 transition-colors"
          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
        />

        {/* Point Estimate Marker */}
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-[#EA1A85] rounded-full z-20 shadow-xs"
          style={{ left: `calc(${ptPercent}% - 3px)` }}
          title={`Point estimate: ${pt}`}
        />
      </div>

      {/* Axis Labels (-15, 0, +40) */}
      <div className="relative w-full text-[9px] font-mono text-slate-400 mt-0.5 flex justify-between select-none leading-none">
        <span>-15</span>
        <span
          style={{ position: 'absolute', left: `${ZERO_PERCENT}%`, transform: 'translateX(-50%)' }}
          className="font-bold text-slate-600"
        >
          0
        </span>
        <span>+40</span>
      </div>

      {/* Numeric CI Lines */}
      <div className={`mt-1 font-mono ${compact ? 'text-[10px]' : 'text-[11px]'} text-slate-600 space-y-0.5`}>
        <div className="whitespace-nowrap">
          Rating CI: [{lo}, {hi}]
        </div>
        <div className="text-slate-500 whitespace-nowrap text-[10px]">
          Boot: [{bootLo}, {bootHi}]
        </div>
      </div>
    </div>
  );
}
