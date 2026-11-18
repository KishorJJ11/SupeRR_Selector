import json

# Load consensus_frontend.json
d = json.load(open('src/data/consensus_frontend.json'))

for key in ['batters', 'bowlers']:
    # Sort strictly by pTop10Post descending, then expectedRank ascending
    players = d[key]
    for p in players:
        p['fitStabilityPct'] = p.get('fitStabilityPct', p.get('top10SharePct', 0.0))
    
    players_sorted = sorted(players, key=lambda x: (-x['pTop10Post'], x['expectedRank']))
    for idx, p in enumerate(players_sorted):
        p['rank'] = idx + 1
    d[key] = players_sorted

with open('src/data/consensus_frontend.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=2)

print("Updated consensus_frontend.json successfully!")
for key in ['batters', 'bowlers']:
    print(f"\n{key.upper()}:")
    for p in d[key]:
        print(f"Rank {p['rank']}: {p['name']} - P(top 10)={p['pTop10Post']}%, expRank={p['expectedRank']}, fitStabilityPct={p['fitStabilityPct']}%")
