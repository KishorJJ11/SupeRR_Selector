# Methodology Report - Reliability Under Pressure (SupeRR Selector S2)

## 1. Key Findings and Limitations

- **Calibration:** The posterior probabilities were overly confident. After calibrating against out-of-sample prediction bounds, standard deviations were inflated, properly lowering expected top-10 hits to about 5 per list.

- **Batters (Limitation):** The EM fit hit the latent correlation cap (0.95). Out-of-sample tests show pressure ability is indistinguishable from ordinary ability. The ranking mostly reflects overall player quality.

- **Bowlers:** Show slight persistent pressure skill, but confidence intervals cross zero in Out-of-Sample testing.

## 2. Data and Preparation

- Deliveries: 195,384 across 823 matches.

- Matches excluded (truncated/revised): 44

- Matches by format: {'IPL': 359, 'T20I': 464}

- Eligibility: >= 150 pressure balls and >= 20 innings; pool sizes {'bat': 40, 'bow': 57}

## 3. Model & Pressure Definition

- **Run-expectancy:** Trained via HistGradientBoostingRegressor to model runs remainder in an innings.

- **Pressure Definition:** The top 20% of balls by leverage index (expected win-probability impact).


### Pressure Profile

| situation | deliveries | avg_leverage | pct_2nd_innings | avg_wickets_lost | avg_balls_left | avg_required_rate | pct_powerplay | pct_middle | pct_death |
|---|---|---|---|---|---|---|---|---|---|
| Ordinary | 149879 | 0.68 | 42.54 | 2.54 | 64.87 | 11.87 | 32.78 | 47.67 | 19.55 |
| Pressure | 37477 | 2.30 | 68.12 | 3.22 | 53.92 | 9.94 | 26.33 | 41.71 | 31.96 |

## 4. Results & Ranking Rule

- **Rule:** Top 10 selected by posterior P(Top 10), then ordered strictly by Expected Rank.

- **Rating Scale:** Baseline is 0 (a league-average player). Values like +45 mean 45 runs per 100 balls above league-average.

### Batters

| rank | name | pressureRating | baselineRating | delta | pTop10Post | expRank | fitStabilityPct | consistency |
|---|---|---|---|---|---|---|---|---|
| 1 | Abhishek Sharma | 54.84 | 46.10 | 8.74 | 96.97 | 2.62 | 100 | 0.50 |
| 2 | Suryakumar Yadav | 41.26 | 36.52 | 4.74 | 81.45 | 6.51 | 100 | 0.44 |
| 3 | Heinrich Klaasen | 40.17 | 34.87 | 5.30 | 78.90 | 7.20 | 100 | 0.48 |
| 4 | Tim David | 41.62 | 36.45 | 5.17 | 77.28 | 7.21 | 100 | 0.47 |
| 5 | Shreyas Iyer | 34.76 | 31.01 | 3.75 | 61.50 | 10.25 | 100 | 0.44 |
| 6 | Jos Buttler | 33.76 | 29.79 | 3.98 | 56.17 | 11.27 | 100 | 0.43 |
| 7 | Mitchell Marsh | 31.05 | 29.78 | 1.27 | 45.92 | 13.10 | 100 | 0.37 |
| 8 | Prabhsimran Singh | 29.19 | 27.53 | 1.66 | 39.83 | 15.15 | 100 | 0.44 |
| 9 | Sanju Samson | 28.13 | 25.83 | 2.30 | 35 | 15.73 | 64 | 0.42 |
| 10 | Glenn Maxwell | 27.95 | 26.71 | 1.24 | 37.33 | 16.42 | 72 | 0.43 |

### Bowlers

| rank | name | pressureRating | baselineRating | delta | pTop10Post | expRank | fitStabilityPct | consistency |
|---|---|---|---|---|---|---|---|---|
| 1 | Sunil Narine | 39.49 | 32.67 | 6.82 | 96.78 | 2.87 | 100 | 0.79 |
| 2 | Jasprit Bumrah | 28.71 | 30.33 | -1.62 | 69.27 | 8.83 | 100 | 0.72 |
| 3 | Josh Hazlewood | 28.00 | 24.64 | 3.36 | 64.18 | 10.18 | 100 | 0.73 |
| 4 | Kuldeep Yadav | 25.11 | 24.66 | 0.46 | 56.88 | 11.60 | 100 | 0.73 |
| 5 | Varun Chakravarthy | 24.18 | 24.94 | -0.76 | 52.05 | 12.53 | 100 | 0.67 |
| 6 | Rashid Khan | 22.17 | 22.93 | -0.76 | 44.32 | 14.04 | 100 | 0.69 |
| 7 | Ravindra Jadeja | 22.34 | 20.44 | 1.90 | 44.10 | 14.24 | 96 | 0.77 |
| 8 | Mustafizur Rahman | 22.09 | 22.88 | -0.79 | 42.93 | 14.84 | 100 | 0.67 |
| 9 | Axar Patel | 19.68 | 17.78 | 1.90 | 32.55 | 16.83 | 80 | 0.73 |
| 10 | Noor Ahmad | 19.82 | 21.49 | -1.67 | 35.30 | 17.38 | 84 | 0.72 |

## 5. Empirical Assessment & Consistency

- **Batters Latent Correlation:** 0.95 (at the cap)

- **Ordinary Overlap:** We rank pressure-adjusted value; overlap with an ordinary-only ranking is 9/10.

- **Bowlers Latent Correlation:** 0.87

- **Ordinary Overlap:** We rank pressure-adjusted value; overlap with an ordinary-only ranking is 8/10.

- **Delta Reliability:** Delta is not persistent; do not use it to identify clutch players.


### Raw Delta Table (Model-Free)

#### Batters (Raw)

| Name | RawDelta | SE |
|---|---|---|
| Abhishek Sharma | 8.28 | 14.28 |
| Suryakumar Yadav | 2.33 | 11.03 |
| Heinrich Klaasen | 13.66 | 11.36 |
| Tim David | 8.80 | 17.26 |
| Shreyas Iyer | 9.95 | 10.98 |
| Jos Buttler | 27.43 | 13.79 |
| Mitchell Marsh | -16.77 | 14.23 |
| Prabhsimran Singh | 2.68 | 18.78 |
| Sanju Samson | 20.89 | 13.55 |
| Glenn Maxwell | -4.49 | 20.59 |

#### Bowlers (Raw)

| Name | RawDelta | SE |
|---|---|---|
| Sunil Narine | 19.12 | 10.45 |
| Jasprit Bumrah | -21.35 | 13.74 |
| Josh Hazlewood | 30.08 | 18.11 |
| Kuldeep Yadav | 2.05 | 14.65 |
| Varun Chakravarthy | -3.18 | 14.92 |
| Rashid Khan | -1.37 | 11.82 |
| Ravindra Jadeja | 13.59 | 12.63 |
| Mustafizur Rahman | -4.28 | 14.04 |
| Axar Patel | 16.16 | 12.03 |
| Noor Ahmad | -7.69 | 16.65 |


## 6. Calibration Check

| Role | Z_SD | Note |
|---|---|---|
| Batters | 1.63 | SD inflated by 1.63x |
| Bowlers | 1.30 | SD inflated by 1.30x |

## 7. Out-of-Sample Predictive Validation (Rolling Origin)

| role | split | valid_n | pressure_rho | ordinary_rho | rho_ci_lo | rho_ci_hi | ordinary_rho_ci_lo | ordinary_rho_ci_hi | skill_pressure_med | skill_ordinary_med | pressure_minus_ordinary_mse | coverage90 | z_sd |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Batters | 0.50 | 49 | -0.03 | -0.15 | -0.28 | 0.23 | -0.39 | 0.10 | -0.00 | -0.17 | [163.146, 215.807, 264.016] | 0.67 | 1.44 |
| Bowlers | 0.50 | 53 | 0.15 | 0.33 | -0.09 | 0.38 | 0.09 | 0.53 | 0.02 | 0.09 | [-196.957, -109.834, -24.987] | 0.85 | 1.31 |
| Batters | 0.60 | 48 | 0.03 | -0.05 | -0.23 | 0.28 | -0.30 | 0.21 | -0.01 | -0.09 | [44.213, 128.012, 200.654] | 0.67 | 1.86 |
| Bowlers | 0.60 | 51 | 0.18 | 0.33 | -0.07 | 0.41 | 0.10 | 0.54 | -0.02 | 0.10 | [-262.861, -183.417, -115.254] | 0.72 | 1.14 |
| Batters | 0.70 | 38 | 0.12 | 0.42 | -0.18 | 0.39 | 0.15 | 0.63 | -0.01 | 0.04 | [-250.384, -133.85, -11.808] | 0.60 | 1.59 |
| Bowlers | 0.70 | 41 | 0.20 | 0.37 | -0.09 | 0.45 | 0.11 | 0.59 | -0.01 | 0.03 | [-223.706, -92.541, 59.96] | 0.81 | 1.46 |

- Note: Pm (the transition table) in the OOS fit still uses all rows, constituting a small leak.

## 8. System Reliability (Split-Half Persistence)

| Role | Pressure split-half | Pressure (Spearman-Brown) | Ordinary split-half | Ordinary (Spearman-Brown) | Delta split-half | Players/split |
|---|---|---|---|---|---|---|
| Batters | 0.14 | 0.25 | 0.33 | 0.50 | -0.15 | 39.94 |
| Bowlers | 0.20 | 0.34 | 0.35 | 0.52 | -0.01 | 56.89 |

## 9. Sensitivity Robustness Variants

| Variant | Batters top-10 overlap | Bowlers top-10 overlap |
|---|---|---|
| Pressure quantile q=0.7 | 9 | 9 |
| Pressure quantile q=0.9 | 8 | 7 |
| Eligibility 100 balls / 15 innings | 5 | 8 |
| Eligibility 200 balls / 25 innings | 7 | 8 |

## 10. Extras Ablation Table

| Extras treatment | Batters top-10 overlap | Bowlers top-10 overlap |
|---|---|---|
| new | 10 | 10 |
| old | 9 | 8 |
| none | 9 | 7 |
| bowler_all | 9 | 7 |

## 9. Appendix: Squad Fit Extension - Rajasthan Royals (IPL 2026, 15 matches)

- Roster source: RR official retention page + news, Nov 17 2026. Verify names before submission.

| Phase | Bat RR (rank/of) | League bat | Bowl eco (rank/of) | League eco |
|---|---|---|---|---|
| powerplay | 11.46 (1/10) | 10.09 | 10.14 (5/10) | 9.93 |
| middle | 9.48 (4/10) | 9.26 | 9.34 (6/10) | 9.16 |
| death | 10.32 (7/10) | 10.73 | 10.53 (5/10) | 10.6 |

- Largest gaps (0 = best in league, 1 = worst): bat/death 0.667; bow/middle 0.556; bow/powerplay 0.444

### Bowling: weakest phase = middle

| Candidate | Rating | 90% CI | Pressure balls | Last IPL team | Gain vs RR best |
|---|---|---|---|---|---|
| Krunal Pandya | 32.27 | [15.6, 48.9] | 164 | Royal Challengers Bengaluru | 3.49 |
| Mohammed Siraj | 29.61 | [12.9, 46.3] | 41 | Gujarat Titans | 0.83 |

### Batting: weakest phase = death

| Candidate | Rating | 90% CI | Pressure balls | Last IPL team | Gain vs RR best |
|---|---|---|---|---|---|
| Liam Livingstone | 30.85 | [28.8, 32.9] | 46 | Sunrisers Hyderabad | 0.9 |
| Romario Shepherd | 30.76 | [28.7, 32.8] | 103 | Royal Challengers Bengaluru | 0.81 |
| Rovman Powell | 30.74 | [28.8, 32.7] | 144 | Kolkata Knight Riders | 0.79 |
| Namboori Tilak Varma | 30.72 | [28.8, 32.7] | 146 | Mumbai Indians | 0.77 |
| Tim David | 30.61 | [28.6, 32.6] | 148 | Royal Challengers Bengaluru | 0.66 |

- Caveat: Ratings are pressure-adjusted value in that phase, not proof of clutch skill (OOS evidence is weak). Price, overseas mix and other teams' bids are not in the data. 
