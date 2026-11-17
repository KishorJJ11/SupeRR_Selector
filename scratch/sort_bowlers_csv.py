import pandas as pd

df = pd.read_csv('src/data/consensus_bowlers.csv')
# Sort by pressureRating descending
df = df.sort_values(by='pressureRating', ascending=False).reset_index(drop=True)
df['rank'] = range(1, len(df) + 1)
df.to_csv('src/data/consensus_bowlers.csv', index=False)
print("consensus_bowlers.csv sorted by pressureRating descending!")
print(df[['rank', 'name', 'pressureRating', 'expRank']].head(10))
