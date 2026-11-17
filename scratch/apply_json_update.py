import json

with open('src/data/consensus_frontend.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Sort batters and bowlers by pressureRating descending
data['batters'] = sorted(data['batters'], key=lambda x: x['pressureRating'], reverse=True)
for i, b in enumerate(data['batters']):
    b['rank'] = i + 1

data['bowlers'] = sorted(data['bowlers'], key=lambda x: x['pressureRating'], reverse=True)
for i, b in enumerate(data['bowlers']):
    b['rank'] = i + 1

with open('src/data/consensus_frontend.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("consensus_frontend.json successfully updated with numerical rank order matching pressureRating!")
