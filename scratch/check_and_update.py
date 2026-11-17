import json

with open('src/data/consensus_frontend.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

bowlers = sorted(data['bowlers'], key=lambda x: x['pressureRating'], reverse=True)
for i, b in enumerate(bowlers):
    b['rank'] = i + 1

batters = sorted(data['batters'], key=lambda x: x['pressureRating'], reverse=True)
for i, b in enumerate(batters):
    b['rank'] = i + 1

print("Sorted Batters:")
for b in batters:
    print(f"Rank {b['rank']:02d}: {b['name']} ({b['pressureRating']}) [expRank: {b.get('expectedRank')}]")

print("\nSorted Bowlers:")
for b in bowlers:
    print(f"Rank {b['rank']:02d}: {b['name']} ({b['pressureRating']}) [expRank: {b.get('expectedRank')}]")
