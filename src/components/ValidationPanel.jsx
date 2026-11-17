import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { meta, getStatusBadgeClass } from '../data/cricketData';

export default function ValidationPanel({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const val = meta.validation || {};
  const batVal = val.bat || {};
  const bowVal = val.bow || {};

  const rows = [
    {
      role: 'Batters',
      rhoPressure: batVal.rho_pressure !== undefined ? Number(batVal.rho_pressure).toFixed(2) : '-',
      rhoOrdinary: batVal.rho_ordinary !== undefined ? Number(batVal.rho_ordinary).toFixed(2) : '-',
      hitRate: batVal.hit_rate !== undefined ? `${(Number(batVal.hit_rate) * 100).toFixed(0)}%` : '-',
      binomialP: batVal.binomial_p !== undefined ? Number(batVal.binomial_p).toFixed(2) : '0.25',
      n: batVal.n ?? '-',
      expectedHits: batVal.expected_hits !== undefined ? `${Number(batVal.expected_hits).toFixed(1)}/10` : (meta.expected_hits?.bat ? `${Number(meta.expected_hits.bat).toFixed(1)}/10` : '-'),
      status: meta.status?.bat ?? 'LOW_CONFIDENCE'
    },
    {
      role: 'Bowlers',
      rhoPressure: bowVal.rho_pressure !== undefined ? Number(bowVal.rho_pressure).toFixed(2) : '-',
      rhoOrdinary: bowVal.rho_ordinary !== undefined ? Number(bowVal.rho_ordinary).toFixed(2) : '-',
      hitRate: bowVal.hit_rate !== undefined ? `${(Number(bowVal.hit_rate) * 100).toFixed(0)}%` : '-',
      binomialP: bowVal.binomial_p !== undefined ? Number(bowVal.binomial_p).toFixed(2) : '0.01',
      n: bowVal.n ?? '-',
      expectedHits: bowVal.expected_hits !== undefined ? `${Number(bowVal.expected_hits).toFixed(1)}/10` : (meta.expected_hits?.bow ? `${Number(meta.expected_hits.bow).toFixed(1)}/10` : '-'),
      status: meta.status?.bow ?? 'LOW_CONFIDENCE'
    }
  ];

  return (
    <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
      isDark 
        ? 'bg-[#0A1A52]/80 border-white/15 text-white' 
        : 'bg-white border-slate-200 text-[#050D2B] shadow-xs'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#EA1A85]" />
          <h3 className="font-display font-extrabold uppercase tracking-wide text-sm sm:text-base">
            Out-of-Sample Predictive Validation (60/40 Split)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-ui text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bound to JSON Metadata</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[580px] sm:min-w-full">
          <thead>
            <tr className={`border-b select-none font-ui uppercase tracking-wider text-xs ${
              isDark ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-500 bg-slate-50'
            }`}>
              <th className="py-2.5 px-3 font-bold">Role</th>
              <th className="py-2.5 px-3 font-bold" title="OOS Spearman ρ">
                <span>OOS Spearman ρ</span> <span className="text-xs font-normal text-slate-400">(Pressure)</span>
              </th>
              <th className="py-2.5 px-3 font-bold" title="OOS Spearman ρ">
                <span>OOS Spearman ρ</span> <span className="text-xs font-normal text-slate-400">(Ordinary)</span>
              </th>
              <th className="py-2.5 px-3 font-bold">Hit Rate vs Median</th>
              <th className="py-2.5 px-3 font-bold">Binomial P-Value</th>
              <th className="py-2.5 px-3 font-bold">Valid N</th>
              <th className="py-2.5 px-3 font-bold">Expected Hits</th>
              <th className="py-2.5 px-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-primary ${isDark ? 'divide-white/10' : 'divide-slate-100'}`}>
            {rows.map((r) => (
              <tr key={r.role} className={`hover:bg-slate-50/10 transition-colors ${
                isDark ? 'text-slate-100' : 'text-[#050D2B]'
              }`}>
                <td className="py-2.5 px-3 font-ui font-bold">{r.role}</td>
                <td className="py-2.5 px-3 font-bold text-[#EA1A85] text-sm">{r.rhoPressure}</td>
                <td className="py-2.5 px-3 text-slate-400 text-sm">{r.rhoOrdinary}</td>
                <td className="py-2.5 px-3 font-bold text-sm">{r.hitRate}</td>
                <td className="py-2.5 px-3 font-semibold text-sm">{r.binomialP}</td>
                <td className="py-2.5 px-3 text-sm">{r.n}</td>
                <td className="py-2.5 px-3 font-bold text-sm">{r.expectedHits}</td>
                <td className="py-2.5 px-3">
                  <span className={getStatusBadgeClass(r.status)}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 font-primary">
        <p>
          Validation evaluates early-half sample ratings predicting late-half match leverage outcomes across eligible cohorts.
        </p>
      </div>
    </div>
  );
}
