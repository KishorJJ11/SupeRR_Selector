import json
import os

json_path = 'src/data/consensus_frontend.json'
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Map all players to their .png image
PNG_MAP = {
    # Batters
    'Abhishek Sharma': '/assets/players/Abhishek Sharma.png',
    'Suryakumar Yadav': '/assets/players/Suryakumar Yadav.png',
    'Heinrich Klaasen': '/assets/players/Heinrich Klaasen.png',
    'Tim David': '/assets/players/Tim David.png',
    'Shreyas Iyer': '/assets/players/Shreyas Iyer.png',
    'Jos Buttler': '/assets/players/Jos Buttler.png',
    'Mitchell Marsh': '/assets/players/Mitchell Marsh.png',
    'Prabhsimran Singh': '/assets/players/Prabhsimran Singh.png',
    'Sanju Samson': '/assets/players/Sanju Samson.png',
    'Glenn Maxwell': '/assets/players/Glenn Maxwell.png',

    # Bowlers
    'Sunil Narine': '/assets/players/Sunil Narine.png',
    'Jasprit Bumrah': '/assets/players/Jasprit Bumrah.png',
    'Josh Hazlewood': '/assets/players/Josh Hazlewood.png',
    'Kuldeep Yadav': '/assets/players/Kuldeep Yadav.png',
    'Varun Chakravarthy': '/assets/players/Varun Chakravarthy.png',
    'Rashid Khan': '/assets/players/Rashid Khan.png',
    'Ravindra Jadeja': '/assets/players/Ravindra Jadeja.png',
    'Mustafizur Rahman': '/assets/players/Mustafizur Rahman.png',
    'Axar Patel': '/assets/players/Axar Patel.png',
    'Noor Ahmad': '/assets/players/Noor Ahmad.png',
}

for b in data.get('batters', []):
    if b['name'] in PNG_MAP:
        b['image'] = PNG_MAP[b['name']]

for b in data.get('bowlers', []):
    if b['name'] in PNG_MAP:
        b['image'] = PNG_MAP[b['name']]

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Updated consensus_frontend.json with .png images successfully!")
