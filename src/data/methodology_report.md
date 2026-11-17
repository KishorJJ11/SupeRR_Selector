# Methodology Report - Reliability Under Pressure (SupeRR Selector S2)

## 1. Data and Preparation

- Deliveries: 196,343 across 833 matches.

- Extras validation: Computed match rate for `won by N runs` strings using mode `new` is 98.4% vs 12.9% for the legacy configuration. This verifies the correct interpretation of extras.

## 2. Model & Pressure Definition

- Pressure balls are defined via cross-fitted (GroupKFold) expected win-probability leverage index (top 20%). Run-expectancy model is strictly out-of-fold.

- Bagged Ensemble: A 25-fit bagged ensemble with standard Early Stopping disabled removes SKLearn validation-split variance.

### Pressure Situations vs Ordinary Distributions

| Situation | balls | mean_leverage | share_innings2 | mean_wickets_lost | mean_balls_left | mean_required_rate_inn2 | share_powerplay | share_middle | share_death |
|---|---|---|---|---|---|---|---|---|---|
| Ordinary | 150612 | 0.68 | 0.42 | 2.54 | 64.77 | 11.86 | 0.32 | 0.48 | 0.20 |
| Pressure | 37654 | 2.27 | 0.68 | 3.21 | 54.81 | 9.91 | 0.28 | 0.40 | 0.32 |

## 3. Results (Ranked by Consensus of Ensemble & Bag-Average Estimators)

### Batters

| AvgRank | Player | Tier | Rating | Lo5 | Hi95 | Delta | D_Lo5 | D_Hi95 | Posterior P(top10) | Expected Rank | Model Fragility Flag |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Phil Salt | Low Confidence | 8 | -6.94 | 22.94 | -8.94 | -26.34 | 8.45 | 56.57 | 11.36 | True |
| 2 | Abhishek Sharma | Tier B | 13.01 | -4.34 | 30.37 | -13.39 | -33.33 | 6.55 | 75.31 | 7.32 | False |
| 3 | Heinrich Klaasen | Low Confidence | 7.40 | -7.36 | 22.16 | -3.73 | -20.92 | 13.46 | 54.88 | 11.74 | False |
| 4 | Tim David | Low Confidence | 6.36 | -7.94 | 20.66 | -5.79 | -24.02 | 12.44 | 49.98 | 12.76 | True |
| 5 | Jos Buttler | Low Confidence | 5.47 | -8.10 | 19.04 | 0.65 | -14.78 | 16.08 | 45.79 | 13.67 | False |
| 6 | Suryakumar Yadav | Low Confidence | 5.79 | -6.85 | 18.44 | -8.51 | -23.32 | 6.30 | 47.27 | 13.11 | False |
| 7 | Shreyas Iyer | Low Confidence | 4.91 | -8.75 | 18.57 | 0.66 | -15.86 | 17.18 | 43.38 | 14.24 | False |
| 8 | Rovman Powell | Low Confidence | 2.42 | -10.87 | 15.72 | 5.70 | -10.80 | 22.21 | 32.12 | 17.02 | False |
| 9 | Rinku Singh | Low Confidence | 3.04 | -10.52 | 16.60 | 8.54 | -7.95 | 25.03 | 34.73 | 16.41 | False |
| 10 | Shubman Gill | Low Confidence | 2.87 | -10.62 | 16.35 | 6.06 | -9.45 | 21.57 | 32.72 | 16.73 | False |

### Bowlers

| AvgRank | Player | Tier | Rating | Lo5 | Hi95 | Delta | D_Lo5 | D_Hi95 | Posterior P(top10) | Expected Rank | Model Fragility Flag |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sunil Narine | Low Confidence | 12.65 | -3.93 | 29.23 | -0.29 | -18.61 | 18.03 | 59.88 | 11.86 | False |
| 2 | Rashid Khan | Low Confidence | 9.34 | -5.41 | 24.08 | 2.61 | -13.79 | 19.01 | 48.52 | 14.70 | True |
| 3 | Taskin Ahmed | Low Confidence | 8.83 | -7.88 | 25.54 | 12.55 | -7.43 | 32.53 | 44.78 | 16.45 | True |
| 4 | Patrick Cummins | Low Confidence | 5.91 | -11.35 | 23.18 | 13.60 | -6.44 | 33.64 | 33.75 | 20.66 | False |
| 5 | Maheesh Theekshana | Low Confidence | 6.15 | -7.97 | 20.26 | 4.12 | -11.64 | 19.88 | 31.83 | 19.54 | False |
| 6 | Varun Chakravarthy | Low Confidence | 9.24 | -6.84 | 25.32 | -0.05 | -17.99 | 17.89 | 46.13 | 15.60 | True |
| 7 | Jasprit Bumrah | Low Confidence | 6.72 | -8.57 | 22.01 | -8.14 | -26.34 | 10.06 | 35.44 | 18.96 | False |
| 8 | Josh Hazlewood | Low Confidence | 5.02 | -10.34 | 20.38 | -0.88 | -19.55 | 17.80 | 29.14 | 21.34 | False |
| 9 | Adam Zampa | Low Confidence | 3.57 | -11.90 | 19.05 | 9.70 | -9.09 | 28.50 | 23.66 | 23.86 | False |
| 10 | Kuldeep Yadav | Low Confidence | 4.92 | -9.43 | 19.26 | -2.25 | -19.37 | 14.86 | 28.09 | 21.15 | False |

## 4. Empirical Assessment & Limitations

- **Batters Expected True Hits (conservative estimate):** We estimate 4.7 of the 10 listed players truly belong in the true top 10. The mixture posterior includes model-fit variance which conservatively lowers probabilities.

- **Batters Separability:** All players have 90% pressure rating intervals that include zero (indistinguishable from the baseline average under pressure).

- **Bowlers Expected True Hits (conservative estimate):** We estimate 3.8 of the 10 listed players truly belong in the true top 10. The mixture posterior includes model-fit variance which conservatively lowers probabilities.

- **Bowlers Separability:** All players have 90% pressure rating intervals that include zero (indistinguishable from the baseline average under pressure).

- *Estimator Sensitivity:* Rankings shift depending on whether ratings are computed via the central ensemble or averaged across individual refits. To maximize stability, the final order uses `avgRank`, a consensus average of both estimators.

## 5. Out-of-Sample Predictive Validation (60/40 Split)

| Role | Early Pressure -> Late Pressure (rho) | Early Ordinary -> Late Pressure (rho) | Hit Rate vs Median | Valid N | Binomial P |
|---|---|---|---|---|---|
| Batters | 0.38 | 0.03 | 0.67 | 9 | 0.25 |
| Bowlers | 0.24 | 0.26 | 0.90 | 10 | 0.01 |

- Batters (n=9): pressure ρ=0.38 vs ordinary ρ=0.03; top-10 hit rate 67%, binomial p=0.25.

- Bowlers (n=10): pressure ρ=0.24 vs ordinary ρ=0.26; hit rate 90%, binomial p=0.011. Early picks beat the late median, but ordinary rating predicts as well, so this does not show a pressure-specific skill.

## 6. System Reliability (Split-Half Persistence)

| Role | Pressure split-half | Pressure (Spearman-Brown) | Ordinary split-half | Ordinary (Spearman-Brown) | Delta split-half | Players/split |
|---|---|---|---|---|---|---|
| Batters | 0.21 | 0.35 | 0.49 | 0.66 | -0.03 | 38.95 |
| Bowlers | 0.28 | 0.44 | 0.39 | 0.56 | 0.02 | 57.92 |

- *Interpretation:* Clutch persistence (Delta) is heavily bounded by noise. Batting Delta Split-Half hovers near -0.03. Because this trait lacks split-half stability, 'clutch' delta for most individuals is statistically indistinguishable from noise.

## 7. Sensitivity Robustness Variants

| Variant | Batters top-10 overlap | Batters rank corr | Bowlers top-10 overlap | Bowlers rank corr |
|---|---|---|---|---|
| Base (Consensus List vs Ensemble Rank) | 9 | 0.96 | 9 | 0.97 |
| Pressure quantile q=0.7 | 8 | 0.94 | 7 | 0.93 |
| Pressure quantile q=0.9 | 4 | 0.61 | 6 | 0.81 |
| Format-specific baselines | 9 | 0.96 | 9 | 0.97 |
| Eligibility 100 balls / 15 innings | 7 | 0.96 | 7 | 0.97 |
| Eligibility 200 balls / 25 innings | 8 | 0.97 | 8 | 0.98 |

## 8. Extras Ablation Table

| Extras treatment | Batters top-10 overlap | Bowlers top-10 overlap |
|---|---|---|
| new | 9 | 9 |
| old | 8 | 6 |
| none | 7 | 5 |
| bowler_all | 9 | 9 |

## 9. Reproducibility

- Model ran on MD5 `c5bbd29fe98b35a46d83c7dc7072a27d` with 25 fits. Result is reproducible within statistical tolerance.
