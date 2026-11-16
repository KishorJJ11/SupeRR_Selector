import json

with open("src/data/modelResults.json") as f:
    mr = json.load(f)
with open("src/data/consensus_frontend.json") as f:
    cf = json.load(f)

print("--- BATTERS in modelResults.json ---")
for b in mr["batters"]:
    match = [c for c in cf["batters"] if str(c.get("id")) == str(b.get("id")) or c.get("name") == b.get("name")]
    m_name = match[0]["name"] if match else "NO MATCH"
    print(b["name"], b["id"], b.get("pTop10Numeric"), "-> cf:", m_name)

print("--- BOWLERS in modelResults.json ---")
for b in mr["bowlers"]:
    match = [c for c in cf["bowlers"] if str(c.get("id")) == str(b.get("id")) or c.get("name") == b.get("name")]
    m_name = match[0]["name"] if match else "NO MATCH"
    print(b["name"], b["id"], b.get("pTop10Numeric"), "-> cf:", m_name)

print("--- consensus_frontend.json BATTERS ---")
for b in cf["batters"]:
    print(b["rank"], b["name"], b["id"], b.get("top10SharePct"), b.get("pTop10Post"))

print("--- consensus_frontend.json BOWLERS ---")
for b in cf["bowlers"]:
    print(b["rank"], b["name"], b["id"], b.get("top10SharePct"), b.get("pTop10Post"))
