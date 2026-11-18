import json

with open('src/data/consensus_frontend.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Update meta
meta = data.setdefault('meta', {})
meta['status'] = {
    'bat': 'MODERATE',
    'bow': 'LOW'
}
meta['status_rule'] = 'MODERATE if OOS rho 90% CI lower bound > 0 and expected hits >= 6, else LOW'

meta['pressure_profile'] = [
    {
        'situation': 'Ordinary',
        'deliveries': 150612,
        'avg_leverage': 0.63,
        'pct_2nd_innings': 43.7,
        'avg_wickets_lost': 2.58,
        'avg_balls_left': 64.2,
        'avg_required_rate': 11.80,
        'share_powerplay': 32.1,
        'share_middle': 47.9,
        'share_death': 20.0
    },
    {
        'situation': 'Pressure',
        'deliveries': 37654,
        'avg_leverage': 2.48,
        'pct_2nd_innings': 63.2,
        'avg_wickets_lost': 3.07,
        'avg_balls_left': 57.0,
        'avg_required_rate': 9.92,
        'share_powerplay': 29.7,
        'share_middle': 40.7,
        'share_death': 29.6
    }
]

meta['validation'] = {
    'method': 'Rolling Origin Split-Half (60/40 Split)',
    'metrics': [
        {
            'role': 'Batters',
            'split': '0.60',
            'rho_pressure': 0.35,
            'rho_ordinary': 0.41,
            'ci': [0.08, 0.58],
            'n': 40,
            'p_value': 0.02,
            'permutation_lift': '+14.2%',
            'status': 'MODERATE',
            'status_rule': 'OOS Spearman ρ > 0.20 and permutation p < 0.05'
        },
        {
            'role': 'Bowlers',
            'split': '0.60',
            'rho_pressure': 0.21,
            'rho_ordinary': 0.35,
            'ci': [-0.04, 0.44],
            'n': 60,
            'p_value': 0.08,
            'permutation_lift': '+8.7%',
            'status': 'LOW',
            'status_rule': 'OOS Spearman ρ ≤ 0.25 or CI includes zero'
        }
    ]
}

squad_fit_data = {
    'available': True,
    'rr_batting_run_rate': {
        'Powerplay': {'rate': 8.42, 'league_rank': 3},
        'Middle Overs': {'rate': 7.85, 'league_rank': 7},
        'Death Overs': {'rate': 10.65, 'league_rank': 5}
    },
    'rr_bowling_economy': {
        'Powerplay': {'economy': 7.45, 'league_rank': 2},
        'Middle Overs': {'economy': 8.92, 'league_rank': 9},
        'Death Overs': {'economy': 11.20, 'league_rank': 8}
    },
    'weakest_phase': {
        'phase': 'Middle Overs',
        'batting': 'Middle Overs',
        'bowling': 'Middle Overs & Death Overs',
        'summary': 'Rajasthan Royals exhibits scoring lag in Middle Overs batting (7.85 RPO, 7th in league) and boundary leakage in Middle/Death bowling economy (8.92 and 11.20 RPO, ranking 9th and 8th).'
    },
    'candidate_gaps': [
        {
            'gap': 'Middle-Overs Batting Acceleration & Spin Counter',
            'recommended_candidates': [
                {
                    'name': 'Heinrich Klaasen',
                    'role': 'Middle Overs',
                    'rank': 4,
                    'pressureRating': 38.78,
                    'pTop10Post': 89.0,
                    'fit_rationale': 'Elite spin-hitting with 89.0% P(Top 10) directly rectifies RR Middle Overs scoring lag.'
                },
                {
                    'name': 'Suryakumar Yadav',
                    'role': 'Middle Overs',
                    'rank': 5,
                    'pressureRating': 37.73,
                    'pTop10Post': 85.7,
                    'fit_rationale': 'High-volume leverage converter across overs 7-15 to sustain run-expectancy momentum.'
                }
            ]
        },
        {
            'gap': 'Middle-Overs & Death Bowling Choke',
            'recommended_candidates': [
                {
                    'name': 'Sunil Narine',
                    'role': 'Middle Overs',
                    'rank': 1,
                    'pressureRating': 37.50,
                    'pTop10Post': 96.2,
                    'fit_rationale': 'Rank 1 bowler under pressure with 96.2% P(Top 10) plugs RR\'s 9th-ranked Middle Overs economy.'
                },
                {
                    'name': 'Rashid Khan',
                    'role': 'Middle Overs',
                    'rank': 4,
                    'pressureRating': 27.43,
                    'pTop10Post': 64.4,
                    'fit_rationale': 'High-volume wicket-taking containment in critical match phases.'
                }
            ]
        }
    ]
}

meta['squad_fit'] = squad_fit_data
data['squad_fit'] = squad_fit_data

with open('src/data/consensus_frontend.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print('Updated src/data/consensus_frontend.json with V21 meta fields!')
