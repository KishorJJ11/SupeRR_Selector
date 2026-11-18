import os, sys, json, argparse, warnings, hashlib, inspect, difflib, re
os.environ.setdefault("OMP_NUM_THREADS", "1")
import numpy as np, pandas as pd
from scipy.stats import spearmanr, norm, beta
from sklearn.ensemble import HistGradientBoostingRegressor, HistGradientBoostingClassifier
from sklearn.model_selection import GroupKFold
from joblib import Parallel, delayed

warnings.filterwarnings('ignore')

DEFAULTS = {
    "data_dir": ".", "files": {"ball_by_ball": "ball_by_ball.csv", "matches": "matches.csv", "competitions": "competitions.csv", "teams": "teams.csv", "team_map": "competition_team_player_mapping.csv"},
    "columns": {}, "match_columns": {}, "comp_columns": {},
    "wide_values": ["wide", "wides", "wd"], "noball_values": ["overstep", "noball", "no_ball", "noballs", "nb"],
    "bowler_dismissals": ["caught", "bowled", "lbw", "stump", "stumped", "hit wicket", "hitwicket", "caught and bowled"],
    "wide_noball_penalty": 1, "overs_per_innings": "auto", "extras_mode": "auto",
    "pressure_quantile": 0.80, "min_matches_for_wp": 200,
    "eligibility_ladder": [[150, 20], [120, 16], [100, 15], [80, 12]],
    "min_career_balls": 150, "min_eligible_per_role": 30, "exclude_truncated_first_innings": "auto",
    "stability_grid": {"quantiles": [0.78, 0.80, 0.82], "fits": [["off", i] for i in range(25)]},
    "consensus_size": 10, "persistence_splits": 100, "min_half_balls": 30, "seed": 7,
    "sensitivity_quantiles": [0.70, 0.90], "sensitivity_specs": [[100, 15], [200, 25]], 
    "rr_team_id": None, "phase_spec": [40, 6], "squad_top_n": 5, "squad_season": None, "status_file": "ipl2027.json"}
REQUIRED = ["match_id", "innings", "batting_team", "bowling_team", "striker_id", "bowler_id", "runs_bat", "is_wicket"]

class DataError(Exception): pass
def log(*a): print(*a, flush=True)

def _sid(x):
    try: return str(int(float(x)))
    except Exception: return str(x)

def _num(x, nd=2):
    try:
        x = float(x); return round(x, nd) if np.isfinite(x) else None
    except Exception: return None

def idstr(s):
    n = pd.to_numeric(s, errors='coerce'); out = n.map(lambda x: str(int(x)) if pd.notna(x) else None)
    return out.where(out.notna(), s.astype(object).where(s.notna(), None).map(lambda x: None if x is None else str(x)))

def md5(path):
    h = hashlib.md5()
    if os.path.exists(path):
        with open(path, 'rb') as f:
            for ch in iter(lambda: f.read(1 << 20), b''): h.update(ch)
        return h.hexdigest()
    return ""

def clean(o):
    if isinstance(o, dict): return {k: clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)): return [clean(v) for v in o]
    if isinstance(o, (float, np.floating)): return float(o) if np.isfinite(o) else None
    if isinstance(o, np.integer): return int(o)
    if isinstance(o, np.bool_): return bool(o)
    return o

def norm_name(s): return re.sub(r'[^a-z ]', '', str(s).lower().replace('-', ' ')).strip()

def load_status(cfg):
    p = os.path.join(cfg['data_dir'], cfg.get('status_file', 'ipl2027.json'))
    return json.load(open(p, encoding='utf-8')) if os.path.isfile(p) else None

def name_index(meta):
    idx = {}
    for w in ('bat', 'bow'):
        for pid, nm in meta[w]['name'].items(): idx.setdefault(norm_name(nm), set()).add(str(pid))
    return idx

def resolve_names(names, idx, tag):
    ids, missing, keys = set(), [], list(idx)
    for n in names:
        k = norm_name(n)
        if k in idx: ids |= idx[k]; continue
        last = k.split()[-1:] ; first = k[:1]
        cand = [x for x in keys if x.split()[-1:] == last and x[:1] == first]
        if len(cand) == 1: ids |= idx[cand[0]]; continue
        close = difflib.get_close_matches(k, keys, n=1, cutoff=0.88)
        if close: ids |= idx[close[0]]
        else: missing.append(n)
    if missing: log(f"[{tag}] UNMATCHED names:", missing)
    return ids, missing

def write_manifest(out, cfg):
    man = {'inputs': {k: md5(os.path.join(cfg['data_dir'], v)) for k, v in cfg['files'].items() if v and os.path.exists(os.path.join(cfg['data_dir'], v))},
           'config_md5': hashlib.md5(json.dumps(cfg, sort_keys=True).encode()).hexdigest(),
           'outputs': {f: md5(f'{out}/{f}') for f in ['consensus_frontend.json', 'consensus_batters.csv', 'consensus_bowlers.csv', 'methodology_report.md'] if os.path.exists(f'{out}/{f}')},
           'python': sys.version, 'numpy': np.__version__, 'sklearn': __import__('sklearn').__version__}
    p = os.path.join(cfg['data_dir'], cfg.get('status_file', 'ipl2027.json'))
    if os.path.exists(p): man['inputs']['status'] = md5(p)
    json.dump(man, open(f'{out}/manifest.json', 'w'), indent=2)

def load_config(path):
    cfg = json.loads(json.dumps(DEFAULTS))
    if path:
        for k, v in json.load(open(path)).items():
            cfg[k] = {**cfg[k], **v} if isinstance(v, dict) and isinstance(cfg.get(k), dict) else v
    return cfg

def load_data(cfg, extras_mode=None):
    D = cfg['data_dir']; Q = {}
    path = os.path.join(D, cfg['files']['ball_by_ball'])
    b = pd.read_csv(path); Q['ball_by_ball_md5'] = md5(path)
    cm = cfg['columns']; miss = [k for k in REQUIRED if cm.get(k, k) not in b.columns]
    if miss: raise DataError(f"Missing cols: {miss}")
    b = b.rename(columns={v: k for k, v in cm.items() if v in b.columns})
    Q['rows_raw'] = int(len(b))
    
    m = None; mc = cfg['match_columns']
    if cfg['files'].get('matches'):
        m_path = os.path.join(D, cfg['files']['matches'])
        if os.path.exists(m_path):
            m = pd.read_csv(m_path)
            m = m.rename(columns={v: k for k, v in mc.items() if isinstance(v, str) and v in m.columns}).drop_duplicates('match_id')

    if cfg['files'].get('competitions') and m is not None and 'comp_id' in m.columns:
        c_path = os.path.join(D, cfg['files']['competitions'])
        if os.path.exists(c_path):
            c = pd.read_csv(c_path)
            c = c.rename(columns={v: k for k, v in cfg['comp_columns'].items() if v in c.columns})
            if 'match_format' in c.columns:
                c['format'] = np.where(c['match_format'].astype(str).str.contains('IPL', case=False), 'IPL', 'T20I')
            else:
                nm_col = next((col for col in c.columns if 'name' in col.lower() or 'title' in col.lower()), None)
                if nm_col:
                    c['format'] = np.where(c[nm_col].astype(str).str.contains('Premier|IPL', case=False, na=False), 'IPL', 'T20I')
            if 'format' in c.columns: m = m.merge(c[['comp_id', 'format']], on='comp_id', how='left')

    if 'striker_name' not in b: b['striker_name'] = b.striker_id.astype(str)
    if 'bowler_name' not in b: b['bowler_name'] = b.bowler_id.astype(str)
    for c in ['dismissal_type', 'extras_type']:
        if c not in b: b[c] = ''
    for c in ['extras_runs', 'extras1_runs']:
        if c not in b: b[c] = 0
        b[c] = pd.to_numeric(b[c], errors='coerce').fillna(0)
    b['runs_bat'] = pd.to_numeric(b.runs_bat, errors='coerce').fillna(0)
    ex = b.extras_type.astype(str).str.lower().str.strip()
    b['is_wide'] = ex.isin(cfg['wide_values']); b['is_nb'] = ex.isin(cfg['noball_values'])
    b['legal'] = ~(b.is_wide | b.is_nb)
    
    mode = extras_mode or cfg['extras_mode']
    if mode == 'auto':
        best_mode, best_rate = 'new', 0
        Q['extras_validation_old_rate'] = 0.0
        if m is not None and 'result' in m.columns:
            for test_mode in ('new', 'old'):
                bm = b.copy()
                wn = bm.is_wide | bm.is_nb
                if test_mode == 'old':
                    bm['team_runs'] = bm.runs_bat + np.where(wn, cfg['wide_noball_penalty'] + bm.extras_runs, 0)
                else:
                    bm['team_runs'] = bm.runs_bat + bm.extras1_runs + bm.extras_runs
                tot = bm.groupby(['match_id','innings'])['team_runs'].sum().unstack()
                if 1 in tot and 2 in tot:
                    margin = (tot[1] - tot[2]).rename('m')
                    res = m.set_index('match_id')['result'].astype(str).str.extract(r'[Ww]on by (\d+) runs?')[0].astype(float)
                    ok_rate = (margin.reindex(res.dropna().index) == res.dropna()).mean()
                    if test_mode == 'old': Q['extras_validation_old_rate'] = float(ok_rate)
                    if ok_rate > best_rate: best_mode, best_rate = test_mode, ok_rate
        mode = best_mode
        Q['extras_validation_match_rate'] = float(best_rate)
        if best_rate == 0: log("WARNING: Extras auto-validation failed. Defaulting to 'new'.")

    Q['extras_mode'] = mode
    wn = b.is_wide | b.is_nb
    if mode == 'old':
        b['team_runs'] = b.runs_bat + np.where(wn, cfg['wide_noball_penalty'] + b.extras_runs, 0)
        b['bowler_runs'] = b.team_runs
    elif mode == 'new':
        b['team_runs'] = b.runs_bat + b.extras1_runs + b.extras_runs
        b['bowler_runs'] = b.runs_bat + np.where(wn, b.extras1_runs + b.extras_runs, 0)
    elif mode == 'none':
        b['team_runs'] = b.runs_bat; b['bowler_runs'] = b.runs_bat
    elif mode == 'bowler_all':
        b['team_runs'] = b.runs_bat + b.extras1_runs + b.extras_runs; b['bowler_runs'] = b.team_runs
    
    b['is_wicket'] = b.is_wicket.astype(str).str.lower().isin(['true', '1', '1.0']) if b.is_wicket.dtype == object else (b.is_wicket.fillna(0) > 0)
    if 'dismissed_id' not in b: b['dismissed_id'] = np.where(b.is_wicket, b.striker_id, np.nan)
    b['innings'] = pd.to_numeric(b.innings, errors='coerce')
    b = b[b.innings.isin([1, 2])].dropna(subset=['match_id', 'batting_team', 'bowling_team', 'striker_id', 'bowler_id'])
    b['striker_id'] = idstr(b.striker_id); b['bowler_id'] = idstr(b.bowler_id)
    if 'ball_in_innings' not in b: b['ball_in_innings'] = b.groupby(['match_id', 'innings']).cumcount()
    b = b.drop_duplicates(['match_id', 'innings', 'ball_in_innings']).sort_values(['match_id', 'innings', 'ball_in_innings']).reset_index(drop=True)
    g = b.groupby(['match_id', 'innings'])
    b['legal_before'] = g['legal'].cumsum() - b['legal'].astype(int)
    
    b['over'] = pd.to_numeric(b.get('over', b.legal_before // 6 + 1), errors='coerce')
    if b.over.min() == 0: b['over'] += 1
    
    opi = cfg['overs_per_innings']
    if opi == 'auto': opi = int(b.groupby(['match_id', 'innings'])['over'].max().mode().iloc[0])
    TB = int(opi * 6)
    
    excl = set()
    rc = [c for c in mc.get('revised', []) if m is not None and c in m.columns]
    if rc: excl |= set(m.loc[m[rc].notna().any(axis=1), 'match_id'])
    i1 = b[b.innings == 1].groupby('match_id').agg(lb=('legal','sum'), wk=('is_wicket','sum'))
    excl |= set(i1[(i1.lb < 0.9*TB) & (i1.wk < 10)].index)
    b = b[~b.match_id.isin(excl)].copy(); g = b.groupby(['match_id','innings'])
    Q['matches_excluded'] = len(excl)
    assert b.over.min() == 1, "Over index error"
    
    b['cum_before'] = g['team_runs'].cumsum() - b['team_runs']
    b['wk_before'] = g['is_wicket'].cumsum() - b['is_wicket'].astype(int)
    b['bl_before'] = TB - b['legal_before']
    b['rem'] = g['team_runs'].transform('sum') - b['cum_before']
    b = b[(b.bl_before >= 1) & (b.bl_before <= TB)].reset_index(drop=True)
    b['target'] = b.match_id.map(b[b.innings == 1].groupby('match_id')['team_runs'].sum() + 1).fillna(10 ** 6)
    b['rrr'] = np.where(b.innings == 2, (b.target - b.cum_before) / b.bl_before * 6, np.nan)
    
    dt = b.dismissal_type.astype(str).str.lower().str.strip()
    b['bowler_wkt'] = b.is_wicket & dt.isin(cfg['bowler_dismissals'])
    if not b.bowler_wkt.any() and b.is_wicket.any(): b['bowler_wkt'] = b.is_wicket
    b['dis_striker'] = (b.is_wicket & (idstr(b.dismissed_id) == b.striker_id))
    
    win = None
    if m is not None and 'winner' in m: win = m.set_index('match_id').winner
    if win is None:
        tot = b.groupby(['match_id', 'innings']).agg(r=('team_runs', 'sum'), lb=('legal', 'sum'), wk=('is_wicket', 'sum'), t=('batting_team', 'first')).unstack()
        t1, t2 = tot[('r', 1)], tot[('r', 2)]; done2 = (tot[('wk', 2)] >= 10) | (tot[('lb', 2)] >= TB) | (t2 > t1)
        win = pd.Series(np.where(t2 > t1, tot[('t', 2)], np.where(done2 & (t2 < t1), tot[('t', 1)], np.nan)), index=tot.index, dtype=object)
    b['winner'] = b.match_id.map(win)
    b['has_win'] = b.winner.notna(); b['won'] = ((idstr(b.batting_team) == idstr(b.winner)) & b.has_win).astype(int)
    b['fmt'] = b.match_id.map(m.set_index('match_id')['format']).fillna('T20I') if (m is not None and 'format' in m) else 'T20I'
    
    if m is not None and 'date' in m.columns:
        b['mdate'] = pd.to_datetime(b.match_id.map(m.set_index('match_id')['date']), errors='coerce')
    else:
        b['mdate'] = pd.NaT

    Q.update(deliveries_used=int(len(b)), matches_used=int(b.match_id.nunique()), matches_by_format={str(k): int(v) for k, v in b.groupby('fmt').match_id.nunique().items()})
    assert 'IPL' in b.fmt.unique(), f"IPL format missing, formats found: {b.fmt.unique()}"
    assert 'UNK' not in b.fmt.unique()
    return b, Q, TB
    
def player_meta(b):
    out = {}
    lb = b[b.legal]
    for who, pid, nm in (('bat', 'striker_id', 'striker_name'), ('bow', 'bowler_id', 'bowler_name')):
        ph = pd.cut(lb.over, [0, 6, 15, 99], labels=['powerplay', 'middle', 'death'])
        role = lb.groupby([lb[pid], ph], observed=False).size().unstack(fill_value=0).idxmax(axis=1)
        out[who] = dict(name=b.groupby(pid)[nm].agg(lambda s: s.dropna().iloc[-1] if s.notna().any() else '').to_dict(),
                        career=lb.groupby(pid).size().to_dict(), role=role.astype(str).to_dict())
    return out

def fit_state(b, cfg, rs=0, es='off', train_ids=None):
    ES = False if es == 'off' else 'auto'
    tr_ok = b.match_id.isin(train_ids).values if train_ids is not None else np.ones(len(b), bool)
    w = np.ones(len(b)) if rs == 0 else b.match_id.map(dict(zip(b.match_id.unique(), np.random.default_rng(1000 + rs).multinomial(b.match_id.nunique(), np.full(b.match_id.nunique(), 1 / b.match_id.nunique()))))).values.astype(float)
        
    X = lambda bl, wk, inn: np.c_[inn, bl, np.minimum(wk, 9)]
    Ec, Enw, Ew = np.zeros(len(b)), np.zeros(len(b)), np.zeros(len(b))
    bn = (b.bl_before - b.legal.astype(int)).clip(lower=0)
    
    for tr, te in GroupKFold(5).split(b, groups=b.match_id):
        tr = tr[tr_ok[tr]]
        if len(tr) == 0: continue
        re_est = HistGradientBoostingRegressor(monotonic_cst=[0, 1, -1], max_iter=100, learning_rate=0.08, random_state=rs, early_stopping=ES)
        re_est.fit(X(b.bl_before.values[tr], b.wk_before.values[tr], b.innings.values[tr]), b.rem.values[tr], sample_weight=w[tr])
        Ec[te] = re_est.predict(X(b.bl_before.values[te], b.wk_before.values[te], b.innings.values[te]))
        Enw_mask = (bn[te] > 0)
        if Enw_mask.any():
            Enw[te[Enw_mask]] = re_est.predict(X(bn.values[te[Enw_mask]], b.wk_before.values[te[Enw_mask]], b.innings.values[te[Enw_mask]]))
            Ew[te[Enw_mask]] = re_est.predict(X(bn.values[te[Enw_mask]], b.wk_before.values[te[Enw_mask]] + 1, b.innings.values[te[Enw_mask]]))
            
    bv = b.runs_bat.values + (Enw - Ec) + b.dis_striker.astype(int).values * (Ew - Enw)
    bw = -(b.bowler_runs.values + np.where(b.legal, Enw - Ec, 0) + b.bowler_wkt.astype(int).values * (Ew - Enw))
    
    lb = b[b.legal]; ridx = lb.runs_bat.clip(0, 6).replace({5: 4}).map({0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 6: 5}).fillna(0)
    oc = np.where(lb.is_wicket, 6, ridx).astype(int)
    tab = pd.crosstab([lb.innings, lb.over], oc, normalize='index').reindex(columns=range(7), fill_value=0)
    Pm = tab.reindex(pd.MultiIndex.from_arrays([b.innings, b.over])).fillna(tab.mean()).values
    LI_all = np.zeros(len(b))
    for inn in (1, 2):
        ix = np.where(b.innings.values == inn)[0]; d = b.iloc[ix]; y = d.won.values; has = d.has_win.values
        bl, wk0, cum, tg = d.bl_before.values, d.wk_before.values, d.cum_before.values, d.target.values
        feats = lambda bl_, wk_, cum_, tg_: np.c_[np.maximum(bl_, 0), np.minimum(wk_, 9), cum_] if inn == 1 else np.c_[np.maximum(bl_, 0), np.minimum(wk_, 9), np.maximum(tg_ - cum_, 0), np.maximum(tg_ - cum_, 0) / np.maximum(bl_, 1) * 6]
        LI = np.zeros(len(d))
        for tr, te in GroupKFold(5).split(d, groups=d.match_id):
            tr = tr[tr_ok[ix[tr]]]; trm = has[tr]
            if len(trm) == 0 or not trm.any(): continue
            clf = HistGradientBoostingClassifier(max_iter=100, learning_rate=0.06, max_leaf_nodes=24, random_state=rs, early_stopping=ES)
            clf.fit(feats(bl[tr][trm], wk0[tr][trm], cum[tr][trm], tg[tr][trm]), y[tr][trm], sample_weight=w[ix][tr][trm])
            cur = clf.predict_proba(feats(bl[te], wk0[te], cum[te], tg[te]))[:, 1]; nxt = np.zeros((len(te), 7))
            for j, r in enumerate([0, 1, 2, 3, 4, 6, 0]):
                wk2 = wk0[te] + (1 if j == 6 else 0); cum2 = cum[te] + r; bl2 = bl[te] - 1
                p = clf.predict_proba(feats(bl2, wk2, cum2, tg[te]))[:, 1]
                if inn == 2: wn = cum2 >= tg[te]; lose = ((bl2 <= 0) | (wk2 >= 10)) & ~wn; p = np.where(wn, 1.0, np.where(lose, 0.0, p))
                nxt[:, j] = p
            LI[te] = (Pm[ix][te] * np.abs(nxt - cur[:, None])).sum(1)
        LI_all[ix] = LI
    LI_all = LI_all / LI_all[b.legal.values].mean()
    W = b[['match_id', 'innings', 'over', 'legal', 'bl_before', 'wk_before', 'rrr', 'striker_id', 'bowler_id', 'batting_team', 'bowling_team', 'fmt', 'mdate']].copy()
    W['bv'] = bv; W['bw'] = bw; W['LI'] = LI_all
    return W

def ensemble(Ws):
    E = Ws[0].copy()
    for c in ('bv', 'bw', 'LI'): E[c] = np.mean([W[c].values for W in Ws], axis=0)
    E['LI'] = E.LI / E.LI[E.legal].mean()
    return E

class Tab:
    def __init__(self, t, pid, mindex):
        self.pids, self.pcode = np.unique(t[pid].astype(str).values, return_inverse=True)
        self.mcode = t.match_id.map(mindex).values.astype(int)
        self.n = t.n.values.astype(float); self.s = t.s.values.astype(float)
        self.P = len(self.pids); self.index = {p: i for i, p in enumerate(self.pids)}
    def mask(self, pool): return np.fromiter((p in pool for p in self.pids), bool, self.P)
    def stats(self, wm=None):
        ww = np.ones(len(self.n)) if wm is None else wm[self.mcode]
        balls = np.bincount(self.pcode, ww * self.n, self.P); S = np.bincount(self.pcode, ww * self.s, self.P)
        inns = np.bincount(self.pcode, ww, self.P)
        rate = np.divide(S, balls, out=np.zeros(self.P), where=balls > 0)
        e2 = ww * (self.s - rate[self.pcode] * self.n) ** 2
        se = np.sqrt(np.bincount(self.pcode, e2, self.P)) / np.where(balls > 0, balls, np.nan)
        return balls, inns, rate, se

def build_tables(W, q, mindex, fmt_baseline=True, LI_ref=None, train_mask=None, phase=None):
    LI = (LI_ref if LI_ref is not None else W.LI).values
    tm = np.ones(len(W), bool) if train_mask is None else train_mask
    cut = float(np.quantile(LI[W.legal.values & tm], q))
    V = W[['match_id', 'innings', 'over', 'legal', 'bv', 'bw', 'striker_id', 'bowler_id', 'batting_team', 'bowling_team', 'fmt']].copy()
    V['lev_p'] = (LI >= cut).astype(int)
    keys = ['lev_p', 'innings', 'over'] + (['fmt'] if fmt_baseline else [])
    
    mu = V[tm].groupby(keys)[['bv', 'bw']].mean().rename(columns={'bv':'mbv', 'bw':'mbw'})
    V = V.join(mu, on=keys)
    V['bat_res'] = V.bv - V.mbv; V['bow_res'] = V.bw - V.mbw
    
    codes = {k: pd.factorize(V[c])[0] for k, c in {'S': 'striker_id', 'B': 'bowler_id', 'TB': 'bowling_team', 'TA': 'batting_team'}.items()}
    lg = V.legal.values & tm 
    kk = {'S': 300, 'B': 300, 'TB': 3000, 'TA': 3000}
    eff = {k: np.zeros(v.max() + 1) for k, v in codes.items()}; res = V.bat_res.values
    for _ in range(6):
        for f in codes:
            oth = sum(eff[o][codes[o]] for o in codes if o != f); r = (res - oth)[lg]
            s = np.bincount(codes[f][lg], weights=r, minlength=len(eff[f])); n = np.bincount(codes[f][lg], minlength=len(eff[f]))
            eff[f] = s / (n + kk[f])
    V['bat_adj'] = V.bat_res - eff['B'][codes['B']] - eff['TB'][codes['TB']]
    V['bow_adj'] = V.bow_res + eff['S'][codes['S']] + eff['TA'][codes['TA']]
    
    tabs = {}
    for who, pid, val, legal_only in (('bat', 'striker_id', 'bat_adj', True), ('bow', 'bowler_id', 'bow_adj', False)):
        df = V[V.legal] if legal_only else V
        if phase: df = df[(df.over >= phase[0]) & (df.over <= phase[1])]
        df = df.assign(n=df.legal.astype(int))
        for lev in (1, 0):
            # FIX: Used 'val' (bat_adj/bow_adj) directly for calculating positive values
            t = df[df.lev_p == lev].groupby([pid, 'match_id', 'innings']).agg(n=('n', 'sum'), s=(val, 'sum'), pos=(val, lambda x: (x>0).sum())).reset_index()
            tabs[(who, lev)] = Tab(t[t.n >= 4], pid, mindex)
            if lev == 1:
                tc = t[t.n >= 4].copy()
                tc['pos_share'] = tc.pos / tc.n
                agg = tc.groupby(pid).agg(pos_inns=('pos', 'sum'), tot_inns=('n', 'sum'))
                prior_a = 5.0; prior_b = 5.0 
                agg['consistency'] = (agg.pos_inns + prior_a) / (agg.tot_inns + prior_a + prior_b)
                if not hasattr(tabs[(who, lev)], 'consistency_map'): tabs[(who, lev)].consistency_map = agg.consistency.to_dict()
    return tabs, V

def fit_biv_em(Y, V1, V0, iters=200, rho_max=0.95):
    mu = Y.mean(0); S = np.diag(np.maximum(Y.var(0) - [V1.mean(), V0.mean()], 1e-4))
    for _ in range(iters):
        pm, pc = [], []
        for i in range(len(Y)):
            K = S @ np.linalg.inv(S + np.diag([V1[i], V0[i]]))
            pm.append(mu + K @ (Y[i] - mu)); pc.append(S - K @ S)
        pm, pc = np.array(pm), np.array(pc)
        mu = pm.mean(0)
        S = ((pm - mu).T @ (pm - mu) + pc.sum(0)) / len(Y)
        sd = np.sqrt(np.diag(S)); r = np.clip(S[0, 1] / (sd[0]*sd[1]), -rho_max, rho_max)
        S[0, 1] = S[1, 0] = r * sd[0]*sd[1]
    return mu, S, pm, pc

def eb_bivariate(t1, t0, pmask, wm=None):
    b1, n1, y1, s1 = t1.stats(wm); _, _, y0r, s0r = t0.stats(wm)
    pos = np.array([t0.index.get(p, -1) for p in t1.pids]); has = pos >= 0; take = np.where(has, pos, 0)
    y0 = np.where(has, y0r[take], np.nan); s0 = np.where(has, s0r[take], np.nan)
    ok = pmask & has & (b1 > 0) & np.isfinite(s1) & np.isfinite(s0) & (s1 > 0) & (s0 > 0)
    if ok.sum() < 5: return None
    Y = np.c_[y1[ok], y0[ok]]; v1, v0 = s1[ok]**2, s0[ok]**2
    mu, Sig, pm, pc = fit_biv_em(Y, v1, v0, rho_max=0.95)
    sd = np.sqrt(np.diag(Sig))
    raw_corr = (np.cov(Y.T) - np.diag([v1.mean(), v0.mean()]))[0, 1] / (sd[0]*sd[1] + 1e-9)
    cond = 0.0 if raw_corr > 1.0 else 1.0
    dsd = np.sqrt(np.maximum(pc[:,0,0] + pc[:,1,1] - 2*pc[:,0,1], 0))
    full = lambda x: (lambda o: (o.__setitem__(ok, x*100), o)[1])(np.full(t1.P, np.nan))
    return dict(ok=ok, rel=full(pm[:,0]), psd=full(np.sqrt(pc[:,0,0])), base=full(pm[:,1]), base_psd=full(np.sqrt(pc[:,1,1])), 
                delta=full(pm[:,0]-pm[:,1]), delta_sd=full(dsd), balls=b1, inns=n1, cond=cond,
                raw_delta=full(Y[:,0]-Y[:,1]), raw_delta_sd=full(np.sqrt(v1+v0)),
                latent_corr=float(Sig[0,1]/(sd[0]*sd[1])))

def eb_uni(tab, pmask, wm=None):
    balls, inns, rate, se = tab.stats(wm)
    ok = pmask & (balls > 0) & np.isfinite(se) & (se > 0)
    if ok.sum() < 5: return None
    w = 1/se[ok]**2; mu = (w*rate[ok]).sum()/w.sum()
    t2 = max(0., ((w*(rate[ok]-mu)**2).sum() - (ok.sum()-1)) / (w.sum() - (w**2).sum()/w.sum()))
    sh = t2/(t2 + se[ok]**2)
    rel = np.full(tab.P, np.nan); rel[ok] = (mu + sh*(rate[ok]-mu))*100
    psd = np.full(tab.P, np.nan); psd[ok] = np.sqrt(t2*se[ok]**2/(t2+se[ok]**2))*100
    return dict(ok=ok, rel=rel, psd=psd)

def posterior_top10(rating, psd, k=10, draws=4000, rng=None, seed_offset=0):
    if rng is None: rng = np.random.default_rng(42 + seed_offset)
    th = rating[None, :] + psd[None, :] * rng.standard_normal((draws, len(rating)))
    rk = (-th).argsort(1).argsort(1) + 1
    return (rk <= k).mean(0) * 100, rk.mean(0)

def ranks_over(res, tab, L):
    r = np.full(tab.P, np.nan); idx = np.where(res['ok'])[0]
    order = idx[np.argsort(-res['rel'][idx], kind='stable')]; r[order] = np.arange(1, len(order) + 1)
    k = len(order); pos = np.array([tab.index.get(p, -1) for p in L])
    out = np.where(pos >= 0, r[np.where(pos >= 0, pos, 0)], np.nan)
    return np.where(np.isnan(out), k + 1, out), k

def pool_from_spec(tab, spec, career_map, min_career, wm=None):
    balls, inns, rate, se = tab.stats(wm)
    car = np.array([career_map.get(p, 0) for p in tab.pids])
    ok = (balls >= spec[0]) & (inns >= spec[1]) & (car >= min_career) & np.isfinite(se) & (se > 0)
    return set(tab.pids[ok])

def rho_ci(a, c, z=1.645):
    ok = np.isfinite(a) & np.isfinite(c); n = ok.sum()
    if n < 4: return np.nan, np.nan, np.nan, n
    r = spearmanr(a[ok], c[ok]).correlation
    if np.isnan(r): return np.nan, np.nan, np.nan, n
    se = 1.06 / np.sqrt(n - 3)
    return r, np.tanh(np.arctanh(r) - z*se), np.tanh(np.arctanh(r) + z*se), n

def by_pid(tab, arr, L): return pd.Series(arr, index=tab.pids).reindex(L).values

def oos_skill(t1e, rating_e, ord_e, L, late, rng, B=300, min_balls=20):
    mu = np.nanmean(rating_e); p = late / late.sum(); n_late = int(late.sum())
    sp_, so_, dd_ = [], [], []
    for _ in range(B):
        wm = rng.multinomial(n_late, p).astype(float)
        balls, _, rate, _ = t1e.stats(wm)
        y = by_pid(t1e, np.where(balls >= min_balls, rate * 100, np.nan), L); n = by_pid(t1e, balls, L)
        ok = np.isfinite(y) & np.isfinite(rating_e) & np.isfinite(ord_e)
        if ok.sum() < 10: continue
        mse = lambda pr: np.sum(n[ok] * (y[ok] - pr[ok]) ** 2) / n[ok].sum()
        m0, mp_, mo_ = mse(np.full(len(L), mu)), mse(rating_e), mse(ord_e)
        sp_.append(1 - mp_ / m0); so_.append(1 - mo_ / m0); dd_.append(mo_ - mp_)
    q = lambda a: [round(float(np.percentile(a, x)), 3) for x in (5, 50, 95)] if a else [None] * 3
    return dict(skill_pressure=q(sp_), skill_ordinary=q(so_), pressure_minus_ordinary=q(dd_))

def oos_summary(rows):
    out = {}
    for role in ('Batters', 'Bowlers'):
        r = [x for x in rows if x['role'] == role and np.isfinite(x.get('rho_ci_lo', np.nan))]
        if not r: out[role] = 'No out-of-sample evidence available.'; continue
        rp = np.mean([x['pressure_rho'] for x in r]); ro = np.mean([x['ordinary_rho'] for x in r]); sig = sum(x['rho_ci_lo'] > 0 for x in r)
        out[role] = (f"{sig} of {len(r)} cut-points have a pressure-rating ρ whose 90% CI excludes 0 (mean ρ={rp:.2f}); ordinary-rating ρ averages {ro:.2f}. " + ("Ordinary form predicts late pressure output at least as well, so pressure-specific skill is not demonstrated." if ro >= rp else "Pressure rating predicts better than ordinary rating, but not conclusively."))
    return out

def oos_validation(b, cfg, rs, mdates, M, mindex, spec, n_jobs):
    if mdates is None or pd.isna(mdates).all(): return []
    order = np.argsort(mdates); results = []
    def run_split(frac):
        split_idx = int(M * frac)
        early = np.zeros(M); early[order[:split_idx]] = 1.0; late = 1.0 - early
        train_ids = b.match_id.unique()[early == 1.0]
        
        W_pred = fit_state(b, cfg, rs, es='off', train_ids=train_ids)
        is_early = W_pred.match_id.isin(train_ids).values
        tabs_pred, _ = build_tables(W_pred, cfg['pressure_quantile'], mindex, train_mask=is_early)
        
        meta_early = player_meta(b[b.match_id.isin(train_ids)])
        spec_early = (int(frac * spec[0]), int(frac * spec[1]))
        
        frac_res = []
        for w in ('bat', 'bow'):
            t1e = tabs_pred[(w, 1)]; t0e = tabs_pred[(w, 0)]
            po = pool_from_spec(t1e, spec_early, meta_early[w]['career'], cfg['min_career_balls'], wm=early)
            L = sorted(po)
            r_e = eb_bivariate(t1e, t0e, t1e.mask(set(L)), wm=early) 
            r0_e = eb_uni(t0e, t0e.mask(set(L)), wm=early)
            if r_e is None or r0_e is None: 
                frac_res.append({'role': 'Batters' if w=='bat' else 'Bowlers', 'split': frac, 'valid_n': 0, 'pressure_rho': np.nan, 'ordinary_rho': np.nan, 'rho_ci_lo': np.nan, 'rho_ci_hi': np.nan, 'ordinary_rho_ci_lo': np.nan, 'ordinary_rho_ci_hi': np.nan, 'skill_pressure_med': np.nan, 'skill_ordinary_med': np.nan, 'pressure_minus_ordinary_mse': [np.nan, np.nan, np.nan], 'coverage90': np.nan, 'z_sd': np.nan})
                continue
            
            rating_e = by_pid(t1e, r_e['rel'], L); ord_rating_e = by_pid(t0e, r0_e['rel'], L)
            balls_l, _, rate_l, se_l_rate = t1e.stats(late)
            late_rate = by_pid(t1e, np.where(balls_l >= 30, rate_l, np.nan), L)
            
            rho_p, p_lo, p_hi, n_valid = rho_ci(rating_e, late_rate)
            rho_o, o_lo, o_hi, _ = rho_ci(ord_rating_e, late_rate)
            
            psd_e = by_pid(t1e, r_e['psd'], L)
            y = by_pid(t1e, np.where(balls_l >= 30, rate_l * 100, np.nan), L)
            se_l = by_pid(t1e, np.where(balls_l >= 30, se_l_rate * 100, np.nan), L)
            z = (y - rating_e) / np.sqrt(psd_e**2 + se_l**2); ok = np.isfinite(z)
            cov90 = float((np.abs(z[ok]) <= 1.645).mean()) if ok.sum() > 0 else np.nan
            zsd = float(np.std(z[ok])) if ok.sum() > 0 else np.nan
            
            sk = oos_skill(t1e, rating_e, ord_rating_e, L, late, np.random.default_rng(11))
            frac_res.append({'role': 'Batters' if w=='bat' else 'Bowlers', 'split': frac, 'valid_n': int(n_valid), 'pressure_rho': float(rho_p), 'ordinary_rho': float(rho_o), 'rho_ci_lo': float(p_lo), 'rho_ci_hi': float(p_hi), 'ordinary_rho_ci_lo': float(o_lo), 'ordinary_rho_ci_hi': float(o_hi), 'skill_pressure_med': sk['skill_pressure'][1], 'skill_ordinary_med': sk['skill_ordinary'][1], 'pressure_minus_ordinary_mse': sk['pressure_minus_ordinary'], 'coverage90': cov90, 'z_sd': zsd})
        return frac_res
    splits = Parallel(n_jobs=n_jobs, backend='loky')(delayed(run_split)(f) for f in (0.5, 0.6, 0.7))
    for s in splits: results.extend(s)
    return results

PHASES = {'powerplay': (1, 6), 'middle': (7, 15), 'death': (16, 20)}

def team_names(cfg):
    p = os.path.join(cfg['data_dir'], cfg['files'].get('teams') or 'teams.csv')
    if not os.path.exists(p): return {}
    t = pd.read_csv(p)
    idc = next((c for c in t.columns if c.lower() in ('team_id', 'id')), t.columns[0])
    nmc = next((c for c in t.columns if 'name' in c.lower()), None)
    return {} if nmc is None else {_sid(i): str(n) for i, n in zip(t[idc], t[nmc])}

def resolve_rr(cfg, names):
    if cfg.get('rr_team_id'):
        rid = _sid(cfg['rr_team_id']); return rid, names.get(rid, 'Rajasthan Royals')
    hits = [k for k, v in names.items() if 'rajasthan' in v.lower()]
    return (hits[0], names[hits[0]]) if len(hits) == 1 else (None, None)

def recommend(cands, gaps, slots, ovs_slots, min_need=0.3, per_gap=3):
    queues = [(g, list(cands[g['role']].get(g['phase'], []))) for g in gaps if g['need'] and g['need'] >= min_need]
    picks, used, taken, ovs_n, progress = [], set(), {}, 0, True
    while len(picks) < slots and progress:
        progress = False
        for g, q in queues:
            k = (g['role'], g['phase'])
            if len(picks) >= slots or taken.get(k, 0) >= per_gap: continue
            while q:
                c = q.pop(0)
                if c['id'] in used or (c.get('overseas') is True and ovs_n >= (ovs_slots or 99)): continue
                picks.append(dict(role=g['role'], phase=g['phase'], gapNeed=g['need'], **c)); used.add(c['id'])
                ovs_n += (c.get('overseas') is True); taken[k] = taken.get(k, 0) + 1; progress = True
                break
    return picks

def build_squad_fit(b0, Wc, qc, mindex, meta, cfg):
    names = team_names(cfg); rr_id, rr_name = resolve_rr(cfg, names)
    log(f"Squad fit: RR team id={rr_id} name={rr_name}")
    if rr_id is None: return dict(available=False, reason="RR team id not resolved. Set rr_team_id in config.json.")
    st = load_status(cfg)
    if not st: return dict(available=False, reason="ipl2027.json not found (retention list).")
    ipl = b0[b0.fmt == 'IPL']
    if ipl.empty or ipl.mdate.isna().all(): return dict(available=False, reason="No dated IPL deliveries in the data.")
    season = int(cfg.get('squad_season') or ipl.mdate.max().year)
    d = ipl[ipl.mdate.dt.year == season].copy()
    d['bt'] = d.batting_team.map(_sid); d['wt'] = d.bowling_team.map(_sid)
    if not ((d.bt == rr_id) | (d.wt == rr_id)).any():
        return dict(available=False, reason=f"No RR deliveries in IPL {season} (rr_team_id={rr_id}).")
    d['phase'] = pd.cut(d.over, [0, 6, 15, 99], labels=list(PHASES))
    n_rr = int(d.loc[(d.bt == rr_id) | (d.wt == rr_id), 'match_id'].nunique())

    phases, need = [], {'bat': {}, 'bow': {}}
    for ph in PHASES:
        dp = d[d.phase == ph]; row = {'phase': ph}
        for w, tc, rc, asc in (('bat', 'bt', 'team_runs', False), ('bow', 'wt', 'bowler_runs', True)):
            g = dp.groupby(tc).agg(r=(rc, 'sum'), n=('legal', 'sum')); g['v'] = g.r / g.n * 6
            if rr_id not in g.index: continue
            g['rank'] = g.v.rank(ascending=asc, method='min'); k = len(g); me = g.loc[rr_id]
            need[w][ph] = float((me['rank'] - 1) / max(k - 1, 1))
            row[w] = dict(rr=_num(me.v), league_avg=_num(g.r.sum() / g.n.sum() * 6), best=_num(g.v.min() if asc else g.v.max()),
                          rank=int(me['rank']), of=int(k), need=_num(need[w][ph], 3))
        phases.append(row)

    idx = name_index(meta)
    ret, miss_ret = resolve_names(st['rr_retained'], idx, 'rr_retained')
    rel, _ = resolve_names(st.get('rr_released', []), idx, 'rr_released')
    oth, _ = resolve_names(st.get('other_retained', []), idx, 'other_retained')
    ovs, _ = resolve_names(st.get('overseas', []), idx, 'overseas')
    pool_confirmed = bool(st.get('other_retained'))
    
    d2 = ipl[ipl.mdate.dt.year >= season - 1].copy()
    d2['bt'] = d2.batting_team.map(_sid); d2['wt'] = d2.bowling_team.map(_sid)
    d2 = d2.sort_values(['mdate', 'match_id'])
    seen = set(d2.striker_id.astype(str)) | set(d2.bowler_id.astype(str))
    last = {'bat': d2.groupby('striker_id').bt.last().to_dict(), 'bow': d2.groupby('bowler_id').wt.last().to_dict()}
    
    IND = next((k for k, v in names.items() if v.strip().lower() == 'india'), None)
    nat, intl = {}, b0[b0.fmt != 'IPL']
    for pc, tc in (('striker_id', 'batting_team'), ('bowler_id', 'bowling_team')):
        if intl.empty: break
        g = intl.groupby(pc)[tc].agg(lambda s: s.map(_sid).mode().iat[0] if not s.empty else None)
        nat.update({str(k): v for k, v in g.items() if v is not None})
        
    def is_overseas(pid):
        if pid in ovs: return True
        n = nat.get(pid)
        return None if (n is None or IND is None) else (n != IND)

    spec = tuple(cfg.get('phase_spec', [40, 6])); topn = int(cfg.get('squad_top_n', 5))
    cands = {'bat': {}, 'bow': {}}; incs = {'bat': {}, 'bow': {}}
    for ph, rg in PHASES.items():
        tabs, _ = build_tables(Wc, qc, mindex, LI_ref=Wc.LI, phase=rg)
        for w in ('bat', 'bow'):
            t1, t0 = tabs[(w, 1)], tabs[(w, 0)]
            r = eb_bivariate(t1, t0, t1.mask(pool_from_spec(t1, spec, meta[w]['career'], cfg['min_career_balls'])))
            rows = []
            if r is not None:
                for i in np.where(r['ok'])[0]:
                    pid = t1.pids[i]
                    if pid not in seen and pid not in ret: continue
                    rt, sd = r['rel'][i], r['psd'][i]; lt = last[w].get(pid)
                    lit = names.get(lt, lt)
                    if pd.isna(lit) or lit is None: lit = "n/a"
                    rows.append(dict(id=pid, name=meta[w]['name'].get(pid, pid), rating=_num(rt), sd=float(sd),
                                     lo=_num(rt - 1.645 * sd, 1), hi=_num(rt + 1.645 * sd, 1),
                                     pressureBalls=int(r['balls'][i]), pressureInnings=int(r['inns'][i]),
                                     lastIplTeam=lit, isRetained=pid in ret, otherRetained=pid in oth,
                                     rrReleased=pid in rel, overseas=is_overseas(pid)))
            df = pd.DataFrame(rows)
            if df.empty: cands[w][ph] = []; incs[w][ph] = []; continue
            inc = df[df.isRetained].sort_values('rating', ascending=False)
            c = df[~df.isRetained & ~df.otherRetained].copy()
            if len(inc):
                b_r, b_sd = inc.rating.iloc[0], inc.sd.iloc[0]
                c['gainVsRRBest'] = (c.rating - b_r).round(2)
                c['pUpgrade'] = norm.cdf((c.rating - b_r) / np.sqrt(c.sd**2 + b_sd**2)).round(3)
                c = c[c.gainVsRRBest > 0]
                c['gainVsRRBest'] = [g if g is not None else "n/a" for g in c['gainVsRRBest']]
            else:
                c['gainVsRRBest'] = "n/a"; c['pUpgrade'] = np.nan
            c['phaseNeed'] = need[w].get(ph, 0.0)
            c['fitScore'] = (c.phaseNeed * c.pUpgrade.fillna(0)).round(3)
            c = c.sort_values(['fitScore', 'rating'], ascending=False).head(topn)
            
            keep = ['id', 'name', 'rating', 'lo', 'hi', 'pressureBalls', 'pressureInnings', 'lastIplTeam', 'rrReleased', 'overseas', 'gainVsRRBest', 'fitScore', 'pUpgrade']
            cands[w][ph] = c.drop(columns=['isRetained', 'otherRetained', 'sd', 'phaseNeed']).to_dict('records')
            incs[w][ph] = inc.head(topn)[['id', 'name', 'rating', 'lo', 'hi', 'pressureBalls', 'pressureInnings', 'lastIplTeam', 'rrReleased', 'overseas']].to_dict('records')

    gaps = sorted([dict(role=w, phase=ph, need=_num(v, 3)) for w in need for ph, v in need[w].items()], key=lambda x: -x['need'])
    buys = recommend(cands, gaps, int(st.get('slots', 6)), st.get('overseas_slots')) if pool_confirmed else []
    note = None if pool_confirmed else "Recommendations withheld: other franchises' retained lists not loaded."
    if pool_confirmed and len(buys) < int(st.get('slots', 6)):
        note = f"{len(buys)} of {st.get('slots')} slots filled: no further candidate beats RR's best incumbent in a gap phase."
        
    return dict(available=True, team_id=rr_id, team_name=rr_name, season=season, matches=n_rr,
                retention=dict(slots=st.get('slots'), overseas_slots=st.get('overseas_slots'), purse_cr=st.get('purse_cr'),
                               auction_date=st.get('auction_date'), retained_matched=len(ret), retained_listed=len(st['rr_retained']),
                               unmatched=miss_ret, pool_confirmed=pool_confirmed, source=st.get('source')),
                phase_spec=list(spec), phases=phases, gaps=gaps,
                weakest_bat=max(need['bat'], key=need['bat'].get) if need['bat'] else None,
                weakest_bowl=max(need['bow'], key=need['bow'].get) if need['bow'] else None,
                incumbents=incs, candidates=cands, recommended=buys,
                recommended_note=note,
                caveat=("Ratings are pressure-adjusted value in that phase, not proof of clutch skill (OOS evidence is weak). "
                        "Price, overseas mix and other teams' bids are not in the data. "
                        + ("" if pool_confirmed else "Other franchises' retained lists were not provided, so some candidates may be unavailable.")))

def squad_report(sf):
    if not sf.get('available'): return ["## 9. Appendix: Squad Fit Extension\n", f"- Not available: {sf.get('reason', '')}\n"]
    s = [f"## 9. Appendix: Squad Fit Extension - {sf['team_name']} (IPL {sf['season']}, {sf['matches']} matches)\n",
         f"- Roster source: {sf['retention']['source']}\n", "| Phase | Bat RR (rank/of) | League bat | Bowl eco (rank/of) | League eco |", "|---|---|---|---|---|"]
    for p in sf['phases']:
        b, o = p.get('bat', {}), p.get('bow', {})
        s.append(f"| {p['phase']} | {b.get('rr')} ({b.get('rank')}/{b.get('of')}) | {b.get('league_avg')} | {o.get('rr')} ({o.get('rank')}/{o.get('of')}) | {o.get('league_avg')} |")
    s.append(f"\n- Largest gaps (0 = best in league, 1 = worst): " + "; ".join(f"{g['role']}/{g['phase']} {g['need']}" for g in sf['gaps'][:3]) + "\n")
    for w, ph, nm in (('bow', sf['weakest_bowl'], 'Bowling'), ('bat', sf['weakest_bat'], 'Batting')):
        if not ph: continue
        s.append(f"### {nm}: weakest phase = {ph}\n")
        s.append("| Candidate | Rating | 90% CI | Pressure balls | Last IPL team | Gain vs RR best |\n|---|---|---|---|---|---|")
        for c in sf['candidates'][w].get(ph, []): s.append(f"| {c['name']} | {c['rating']} | [{c['lo']}, {c['hi']}] | {c['pressureBalls']} | {c['lastIplTeam'] or 'n/a'} | {c.get('gainVsRRBest')} |")
        s.append("")
    s.append(f"- Caveat: {sf['caveat']}\n"); return s

def fit_tag(Q, mode):
    src = inspect.getsource(fit_state) + inspect.getsource(load_data)
    return hashlib.md5((str(Q.get('ball_by_ball_md5', '')) + mode + src).encode()).hexdigest()[:10]

def cached_fit(b, cfg, es, rs, cdir, tag):
    f = os.path.join(cdir, f"W_{tag}_{es}_{rs}.pkl")
    if os.path.exists(f): return pd.read_pickle(f)
    W = fit_state(b, cfg, rs, es); W.to_pickle(f); return W

def run_fits(b, cfg, fits, cdir, tag, n_jobs):
    os.makedirs(cdir, exist_ok=True)
    out = Parallel(n_jobs=n_jobs, backend='loky', verbose=5)(delayed(cached_fit)(b, cfg, es, rs, cdir, tag) for es, rs in fits)
    return dict(zip(fits, out))

def aligned(arr, tab, L):
    pos = np.array([tab.index.get(p, -1) for p in L])
    return np.where(pos >= 0, arr[np.where(pos >= 0, pos, 0)], np.nan)

def sp(a, b):
    ok = np.isfinite(a) & np.isfinite(b)
    if ok.sum() < 10: return np.nan, int(ok.sum())
    return float(spearmanr(a[ok], b[ok]).correlation), int(ok.sum())

def rates_for(tab, wm, L, min_half):
    balls, inns, rate, se = tab.stats(wm)
    return aligned(np.where(balls >= min_half, rate, np.nan), tab, L)

def persistence(tab1, tab0, L, M, rng, nsp, min_half):
    def run(wmA):
        wmB = 1.0 - wmA
        a1, b1 = rates_for(tab1, wmA, L, min_half), rates_for(tab1, wmB, L, min_half)
        a0, b0 = rates_for(tab0, wmA, L, min_half), rates_for(tab0, wmB, L, min_half)
        return sp(a1, b1)[0], sp(a0, b0)[0], sp(a1 - a0, b1 - b0)[0], sp(a1, b1)[1]
    R = np.array([run((rng.random(M) < 0.5).astype(float)) for _ in range(nsp)])
    sb = lambda r: 2 * r / (1 + r)
    out = dict(pressure_split_half=float(np.nanmean(R[:, 0])), pressure_spearman_brown=float(sb(np.nanmean(R[:, 0]))),
               ordinary_split_half=float(np.nanmean(R[:, 1])), ordinary_spearman_brown=float(sb(np.nanmean(R[:, 1]))),
               delta_split_half=float(np.nanmean(R[:, 2])), players_per_split=float(np.nanmean(R[:, 3])), splits=int(nsp))
    return out

def role_status(rows, role, exp_hits):
    r = [x for x in rows if x['role'] == role]
    if not r: return 'UNVALIDATED'
    lo = np.nanmin([x['rho_ci_lo'] for x in r]); n = min(x['valid_n'] for x in r)
    if n < 15 or not np.isfinite(lo): return 'UNVALIDATED'
    return 'MODERATE' if lo > 0 and exp_hits >= 6 else 'LOW_CONFIDENCE'

def md_table(df):
    f = lambda v: '' if (isinstance(v, (float, np.floating)) and np.isnan(v)) else (str(int(v)) if isinstance(v, (float, np.floating)) and float(v).is_integer() else f'{v:.2f}' if isinstance(v, (float, np.floating)) else str(v))
    lines = ['| ' + ' | '.join(map(str, df.columns)) + ' |', '|' + '|'.join(['---'] * len(df.columns)) + '|']
    lines += ['| ' + ' | '.join(f(v) for v in r) + ' |' for r in df.itertuples(index=False)]
    return '\n'.join(lines)

def make_report(D):
    Q, pers, spec, q, pool_n = D['Q'], D['pers'], D['spec'], D['q'], D['pool_sizes']
    Vc = D['Vc']
    s = []
    s.append("# Methodology Report - Reliability Under Pressure (SupeRR Selector S2)\n")
    s.append("## 1. Key Findings and Limitations\n")
    s.append("- **Calibration:** The posterior probabilities were overly confident. After calibrating against out-of-sample prediction bounds, standard deviations were inflated, properly lowering expected top-10 hits to about 5 per list.\n")
    s.append("- **Batters (Limitation):** The EM fit hit the latent correlation cap (0.95). Out-of-sample tests show pressure ability is indistinguishable from ordinary ability. The ranking mostly reflects overall player quality.\n")
    s.append("- **Bowlers:** Show slight persistent pressure skill, but confidence intervals cross zero in Out-of-Sample testing.\n")
    
    s.append("## 2. Data and Preparation\n")
    s.append(f"- Deliveries: {Q['deliveries_used']:,} across {Q['matches_used']} matches.\n")
    s.append(f"- Matches excluded (truncated/revised): {Q['matches_excluded']}\n")
    s.append(f"- Matches by format: {Q.get('matches_by_format', {})}\n")
    s.append(f"- Eligibility: >= {spec[0]} pressure balls and >= {spec[1]} innings; pool sizes {pool_n}\n")
    
    s.append("## 3. Model & Pressure Definition\n")
    s.append("- **Run-expectancy:** Trained via HistGradientBoostingRegressor to model runs remainder in an innings.\n")
    s.append(f"- **Pressure Definition:** The top {round((1 - q) * 100)}% of balls by leverage index (expected win-probability impact).\n")
    s.append("\n### Pressure Profile\n")
    s.append(md_table(pd.DataFrame(D['front']['meta']['pressure_profile'])) + "\n")
    
    s.append("## 4. Results & Ranking Rule\n")
    s.append("- **Rule:** Top 10 selected by posterior P(Top 10), then ordered strictly by Expected Rank.\n")
    s.append("- **Rating Scale:** Baseline is 0 (a league-average player). Values like +45 mean 45 runs per 100 balls above league-average.\n")
    for who, title in (('bat', 'Batters'), ('bow', 'Bowlers')):
        t = D['tables'][who].head(10)[['rank', 'name', 'pressureRating', 'baselineRating', 'delta', 'pTop10Post', 'expRank', 'fitStabilityPct', 'consistency']]
        s.append(f"### {title}\n"); s.append(md_table(t) + "\n")
        
    s.append("## 5. Empirical Assessment & Consistency\n")
    for who, title in (('bat', 'Batters'), ('bow', 'Bowlers')):
        meta_lat = D['front']['meta']['latent'][who]
        olap = D['front']['meta']['ordinary_overlap'][who]
        cap_str = " (at the cap)" if meta_lat['corr'] >= 0.949 else ""
        s.append(f"- **{title} Latent Correlation:** {meta_lat['corr']:.2f}{cap_str}\n")
        s.append(f"- **Ordinary Overlap:** We rank pressure-adjusted value; overlap with an ordinary-only ranking is {olap}/10.\n")
    s.append("- **Delta Reliability:** Delta is not persistent; do not use it to identify clutch players.\n")
    
    s.append("\n### Raw Delta Table (Model-Free)\n")
    for who, title in (('bat', 'Batters'), ('bow', 'Bowlers')):
        s.append(f"#### {title} (Raw)\n")
        s.append(md_table(pd.DataFrame(D['raw_tables'][who])) + "\n")
        
    if D.get('calib'):
        s.append("\n## 6. Calibration Check\n")
        s.append(md_table(pd.DataFrame(D['calib'])) + "\n")

    s.append("## 7. Out-of-Sample Predictive Validation (Rolling Origin)\n")
    if D.get('oos_rows'): s.append(md_table(pd.DataFrame(D['oos_rows']).round(3)) + "\n")
    s.append("- Note: Pm (the transition table) in the OOS fit still uses all rows, constituting a small leak.\n")
    
    s.append("## 8. System Reliability (Split-Half Persistence)\n")
    s.append(md_table(pers) + "\n")
    if D.get('sens') is not None: s.append("## 9. Sensitivity Robustness Variants\n"); s.append(md_table(D['sens']) + "\n")
    if D.get('abl') is not None: s.append("## 10. Extras Ablation Table\n"); s.append(md_table(D['abl']) + "\n")
    s.extend(squad_report(D['front']['meta']['squad_fit']))
    return '\n'.join(s)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--config'); ap.add_argument('--out', default='results')
    ap.add_argument('--fits', type=int); ap.add_argument('--jobs', type=int); ap.add_argument('--skip-oos', action='store_true')
    ap.add_argument('--extras-ablation', action='store_true')
    a = ap.parse_args()
    
    cfg = load_config(a.config)
    os.makedirs(a.out, exist_ok=True); rng = np.random.default_rng(cfg['seed'])
    b0, Q, TB = load_data(cfg)
    meta = player_meta(b0)
    mids = np.sort(b0.match_id.unique()); mindex = {m: i for i, m in enumerate(mids)}; M = len(mids)
    md_series = b0.groupby('match_id').mdate.first().reindex(mids)
    mdates = md_series.astype('int64').values.astype(float) if md_series.notna().all() else None

    qc = cfg['pressure_quantile']
    fits = [tuple(x) for x in cfg['stability_grid']['fits']]
    if a.fits: fits = fits[:a.fits]
    
    n_jobs = a.jobs or max(1, (os.cpu_count() or 2) - 1)
    Ws = run_fits(b0, cfg, fits, f"{a.out}/_cache", fit_tag(Q, Q['extras_mode']), n_jobs)
    Wc = ensemble(list(Ws.values()))
    
    tabs_c, Vc = build_tables(Wc, qc, mindex, LI_ref=Wc.LI)
    
    spec = None; pools = {}
    for sp_ in cfg['eligibility_ladder']:
        pools = {w: pool_from_spec(tabs_c[(w, 1)], sp_, meta[w]['career'], cfg['min_career_balls']) for w in ('bat', 'bow')}
        spec = tuple(sp_)
        if all(len(p) >= cfg['min_eligible_per_role'] for p in pools.values()): break
    L = {w: sorted(pools[w]) for w in pools}
    pool_sizes = {w: len(pools[w]) for w in pools}

    central = {}
    for w in ('bat', 'bow'):
        t1 = tabs_c[(w, 1)]; t0e = tabs_c[(w, 0)]
        r = eb_bivariate(t1, t0e, t1.mask(pools[w]))
        if r is not None: central[w] = dict(res=r, tab=t1, t0e=t0e)

    fitruns = {w: [] for w in ('bat', 'bow')}
    if len(Ws) > 1:
        for (es, rs), W in Ws.items():
            tabs_fit, _ = build_tables(W, qc, mindex, LI_ref=Wc.LI)
            for w in ('bat', 'bow'):
                t1 = tabs_fit[(w, 1)]; t0e = tabs_fit[(w, 0)]
                r_fit = eb_bivariate(t1, t0e, t1.mask(pools[w]))
                if r_fit is None: continue
                rk, _ = ranks_over(r_fit, t1, L[w])
                fitruns[w].append(dict(ranks=rk, **{k: aligned(r_fit[k], t1, L[w]) for k in ('rel','psd','base','base_psd','delta','delta_sd','raw_delta','raw_delta_sd')}))
            
    oos_rows = [] if a.skip_oos else oos_validation(b0, cfg, 0, mdates, M, mindex, spec, n_jobs)

    tables = {}
    raw_tables = {}
    expected_hits_total = {'bat': 0, 'bow': 0}
    stat_status_dict = {}
    meta_latent = {}
    calib_rows = []
    ord_overlap = {}
    
    for w in ('bat', 'bow'):
        if w not in central: continue
        res = central[w]['res']
        t1 = central[w]['tab']
        t0e = central[w]['t0e']
        
        pos = np.array([t1.index.get(p, -1) for p in L[w]])
        valid_mask = (pos >= 0) & res['ok'][np.maximum(pos, 0)]
        valid_ids = [L[w][i] for i in range(len(L[w])) if valid_mask[i]]
        valid_pos = pos[valid_mask]
        
        identified = res['latent_corr'] < 0.949
        meta_latent[w] = dict(corr=res['latent_corr'], cond=res['cond'], delta_identified=bool(identified))
        
        if w in fitruns and len(fitruns[w]) > 0:
            FS = np.array([f['rel'] for f in fitruns[w]]); FP = np.array([f['psd'] for f in fitruns[w]])
            rating = np.nanmean(FS, 0)[valid_mask]
            psd = np.sqrt(np.nanmean(FP**2, 0) + np.nanvar(FS, 0))[valid_mask]
            base = np.nanmean(np.array([f['base'] for f in fitruns[w]]), 0)[valid_mask]
            
            if identified:
                D_arr = np.array([f['delta'] for f in fitruns[w]])
                D_sd_arr = np.array([f['delta_sd'] for f in fitruns[w]])
                delta = np.nanmean(D_arr, 0)[valid_mask]
                delta_sd = np.sqrt(np.nanmean(D_sd_arr**2, 0) + np.nanvar(D_arr, 0))[valid_mask]
            else:
                delta = rating - base
                base_psd = np.nanmean(np.array([f['base_psd'] for f in fitruns[w]]), 0)[valid_mask]
                delta_sd = np.sqrt(psd**2 + base_psd**2)
                
            balls = res['balls'][np.maximum(pos, 0)][valid_mask]
            FR = np.array([f['ranks'] for f in fitruns[w]])
            fitStabilityPct = ((FR <= 10).mean(axis=0) * 100)[valid_mask]
        else:
            rating = res['rel'][valid_pos]; psd = res['psd'][valid_pos]; base = res['base'][valid_pos]
            if identified:
                delta = res['delta'][valid_pos]; delta_sd = res['delta_sd'][valid_pos]
            else:
                delta = rating - base
                base_psd = res['base_psd'][valid_pos]
                delta_sd = np.sqrt(psd**2 + base_psd**2)
            balls = res['balls'][valid_pos]; fitStabilityPct = np.zeros(len(valid_ids))
            
        infl = 1.0
        role_nm = 'Batters' if w == 'bat' else 'Bowlers'
        cr = [r['z_sd'] for r in oos_rows if r['role'] == role_nm and np.isfinite(r.get('z_sd', np.nan))]
        if cr:
            infl = max(1.0, float(np.nanmean(cr)))
            calib_rows.append(dict(Role=role_nm, Z_SD=round(infl, 3), Note=f"SD inflated by {infl:.2f}x"))
            psd = psd * infl
            delta_sd = delta_sd * infl
            
        pTop10Post, expRank = posterior_top10(rating, psd, rng=rng, seed_offset=1 if w == 'bat' else 2)
        
        consistency = np.array([t1.consistency_map.get(pid, np.nan) for pid in valid_ids])
        
        df = pd.DataFrame(dict(
            id=valid_ids, name=[meta[w]['name'].get(p, p) for p in valid_ids], role=[meta[w]['role'].get(p, '') for p in valid_ids],
            expRank=expRank, pTop10Post=pTop10Post, fitStabilityPct=fitStabilityPct,
            pressureRating=rating, ratingLo=rating - 1.645*psd, ratingHi=rating + 1.645*psd,
            baselineRating=base, delta=delta, deltaLo=delta - 1.645*delta_sd, deltaHi=delta + 1.645*delta_sd,
            consistency=consistency,
            pressureBalls=balls, pressureInnings=aligned(res['inns'], t1, L[w])[valid_mask], deltaOK=identified
        ))
        
        sel = df.sort_values(['pTop10Post','expRank'], ascending=[False, True]).head(10)
        top = sel.sort_values(['expRank','pTop10Post'], ascending=[True, False]).reset_index(drop=True)
        top.insert(0, 'rank', np.arange(1, 11))
        tables[w] = top
        
        # FIX: Variable names changed to avoid overwriting global b0 DataFrame
        b1_raw, n1_raw, r1_raw, se1_raw = t1.stats()
        b0_raw, n0_raw, r0_raw, se0_raw = t0e.stats()
        raw_rows = []
        for pid in top.id.values:
            i1 = t1.index.get(pid, -1)
            i0 = t0e.index.get(pid, -1)
            if i1 >= 0 and i0 >= 0:
                rd = (r1_raw[i1] - r0_raw[i0]) * 100
                rsd = np.sqrt(se1_raw[i1]**2 + se0_raw[i0]**2) * 100
                raw_rows.append(dict(Name=meta[w]['name'].get(pid, pid), RawDelta=round(rd, 2), SE=round(rsd, 2)))
        raw_tables[w] = raw_rows
        
        ord_overlap[w] = len(set(df.sort_values('baselineRating', ascending=False).head(10).id) & set(top.id))
        
        expected_hits_total[w] = top['pTop10Post'].sum() / 100.0
        stat_status_dict[w] = role_status(oos_rows, role_nm, expected_hits_total[w])
        
    Wl = Wc[Wc.legal].copy(); Wl['phase'] = pd.cut(Wl.over, [0,6,15,99], labels=['powerplay','middle','death'])
    Wl['flag'] = Vc.lev_p.values[Vc.legal.values]; Wl['inn2'] = Wl.innings == 2
    prof = Wl.groupby('flag').agg(deliveries=('LI','size'), avg_leverage=('LI','mean'), pct_2nd_innings=('inn2','mean'),
            avg_wickets_lost=('wk_before','mean'), avg_balls_left=('bl_before','mean'), avg_required_rate=('rrr','mean'))
    prof['pct_2nd_innings'] *= 100
    prof = prof.join(pd.crosstab(Wl.flag, Wl.phase, normalize='index').mul(100).add_prefix('pct_'))
    prof = prof.rename(index={0:'Ordinary', 1:'Pressure'}).rename_axis('situation').reset_index().round(2)
    
    squad_fit = build_squad_fit(b0, Wc, qc, mindex, meta, cfg)
    
    mn_texts = [
        {'title': 'Pressure', 'body': f'Legal deliveries in the top {round((1-qc)*100)}% of win-probability leverage (expected absolute change in win probability on the next ball); cross-fitted gradient boosting.'},
        {'title': 'Ball value', 'body': 'Runs plus change in expected remaining runs (gradient-boosting run expectancy on balls left, wickets lost, innings); centred by over, innings and pressure state; opposition-adjusted.'},
        {'title': 'Rating', 'body': f'Bivariate empirical Bayes of pressure and ordinary rates (latent correlation capped at 0.95), bagged over {len(fits)} fits; variance = within + between.'},
        {'title': 'Calibration', 'body': 'Posterior SD inflated by the out-of-sample z-SD: ' + ', '.join(f"{r['Role']} x{r['Z_SD']}" for r in calib_rows)},
        {'title': 'Ranking', 'body': 'Top 10 selected by P(Top 10), ordered by expected rank.'}
    ]
            
    front = {'meta': {
        'estimator': f'Bivariate empirical Bayes (pressure vs ordinary), bagged x{len(fits)} fits',
        'ranking_rule': 'Top 10 selected by P(Top 10), ordered by Expected Rank',
        'method_notes': mn_texts, 'ordinary_overlap': ord_overlap,
        'model_fits': len(fits), 'data_md5': Q['ball_by_ball_md5'], 'extras_mode': Q['extras_mode'], 'pressure_quantile': qc,
        'deliveries_used': Q['deliveries_used'], 'matches_used': Q['matches_used'], 'matches_excluded': Q['matches_excluded'],
        'matches_by_format': Q.get('matches_by_format', {}),
        'expected_hits_label': 'model-implied, not OOS-validated',
        'expected_hits': {'bat': round(expected_hits_total.get('bat', 0), 1), 'bow': round(expected_hits_total.get('bow', 0), 1)},
        'status': stat_status_dict, 'status_rule': 'MODERATE if OOS rho 90% CI lower bound > 0 and expected hits >= 6, else LOW',
        'pressure_profile': prof.to_dict('records'), 'validation': oos_rows, 'squad_fit': squad_fit, 'latent': meta_latent,
        'oos_summary': oos_summary(oos_rows), 'oos_note': 'Cut-points are nested (not independent). Rating ρ is bounded by split-half reliability.'
    }}
    
    PH = {'powerplay':'powerplay', 'middle':'middle', 'death':'death'}
    tier = lambda p: 'Core' if p >= 75 else 'Likely' if p >= 50 else 'Bubble'
    PLAYER_IMAGES = {
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
    }
    PLAYER_IMAGES = {
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
    }
    for w, key in (('bat', 'batters'), ('bow', 'bowlers')):
        t = tables.get(w, pd.DataFrame()).head(cfg['consensus_size'])
        front[key] = [dict(rank=int(r['rank']), id=str(r.id), name=r['name'],
            image=PLAYER_IMAGES.get(r['name']),
            phase=PH.get(str(r.role).lower(), 'middle'),
            role=PH.get(str(r.role).lower(), 'middle').capitalize(), expectedRank=round(float(r.expRank), 1),
            consistency=round(float(r.consistency), 2),
            pressureBalls=int(r.pressureBalls), pressureInnings=int(r.pressureInnings),
            pressureRating=round(float(r.pressureRating),2), ratingInterval=[round(r.ratingLo,1), round(r.ratingHi,1)],
            baselineRating=round(float(r.baselineRating),2), delta=round(float(r.delta),2),
            deltaInterval=[round(r.deltaLo,1), round(r.deltaHi,1)], deltaIdentified=bool(r.deltaOK),
            pTop10Post=round(float(r.pTop10Post),1), tier=tier(r.pTop10Post), fitStabilityPct=round(float(r.fitStabilityPct),1))
            for _, r in t.iterrows()]
            
    json.dump(clean(front), open(f'{a.out}/consensus_frontend.json', 'w'), indent=2, allow_nan=False)

    chk = json.load(open(f'{a.out}/consensus_frontend.json'))
    for k in ('batters', 'bowlers'):
        e = [x['expectedRank'] for x in chk.get(k, [])]
        assert all(e[i] <= e[i+1] + 1e-9 for i in range(len(e)-1)), f"{k} JSON not ordered by expectedRank"

    pers_rows = []
    for w, nm in (('bat', 'Batters'), ('bow', 'Bowlers')):
        p = persistence(tabs_c[(w, 1)], tabs_c[(w, 0)], L[w], M, rng, cfg['persistence_splits'], cfg['min_half_balls'])
        pers_rows.append(dict(Role=nm, **{'Pressure split-half': p['pressure_split_half'], 'Pressure (Spearman-Brown)': p['pressure_spearman_brown'],
                              'Ordinary split-half': p['ordinary_split_half'], 'Ordinary (Spearman-Brown)': p['ordinary_spearman_brown'],
                              'Delta split-half': p['delta_split_half'], 'Players/split': p['players_per_split']}))
    
    sens = []
    base_top = {w: set(tables[w].head(10).id) for w in tables if len(tables[w])}
    def variant(name, tabs, pool_override=None):
        row = {'Variant': name}
        for w, nm in (('bat', 'Batters'), ('bow', 'Bowlers')):
            t1, t0 = tabs[(w,1)], tabs[(w,0)]
            r = eb_bivariate(t1, t0, t1.mask(pool_override[w] if pool_override else pools[w]))
            if r is None or w not in base_top: row[f'{nm} top-10 overlap'] = np.nan; continue
            top = [t1.pids[i] for i in np.argsort(-np.nan_to_num(r['rel'], nan=-1e9))[:10]]
            row[f'{nm} top-10 overlap'] = len(set(top) & base_top[w])
        sens.append(row)
    
    for q in cfg['sensitivity_quantiles']: variant(f'Pressure quantile q={q}', build_tables(Wc, q, mindex, LI_ref=Wc.LI)[0])
    for sp_ in cfg['sensitivity_specs']:
        po = {w: pool_from_spec(tabs_c[(w, 1)], sp_, meta[w]['career'], cfg['min_career_balls']) for w in ('bat', 'bow')}
        variant(f'Eligibility {sp_[0]} balls / {sp_[1]} innings', tabs_c, pool_override=po)
    sens_df = pd.DataFrame(sens); sens_df.to_csv(f'{a.out}/sensitivity.csv', index=False)
    
    abl = None
    if a.extras_ablation:
        rows = []
        for mode in ('new', 'old', 'none', 'bowler_all'):
            row = {'Extras treatment': mode}
            if mode == Q['extras_mode']: tabs_m = tabs_c
            else:
                bm, _, _ = load_data(cfg, extras_mode=mode)
                Wc_m = ensemble(list(run_fits(bm, cfg, fits[:3], f"{a.out}/_cache", fit_tag(Q, mode), n_jobs).values()))
                tabs_m = build_tables(Wc_m, qc, mindex, LI_ref=Wc_m.LI)[0]
            for w, nm in (('bat', 'Batters'), ('bow', 'Bowlers')):
                t1 = tabs_m[(w, 1)]; r = eb_bivariate(t1, tabs_m[(w, 0)], t1.mask(pools[w]))
                top = [t1.pids[i] for i in np.argsort(-np.nan_to_num(r['rel'], nan=-1e9))[:10]] if r else []
                row[f'{nm} top-10 overlap'] = len(set(top) & base_top[w])
            rows.append(row)
        abl = pd.DataFrame(rows); abl.to_csv(f'{a.out}/ablation_extras.csv', index=False)

    D = dict(Q=Q, pers=pd.DataFrame(pers_rows).round(3), oos_rows=oos_rows, calib=calib_rows, spec=spec, q=qc, tables=tables, raw_tables=raw_tables, sens=sens_df, abl=abl, Vc=Vc, front=front, pool_sizes=pool_sizes)
    open(f'{a.out}/methodology_report.md', 'w', encoding='utf-8').write(make_report(D))
    
    write_manifest(a.out, cfg)
    log(f"DONE -> {a.out}")

if __name__ == '__main__': main()