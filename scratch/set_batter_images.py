import json

d = json.load(open('src/data/consensus_frontend.json', 'r', encoding='utf-8'))

image_map = {
    'Abhishek Sharma': '/assets/players/abishek_sharma.jpg',
    'Suryakumar Yadav': '/assets/players/Suryakumar Yadav.jpg',
    'Heinrich Klaasen': '/assets/players/Heinrich Klaasen.jpg',
    'Tim David': '/assets/players/Tim David.webp',
    'Shreyas Iyer': '/assets/players/Shreyas Iyer.webp',
    'Jos Buttler': '/assets/players/Jos Buttler.jpg',
    'Mitchell Marsh': '/assets/players/Mitchell Marsh.webp',
    'Prabhsimran Singh': '/assets/players/Prabhsimran Singh.jpg',
    'Sanju Samson': '/assets/players/Sanju Samson.jpg',
    'Glenn Maxwell': '/assets/players/Glenn Maxwell.jpg',
    'Sunil Narine': '/assets/players/Sunil Narine.webp',
    'Jasprit Bumrah': '/assets/players/Jasprit Bumrah.jpg',
    'Josh Hazlewood': '/assets/players/Josh Hazlewood.jpg',
    'Kuldeep Yadav': '/assets/players/Kuldeep Yadav.jpg',
    'Varun Chakravarthy': '/assets/players/Varun Chakravarthy.webp',
    'Rashid Khan': '/assets/players/Rashid Khan.webp',
    'Ravindra Jadeja': '/assets/players/Ravindra Jadeja.jpg',
    'Mustafizur Rahman': '/assets/players/Mustafizur Rahman.webp',
    'Axar Patel': '/assets/players/Axar Patel.jpg'
}

for role_key in ['batters', 'bowlers']:
    for p in d.get(role_key, []):
        if p['name'] in image_map:
            p['image'] = image_map[p['name']]

with open('src/data/consensus_frontend.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=2)

print('Updated consensus_frontend.json with all player images.')
