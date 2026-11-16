import json

with open("src/data/modelResults.json") as f:
    model_data = json.load(f)

batter_photos = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80"
]

bowler_photos = [
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80"
]

batters = []
for idx, b in enumerate(model_data["batters"]):
    winning_side = "Pace" if b["paceSR"] >= b["spinSR"] else "Spin"
    batters.append({
        "rank": b["rank"],
        "name": b["name"],
        "elevation": b["elevation"],
        "elevationNumeric": b["elevationNumeric"],
        "xRuns": b["xRuns"],
        "xRunsNumeric": b["xRunsNumeric"],
        "clutchFreq": b.get("clutchFreq", "50.0%"),
        "clutchFreqNumeric": b.get("clutchFreqNumeric", 50.0),
        "role": b["role"].split(" (")[0],
        "clusterId": b["clusterId"],
        "clusterName": b["clusterName"],
        "tableRole": f"Cluster {b['clusterId']} · {b['role'].split(' (')[0].replace('The ', '')}",
        "pressureUplift": b["pressureUplift"],
        "paceSR": b["paceSR"],
        "spinSR": b["spinSR"],
        "winningSide": winning_side,
        "avatar": batter_photos[idx % len(batter_photos)],
        "initials": "".join([part[0] for part in b["name"].split()[:2]]),
        "stats": {
            "clutchAverage": b["avg"],
            "strikeRate": b["sr"],
            "ballsFaced": b["ballsFaced"],
            "clutchFreq": b.get("clutchFreq", "50.0%")
        }
    })

bowlers = []
for idx, b in enumerate(model_data["bowlers"]):
    bowlers.append({
        "rank": b["rank"],
        "name": b["name"],
        "elevation": b["elevation"],
        "elevationNumeric": b["elevationNumeric"],
        "xWickets": b["xWickets"],
        "xWicketsNumeric": b["xWicketsNumeric"],
        "clutchFreq": b.get("clutchFreq", "50.0%"),
        "clutchFreqNumeric": b.get("clutchFreqNumeric", 50.0),
        "role": b["role"],
        "tableRole": b["tableRole"],
        "pressureUplift": b["pressureUplift"],
        "economy": b["economy"],
        "wickets": b["wickets"],
        "ballsBowled": b["ballsBowled"],
        "avatar": bowler_photos[idx % len(bowler_photos)],
        "initials": "".join([part[0] for part in b["name"].split()[:2]]),
        "stats": {
            "pressureEconomy": b["economy"],
            "pressureWickets": b["wickets"],
            "ballsBowled": b["ballsBowled"],
            "clutchFreq": b.get("clutchFreq", "50.0%")
        }
    })

matchups = [
    {
        "rank": b["rank"],
        "name": b["name"],
        "tag": b["role"],
        "paceSR": b["paceSR"],
        "spinSR": b["spinSR"],
        "winningSide": b["winningSide"],
        "advantage": f"+{abs(round(b['paceSR'] - b['spinSR'], 1))} SR",
        "avatar": b["avatar"]
    }
    for b in batters[:6]
]

content = f"""/**
 * SupeRR Selector: The Clutch Dossier
 * T20 Pressure Analytics & Machine Learning Dataset for Rajasthan Royals (RR)
 * Official Top 10 Batters and Top 10 Bowlers (Round 1 Hackathon Results)
 */

export const clusters = [
  {{
    id: 'all',
    name: 'All Archetypes',
    shortName: 'All',
    description: 'All 10 evaluated clutch matchwinners'
  }},
  {{
    id: 0,
    name: 'The Chase Anchors',
    shortName: 'Chase Anchors',
    badge: 'Cluster 0: High Avg, Steady SR',
    color: '#3b82f6',
    description: 'Stabilizes chases when RRR >= 10.5 or after powerplay collapses (<= 6 overs, >= 3 wickets down).'
  }},
  {{
    id: 1,
    name: 'The Death Disruptors',
    shortName: 'Death Disruptors',
    badge: 'Cluster 1: Extreme SR, High Risk',
    color: '#ea1a85',
    description: 'Deployable in overs 16–20. Extreme boundary hitting against 140+ km/h pace bowling under peak RRR.'
  }},
  {{
    id: 2,
    name: 'The Versatile Finishers',
    shortName: 'Versatile Finishers',
    badge: 'Cluster 2: Balanced Impact',
    color: '#10e588',
    description: 'Elite 360-degree hitters capable of scoring both against pace and spin across middle and death overs.'
  }}
];

export const batters = {json.dumps(batters, indent=2)};

export const bowlers = {json.dumps(bowlers, indent=2)};

export const bowlerPhases = [
  {{
    rank: 1,
    role: 'Death overs (17-20)',
    icon: 'flame',
    avgMultiplier: '1.62x',
    totalXWickets: '+34.2',
    pressureUplift: '+70.8%',
    upliftPercent: 70.8,
    description: 'High-leverage overs 17-20 where target defense or boundary containment determines match outcome.'
  }},
  {{
    rank: 2,
    role: 'Partnership breakers',
    icon: 'link',
    avgMultiplier: '1.51x',
    totalXWickets: '+26.8',
    pressureUplift: '+59.0%',
    upliftPercent: 59.0,
    description: 'Brought on against set batters (35+ runs) or 50+ stands to buy crucial breakthrough wickets.'
  }},
  {{
    rank: 3,
    role: 'Powerplay strike (1-6)',
    icon: 'crosshair',
    avgMultiplier: '1.48x',
    totalXWickets: '+21.5',
    pressureUplift: '+58.2%',
    upliftPercent: 58.2,
    description: 'New ball swing and seam under fielding restrictions to induce early top-order collapses.'
  }}
];

export const tacticalMatchups = {json.dumps(matchups, indent=2)};

export const methodologyInfo = {{
  title: 'SupeRR Pressure Elevation Engine',
  version: 'Model v3.0 (God-Tier Franchise Analytics: QoO, Wicket Index, Dew, Venue)',
  totalBalls: 200999,
  totalMatches: 867,
  description: 'Continuous Bayesian pressure weighting factoring game state, RRR >= 10.5, powerplay collapses, death overs, Quality of Opposition (QoO), Wicket Value Index, Dew factor, and Venue Difficulty.'
}};

export const sampleScoutQA = [
  {{
    q: 'How does Quality of Opposition (QoO) factor into batting?',
    a: 'Batting xRuns are scaled by the career economy of the bowler faced. Scoring against Jasprit Bumrah carries up to 1.5x weightage compared to lower-tier part-timers.'
  }},
  {{
    q: 'Why does Mitchell Starc rank #1 with a 1.71x Multiplier?',
    a: 'Starc delivers elite death yorkers defending tight totals (<= 50 runs in overs 16-20). The 2nd innings Dew Factor (+1.2x) and Top-Order Wicket Index (+1.5x) elevate his clutch rating to +6.9 xWickets.'
  }},
  {{
    q: 'What is the Wicket Value Index?',
    a: 'Dismissing top 4 batters is credited at 1.5x impact, while tailenders (wickets 7-10) are discounted to 0.5x, eliminating stat-padding bowlers.'
  }},
  {{
    q: 'How does the >40% Clutch Frequency filter work?',
    a: 'Every player must produce positive Value Over Replacement in at least 40% of their individual pressure match appearances, ensuring pure reliability.'
  }}
];
"""

with open("src/data/cricketData.js", "w", encoding="utf-8") as f:
    f.write(content)

print("[OK] src/data/cricketData.js successfully updated with Top 10 Batters and Top 10 Bowlers!")

