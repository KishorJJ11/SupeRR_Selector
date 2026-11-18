import React, { useState } from 'react';
import { Target, TrendingUp, ShieldAlert, Award, AlertCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { squadFit } from '../data/cricketData';
import { formatRating, formatInterval } from '../utils/formatters';

const FIXED_PHASES = ['powerplay', 'middle', 'death'];

function getNeedColorStyle(need) {
  if (need === undefined || need === null || isNaN(need)) {
    return {};
  }
  const clamped = Math.max(0, Math.min(1, Number(need)));
  const hue = Math.round((1 - clamped) * 120); // 120 (green) to 0 (red)
  return {
    backgroundColor: `hsla(${hue}, 80%, 93%, 0.9)`,
    color: `hsl(${hue}, 95%, 22%)`,
    borderColor: `hsla(${hue}, 70%, 75%, 0.8)`
  };
}

export default function SquadFitView({ onSelectPlayer }) {
  // If squad_fit.available === false: show a neutral card "Squad fit not available in this run" plus squad_fit.reason. Nothing else.
  if (!squadFit || squadFit.available === false) {
    return (
      <div className="rounded-2xl p-8 sm:p-12 bg-white border border-slate-200 text-center shadow-xs my-6">
        <Target className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="font-display font-bold uppercase text-lg text-[#050D2B] mb-1">
          Squad fit not available in this run
        </h3>
        {squadFit?.reason && (
          <p className="text-sm text-slate-500 font-primary mt-2 max-w-md mx-auto">
            {squadFit.reason}
          </p>
        )}
      </div>
    );
  }

  const retention = squadFit.retention || {};
  const weakestBowl = squadFit.weakest_bowl || 'middle';
  const weakestBat = squadFit.weakest_bat || 'middle';

  // "By phase" role and phase tabs
  const [selectedRole, setSelectedRole] = useState('Bowling'); // 'Bowling' or 'Batting'
  const [selectedBowlPhase, setSelectedBowlPhase] = useState(weakestBowl);
  const [selectedBatPhase, setSelectedBatPhase] = useState(weakestBat);
  const [isDataQualityOpen, setIsDataQualityOpen] = useState(false);

  // Active phase depending on selected role
  const activePhase = selectedRole === 'Bowling' ? selectedBowlPhase : selectedBatPhase;
  const setActivePhase = selectedRole === 'Bowling' ? setSelectedBowlPhase : setSelectedBatPhase;

  // Parse Phase table rows in fixed order: powerplay, middle, death
  const phaseRows = FIXED_PHASES.map((phase) => {
    let rowData = {};
    if (Array.isArray(squadFit.phases)) {
      rowData = squadFit.phases.find(r => String(r.phase || '').toLowerCase() === phase) || {};
    } else if (Array.isArray(squadFit.phase_table)) {
      rowData = squadFit.phase_table.find(r => String(r.phase || '').toLowerCase() === phase) || {};
    } else if (squadFit.phases && typeof squadFit.phases === 'object') {
      rowData = squadFit.phases[phase] || {};
    }

    const batObj = rowData.bat || {};
    const bowObj = rowData.bow || {};

    const bat_need = batObj.need ?? rowData.bat_need ?? 0;
    const bowl_need = bowObj.need ?? rowData.bowl_need ?? 0;
    const need = rowData.need ?? (bat_need !== undefined && bowl_need !== undefined ? Math.max(bat_need, bowl_need) : (bat_need ?? bowl_need ?? 0));

    return {
      phase,
      bat_rr: batObj.rr ?? rowData.bat_rr ?? rowData.bat_rate ?? 'n/a',
      bat_league_avg: batObj.league_avg ?? rowData.bat_league_avg ?? rowData.league_bat_avg ?? 'n/a',
      bat_rank: batObj.rank ?? rowData.bat_rank ?? 'n/a',
      bat_of: batObj.of ?? rowData.bat_of,
      bat_need,
      bowl_econ: bowObj.rr ?? rowData.bowl_econ ?? rowData.bowl_economy ?? 'n/a',
      bowl_league_avg: bowObj.league_avg ?? rowData.bowl_league_avg ?? rowData.league_bowl_avg ?? 'n/a',
      bowl_rank: bowObj.rank ?? rowData.bowl_rank ?? 'n/a',
      bowl_of: bowObj.of ?? rowData.bowl_of,
      bowl_need,
      need
    };
  });

  const gaps = Array.isArray(squadFit.gaps) ? squadFit.gaps.slice(0, 3) : [];
  const recommended = Array.isArray(squadFit.recommended) ? squadFit.recommended : [];

  const incumbents = squadFit.incumbents || {};
  const candidates = squadFit.candidates || {};

  const roleKey = selectedRole === 'Bowling' ? 'bow' : 'bat';
  const roleIncumbents = incumbents[roleKey]?.[activePhase] || incumbents[selectedRole.toLowerCase()]?.[activePhase] || [];
  const roleCandidates = candidates[roleKey]?.[activePhase] || candidates[selectedRole.toLowerCase()]?.[activePhase] || [];

  const formatGain = (gain) => {
    if (gain === undefined || gain === null) return 'n/a';
    const num = Number(gain);
    if (isNaN(num)) return 'n/a';
    return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
  };

  const renderBadges = (player) => (
    <div className="inline-flex items-center gap-1.5 flex-wrap ml-1.5">
      {player.rrReleased && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-ui font-extrabold tracking-wide uppercase bg-[#EA1A85]/10 text-[#EA1A85] border border-[#EA1A85]/30">
          Ex-RR (buy-back)
        </span>
      )}
      {player.overseas && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-ui font-extrabold tracking-wide uppercase bg-sky-50 text-sky-700 border border-sky-200">
          Overseas
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-6 my-6">
      {/* 1. Header: "{team_name} - IPL {season} data ({matches} matches)" */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-[#EA1A85]" />
              <h2 className="font-display font-black text-xl sm:text-2xl text-[#050D2B] uppercase tracking-tight">
                {squadFit.team_name} - IPL {squadFit.season} data ({squadFit.matches} matches)
              </h2>
            </div>
            {retention.source && (
              <p className="text-xs text-slate-500 font-primary">
                {retention.source}
              </p>
            )}
          </div>

          {/* Chips from squad_fit.retention: "Purse {purse_cr} Cr", "{slots} slots", "{overseas_slots} overseas", "Auction {auction_date}" */}
          <div className="flex flex-wrap items-center gap-2">
            {retention.purse_cr !== undefined && (
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-[#050D2B] font-ui font-bold text-xs border border-slate-200">
                Purse {retention.purse_cr} Cr
              </span>
            )}
            {retention.slots !== undefined && (
              <span className="px-3 py-1.5 rounded-xl bg-[#EA1A85]/10 text-[#EA1A85] font-ui font-bold text-xs border border-[#EA1A85]/20">
                {retention.slots} slots
              </span>
            )}
            {retention.overseas_slots !== undefined && (
              <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 font-ui font-bold text-xs border border-sky-200">
                {retention.overseas_slots} overseas
              </span>
            )}
            {retention.auction_date && (
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-ui font-bold text-xs border border-slate-200">
                Auction {retention.auction_date}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Retention pool warning & Data quality */}
      {retention.pool_confirmed === false && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-primary flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">
              Other franchises' retained lists not loaded: some candidates may be unavailable.
            </span>
            <span className="text-amber-800 text-[11px] mt-0.5 block">
              {retention.retained_matched ?? 0}/{retention.retained_listed ?? 0} retained names matched to ball-by-ball data
            </span>
          </div>
        </div>
      )}

      {/* Collapsed Data Quality section if unmatched is non-empty */}
      {retention.unmatched && retention.unmatched.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <button
            onClick={() => setIsDataQualityOpen(!isDataQualityOpen)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-ui font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>Data quality: Unmatched retained names ({retention.unmatched.length})</span>
            {isDataQualityOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {isDataQualityOpen && (
            <div className="px-4 pb-3 pt-1 text-xs text-slate-600 font-primary border-t border-slate-100 bg-slate-50/50">
              <p className="mb-1 text-slate-500 text-[11px]">
                The following retained players could not be matched directly to historical ball-by-ball IDs:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {retention.unmatched.map((name, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[11px]">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Phase table (fixed order powerplay, middle, death) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#1B3FA0]" />
          <h3 className="font-display font-bold uppercase tracking-wider text-sm text-[#050D2B]">
            Phase-by-Phase Performance Benchmark
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 select-none font-ui uppercase tracking-wider text-xs text-slate-500 bg-slate-50">
                <th className="py-2.5 px-3 font-bold">Phase</th>
                <th className="py-2.5 px-3 font-bold">RR bat rate</th>
                <th className="py-2.5 px-3 font-bold">league avg</th>
                <th className="py-2.5 px-3 font-bold text-center">rank</th>
                <th className="py-2.5 px-3 font-bold border-l border-slate-200">RR bowl economy</th>
                <th className="py-2.5 px-3 font-bold">league avg</th>
                <th className="py-2.5 px-3 font-bold text-center">rank</th>
                <th className="py-2.5 px-3 font-bold text-center border-l border-slate-200">need</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-primary text-xs">
              {phaseRows.map((row) => (
                <tr key={row.phase} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-ui font-bold uppercase tracking-wide text-[#050D2B]">
                    {row.phase}
                  </td>
                  <td className="py-3 px-3 tabular-nums font-semibold text-sm">
                    {typeof row.bat_rr === 'number' ? row.bat_rr.toFixed(2) : row.bat_rr}
                  </td>
                  <td className="py-3 px-3 tabular-nums text-slate-500">
                    {typeof row.bat_league_avg === 'number' ? row.bat_league_avg.toFixed(2) : row.bat_league_avg}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className="px-2.5 py-1 rounded-md font-ui font-bold text-xs inline-block border shadow-2xs"
                      style={getNeedColorStyle(row.bat_need)}
                    >
                      {row.bat_rank}{row.bat_of ? ` / ${row.bat_of}` : ''}
                    </span>
                  </td>
                  <td className="py-3 px-3 tabular-nums font-semibold text-sm border-l border-slate-100">
                    {typeof row.bowl_econ === 'number' ? row.bowl_econ.toFixed(2) : row.bowl_econ}
                  </td>
                  <td className="py-3 px-3 tabular-nums text-slate-500">
                    {typeof row.bowl_league_avg === 'number' ? row.bowl_league_avg.toFixed(2) : row.bowl_league_avg}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className="px-2.5 py-1 rounded-md font-ui font-bold text-xs inline-block border shadow-2xs"
                      style={getNeedColorStyle(row.bowl_need)}
                    >
                      {row.bowl_rank}{row.bowl_of ? ` / ${row.bowl_of}` : ''}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center border-l border-slate-100">
                    <span
                      className="px-2.5 py-1 rounded-md font-ui font-bold text-xs inline-block border shadow-2xs"
                      style={getNeedColorStyle(row.need)}
                    >
                      {typeof row.need === 'number' ? `${(row.need * 100).toFixed(0)}%` : (row.need ?? 'n/a')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. "Biggest gaps" chips: top 3 from squad_fit.gaps (role, phase, need) */}
      {gaps.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-ui uppercase font-bold text-slate-500 block mb-2.5">
            Biggest Gaps
          </span>
          <div className="flex flex-wrap gap-2.5">
            {gaps.map((g, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-ui font-bold shadow-2xs"
                style={getNeedColorStyle(g.need)}
              >
                <span className="uppercase text-[11px] px-1.5 py-0.5 rounded bg-white/70">
                  {g.role === 'bat' ? 'Batting' : (g.role === 'bow' ? 'Bowling' : g.role)}
                </span>
                <span className="capitalize">{g.phase}</span>
                <span className="tabular-nums font-extrabold">
                  Need: {(Number(g.need) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. "Recommended buys (fills {slots} slots)" table from squad_fit.recommended */}
      {recommended.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Award className="w-5 h-5 text-[#EA1A85]" />
            <h3 className="font-display font-extrabold uppercase text-base sm:text-lg text-[#050D2B]">
              Recommended buys (fills {retention.slots ?? recommended.length} slots)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[840px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-ui uppercase">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Phase</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">90% CI</th>
                  <th className="py-2.5 px-3">Pressure Balls</th>
                  <th className="py-2.5 px-3">Last IPL Team</th>
                  <th className="py-2.5 px-3">Gain vs RR Best</th>
                  <th className="py-2.5 px-3">Fit Score</th>
                  <th className="py-2.5 px-3 text-right">Gap Need</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-primary">
                {recommended.map((p, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onSelectPlayer && onSelectPlayer(p)}
                    className="hover:bg-[#FDE4F1]/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 font-bold text-[#050D2B] group-hover:text-[#EA1A85] flex items-center">
                      <span>{p.name}</span>
                      {renderBadges(p)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 capitalize">
                      {p.role}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 capitalize">
                      {p.phase}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#EA1A85] tabular-nums">
                      {formatRating(p.rating)}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums font-mono text-[11px]">
                      {formatInterval(p.ratingInterval || (p.lo !== undefined ? [p.lo, p.hi] : null)) || 'n/a'}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      {p.pressureBalls ?? 'n/a'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {p.lastIplTeam || 'n/a'}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums font-bold text-[#1B3FA0]">
                      {formatGain(p.gainVsRRBest)}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums font-extrabold text-[#050D2B]">
                      {p.fitScore !== undefined ? Number(p.fitScore).toFixed(1) : 'n/a'}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {p.gapNeed !== undefined ? (
                        <span
                          className="px-2 py-0.5 rounded font-ui font-bold text-[11px] border shadow-2xs"
                          style={getNeedColorStyle(p.gapNeed)}
                        >
                          {(Number(p.gapNeed) * 100).toFixed(0)}%
                        </span>
                      ) : 'n/a'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. "By phase" tabs: per role (Bowling / Batting) x (powerplay, middle, death) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Role selector tabs: Bowling / Batting */}
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#1B3FA0]" />
            <h3 className="font-display font-extrabold uppercase text-base sm:text-lg text-[#050D2B]">
              By Phase Targets and Incumbents
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl ml-2">
              <button
                onClick={() => setSelectedRole('Bowling')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-ui uppercase font-bold transition-all cursor-pointer ${
                  selectedRole === 'Bowling'
                    ? 'bg-[#1B3FA0] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#050D2B]'
                }`}
              >
                Bowling (weakest: {weakestBowl})
              </button>
              <button
                onClick={() => setSelectedRole('Batting')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-ui uppercase font-bold transition-all cursor-pointer ${
                  selectedRole === 'Batting'
                    ? 'bg-[#EA1A85] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#050D2B]'
                }`}
              >
                Batting (weakest: {weakestBat})
              </button>
            </div>
          </div>

          {/* Phase selector tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {FIXED_PHASES.map((p) => (
              <button
                key={p}
                onClick={() => setActivePhase(p)}
                className={`px-3 py-1 rounded-lg text-xs font-ui uppercase font-bold transition-all cursor-pointer ${
                  activePhase === p
                    ? selectedRole === 'Bowling'
                      ? 'bg-[#1B3FA0] text-white shadow-xs'
                      : 'bg-[#EA1A85] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#050D2B]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* RR incumbents in this phase */}
        {roleIncumbents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-ui uppercase font-bold text-slate-500">
              RR incumbents in this phase ({selectedRole} - {activePhase})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-ui uppercase">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Phase</th>
                    <th className="py-2 px-3">Rating</th>
                    <th className="py-2 px-3">90% CI</th>
                    <th className="py-2 px-3">Pressure Balls</th>
                    <th className="py-2 px-3">Pressure Innings</th>
                    <th className="py-2 px-3">Last IPL Team</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-primary">
                  {roleIncumbents.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-bold text-[#050D2B] flex items-center">
                        <span>{p.name}</span>
                        {renderBadges(p)}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-700 capitalize">{p.role || selectedRole}</td>
                      <td className="py-2 px-3 font-semibold text-slate-700 capitalize">{p.phase || activePhase}</td>
                      <td className="py-2 px-3 font-semibold text-[#EA1A85] tabular-nums">{formatRating(p.rating)}</td>
                      <td className="py-2 px-3 tabular-nums font-mono text-[11px]">{formatInterval(p.ratingInterval || (p.lo !== undefined ? [p.lo, p.hi] : null)) || 'n/a'}</td>
                      <td className="py-2 px-3 tabular-nums">{p.pressureBalls ?? 'n/a'}</td>
                      <td className="py-2 px-3 tabular-nums">{p.pressureInnings ?? 'n/a'}</td>
                      <td className="py-2 px-3 text-slate-600">{p.lastIplTeam || 'n/a'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Targets from candidates[role][phase] */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-ui uppercase font-bold text-[#1B3FA0] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Targets ({selectedRole} - {activePhase})</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[840px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-ui uppercase">
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Phase</th>
                  <th className="py-2 px-3">Rating</th>
                  <th className="py-2 px-3">90% CI</th>
                  <th className="py-2 px-3">Pressure Balls</th>
                  <th className="py-2 px-3">Last IPL Team</th>
                  <th className="py-2 px-3">Gain vs RR Best</th>
                  <th className="py-2 px-3">Fit Score</th>
                  <th className="py-2 px-3 text-right">Gap Need</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-primary">
                {roleCandidates.map((c, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onSelectPlayer && onSelectPlayer(c)}
                    className="hover:bg-[#FDE4F1]/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 font-bold text-[#050D2B] group-hover:text-[#EA1A85] flex items-center">
                      <span>{c.name}</span>
                      {renderBadges(c)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 capitalize">{c.role || selectedRole}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 capitalize">{c.phase || activePhase}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#EA1A85] tabular-nums">{formatRating(c.rating)}</td>
                    <td className="py-2.5 px-3 tabular-nums font-mono text-[11px]">{formatInterval(c.ratingInterval || (c.lo !== undefined ? [c.lo, c.hi] : null)) || 'n/a'}</td>
                    <td className="py-2.5 px-3 tabular-nums">{c.pressureBalls ?? 'n/a'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.lastIplTeam || 'n/a'}</td>
                    <td className="py-2.5 px-3 tabular-nums font-bold text-[#1B3FA0]">{formatGain(c.gainVsRRBest)}</td>
                    <td className="py-2.5 px-3 tabular-nums font-extrabold text-[#050D2B]">
                      {c.fitScore !== undefined ? Number(c.fitScore).toFixed(1) : 'n/a'}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {c.gapNeed !== undefined ? (
                        <span
                          className="px-2 py-0.5 rounded font-ui font-bold text-[11px] border shadow-2xs"
                          style={getNeedColorStyle(c.gapNeed)}
                        >
                          {(Number(c.gapNeed) * 100).toFixed(0)}%
                        </span>
                      ) : 'n/a'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7. Footer: squad_fit.caveat verbatim */}
      {squadFit.caveat && (
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-primary italic flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{squadFit.caveat}</span>
        </div>
      )}
    </div>
  );
}
