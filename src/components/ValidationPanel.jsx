import React from 'react';
import { Activity, Info } from 'lucide-react';
import { meta, getStatusBadgeClass } from '../data/cricketData';
import { formatInterval } from '../utils/formatters';

export default function ValidationPanel({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const val = meta?.validation;

  if (!val) {
    return null;
  }

  // Handle both array and object { method, metrics } structures
  const metrics = Array.isArray(val) ? val : (Array.isArray(val.metrics) ? val.metrics : null);
  const method = typeof val === 'object' && val.method ? val.method : 'Out-of-Sample Predictive Reliability';

  if (!metrics || metrics.length === 0) {
    return null;
  }

  const formatRho = (val) => {
    if (val === undefined || val === null) return 'n/a';
    const num = Number(val);
    if (isNaN(num)) return 'n/a';
    return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
  };

  const formatSkill = (val) => {
    if (val === undefined || val === null) return 'n/a';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return num.toFixed(2);
  };

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
            Out-of-Sample Validation
          </h3>
        </div>
        <div className="text-xs font-ui text-slate-500">
          <span>{method}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[760px]">
          <thead>
            <tr className={`border-b select-none font-ui uppercase tracking-wider text-xs ${
              isDark ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-500 bg-slate-50'
            }`}>
              <th className="py-2.5 px-3 font-bold">Role</th>
              <th className="py-2.5 px-3 font-bold">Split</th>
              <th className="py-2.5 px-3 font-bold">N</th>
              <th className="py-2.5 px-3 font-bold">Pressure rho</th>
              <th className="py-2.5 px-3 font-bold">90% CI</th>
              <th className="py-2.5 px-3 font-bold">Ordinary rho</th>
              <th className="py-2.5 px-3 font-bold">Skill (pressure)</th>
              <th className="py-2.5 px-3 font-bold">Skill (ordinary)</th>
              <th className="py-2.5 px-3 font-bold">P-O dMSE 90%</th>
              <th className="py-2.5 px-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-primary ${isDark ? 'divide-white/10' : 'divide-slate-100'}`}>
            {metrics.map((r, idx) => {
              const roleName = r.Role ?? r.role ?? 'n/a';
              const isBat = String(roleName).toLowerCase().includes('bat');
              const roleStatus = meta?.status?.[isBat ? 'bat' : 'bow'] || r.Status || r.status || (typeof meta?.status === 'string' ? meta.status : 'LOW_CONFIDENCE');
              const statusRule = meta?.status_rule || r.status_rule || 'MODERATE if OOS rho 90% CI lower bound > 0 and expected hits >= 6, else LOW';
              const splitVal = r.Split ?? r.split ?? 'n/a';
              const nVal = r.N ?? r['Valid N'] ?? r.n ?? r.valid_n ?? 'n/a';
              
              const pRho = r['Pressure rho'] ?? r['Pressure ρ'] ?? r.rho_pressure ?? r.pressure_rho;
              const ordRho = r['Ordinary rho'] ?? r['Ordinary ρ'] ?? r.rho_ordinary ?? r.ordinary_rho;
              
              const ci = r['90% CI'] || ((r['ρ CI Lo'] !== undefined && r['ρ CI Hi'] !== undefined) ? [r['ρ CI Lo'], r['ρ CI Hi']] : r.ci);
              const formattedCI = Array.isArray(ci) && ci.length === 2 ? formatInterval(ci) : (ci || 'n/a');

              const skillPressure = r['Skill (pressure)'] ?? r.skill_pressure;
              const skillOrdinary = r['Skill (ordinary)'] ?? r.skill_ordinary;
              const poDmse = r['P-O dMSE 90%'] ?? r.po_dmse_90 ?? 'n/a';

              return (
                <tr key={idx} className={`hover:bg-slate-50/10 transition-colors ${
                  isDark ? 'text-slate-100' : 'text-[#050D2B]'
                }`}>
                  <td className="py-2.5 px-3 font-ui font-bold">{roleName}</td>
                  <td className="py-2.5 px-3 tabular-nums">{splitVal}</td>
                  <td className="py-2.5 px-3 text-sm tabular-nums">{nVal}</td>
                  <td className="py-2.5 px-3 font-bold text-[#EA1A85] text-sm tabular-nums">
                    {formatRho(pRho)}
                  </td>
                  <td className="py-2.5 px-3 text-sm tabular-nums font-mono text-[11px]">
                    {formattedCI}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-sm tabular-nums">
                    {formatRho(ordRho)}
                  </td>
                  <td className="py-2.5 px-3 text-sm tabular-nums">
                    {formatSkill(skillPressure)}
                  </td>
                  <td className="py-2.5 px-3 text-sm tabular-nums">
                    {formatSkill(skillOrdinary)}
                  </td>
                  <td className="py-2.5 px-3 text-sm tabular-nums font-mono text-[11px]">
                    {poDmse}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`${getStatusBadgeClass(roleStatus)} cursor-help inline-flex items-center gap-1`}
                      title={statusRule}
                    >
                      <span>{roleStatus}</span>
                      <Info className="w-3 h-3 opacity-75" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Below the table: render meta.oos_summary.Batters and .Bowlers verbatim, plus meta.oos_note */}
      {meta?.oos_summary && (
        <div className="mt-4 pt-3.5 border-t border-slate-200/70 text-xs text-slate-700 space-y-1.5 font-primary leading-relaxed">
          {meta.oos_summary.Batters && (
            <div>
              <span className="font-ui font-bold uppercase tracking-wider text-[#050D2B] mr-1.5">Batters:</span>
              <span>{meta.oos_summary.Batters}</span>
            </div>
          )}
          {meta.oos_summary.Bowlers && (
            <div>
              <span className="font-ui font-bold uppercase tracking-wider text-[#050D2B] mr-1.5">Bowlers:</span>
              <span>{meta.oos_summary.Bowlers}</span>
            </div>
          )}
        </div>
      )}

      {meta?.oos_note && (
        <div className="mt-2.5 text-[11px] text-slate-500 font-primary italic">
          {meta.oos_note}
        </div>
      )}
    </div>
  );
}
