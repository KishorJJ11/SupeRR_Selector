import pandas as pd

for w in ['batters', 'bowlers']:
    p = f'src/data/consensus_{w}.csv'
    df = pd.read_csv(p)
    if 'fitStabilityPct' not in df.columns:
        df['fitStabilityPct'] = df['top10SharePct']
    df = df.sort_values(['pTop10Post', 'expRank'], ascending=[False, True]).reset_index(drop=True)
    df['rank'] = range(1, len(df) + 1)
    df.to_csv(p, index=False)
    print(f"Updated {p}")
