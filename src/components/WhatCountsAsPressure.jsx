import React from 'react';
import { Gauge } from 'lucide-react';
import { meta } from '../data/cricketData';

export default function WhatCountsAsPressure() {
  const profile = meta?.pressure_profile;

  // Strict Statistical Rule: If key is missing or empty, render nothing (no typed-in numbers)
  if (!profile || !Array.isArray(profile) || profile.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl p-4 sm:p-5 border bg-white border-slate-200 text-[#050D2B] shadow-xs mb-8">
      <div className="flex items-center gap-2 mb-2 pb-2.5 border-b border-slate-100">
        <Gauge className="w-4 h-4 text-[#EA1A85]" />
        <h3 className="font-display font-extrabold uppercase tracking-wide text-sm sm:text-base text-[#050D2B]">
          What Counts as Pressure
        </h3>
      </div>

      <p className="text-xs sm:text-sm text-slate-600 font-primary leading-relaxed mb-4">
        Pressure deliveries are defined via cross-fitted Win-Probability Leverage Index (LI &ge; top 20% acute leverage quantile). 
        The distribution below contrasts deliveries under acute match pressure against ordinary deliveries directly from model diagnostics.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 select-none font-ui uppercase tracking-wider text-xs text-slate-500 bg-slate-50">
              <th className="py-2.5 px-3 font-bold">situation</th>
              <th className="py-2.5 px-3 font-bold">deliveries</th>
              <th className="py-2.5 px-3 font-bold">avg_leverage</th>
              <th className="py-2.5 px-3 font-bold">pct_2nd_innings</th>
              <th className="py-2.5 px-3 font-bold">avg_wickets_lost</th>
              <th className="py-2.5 px-3 font-bold">avg_balls_left</th>
              <th className="py-2.5 px-3 font-bold">avg_required_rate</th>
              <th className="py-2.5 px-3 font-bold">pct_powerplay</th>
              <th className="py-2.5 px-3 font-bold">pct_middle</th>
              <th className="py-2.5 px-3 font-bold">pct_death</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-primary text-xs">
            {profile.map((row, idx) => {
              const sitStr = row.situation || row.flag || row.Situation || '';
              const isPressure = String(sitStr).toLowerCase().includes('pressure');
              const formatPct = (val) => (val !== undefined && val !== null ? `${Number(val).toFixed(1)}%` : 'n/a');
              return (
                <tr key={idx} className={isPressure ? 'bg-[#FDE4F1]/30 font-semibold' : 'hover:bg-slate-50/50'}>
                  <td className="py-2.5 px-3 font-ui font-bold">
                    <span className={isPressure ? 'text-[#EA1A85]' : 'text-slate-700'}>
                      {sitStr}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 tabular-nums font-medium">
                    {row.deliveries ? Number(row.deliveries).toLocaleString() : 'n/a'}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">
                    {row.avg_leverage !== undefined ? Number(row.avg_leverage).toFixed(2) : 'n/a'}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">
                    {formatPct(row.pct_2nd_innings)}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">
                    {row.avg_wickets_lost !== undefined ? Number(row.avg_wickets_lost).toFixed(2) : (row.avg_wkts_lost !== undefined ? Number(row.avg_wkts_lost).toFixed(2) : 'n/a')}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">
                    {row.avg_balls_left !== undefined ? Number(row.avg_balls_left).toFixed(1) : 'n/a'}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">
                    {row.avg_required_rate !== undefined ? Number(row.avg_required_rate).toFixed(2) : (row.avg_req_rate !== undefined ? Number(row.avg_req_rate).toFixed(2) : 'n/a')}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">
                    {formatPct(row.pct_powerplay)}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">
                    {formatPct(row.pct_middle)}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">
                    {formatPct(row.pct_death)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
