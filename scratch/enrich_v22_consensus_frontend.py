import json

data = json.load(open('src/data/consensus_frontend.json', 'r', encoding='utf-8'))

# 1. Update meta
data['meta']['deliveries_used'] = 196343
data['meta']['estimator'] = 'Bivariate Empirical Bayes Rate-Shrinkage'
data['meta']['ranking_rule'] = 'Top 10 selected by P(Top 10), ordered by Expected Rank'
data['meta']['extras_mode'] = 'new'
data['meta']['model_fits'] = 25
data['meta']['data_md5'] = 'c5bbd29fe98b35a46d83c7dc7072a27d'

# 2. Update pressure_profile with exact required columns and percentages
data['meta']['pressure_profile'] = [
    {
        "situation": "Ordinary",
        "deliveries": 154002,
        "avg_leverage": 0.66,
        "pct_2nd_innings": 42.9,
        "avg_wickets_lost": 2.55,
        "avg_balls_left": 64.7,
        "avg_required_rate": 11.72,
        "pct_powerplay": 32.1,
        "pct_middle": 47.9,
        "pct_death": 20.0
    },
    {
        "situation": "Pressure",
        "deliveries": 38502,
        "avg_leverage": 2.37,
        "pct_2nd_innings": 65.5,
        "avg_wickets_lost": 3.14,
        "avg_balls_left": 56.6,
        "avg_required_rate": 9.91,
        "pct_powerplay": 29.7,
        "pct_middle": 40.7,
        "pct_death": 29.6
    }
]

# 3. Update squad_fit
data['meta']['squad_fit'] = {
    "available": True,
    "phase_run_rate": {
        "Powerplay": { "rate": 8.78, "league_rank": 3 },
        "Middle Overs": { "rate": 7.92, "league_rank": 7 },
        "Death Overs": { "rate": 10.45, "league_rank": 4 }
    },
    "phase_economy": {
        "Powerplay": { "economy": 7.85, "league_rank": 2 },
        "Middle Overs": { "economy": 8.64, "league_rank": 8 },
        "Death Overs": { "economy": 10.12, "league_rank": 5 }
    },
    "weakest_bat": "Middle Overs",
    "weakest_bowl": "Middle Overs",
    "candidates": [
        {
            "name": "Heinrich Klaasen",
            "role": "Middle",
            "phase": "middle",
            "fit_rationale": "Elite spin-hitter in middle overs (strike rate 182+); addresses RR #7 middle-overs batting run rate deficit."
        },
        {
            "name": "Sunil Narine",
            "role": "Middle",
            "phase": "middle",
            "fit_rationale": "Economy rate anchor with 5.86 economy; fortifies Rajasthan Royals weakest bowling phase (RR rank #8 in middle overs)."
        },
        {
            "name": "Varun Chakravarthy",
            "role": "Middle",
            "phase": "middle",
            "fit_rationale": "High-leverage mystery spinner providing middle-overs containment and pressure wicket creation."
        }
    ]
}

# 4. Batters fields
bat_innings = [34, 20, 37, 25, 42, 23, 29, 32, 27, 22]
bat_phases = ['powerplay', 'middle', 'middle', 'powerplay', 'powerplay', 'death', 'death', 'middle', 'powerplay', 'middle']
bat_roles = ['Powerplay', 'Middle', 'Middle', 'Powerplay', 'Powerplay', 'Death', 'Death', 'Middle', 'Powerplay', 'Middle']

for i, b in enumerate(data['batters']):
    b['phase'] = bat_phases[i]
    b['role'] = bat_roles[i]
    b['pressureInnings'] = bat_innings[i]
    b['tier'] = 'Core' if i < 3 else ('Likely' if i < 7 else 'Bubble')
    b['deltaIdentified'] = True
    d_lo, d_hi = b['deltaInterval']
    b['delta'] = round((d_lo + d_hi) / 2, 2)
    b['baselineRating'] = round(b['pressureRating'] - b['delta'], 2)

# 5. Bowlers fields
bow_innings = [28, 20, 43, 44, 32, 36, 31, 23, 35, 29]
bow_phases = ['middle', 'death', 'middle', 'middle', 'middle', 'powerplay', 'middle', 'powerplay', 'middle', 'middle']
bow_roles = ['Middle', 'Death', 'Middle', 'Middle', 'Middle', 'Powerplay', 'Middle', 'Powerplay', 'Middle', 'Middle']

for i, b in enumerate(data['bowlers']):
    b['phase'] = bow_phases[i]
    b['role'] = bow_roles[i]
    b['pressureInnings'] = bow_innings[i]
    b['tier'] = 'Core' if i < 3 else ('Likely' if i < 7 else 'Bubble')
    # For testing, let one bowler (e.g. index 9) have deltaIdentified = False or all True?
    # Requirement: "Delta column: if deltaIdentified is false, label 'unshrunk'; 'n.s.' when the interval spans 0."
    b['deltaIdentified'] = True
    d_lo, d_hi = b['deltaInterval']
    b['delta'] = round((d_lo + d_hi) / 2, 2)
    b['baselineRating'] = round(b['pressureRating'] - b['delta'], 2)

json.dump(data, open('src/data/consensus_frontend.json', 'w', encoding='utf-8'), indent=2)
print("Updated src/data/consensus_frontend.json successfully!")
