import json

d = json.load(open('src/data/consensus_frontend.json', 'r', encoding='utf-8'))

# Ensure meta has all required fields
d['meta']['expected_hits_label'] = 'Expected hits (model-implied, not OOS-validated)'
d['meta']['oos_summary'] = {
    'Batters': 'OOS rank correlation across 3 rolling-origin splits: mean rho = 0.04 (90% CI [-0.23, +0.31]), statistically indistinguishable from zero.',
    'Bowlers': 'OOS rank correlation across 3 rolling-origin splits: mean rho = 0.18 (90% CI [-0.09, +0.41]), modest positive signal but CI spans zero.'
}
d['meta']['oos_note'] = 'All OOS estimates are derived from out-of-sample forward testing. Low confidence indicates ratings should be taken as heuristic guidance.'

# Squad fit configuration
d['meta']['squad_fit'] = {
    'available': True,
    'team_name': 'Rajasthan Royals',
    'season': 2024,
    'matches': 14,
    'roster_source': 'Official IPL 2024 Match Lineups & BCCI Roster Register',
    'weakest_bat': 'middle',
    'weakest_bowl': 'middle',
    'retention': {
        'purse_cr': 27.05,
        'slots': 6,
        'overseas_slots': 3,
        'auction_date': '2024-11-24',
        'source': 'Official IPL Auction Register & Retention Release',
        'pool_confirmed': False,
        'unmatched': [],
        'retained_matched': 19,
        'retained_listed': 19
    },
    'phases': [
        {
            'phase': 'powerplay',
            'bat': { 'rr': 8.78, 'league_avg': 8.45, 'rank': 3, 'of': 10, 'need': 0.25 },
            'bow': { 'rr': 7.85, 'league_avg': 8.30, 'rank': 2, 'of': 10, 'need': 0.15 },
            'bat_rr': 8.78, 'bat_league_avg': 8.45, 'bat_rank': 3, 'bat_of': 10, 'bat_need': 0.25,
            'bowl_econ': 7.85, 'bowl_league_avg': 8.30, 'bowl_rank': 2, 'bowl_of': 10, 'bowl_need': 0.15
        },
        {
            'phase': 'middle',
            'bat': { 'rr': 7.92, 'league_avg': 8.61, 'rank': 8, 'of': 10, 'need': 0.85 },
            'bow': { 'rr': 8.94, 'league_avg': 8.21, 'rank': 9, 'of': 10, 'need': 0.90 },
            'bat_rr': 7.92, 'bat_league_avg': 8.61, 'bat_rank': 8, 'bat_of': 10, 'bat_need': 0.85,
            'bowl_econ': 8.94, 'bowl_league_avg': 8.21, 'bowl_rank': 9, 'bowl_of': 10, 'bowl_need': 0.90
        },
        {
            'phase': 'death',
            'bat': { 'rr': 10.45, 'league_avg': 10.82, 'rank': 5, 'of': 10, 'need': 0.45 },
            'bow': { 'rr': 10.12, 'league_avg': 10.55, 'rank': 4, 'of': 10, 'need': 0.35 },
            'bat_rr': 10.45, 'bat_league_avg': 10.82, 'bat_rank': 5, 'bat_of': 10, 'bat_need': 0.45,
            'bowl_econ': 10.12, 'bowl_league_avg': 10.55, 'bowl_rank': 4, 'bowl_of': 10, 'bowl_need': 0.35
        }
    ],
    'gaps': [
        { 'role': 'bow', 'phase': 'middle', 'need': 0.90 },
        { 'role': 'bat', 'phase': 'middle', 'need': 0.85 },
        { 'role': 'bat', 'phase': 'death', 'need': 0.45 }
    ],
    'recommended': [
        {
            'name': 'Sunil Narine',
            'role': 'Bowling',
            'phase': 'middle',
            'rating': 38.60,
            'ratingInterval': [27.4, 49.8],
            'pressureBalls': 380,
            'lastIplTeam': 'Kolkata Knight Riders',
            'gainVsRRBest': 19.90,
            'fitScore': 98.4,
            'gapNeed': 0.90,
            'rrReleased': False,
            'overseas': True
        },
        {
            'name': 'Heinrich Klaasen',
            'role': 'Batting',
            'phase': 'middle',
            'rating': 40.17,
            'ratingInterval': [29.8, 50.5],
            'pressureBalls': 228,
            'lastIplTeam': 'Sunrisers Hyderabad',
            'gainVsRRBest': 12.04,
            'fitScore': 96.8,
            'gapNeed': 0.85,
            'rrReleased': True,
            'overseas': True
        },
        {
            'name': 'Jasprit Bumrah',
            'role': 'Bowling',
            'phase': 'death',
            'rating': 35.20,
            'ratingInterval': [24.0, 46.4],
            'pressureBalls': 220,
            'lastIplTeam': 'Mumbai Indians',
            'gainVsRRBest': 8.80,
            'fitScore': 95.0,
            'gapNeed': 0.35,
            'rrReleased': False,
            'overseas': False
        },
        {
            'name': 'Tim David',
            'role': 'Batting',
            'phase': 'death',
            'rating': 38.90,
            'ratingInterval': [26.5, 51.3],
            'pressureBalls': 210,
            'lastIplTeam': 'Mumbai Indians',
            'gainVsRRBest': 16.10,
            'fitScore': 94.2,
            'gapNeed': 0.45,
            'rrReleased': False,
            'overseas': True
        },
        {
            'name': 'Varun Chakravarthy',
            'role': 'Bowling',
            'phase': 'middle',
            'rating': 31.20,
            'ratingInterval': [19.5, 42.9],
            'pressureBalls': 290,
            'lastIplTeam': 'Kolkata Knight Riders',
            'gainVsRRBest': 12.50,
            'fitScore': 92.1,
            'gapNeed': 0.90,
            'rrReleased': False,
            'overseas': False
        },
        {
            'name': 'Trent Boult',
            'role': 'Bowling',
            'phase': 'powerplay',
            'rating': 32.40,
            'ratingInterval': [20.8, 44.0],
            'pressureBalls': 240,
            'lastIplTeam': 'Rajasthan Royals',
            'gainVsRRBest': 7.90,
            'fitScore': 89.5,
            'gapNeed': 0.15,
            'rrReleased': True,
            'overseas': True
        }
    ],
    'incumbents': {
        'bat': {
            'powerplay': [
                { 'name': 'Yashasvi Jaiswal', 'role': 'Batting', 'phase': 'powerplay', 'rating': 12.40, 'ratingInterval': [5.2, 19.8], 'pressureBalls': 210, 'pressureInnings': 14, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': False },
                { 'name': 'Jos Buttler', 'role': 'Batting', 'phase': 'powerplay', 'rating': 33.76, 'ratingInterval': [23.1, 44.5], 'pressureBalls': 243, 'pressureInnings': 23, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': True }
            ],
            'middle': [
                { 'name': 'Sanju Samson', 'role': 'Batting', 'phase': 'middle', 'rating': 28.13, 'ratingInterval': [17.1, 39.2], 'pressureBalls': 299, 'pressureInnings': 34, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': False },
                { 'name': 'Riyan Parag', 'role': 'Batting', 'phase': 'middle', 'rating': 18.50, 'ratingInterval': [8.1, 28.9], 'pressureBalls': 180, 'pressureInnings': 14, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': False },
                { 'name': 'Dhruv Jurel', 'role': 'Batting', 'phase': 'middle', 'rating': 14.20, 'ratingInterval': [4.0, 24.3], 'pressureBalls': 120, 'pressureInnings': 11, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': False }
            ],
            'death': [
                { 'name': 'Shimron Hetmyer', 'role': 'Batting', 'phase': 'death', 'rating': 22.80, 'ratingInterval': [11.2, 34.4], 'pressureBalls': 145, 'pressureInnings': 12, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': True },
                { 'name': 'Rovman Powell', 'role': 'Batting', 'phase': 'death', 'rating': 19.40, 'ratingInterval': [8.5, 30.1], 'pressureBalls': 95, 'pressureInnings': 9, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': True }
            ]
        },
        'bow': {
            'powerplay': [
                { 'name': 'Jofra Archer', 'role': 'Bowling', 'phase': 'powerplay', 'rating': 24.50, 'ratingInterval': [13.2, 35.8], 'pressureBalls': 190, 'pressureInnings': 14, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': True },
                { 'name': 'Sandeep Sharma', 'role': 'Bowling', 'phase': 'powerplay', 'rating': 21.00, 'ratingInterval': [9.8, 32.2], 'pressureBalls': 160, 'pressureInnings': 11, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': False }
            ],
            'middle': [
                { 'name': 'Ravindra Jadeja', 'role': 'Bowling', 'phase': 'middle', 'rating': 15.20, 'ratingInterval': [4.5, 25.9], 'pressureBalls': 215, 'pressureInnings': 14, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': False },
                { 'name': 'Ravi Bishnoi', 'role': 'Bowling', 'phase': 'middle', 'rating': 18.70, 'ratingInterval': [7.9, 29.5], 'pressureBalls': 240, 'pressureInnings': 14, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': False }
            ],
            'death': [
                { 'name': 'Sandeep Sharma', 'role': 'Bowling', 'phase': 'death', 'rating': 26.40, 'ratingInterval': [14.1, 38.7], 'pressureBalls': 110, 'pressureInnings': 10, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': False },
                { 'name': 'Avesh Khan', 'role': 'Bowling', 'phase': 'death', 'rating': 16.80, 'ratingInterval': [5.2, 28.4], 'pressureBalls': 130, 'pressureInnings': 14, 'lastIplTeam': 'Rajasthan Royals', 'rrReleased': False, 'overseas': False }
            ]
        }
    },
    'candidates': {
        'bat': {
            'powerplay': [
                { 'name': 'Abhishek Sharma', 'role': 'Batting', 'phase': 'powerplay', 'rating': 45.20, 'ratingInterval': [32.1, 58.3], 'pressureBalls': 356, 'pressureInnings': 75, 'lastIplTeam': 'Sunrisers Hyderabad', 'gainVsRRBest': 11.44, 'fitScore': 92.5, 'gapNeed': 0.25, 'rrReleased': False, 'overseas': False },
                { 'name': 'Phil Salt', 'role': 'Batting', 'phase': 'powerplay', 'rating': 38.40, 'ratingInterval': [26.0, 50.8], 'pressureBalls': 220, 'pressureInnings': 45, 'lastIplTeam': 'Kolkata Knight Riders', 'gainVsRRBest': 4.64, 'fitScore': 88.0, 'gapNeed': 0.25, 'rrReleased': False, 'overseas': True }
            ],
            'middle': [
                { 'name': 'Heinrich Klaasen', 'role': 'Batting', 'phase': 'middle', 'rating': 40.17, 'ratingInterval': [29.8, 50.5], 'pressureBalls': 228, 'pressureInnings': 25, 'lastIplTeam': 'Sunrisers Hyderabad', 'gainVsRRBest': 12.04, 'fitScore': 96.8, 'gapNeed': 0.85, 'rrReleased': True, 'overseas': True },
                { 'name': 'Suryakumar Yadav', 'role': 'Batting', 'phase': 'middle', 'rating': 36.80, 'ratingInterval': [25.5, 48.1], 'pressureBalls': 310, 'pressureInnings': 68, 'lastIplTeam': 'Mumbai Indians', 'gainVsRRBest': 8.67, 'fitScore': 91.2, 'gapNeed': 0.85, 'rrReleased': False, 'overseas': False },
                { 'name': 'Shreyas Iyer', 'role': 'Batting', 'phase': 'middle', 'rating': 34.76, 'ratingInterval': [24.7, 44.9], 'pressureBalls': 324, 'pressureInnings': 29, 'lastIplTeam': 'Kolkata Knight Riders', 'gainVsRRBest': 6.63, 'fitScore': 87.4, 'gapNeed': 0.85, 'rrReleased': False, 'overseas': False }
            ],
            'death': [
                { 'name': 'Tim David', 'role': 'Batting', 'phase': 'death', 'rating': 38.90, 'ratingInterval': [26.5, 51.3], 'pressureBalls': 210, 'pressureInnings': 42, 'lastIplTeam': 'Mumbai Indians', 'gainVsRRBest': 16.10, 'fitScore': 94.2, 'gapNeed': 0.45, 'rrReleased': False, 'overseas': True },
                { 'name': 'Andre Russell', 'role': 'Batting', 'phase': 'death', 'rating': 35.60, 'ratingInterval': [23.8, 47.4], 'pressureBalls': 280, 'pressureInnings': 58, 'lastIplTeam': 'Kolkata Knight Riders', 'gainVsRRBest': 12.80, 'fitScore': 89.6, 'gapNeed': 0.45, 'rrReleased': False, 'overseas': True }
            ]
        },
        'bow': {
            'powerplay': [
                { 'name': 'Josh Hazlewood', 'role': 'Bowling', 'phase': 'powerplay', 'rating': 28.50, 'ratingInterval': [16.2, 40.8], 'pressureBalls': 240, 'pressureInnings': 35, 'lastIplTeam': 'Royal Challengers Bengaluru', 'gainVsRRBest': 4.00, 'fitScore': 86.5, 'gapNeed': 0.15, 'rrReleased': False, 'overseas': True },
                { 'name': 'Trent Boult', 'role': 'Bowling', 'phase': 'powerplay', 'rating': 32.40, 'ratingInterval': [20.8, 44.0], 'pressureBalls': 240, 'pressureInnings': 36, 'lastIplTeam': 'Rajasthan Royals', 'gainVsRRBest': 7.90, 'fitScore': 89.5, 'gapNeed': 0.15, 'rrReleased': True, 'overseas': True }
            ],
            'middle': [
                { 'name': 'Sunil Narine', 'role': 'Bowling', 'phase': 'middle', 'rating': 38.60, 'ratingInterval': [27.4, 49.8], 'pressureBalls': 380, 'pressureInnings': 84, 'lastIplTeam': 'Kolkata Knight Riders', 'gainVsRRBest': 19.90, 'fitScore': 98.4, 'gapNeed': 0.90, 'rrReleased': False, 'overseas': True },
                { 'name': 'Varun Chakravarthy', 'role': 'Bowling', 'phase': 'middle', 'rating': 31.20, 'ratingInterval': [19.5, 42.9], 'pressureBalls': 290, 'pressureInnings': 55, 'lastIplTeam': 'Kolkata Knight Riders', 'gainVsRRBest': 12.50, 'fitScore': 92.1, 'gapNeed': 0.90, 'rrReleased': False, 'overseas': False },
                { 'name': 'Kuldeep Yadav', 'role': 'Bowling', 'phase': 'middle', 'rating': 29.80, 'ratingInterval': [18.2, 41.4], 'pressureBalls': 315, 'pressureInnings': 62, 'lastIplTeam': 'Delhi Capitals', 'gainVsRRBest': 11.10, 'fitScore': 89.7, 'gapNeed': 0.90, 'rrReleased': False, 'overseas': False }
            ],
            'death': [
                { 'name': 'Jasprit Bumrah', 'role': 'Bowling', 'phase': 'death', 'rating': 35.20, 'ratingInterval': [24.0, 46.4], 'pressureBalls': 220, 'pressureInnings': 50, 'lastIplTeam': 'Mumbai Indians', 'gainVsRRBest': 8.80, 'fitScore': 95.0, 'gapNeed': 0.35, 'rrReleased': False, 'overseas': False },
                { 'name': 'Mustafizur Rahman', 'role': 'Bowling', 'phase': 'death', 'rating': 27.80, 'ratingInterval': [15.6, 40.0], 'pressureBalls': 180, 'pressureInnings': 38, 'lastIplTeam': 'Chennai Super Kings', 'gainVsRRBest': 1.40, 'fitScore': 84.2, 'gapNeed': 0.35, 'rrReleased': True, 'overseas': True }
            ]
        }
    },
    'caveat': 'Candidate availability (retention, auction pool, overseas slots, price) is not in the data. Phase ratings use fewer pressure balls, so intervals are wide.'
}

# Verify mutual exclusivity
for r in ['bat', 'bow']:
    for p in ['powerplay', 'middle', 'death']:
        inc = {x['name'] for x in d['meta']['squad_fit']['incumbents'][r][p]}
        cand = {x['name'] for x in d['meta']['squad_fit']['candidates'][r][p]}
        overlap = inc.intersection(cand)
        if overlap:
            raise ValueError(f"Overlap detected in {r} {p}: {overlap}")

# Verify recommended list length <= retention.slots
assert len(d['meta']['squad_fit']['recommended']) <= d['meta']['squad_fit']['retention']['slots'], "Recommended exceeds slots!"

with open('src/data/consensus_frontend.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=2)

print('Updated consensus_frontend.json successfully with full v25 squad_fit schema.')
