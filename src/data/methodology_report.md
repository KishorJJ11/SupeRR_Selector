# Methodology Report - Reliability Under Pressure (SupeRR Selector S2)

## 1. Data and Preparation

- Deliveries: 196,343 across 833 matches.

- Extras validation: Computed match rate for `won by N runs` strings using mode `new` is 98.4% vs 12.9% for the legacy configuration. This verifies the correct interpretation of extras.

## 2. Model & Pressure Definition

- Pressure balls are defined via cross-fitted (GroupKFold) expected win-probability leverage index (top 20%). Run-expectancy model is strictly out-of-fold.

- Bagged Ensemble: A 25-fit bagged ensemble removes SKLearn validation-split variance.

### Pressure Situations vs Ordinary Distributions

| Situation | balls | mean_leverage | share_innings2 | mean_wickets_lost | mean_balls_left | mean_required_rate_inn2 | share_powerplay | share_middle | share_death |
|---|---|---|---|---|---|---|---|---|---|
| Ordinary | 150612 | 0.68 | 0.42 | 2.54 | 64.77 | 11.86 | 0.32 | 0.48 | 0.20 |
| Pressure | 37654 | 2.27 | 0.68 | 3.21 | 54.81 | 9.91 | 0.28 | 0.40 | 0.32 |

## 3. Results (Ranked by Posterior Expected Rank)

### Batters

| Rank | Player | Tier | Rating | Lo5 | Hi95 | Delta | D_Lo5 | D_Hi95 | Posterior P(top10) | Expected Rank |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Phil Salt | Tier C | 11.38 | -3.12 | 25.89 | -5.56 | -22.58 | 11.46 | 70.18 | 8.33 |
| 2 | Tim David | Low Confidence | 8.10 | -5.60 | 21.79 | -4.05 | -21.81 | 13.71 | 56.08 | 11.35 |
| 3 | Jos Buttler | Low Confidence | 8.21 | -5.67 | 22.08 | 3.39 | -12.31 | 19.09 | 55.38 | 11.42 |
| 4 | Heinrich Klaasen | Low Confidence | 7.84 | -6.52 | 22.19 | -3.29 | -20.14 | 13.55 | 54.35 | 11.62 |
| 5 | Rovman Powell | Low Confidence | 6.98 | -5.05 | 19.01 | 10.26 | -5.24 | 25.76 | 51.15 | 11.89 |
| 6 | Abhishek Sharma | Low Confidence | 6.80 | -10.47 | 24.07 | -19.60 | -39.47 | 0.27 | 48.92 | 13.52 |
| 7 | David Miller | Low Confidence | 5.68 | -7.04 | 18.40 | 12.79 | -4.12 | 29.69 | 44.20 | 13.67 |
| 8 | Shreyas Iyer | Low Confidence | 5.35 | -7.09 | 17.79 | 1.10 | -14.43 | 16.62 | 42.75 | 13.74 |
| 9 | Shubman Gill | Low Confidence | 5.43 | -7.87 | 18.73 | 8.62 | -6.73 | 23.97 | 42.48 | 14.13 |
| 10 | Rinku Singh | Low Confidence | 4.88 | -8.58 | 18.35 | 10.38 | -6.02 | 26.79 | 39.80 | 14.63 |

### Bowlers

| Rank | Player | Tier | Rating | Lo5 | Hi95 | Delta | D_Lo5 | D_Hi95 | Posterior P(top10) | Expected Rank |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sunil Narine | Tier B | 23.31 | 6.56 | 40.06 | 10.37 | -8.11 | 28.85 | 86.10 | 5.28 |
| 2 | Adam Zampa | Tier C | 16.29 | 0.71 | 31.86 | 22.42 | 3.54 | 41.29 | 67.20 | 9.25 |
| 3 | Taskin Ahmed | Tier C | 15.51 | -0.76 | 31.78 | 19.23 | -0.39 | 38.84 | 62.28 | 10.56 |
| 4 | Rashid Khan | Low Confidence | 14.18 | -1.46 | 29.82 | 7.45 | -9.75 | 24.65 | 59.32 | 11.15 |
| 5 | Patrick Cummins | Low Confidence | 14.18 | -4.38 | 32.73 | 21.87 | 0.71 | 43.03 | 56.65 | 12.27 |
| 6 | Maheesh Theekshana | Low Confidence | 11.07 | -3.65 | 25.78 | 9.04 | -7.27 | 25.35 | 42.25 | 14.53 |
| 7 | Josh Hazlewood | Low Confidence | 10.94 | -5.82 | 27.70 | 5.05 | -14.80 | 24.89 | 43.10 | 15.22 |
| 8 | Kuldeep Yadav | Low Confidence | 8.89 | -4.62 | 22.39 | 1.71 | -14.71 | 18.13 | 34.52 | 16.37 |
| 9 | Jasprit Bumrah | Low Confidence | 8.56 | -7.05 | 24.17 | -6.30 | -24.76 | 12.17 | 34.62 | 17.40 |
| 10 | Mitchell Santner | Low Confidence | 9.14 | -9.49 | 27.78 | 2.25 | -18.24 | 22.73 | 37.85 | 17.50 |

## 4. Empirical Assessment & Limitations

- **Batters True Hits:** We estimate 5.1 of the 10 listed players truly belong in the top 10.

- **Batters Separability:** 10 of the 10 players have 90% pressure rating intervals that include zero (indistinguishable from the baseline average under pressure).

- **Bowlers True Hits:** We estimate 5.2 of the 10 listed players truly belong in the top 10.

- **Bowlers Separability:** 8 of the 10 players have 90% pressure rating intervals that include zero (indistinguishable from the baseline average under pressure).

## 5. Out-of-Sample Predictive Validation (60/40 Split)

| Role | Early Pressure -> Late Pressure (rho) | Early Ordinary -> Late Pressure (rho) | Hit Rate vs Median | Valid N |
|---|---|---|---|---|
| Batters | 0.37 | 0.00 | 0.62 | 8 |
| Bowlers | 0.19 | 0.39 | 0.80 | 10 |

## 6. System Reliability (Split-Half Persistence)

| Role | Pressure split-half | Pressure (Spearman-Brown) | Ordinary split-half | Ordinary (Spearman-Brown) | Delta split-half | Players/split |
|---|---|---|---|---|---|---|
| Batters | 0.21 | 0.35 | 0.49 | 0.66 | -0.03 | 38.95 |
| Bowlers | 0.28 | 0.44 | 0.39 | 0.56 | 0.02 | 57.92 |

- *Interpretation:* Clutch persistence (Delta) is heavily bounded by noise. For example, Batting Delta Split-Half hovers near -0.03. Because this trait lacks split-half stability, 'clutch' delta for most individuals is statistically indistinguishable from noise.

## 7. Sensitivity Robustness Variants

| Variant | Batters top-10 overlap | Batters rank corr | Bowlers top-10 overlap | Bowlers rank corr |
|---|---|---|---|---|
| Base | 10 | 1 | 10 | 1 |
| Pressure quantile q=0.7 | 7 | 0.91 | 7 | 0.89 |
| Pressure quantile q=0.9 | 5 | 0.65 | 5 | 0.79 |
| Format-specific baselines | 10 | 1 | 10 | 1 |
| Eligibility 100 balls / 15 innings | 8 | 1 | 7 | 1 |
| Eligibility 200 balls / 25 innings | 8 | 1 | 8 | 1 |

## 8. Extras Ablation Table

| Extras treatment | Batters top-10 overlap | Bowlers top-10 overlap |
|---|---|---|
| new | 10 | 10 |
| old | 7 | 5 |
| none | 6 | 6 |
| bowler_all | 10 | 10 |

## 9. Reproducibility Guarantee

- Model ran on MD5 `c5bbd29fe98b35a46d83c7dc7072a27d` with 25 fits. SKLearn internal float variances mean deterministic byte-for-byte matching is not physically guaranteed. Result is reproducible within statistical tolerance.
