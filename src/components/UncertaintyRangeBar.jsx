import React from 'react';
import { formatInterval, cleanAxisTick } from '../utils/formatters';

export default function UncertaintyRangeBar({
  ratingInterval,
  pressureRating,
  bootRankInterval,
  domain,
  compact = false
}) {
  if (!ratingInterval || !Array.isArray(ratingInterval) || ratingInterval.length < 2) {
    return <span className="text-xs text-slate-400 font-primary">n/a</span>;
  }

  const lo = Number(ratingInterval[0]);
  const hi = Number(ratingInterval[1]);
  if (isNaN(lo) || isNaN(hi)) {
    return <span className="text-xs text-slate-400 font-primary">n/a</span>;
  }

  const pt = typeof pressureRating === 'number' && !isNaN(pressureRating) ? pressureRating : null;

  // Use dynamic domain from visible tab plus 5% padding, or fallback cleanly
  const dMin = domain?.min !== undefined ? domain.min : Math.min(0, lo) - 2;
  const dMax = domain?.max !== undefined ? domain.max : Math.max(0, hi) + 2;
  const span = dMax - dMin > 0 ? dMax - dMin : 1;

  const zeroPercent = Math.max(0, Math.min(100, ((0 - dMin) / span) * 100));
  const leftPercent = Math.max(0, Math.min(100, ((lo - dMin) / span) * 100));
  const rightPercent = Math.max(0, Math.min(100, ((hi - dMin) / span) * 100));
  const widthPercent = Math.max(1.5, rightPercent - leftPercent);
  const ptPercent = pt !== null ? Math.max(0, Math.min(100, ((pt - dMin) / span) * 100)) : null;

  // Only show Boot line if bootRankInterval exists and values >= 1 (Fix A)
  const hasValidBoot = Array.isArray(bootRankInterval) &&
                       bootRankInterval.length === 2 &&
                       bootRankInterval.every(v => typeof v === 'number' && v >= 1);

  const formattedCI = formatInterval([lo, hi]);

  return (
    <div className="w-full select-none">
      {/* Horizontal Range Track */}
      <div className="relative w-full h-3 bg-slate-100 rounded-full border border-slate-200 overflow-visible shadow-inner my-1">
        {/* Visible Zero Benchmark Line */}
        <div
          className="absolute -top-1 -bottom-1 w-0.5 bg-slate-400 z-10"
          style={{ left: `${zeroPercent}%` }}
          title="Zero rating benchmark (eligible pool average)"
        />

        {/* [ci_lo, ci_hi] Range Bar */}
        <div
          className="absolute top-0.5 bottom-0.5 rounded-full bg-[#1B3FA0]/75 transition-all"
          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
          title={`90% CI: ${formattedCI}`}
        />

        {/* Point Estimate Dot */}
        {ptPercent !== null && (
          <div
            className="absolute top-1/2 w-3.5 h-3.5 bg-[#EA1A85] rounded-full z-20 shadow-xs border-2 border-white -translate-y-1/2"
            style={{ left: `calc(${ptPercent}% - 7px)` }}
            title={`Point estimate: ${pt >= 0 ? `+${pt.toFixed(2)}` : pt.toFixed(2)}`}
          />
        )}
      </div>

      {/* Dynamic Axis Labels (formatted v => Math.round(v) || 0; zero tick label below the line; no collisions) */}
      <div className="relative w-full text-[11px] font-ui text-slate-500 mt-1 flex justify-between select-none leading-none">
        <span>{cleanAxisTick(dMin)}</span>
        {zeroPercent > 12 && zeroPercent < 88 && (
          <span
            style={{ position: 'absolute', left: `${zeroPercent}%`, transform: 'translateX(-50%)' }}
            className="font-bold text-slate-700"
          >
            0
          </span>
        )}
        <span>{cleanAxisTick(dMax)}</span>
      </div>

      {/* Numeric CI Lines */}
      {!compact && (
        <div className="mt-1 font-primary text-xs text-slate-700 space-y-0.5 leading-tight">
          <div className="whitespace-nowrap">
            Rating CI: {formattedCI}
          </div>
          {hasValidBoot && (
            <div className="text-slate-500 whitespace-nowrap text-[11px]">
              Boot: [{bootRankInterval[0]}, {bootRankInterval[1]}]
            </div>
          )}
        </div>
      )}
    </div>
  );
}
