import json

d = json.load(open('src/data/consensus_frontend.json'))
print('Batters by current order:')
for b in d['batters']:
    print(f"{b['rank']}. {b['name']}: pTop10Post={b['pTop10Post']}, expRank={b['expectedRank']}, top10SharePct={b.get('top10SharePct')}")

print('\nBowlers by current order:')
for b in d['bowlers']:
    print(f"{b['rank']}. {b['name']}: pTop10Post={b['pTop10Post']}, expRank={b['expectedRank']}, top10SharePct={b.get('top10SharePct')}")
