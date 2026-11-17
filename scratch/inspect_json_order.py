import json

with open('src/data/consensus_frontend.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("Batters in consensus_frontend.json:")
for i, b in enumerate(data['batters']):
    print(f"  Index {i}: rank={b.get('rank')} name={b.get('name')} pressureRating={b.get('pressureRating')} expRank={b.get('expectedRank')}")

print("\nBowlers in consensus_frontend.json:")
for i, b in enumerate(data['bowlers']):
    print(f"  Index {i}: rank={b.get('rank')} name={b.get('name')} pressureRating={b.get('pressureRating')} expRank={b.get('expectedRank')}")
