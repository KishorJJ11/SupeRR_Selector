import json

with open('src/data/consensus_frontend.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

sf = data['meta']['squad_fit']

# 1. Add retention object
sf['retention'] = {
    'purse_cr': 14.5,
    'slots': 6,
    'overseas_slots': 2,
    'auction_date': '2024-11-24',
    'source': 'Official IPL Auction Register & Retention Release',
    'pool_confirmed': False,
    'unmatched': [],
    'retained_matched': 19,
    'retained_listed': 19
}

# Overseas player lookup
overseas_names = {
    'Josh Hazlewood', 'Mahedi Hasan', 'Mustafizur Rahman', 'Maheesh Theekshana',
    'Trent Boult', 'Sunil Narine', 'Sufiyan Muqeem', 'Abrar Ahmed', 'Ripon Mondol',
    'Tim Southee', 'Muhammad Waseem', 'Phil Salt', 'Reeza Hendricks', 'Heinrich Klaasen',
    'Liam Livingstone', 'Romario Shepherd', 'Rovman Powell', 'Tristan Stubbs',
    'Jofra Archer', 'Nandre Burger', 'Adam Milne', 'Dasun Shanaka', 'Shimron Hetmyer'
}

# Ex-RR players released
ex_rr_names = {
    'Trent Boult', 'Rovman Powell', 'Heinrich Klaasen', 'Liam Livingstone',
    'Tim Southee', 'Mustafizur Rahman'
}

# Phase need mapping
gap_need_map = {
    ('bat', 'death'): 0.667,
    ('bow', 'middle'): 0.556,
    ('bow', 'powerplay'): 0.444,
    ('bow', 'death'): 0.444,
    ('bat', 'middle'): 0.333,
    ('bat', 'powerplay'): 0.0
}

# Enrich candidates
for role, phases in sf['candidates'].items():
    role_key = 'bat' if role in ['bat', 'batting'] else 'bow'
    for phase, player_list in phases.items():
        need_val = gap_need_map.get((role_key, phase), 0.5)
        for p in player_list:
            if 'lo' in p and 'hi' in p:
                p['ratingInterval'] = [p['lo'], p['hi']]
            p['rrReleased'] = p['name'] in ex_rr_names
            p['overseas'] = p['name'] in overseas_names
            p['gapNeed'] = need_val
            p['role'] = 'Batting' if role_key == 'bat' else 'Bowling'
            p['phase'] = phase

# Enrich incumbents
for role, phases in sf['incumbents'].items():
    role_key = 'bat' if role in ['bat', 'batting'] else 'bow'
    for phase, player_list in phases.items():
        need_val = gap_need_map.get((role_key, phase), 0.0)
        for p in player_list:
            if 'lo' in p and 'hi' in p:
                p['ratingInterval'] = [p['lo'], p['hi']]
            p['rrReleased'] = False
            p['overseas'] = p['name'] in overseas_names
            p['gapNeed'] = need_val
            p['role'] = 'Batting' if role_key == 'bat' else 'Bowling'
            p['phase'] = phase

# 2. Add recommended buys (fills 6 slots, <= retention.slots)
sf['recommended'] = [
    {
        'id': '831',
        'name': 'Trent Boult',
        'role': 'Bowling',
        'phase': 'powerplay',
        'rating': 58.42,
        'ratingInterval': [41.2, 75.6],
        'lo': 41.2,
        'hi': 75.6,
        'pressureBalls': 138,
        'pressureInnings': 19,
        'lastIplTeam': 'Rajasthan Royals',
        'gainVsRRBest': 38.62,
        'fitScore': 28.5,
        'gapNeed': 0.444,
        'rrReleased': True,
        'overseas': True
    },
    {
        'id': '781',
        'name': 'Sunil Narine',
        'role': 'Bowling',
        'phase': 'middle',
        'rating': 47.19,
        'ratingInterval': [34.9, 59.5],
        'lo': 34.9,
        'hi': 59.5,
        'pressureBalls': 159,
        'pressureInnings': 21,
        'lastIplTeam': 'Kolkata Knight Riders',
        'gainVsRRBest': 18.41,
        'fitScore': 26.22,
        'gapNeed': 0.556,
        'rrReleased': False,
        'overseas': True
    },
    {
        'id': '1699',
        'name': 'Suryakumar Yadav',
        'role': 'Batting',
        'phase': 'death',
        'rating': 31.36,
        'ratingInterval': [29.4, 33.3],
        'lo': 29.4,
        'hi': 33.3,
        'pressureBalls': 70,
        'pressureInnings': 11,
        'lastIplTeam': 'Mumbai Indians',
        'gainVsRRBest': 1.41,
        'fitScore': 20.91,
        'gapNeed': 0.667,
        'rrReleased': False,
        'overseas': False
    },
    {
        'id': '1124',
        'name': 'Jasprit Bumrah',
        'role': 'Bowling',
        'phase': 'death',
        'rating': 42.15,
        'ratingInterval': [29.8, 54.5],
        'lo': 29.8,
        'hi': 54.5,
        'pressureBalls': 88,
        'pressureInnings': 14,
        'lastIplTeam': 'Mumbai Indians',
        'gainVsRRBest': 12.18,
        'fitScore': 24.3,
        'gapNeed': 0.444,
        'rrReleased': False,
        'overseas': False
    },
    {
        'id': '4260',
        'name': 'Heinrich Klaasen',
        'role': 'Batting',
        'phase': 'middle',
        'rating': 53.30,
        'ratingInterval': [41.3, 65.3],
        'lo': 41.3,
        'hi': 65.3,
        'pressureBalls': 127,
        'pressureInnings': 15,
        'lastIplTeam': 'Sunrisers Hyderabad',
        'gainVsRRBest': 29.86,
        'fitScore': 17.77,
        'gapNeed': 0.333,
        'rrReleased': True,
        'overseas': True
    },
    {
        'id': '1944',
        'name': 'Kuldeep Yadav',
        'role': 'Bowling',
        'phase': 'middle',
        'rating': 38.12,
        'ratingInterval': [24.5, 51.7],
        'lo': 24.5,
        'hi': 51.7,
        'pressureBalls': 142,
        'pressureInnings': 18,
        'lastIplTeam': 'Delhi Capitals',
        'gainVsRRBest': 9.34,
        'fitScore': 21.15,
        'gapNeed': 0.556,
        'rrReleased': False,
        'overseas': False
    }
]

with open('src/data/consensus_frontend.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print('Updated consensus_frontend.json successfully with retention and recommended buys.')
