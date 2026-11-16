import os
import pandas as pd
import numpy as np
from scipy.optimize import minimize_scalar
from scipy.special import gammaln
from scipy.stats import gamma

bbb_file = 'dataset/ball_by_ball.csv'
matches_file = 'dataset/matches.csv'

bbb = pd.read_csv(bbb_file)
matches = pd.read_csv(matches_file)

bbb = bbb.merge(
    matches[['match_id', 'knock_out', 'comp_id', 'stage', 'win_team_id', 'venue_id']],
    on='match_id',
    how='left'
)

bbb = bbb[bbb['innings'].isin([1, 2])].copy()

# Legal balls: neither wide nor overstep
bbb['is_legal_ball'] = (~bbb['extras_type'].isin(['wide', 'Overstep'])).astype(int)

# Bowler-credited wickets
bowler_dismissals = ['Caught', 'Bowled', 'LBW', 'Stump', 'Hit Wicket']
bbb['is_bowler_wicket'] = bbb['dismissal_type'].isin(bowler_dismissals).astype(int)

# Phase
bbb['phase'] = np.where(bbb['overid'] <= 6, 'PP', np.where(bbb['overid'] <= 15, 'Mid', 'Death'))

# Match state
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

# Pressure definitions
c_bowl_2nd = (bbb['innings'] == 2) & (bbb['rrr'] >= 7.5) & (bbb['rrr'] <= 12.0) & (bbb['team_wickets_lost'] <= 6)
c_bowl_1st_death = (bbb['innings'] == 1) & (bbb['overid'] >= 16)
bbb['bowl_pressure'] = (c_bowl_2nd | c_bowl_1st_death).astype(int)

# Filter to legal balls only for bowler evaluation!
legal_df = bbb[bbb['is_legal_ball'] == 1].copy()

# Step 1: Base expected wicket probability by overid (or overid x innings)
base_w = legal_df.groupby(['overid', 'innings'])['is_bowler_wicket'].mean().reset_index()
base_w.rename(columns={'is_bowler_wicket': 'base_exp_wicket'}, inplace=True)
legal_df = legal_df.merge(base_w, on=['overid', 'innings'], how='left')

# Check calibration before adjustment
print("--- PRE-CALIBRATION CHECK (PRESSURE BALLS) ---")
pres_df = legal_df[legal_df['bowl_pressure'] == 1]
obs_raw = pres_df['is_bowler_wicket'].sum()
exp_raw = pres_df['base_exp_wicket'].sum()
print(f"Observed wickets: {obs_raw}, Uncalibrated Expected: {exp_raw:.2f}, Diff: {obs_raw - exp_raw:.2f}")

# Point 1: Calibrate in each pressure state x phase x innings cell
# scale = obs_total / exp_total
# exp_adj = exp * scale
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
obs_calib = pres_df['is_bowler_wicket'].sum()
exp_calib = pres_df['exp_adj'].sum()
print(f"Post-calibration: Observed={obs_calib}, Expected={exp_calib:.4f}, Mean diff={obs_calib - exp_calib:.4f}")

# Aggregate per bowler under pressure
b_agg = pres_df.groupby(['bowler_id', 'bowler_name']).agg(
    balls=('is_legal_ball', 'sum'),
    O=('is_bowler_wicket', 'sum'),
    E=('exp_adj', 'sum')
).reset_index()

# Also calculate career balls for eligibility
career_balls = legal_df.groupby('bowler_id')['is_legal_ball'].sum().reset_index()
career_balls.rename(columns={'is_legal_ball': 'career_balls'}, inplace=True)
b_agg = b_agg.merge(career_balls, on='bowler_id', how='left')

# Filter eligible bowlers (e.g. career balls >= 150, pressure balls >= 80 or 100)
b_elig = b_agg[(b_agg['career_balls'] >= 150) & (b_agg['balls'] >= 80)].copy()
print(f"\nNumber of eligible bowlers: {len(b_elig)}")

# Point 2: Poisson-Gamma shrinkage
O_arr = b_elig['O'].values.astype(float)
E_arr = b_elig['E'].values.astype(float)

def nll(a):
    return -np.sum(
        gammaln(O_arr + a) - gammaln(a) - gammaln(O_arr + 1)
        + a * np.log(a / (a + E_arr)) + O_arr * np.log(E_arr / (a + E_arr))
    )

res = minimize_scalar(nll, bounds=(0.1, 1e4), method='bounded')
a_opt = res.x
print(f"\nOptimal Poisson-Gamma dispersion 'a': {a_opt:.3f}")

b_elig['ratio'] = (b_elig['O'] + a_opt) / (b_elig['E'] + a_opt)
b_elig['xwkts_per_100'] = (b_elig['ratio'] - 1.0) * b_elig['E'] / b_elig['balls'] * 100.0

# 90% posterior interval using Gamma(a + O, a + E)
# In standard parameterization where mean = (a+O)/(a+E):
# Gamma distribution with shape k = a + O, scale theta = 1 / (a + E)
b_elig['ci_lower_ratio'] = gamma.ppf(0.05, a=b_elig['O'] + a_opt, scale=1.0 / (b_elig['E'] + a_opt))
b_elig['ci_upper_ratio'] = gamma.ppf(0.95, a=b_elig['O'] + a_opt, scale=1.0 / (b_elig['E'] + a_opt))
b_elig['ci_lower_xwkts'] = (b_elig['ci_lower_ratio'] - 1.0) * b_elig['E'] / b_elig['balls'] * 100.0
b_elig['ci_upper_xwkts'] = (b_elig['ci_upper_ratio'] - 1.0) * b_elig['E'] / b_elig['balls'] * 100.0

# Add phase role
b_phases = legal_df.groupby(['bowler_id', 'phase'])['is_legal_ball'].count().unstack().fillna(0)
b_phases['Role'] = b_phases[['Death', 'Mid', 'PP']].idxmax(axis=1)
b_phases['Role'] = b_phases['Role'].map({'Death': 'Death Overs', 'Mid': 'Middle Overs', 'PP': 'Powerplay'})
b_elig = b_elig.merge(b_phases[['Role']], on='bowler_id', how='left')

# Top 15 sorted by xwkts_per_100 descending
top_bowlers = b_elig.sort_values(by='xwkts_per_100', ascending=False).reset_index(drop=True)

print("\n--- TOP 15 BOWLERS UNDER PRESSURE (POISSON-GAMMA SHRUNK) ---")
for idx, r in top_bowlers.head(15).iterrows():
    print(f"{idx+1:2d}. {r['bowler_name']:<22} | Role: {r['Role']:<13} | Balls: {int(r['balls']):3d} | "
          f"O: {int(r['O']):2d} | E: {r['E']:5.2f} | O/E: {r['O']/r['E']:4.2f} | "
          f"xWkts/100b: {r['xwkts_per_100']:+6.3f} | 90% CI: [{r['ci_lower_xwkts']:+6.3f}, {r['ci_upper_xwkts']:+6.3f}]")

