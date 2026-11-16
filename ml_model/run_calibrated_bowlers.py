import os
import pandas as pd
import numpy as np
from scipy.optimize import minimize_scalar
from scipy.special import gammaln
from scipy.stats import gamma

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dataset_dir = os.path.join(base_dir, "dataset")

bbb = pd.read_csv(os.path.join(dataset_dir, "ball_by_ball.csv"))
matches = pd.read_csv(os.path.join(dataset_dir, "matches.csv"))

bbb = bbb.merge(
    matches[['match_id', 'knock_out', 'comp_id', 'stage', 'win_team_id', 'venue_id']],
    on='match_id',
    how='left'
)
bbb = bbb[bbb['innings'].isin([1, 2])].copy()

# 1. LEGAL DELIVERIES ONLY (neither wide nor no-ball/Overstep)
bbb['is_legal_ball'] = (~bbb['extras_type'].isin(['wide', 'Overstep'])).astype(int)

# 2. BOWLER-CREDITED WICKETS ONLY (exclude RunOut, Retire Out, Obstructing)
bowler_dismissals = ['Caught', 'Bowled', 'LBW', 'Stump', 'Hit Wicket']
bbb['is_bowler_wicket'] = bbb['dismissal_type'].isin(bowler_dismissals).astype(int)

# Phase definition
bbb['phase'] = np.where(bbb['overid'] <= 6, 'PP', np.where(bbb['overid'] <= 15, 'Mid', 'Death'))

# Match situation tracking
bbb = bbb.sort_values(by=['match_id', 'innings', 'overid', 'over_ball_num'])
bbb['runs_num'] = pd.to_numeric(bbb['runs'], errors='coerce').fillna(0)
wide_runs = np.where(bbb['extras_type'] == 'wide', 1 + bbb['extras_2_runs'].fillna(0), 0)
noball_runs = np.where(bbb['extras_type'] == 'Overstep', 1 + bbb['extras_2_runs'].fillna(0), 0)
other_extras = np.where(bbb['extras_type'].isin(['byes', 'legbyes', 'other']), bbb['extras_2_runs'].fillna(0), 0)
bbb['total_ball_runs'] = bbb['runs_num'] + wide_runs + noball_runs + other_extras
bbb['cum_runs'] = bbb.groupby(['match_id', 'innings'])['total_ball_runs'].cumsum()
bbb['team_wickets_lost'] = bbb.groupby(['match_id', 'innings'])['is_wicket'].cumsum()

inn1_totals = bbb[bbb['innings'] == 1].groupby('match_id')['total_ball_runs'].sum().reset_index()
inn1_totals.rename(columns={'total_ball_runs': 'target_runs'}, inplace=True)
inn1_totals['target_runs'] += 1
bbb = bbb.merge(inn1_totals, on='match_id', how='left')

legal_balls_bowled = bbb.groupby(['match_id', 'innings'])['is_legal_ball'].cumsum()
bbb['balls_remaining'] = np.maximum(1, 120 - legal_balls_bowled)
bbb['runs_required'] = np.maximum(0, bbb['target_runs'] - bbb['cum_runs'])
bbb['rrr'] = np.where(bbb['innings'] == 2, (bbb['runs_required'] / bbb['balls_remaining']) * 6, 0.0)

# True Pressure Situations
c_bowl_2nd = (bbb['innings'] == 2) & (bbb['rrr'] >= 7.5) & (bbb['rrr'] <= 12.0) & (bbb['team_wickets_lost'] <= 6)
c_bowl_1st_death = (bbb['innings'] == 1) & (bbb['overid'] >= 16)
bbb['bowl_pressure'] = (c_bowl_2nd | c_bowl_1st_death).astype(int)

# Filter to legal balls
legal_df = bbb[bbb['is_legal_ball'] == 1].copy()

# Base expectation: by overid and innings
base_w = legal_df.groupby(['overid', 'innings'])['is_bowler_wicket'].mean().reset_index()
base_w.rename(columns={'is_bowler_wicket': 'base_exp_wicket'}, inplace=True)
legal_df = legal_df.merge(base_w, on=['overid', 'innings'], how='left')

# POINT 1: CALIBRATE IN EACH PRESSURE STATE x PHASE x INNINGS CELL
legal_df['cell'] = (
    legal_df['bowl_pressure'].astype(str) + '_' +
    legal_df['phase'].astype(str) + '_' +
    legal_df['innings'].astype(str)
)

cell_calib = legal_df.groupby('cell').agg(
    obs_total=('is_bowler_wicket', 'sum'),
    exp_total=('base_exp_wicket', 'sum')
).reset_index()
cell_calib['scale'] = cell_calib['obs_total'] / cell_calib['exp_total']
legal_df = legal_df.merge(cell_calib[['cell', 'scale']], on='cell', how='left')
legal_df['exp_adj'] = legal_df['base_exp_wicket'] * legal_df['scale']

# Verification of calibration
pres_df = legal_df[legal_df['bowl_pressure'] == 1]
print("==================================================================")
print("  STEP 1: CALIBRATION VERIFICATION (POOLED O - E = 0 IN EACH CELL)")
print("==================================================================")
for c, grp in pres_df.groupby('cell'):
    obs = grp['is_bowler_wicket'].sum()
    exp = grp['exp_adj'].sum()
    print(f"Cell {c:<12} | Balls: {len(grp):5d} | Obs: {obs:4d} | Exp: {exp:7.2f} | Diff: {obs - exp:+7.4f}")

total_obs = pres_df['is_bowler_wicket'].sum()
total_exp = pres_df['exp_adj'].sum()
print(f"TOTAL PRESSURE  | Balls: {len(pres_df):5d} | Obs: {total_obs:4d} | Exp: {total_exp:7.2f} | Diff: {total_obs - total_exp:+7.4f}")
print("-> Calibration holds perfectly: Pooled residual is exactly 0.0000!\n")

# Aggregation per bowler under pressure
b_agg = pres_df.groupby(['bowler_id', 'bowler_name']).agg(
    balls=('is_legal_ball', 'sum'),
    O=('is_bowler_wicket', 'sum'),
    E=('exp_adj', 'sum')
).reset_index()

career_balls = legal_df.groupby('bowler_id')['is_legal_ball'].sum().reset_index()
career_balls.rename(columns={'is_legal_ball': 'career_balls'}, inplace=True)
b_agg = b_agg.merge(career_balls, on='bowler_id', how='left')

# Role phase tags
b_phases = legal_df.groupby(['bowler_id', 'phase'])['is_legal_ball'].count().unstack().fillna(0)
b_phases['Role'] = b_phases[['Death', 'Mid', 'PP']].idxmax(axis=1)
b_phases['Role'] = b_phases['Role'].map({'Death': 'Death Overs', 'Mid': 'Middle Overs', 'PP': 'Powerplay'})
b_agg = b_agg.merge(b_phases[['Role']], on='bowler_id', how='left')

# Innings level clutch consistency
b_inns = pres_df.groupby(['bowler_id', 'match_id']).agg(
    inns_balls=('is_legal_ball', 'sum'),
    inns_O=('is_bowler_wicket', 'sum'),
    inns_E=('exp_adj', 'sum')
).reset_index()
valid_b_inns = b_inns[b_inns['inns_balls'] >= 4]
b_freq = valid_b_inns.groupby('bowler_id').agg(
    pressure_innings=('match_id', 'count'),
    positive_innings=('inns_O', lambda x: (x > valid_b_inns.loc[x.index, 'inns_E']).sum())
).reset_index()
b_freq['clutch_freq_pct'] = (b_freq['positive_innings'] / np.maximum(1, b_freq['pressure_innings'])) * 100.0
b_agg = b_agg.merge(b_freq[['bowler_id', 'pressure_innings', 'clutch_freq_pct']], on='bowler_id', how='left')

# Eligibility: career balls >= 150, pressure balls >= 100
b_elig = b_agg[(b_agg['career_balls'] >= 150) & (b_agg['balls'] >= 100)].copy()

# POINT 2: POISSON-GAMMA EMPIRICAL BAYES SHRINKAGE
O = b_elig['O'].values.astype(float)
E = b_elig['E'].values.astype(float)

def nll(a):
    return -np.sum(
        gammaln(O + a) - gammaln(a) - gammaln(O + 1)
        + a * np.log(a / (a + E)) + O * np.log(E / (a + E))
    )

res = minimize_scalar(nll, bounds=(1, 1e4), method='bounded')
a_opt = res.x

print("==================================================================")
print("  STEP 2: POISSON-GAMMA SHRINKAGE MODEL RESULTS")
print("==================================================================")
print(f"Number of eligible pressure bowlers: {len(b_elig)}")
print(f"Optimal dispersion parameter 'a': {a_opt:.2f}")

chi2 = np.sum((O - E)**2 / E)
df = len(b_elig) - 1
print(f"Pearson Chi-Square: {chi2:.2f} on {df} df (Chi2/df = {chi2/df:.3f})")
if a_opt >= 9990 or chi2 / df <= 1.0:
    print("NOTE: 'a' reaches the boundary because Pearson Chi2/df <= 1.0.")
    print("      Between-bowler variance (tau^2) is statistically zero.")
    print("      Wicket counts under pressure are dominated by Poisson noise;")
    print("      bowlers are barely distinguishable from random variation.")

b_elig['ratio'] = (b_elig['O'] + a_opt) / (b_elig['E'] + a_opt)
b_elig['xwkts_per_100'] = (b_elig['ratio'] - 1.0) * b_elig['E'] / b_elig['balls'] * 100.0

# Posterior 90% Credible Interval: Gamma(a + O, scale = 1 / (a + E))
b_elig['ratio_p05'] = gamma.ppf(0.05, a=b_elig['O'] + a_opt, scale=1.0 / (b_elig['E'] + a_opt))
b_elig['ratio_p95'] = gamma.ppf(0.95, a=b_elig['O'] + a_opt, scale=1.0 / (b_elig['E'] + a_opt))
b_elig['ci_lower'] = (b_elig['ratio_p05'] - 1.0) * b_elig['E'] / b_elig['balls'] * 100.0
b_elig['ci_upper'] = (b_elig['ratio_p95'] - 1.0) * b_elig['E'] / b_elig['balls'] * 100.0

# Sort by xwkts_per_100 descending
top_bowlers = b_elig.sort_values(by='xwkts_per_100', ascending=False).reset_index(drop=True)

print("\n=======================================================================================================")
print("  TOP 15 BOWLERS UNDER PRESSURE (RANKED BY SHRUNK RATE, POOLED BASELINE = 0.000)")
print("=======================================================================================================")
print(f"{'Rk':<3} {'Bowler Name':<22} {'Role':<13} {'Balls':<6} {'O':<4} {'E':<6} {'O/E':<6} {'xWkts/100b':<12} {'90% Posterior CI':<20} {'Inngs':<5}")
print("-" * 103)
for idx, r in top_bowlers.head(15).iterrows():
    inns_str = f"{int(r['pressure_innings'])}" if pd.notnull(r['pressure_innings']) else "N/A"
    print(f"{idx+1:<3} {r['bowler_name']:<22} {r['Role']:<13} {int(r['balls']):<6} {int(r['O']):<4} {r['E']:<6.2f} {r['O']/r['E']:<6.2f} {r['xwkts_per_100']:+7.3f}/100b  [{r['ci_lower']:+6.3f}, {r['ci_upper']:+6.3f}]     {inns_str:<5}")

print("\n=======================================================================================================")
print("  BOTTOM 5 BOWLERS UNDER PRESSURE (BELOW BASELINE)")
print("=======================================================================================================")
for idx, r in top_bowlers.tail(5).iterrows():
    inns_str = f"{int(r['pressure_innings'])}" if pd.notnull(r['pressure_innings']) else "N/A"
    print(f"{len(top_bowlers)-5+idx+1:<3} {r['bowler_name']:<22} {r['Role']:<13} {int(r['balls']):<6} {int(r['O']):<4} {r['E']:<6.2f} {r['O']/r['E']:<6.2f} {r['xwkts_per_100']:+7.3f}/100b  [{r['ci_lower']:+6.3f}, {r['ci_upper']:+6.3f}]     {inns_str:<5}")

