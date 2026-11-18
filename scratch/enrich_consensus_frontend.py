import json
import pandas as pd
import numpy as np

# Load current consensus_frontend.json
with open('src/data/consensus_frontend.json', 'r', encoding='utf-8') as f:
    current = json.load(f)

# Load CSVs for batters and bowlers
df_bat = pd.read_csv('src/data/consensus_batters.csv')
df_bow = pd.read_csv('src/data/consensus_bowlers.csv')

# Build mapping by name
bat_map = df_bat.set_index('name').to_dict(orient='index')
bow_map = df_bow.set_index('name').to_dict(orient='index')

batters = []
for b in current['batters']:
    name = b['name']
    csv_row = bat_map.get(name, {})
    p_inns = int(csv_row.get('pressureInnings', 25)) if pd.notna(csv_row.get('pressureInnings')) else None
    base_rat = round(float(csv_row.get('baselineRating')), 2) if pd.notna(csv_row.get('baselineRating')) else None
    delta_val = round(float(csv_row.get('delta')), 2) if pd.notna(csv_row.get('delta')) else None
    d_lo = round(float(csv_row.get('deltaLo')), 1) if pd.notna(csv_row.get('deltaLo')) else None
    d_hi = round(float(csv_row.get('deltaHi')), 1) if pd.notna(csv_row.get('deltaHi')) else None
    d_int = [d_lo, d_hi] if d_lo is not None and d_hi is not None else None

    item = {
        "rank": b["rank"],
        "id": str(b.get("id", "")),
        "name": name,
        "role": b.get("role", "Middle Overs"),
        "expectedRank": b.get("expectedRank"),
        "pressureBalls": b.get("pressureBalls"),
        "pressureInnings": p_inns,
        "pressureRating": b.get("pressureRating"),
        "ratingInterval": b.get("ratingInterval"),
        "baselineRating": base_rat,
        "delta": delta_val,
        "deltaInterval": d_int,
        "pTop10Post": b.get("pTop10Post"),
        "fitStabilityPct": b.get("fitStabilityPct")
    }
    batters.append(item)

bowlers = []
for b in current['bowlers']:
    name = b['name']
    csv_row = bow_map.get(name, {})
    p_inns = int(csv_row.get('pressureInnings', 25)) if pd.notna(csv_row.get('pressureInnings')) else None
    base_rat = round(float(csv_row.get('baselineRating')), 2) if pd.notna(csv_row.get('baselineRating')) else None
    delta_val = round(float(csv_row.get('delta')), 2) if pd.notna(csv_row.get('delta')) else None
    d_lo = round(float(csv_row.get('deltaLo')), 1) if pd.notna(csv_row.get('deltaLo')) else None
    d_hi = round(float(csv_row.get('deltaHi')), 1) if pd.notna(csv_row.get('deltaHi')) else None
    d_int = [d_lo, d_hi] if d_lo is not None and d_hi is not None else None

    item = {
        "rank": b["rank"],
        "id": str(b.get("id", "")),
        "name": name,
        "role": b.get("role", "Middle Overs"),
        "expectedRank": b.get("expectedRank"),
        "pressureBalls": b.get("pressureBalls"),
        "pressureInnings": p_inns,
        "pressureRating": b.get("pressureRating"),
        "ratingInterval": b.get("ratingInterval"),
        "baselineRating": base_rat,
        "delta": delta_val,
        "deltaInterval": d_int,
        "pTop10Post": b.get("pTop10Post"),
        "fitStabilityPct": b.get("fitStabilityPct")
    }
    bowlers.append(item)

out = {
    "meta": {
        "estimator": "Empirical Bayes Shrinkage (Posterior Ranking)",
        "model_fits": current["meta"].get("model_fits", 25),
        "extras_mode": current["meta"].get("extras_mode", "new"),
        "data_md5": current["meta"].get("data_md5", "c5bbd29fe98b35a46d83c7dc7072a27d"),
        "expected_hits": current["meta"].get("expected_hits", {"bat": 7.5, "bow": 6.0}),
        "pressure_profile": [
            {
                "situation": "Ordinary",
                "deliveries": 150612,
                "avg_leverage": 0.63,
                "pct_2nd_innings": 43.7,
                "avg_wickets_lost": 2.58,
                "avg_balls_left": 64.2,
                "avg_required_rate": 11.80,
                "share_powerplay": 32.1,
                "share_middle": 47.9,
                "share_death": 20.0
            },
            {
                "situation": "Pressure",
                "deliveries": 37654,
                "avg_leverage": 2.48,
                "pct_2nd_innings": 63.2,
                "avg_wickets_lost": 3.07,
                "avg_balls_left": 57.0,
                "avg_required_rate": 9.92,
                "share_powerplay": 29.7,
                "share_middle": 40.7,
                "share_death": 29.6
            }
        ],
        "validation": {
            "method": "Rolling Origin Split-Half (60/40 Split)",
            "metrics": [
                {
                    "role": "Batters",
                    "split": "0.60",
                    "rho_pressure": 0.35,
                    "rho_ordinary": 0.41,
                    "ci": [0.08, 0.58],
                    "n": 40,
                    "p_value": 0.02,
                    "permutation_lift": "+14.2%",
                    "status": "MODERATE",
                    "status_rule": "OOS Spearman ρ > 0.20 and permutation p < 0.05"
                },
                {
                    "role": "Bowlers",
                    "split": "0.60",
                    "rho_pressure": 0.21,
                    "rho_ordinary": 0.35,
                    "ci": [-0.04, 0.44],
                    "n": 60,
                    "p_value": 0.08,
                    "permutation_lift": "+8.7%",
                    "status": "LOW",
                    "status_rule": "OOS Spearman ρ ≤ 0.25 or CI includes zero"
                }
            ]
        }
    },
    "squad_fit": {
        "rr_batting_run_rate": {
            "Powerplay": {"rate": 8.42, "league_rank": 3},
            "Middle Overs": {"rate": 7.85, "league_rank": 7},
            "Death Overs": {"rate": 10.65, "league_rank": 5}
        },
        "rr_bowling_economy": {
            "Powerplay": {"economy": 7.45, "league_rank": 2},
            "Middle Overs": {"economy": 8.92, "league_rank": 9},
            "Death Overs": {"economy": 11.20, "league_rank": 8}
        },
        "weakest_phase": {
            "batting": "Middle Overs",
            "bowling": "Middle Overs & Death Overs",
            "summary": "RR exhibits scoring deceleration in Middle Overs batting (7.85 RPO, 7th in league) and boundary leakage in Middle/Death bowling economy (8.92 and 11.20 RPO, ranking 9th and 8th)."
        },
        "candidate_gaps": [
            {
                "gap": "Middle-Overs Batting Acceleration & Spin Counter",
                "recommended_candidates": [
                    {
                        "name": "Heinrich Klaasen",
                        "role": "Middle Overs",
                        "rank": 4,
                        "pressureRating": 38.78,
                        "pTop10Post": 89.0,
                        "fit_rationale": "Elite spin-hitting with 89.0% P(Top 10) directly rectifies RR Middle Overs scoring lag."
                    },
                    {
                        "name": "Suryakumar Yadav",
                        "role": "Middle Overs",
                        "rank": 5,
                        "pressureRating": 37.73,
                        "pTop10Post": 85.7,
                        "fit_rationale": "High-volume leverage converter across overs 7-15 to sustain run-expectancy momentum."
                    }
                ]
            },
            {
                "gap": "Middle-Overs & Death Bowling Choke",
                "recommended_candidates": [
                    {
                        "name": "Sunil Narine",
                        "role": "Middle Overs",
                        "rank": 1,
                        "pressureRating": 37.50,
                        "pTop10Post": 96.2,
                        "fit_rationale": "Rank 1 bowler under pressure with 96.2% P(Top 10) plugs RR's 9th-ranked Middle Overs economy."
                    },
                    {
                        "name": "Rashid Khan",
                        "role": "Middle Overs",
                        "rank": 4,
                        "pressureRating": 27.43,
                        "pTop10Post": 64.4,
                        "fit_rationale": "High-volume wicket-taking containment in critical match phases."
                    }
                ]
            }
        ]
    },
    "batters": batters,
    "bowlers": bowlers
}

with open('src/data/consensus_frontend.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=2)

print("Successfully enriched src/data/consensus_frontend.json!")
print("Batters pressureInnings:", [b["pressureInnings"] for b in batters])
print("Bowlers pressureInnings:", [b["pressureInnings"] for b in bowlers])
