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

## 3. Results (Ranked by Central Ensemble Estimator)

### Batters

| Rank | Player | Tier | Rating | Lo5 | Hi95 | Delta | D_Lo5 | D_Hi95 | Posterior P(top10) | Expected Rank | Model Fragility Flag |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Abhishek Sharma | Tier C | 13.01 | -4.26 | 30.29 | -13.39 | -33.26 | 6.48 | 74.05 | 7.80 | False |
| 2 | Phil Salt | Low Confidence | 8 | -6.50 | 22.50 | -8.94 | -25.97 | 8.08 | 58.92 | 10.88 | True |
| 3 | Heinrich Klaasen | Low Confidence | 7.40 | -6.96 | 21.76 | -3.73 | -20.58 | 13.11 | 55.85 | 11.52 | False |
| 4 | Tim David | Low Confidence | 6.36 | -7.34 | 20.06 | -5.79 | -23.55 | 11.98 | 51.30 | 12.65 | True |
| 5 | Suryakumar Yadav | Low Confidence | 5.79 | -6.39 | 17.98 | -8.51 | -22.93 | 5.91 | 46.88 | 12.96 | False |
| 6 | Shreyas Iyer | Low Confidence | 4.91 | -7.53 | 17.36 | 0.66 | -14.86 | 16.19 | 44.15 | 13.74 | False |
| 7 | Jos Buttler | Low Confidence | 5.47 | -8.41 | 19.35 | 0.65 | -15.05 | 16.36 | 46.02 | 13.80 | False |
| 8 | Sanju Samson | Low Confidence | 3.64 | -10.33 | 17.60 | 1.39 | -14.79 | 17.58 | 38.35 | 15.52 | False |
| 9 | Rinku Singh | Low Confidence | 3.04 | -10.42 | 16.50 | 8.54 | -7.87 | 24.95 | 34.42 | 16.31 | False |
| 10 | Yashasvi Jaiswal | Low Confidence | 2.87 | -11.05 | 16.80 | 3.67 | -12.53 | 19.88 | 35.30 | 16.51 | False |

### Bowlers

| Rank | Player | Tier | Rating | Lo5 | Hi95 | Delta | D_Lo5 | D_Hi95 | Posterior P(top10) | Expected Rank | Model Fragility Flag |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sunil Narine | Low Confidence | 12.65 | -4.10 | 29.40 | -0.29 | -18.77 | 18.19 | 58.13 | 12.35 | False |
| 2 | Rashid Khan | Low Confidence | 9.34 | -6.30 | 24.97 | 2.61 | -14.59 | 19.81 | 44.35 | 15.77 | True |
| 3 | Taskin Ahmed | Low Confidence | 8.83 | -7.44 | 25.10 | 12.55 | -7.07 | 32.16 | 43.42 | 16.40 | True |
| 4 | Varun Chakravarthy | Low Confidence | 9.24 | -8.85 | 27.33 | -0.05 | -19.82 | 19.71 | 44.10 | 17.08 | True |
| 5 | Jasprit Bumrah | Low Confidence | 6.72 | -8.89 | 22.33 | -8.14 | -26.61 | 10.32 | 34.55 | 19.07 | False |
| 6 | Maheesh Theekshana | Low Confidence | 6.15 | -8.57 | 20.86 | 4.12 | -12.19 | 20.43 | 30.20 | 20.40 | False |
| 7 | Patrick Cummins | Low Confidence | 5.91 | -12.64 | 24.47 | 13.60 | -7.56 | 34.76 | 32.60 | 21.21 | False |
| 8 | Kuldeep Yadav | Low Confidence | 4.92 | -8.59 | 18.42 | -2.25 | -18.67 | 14.17 | 24.58 | 21.27 | False |
| 9 | Josh Hazlewood | Low Confidence | 5.02 | -11.74 | 21.78 | -0.88 | -20.72 | 18.97 | 29.33 | 21.86 | False |
| 10 | Shaheen Afridi | Low Confidence | 5.07 | -12.58 | 22.72 | 0.26 | -20.55 | 21.07 | 30.45 | 21.87 | False |

## 4. Empirical Assessment & Limitations

- **Batters True Hits:** We estimate 4.9 of the 10 listed players truly belong in the true top 10.

- **Batters Separability:** All players have 90% pressure rating intervals that include zero (indistinguishable from the baseline average under pressure).

- **Bowlers True Hits:** We estimate 3.7 of the 10 listed players truly belong in the true top 10.

- **Bowlers Separability:** All players have 90% pressure rating intervals that include zero (indistinguishable from the baseline average under pressure).

## 5. Out-of-Sample Predictive Validation (60/40 Split)

| Role | Early Pressure -> Late Pressure (rho) | Early Ordinary -> Late Pressure (rho) | Hit Rate vs Median | Valid N | Binomial P |
|---|---|---|---|---|---|
| Batters | 0.38 | 0.03 | 0.67 | 9 | 0.25 |
| Bowlers | 0.24 | 0.26 | 0.90 | 10 | 0.01 |

- *Validation Result:* For Bowlers (n=10), early ordinary ratings predict late-stage pressure performance equivalently to early pressure ratings (Ordinary 0.26 vs Pressure 0.24). For Batters (n=9), pressure rating outperforms (0.38 vs 0.03), but sample sizes remain small. 

## 6. System Reliability (Split-Half Persistence)

| Role | Pressure split-half | Pressure (Spearman-Brown) | Ordinary split-half | Ordinary (Spearman-Brown) | Delta split-half | Players/split |
|---|---|---|---|---|---|---|
| Batters | 0.21 | 0.35 | 0.49 | 0.66 | -0.03 | 38.95 |
| Bowlers | 0.28 | 0.44 | 0.39 | 0.56 | 0.02 | 57.92 |

- *Interpretation:* Clutch persistence (Delta) is heavily bounded by noise. Batting Delta Split-Half hovers near -0.03. Because this trait lacks split-half stability, 'clutch' delta for most individuals is statistically indistinguishable from noise.

## 7. Sensitivity Robustness Variants

| Variant | Batters top-10 overlap | Batters rank corr | Bowlers top-10 overlap | Bowlers rank corr |
|---|---|---|---|---|
| Base | 7 | 0.90 | 8 | 0.91 |
| Pressure quantile q=0.7 | 8 | 0.92 | 8 | 0.93 |
| Pressure quantile q=0.9 | 3 | 0.59 | 6 | 0.79 |
| Format-specific baselines | 7 | 0.90 | 8 | 0.91 |
| Eligibility 100 balls / 15 innings | 5 | 0.90 | 6 | 0.91 |
| Eligibility 200 balls / 25 innings | 6 | 0.92 | 8 | 0.96 |

## 8. Extras Ablation Table

| Extras treatment | Batters top-10 overlap | Bowlers top-10 overlap |
|---|---|---|
| new | 7 | 8 |
| old | 8 | 6 |
| none | 6 | 5 |
| bowler_all | 7 | 8 |

## 9. Reproducibility

- Model ran on MD5 `c5bbd29fe98b35a46d83c7dc7072a27d` with 25 fits. Result is reproducible within statistical tolerance.
