"""
SupeRR Selector: Pressure Elevation Multiplier (PEI) Calculation Engine
Analyzes ball-by-ball T20 match states and calculates player clutch indices.
Franchise: Rajasthan Royals (RR) Analytics Lab
"""

import numpy as np

def calculate_leverage_index(balls_remaining, runs_needed, wickets_in_hand):
    """
    Computes Win Probability Sensitivity per ball.
    """
    rrr = (runs_needed / max(balls_remaining, 1)) * 6.0
    pressure_factor = (rrr / 8.5) ** 1.8 * ((10 - wickets_in_hand) / 5.0)
    return max(pressure_factor, 0.2)

def calculate_clutch_elevation_multiplier(clutch_sr, baseline_sr, dot_ball_pct_clutch, opponent_economy=8.2):
    """
    PEI Multiplier Formula:
    Multiplier = (Clutch SR / Baseline SR) * (1 - delta_dot_rate) * Opponent Quality
    """
    quality_factor = opponent_economy / 8.0
    efficiency = clutch_sr / max(baseline_sr, 100.0)
    dot_penalty = 1.0 - (dot_ball_pct_clutch / 100.0)
    multiplier = efficiency * dot_penalty * quality_factor * 1.55
    return round(multiplier, 2)

if __name__ == "__main__":
    print("=" * 60)
    print("SupeRR Selector: Rajasthan Royals Pressure Analytics Engine")
    print("=" * 60)
    
    players = [
        {"name": "Najibullah Zadran", "clutch_sr": 198.4, "baseline_sr": 138.2, "dot_pct": 19.2, "opp_econ": 8.9},
        {"name": "Ajinkya Rahane", "clutch_sr": 154.0, "baseline_sr": 118.5, "dot_pct": 21.0, "opp_econ": 7.8},
        {"name": "Donovan Ferreira", "clutch_sr": 204.6, "baseline_sr": 142.0, "dot_pct": 26.4, "opp_econ": 8.5},
        {"name": "Riyan Parag", "clutch_sr": 178.4, "baseline_sr": 132.0, "dot_pct": 22.8, "opp_econ": 8.1},
        {"name": "Shimron Hetmyer", "clutch_sr": 194.5, "baseline_sr": 145.0, "dot_pct": 23.1, "opp_econ": 8.3},
    ]
    
    for p in players:
        mult = calculate_clutch_elevation_multiplier(p["clutch_sr"], p["baseline_sr"], p["dot_pct"], p["opp_econ"])
        print(f"Player: {p['name']:<20} | Multiplier: {mult}x | Clutch SR: {p['clutch_sr']}")
