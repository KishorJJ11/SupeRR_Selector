import json

with open('src/data/consensus_frontend.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Update validation binomial_p
if 'meta' in data and 'validation' in data['meta']:
    if 'bat' in data['meta']['validation']:
        data['meta']['validation']['bat']['binomial_p'] = 0.25390625
    if 'bow' in data['meta']['validation']:
        data['meta']['validation']['bow']['binomial_p'] = 0.0107421875

# Update modelFragility on every player
for w in ('batters', 'bowlers'):
    for p in data.get(w, []):
        top10 = p.get('top10SharePct', 0)
        pPost = p.get('pTop10Post', 0)
        is_fragile = abs(top10 - pPost) > 30
        p['modelFragility'] = is_fragile

with open('src/data/consensus_frontend.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated consensus_frontend.json with binomial_p and modelFragility!")
print("Meta validation:", json.dumps(data['meta']['validation'], indent=2))
print("Batters modelFragility:", [(p['name'], p['modelFragility']) for p in data['batters']])
print("Bowlers modelFragility:", [(p['name'], p['modelFragility']) for p in data['bowlers']])
