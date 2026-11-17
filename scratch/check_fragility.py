import json

with open('src/data/consensus_frontend.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for w in ('batters', 'bowlers'):
    print(w)
    for p in data[w]:
        mf = p.get('modelFragility')
        gap = p.get('rankVsPosteriorGap')
        top10 = p.get('top10SharePct', 0)
        pPost = p.get('pTop10Post', 0)
        diff = abs(top10 - pPost)
        print(f"  {p['name']}: modelFragility={mf}, rankVsPosteriorGap={gap}, top10SharePct={top10}, pTop10Post={pPost}, diff={diff:.1f}")
