import os
from PIL import Image
from rembg import new_session, remove

os.environ["U2NET_HOME"] = os.path.expanduser("~/.rembg")
session = new_session("u2net")

players_dir = "public/assets/players"
dist_dir = "dist/assets/players"
os.makedirs(dist_dir, exist_ok=True)

players_to_process = [
    ("Abhishek Sharma", ["abhishek_sharma.jpg", "abishek_sharma.jpg"]),
    ("Suryakumar Yadav", ["Suryakumar Yadav.jpg"]),
    ("Heinrich Klaasen", ["Heinrich Klaasen.jpg"]),
    ("Tim David", ["Tim David.webp"]),
    ("Shreyas Iyer", ["Shreyas Iyer.webp"]),
    ("Jos Buttler", ["Jos Buttler.jpg"]),
    ("Mitchell Marsh", ["Mitchell Marsh.webp"]),
    ("Prabhsimran Singh", ["Prabhsimran Singh.jpg"]),
    ("Sanju Samson", ["Sanju Samson.jpg"]),
    ("Glenn Maxwell", ["Glenn Maxwell.jpg"]),
    ("Sunil Narine", ["Sunil Narine.webp"]),
    ("Jasprit Bumrah", ["Jasprit Bumrah.jpg"]),
    ("Josh Hazlewood", ["Josh Hazlewood.jpg"]),
    ("Kuldeep Yadav", ["Kuldeep Yadav.jpg"]),
    ("Varun Chakravarthy", ["Varun Chakravarthy.webp"]),
    ("Rashid Khan", ["Rashid Khan.webp"]),
    ("Ravindra Jadeja", ["Ravindra Jadeja.jpg"]),
    ("Mustafizur Rahman", ["Mustafizur Rahman.webp"]),
    ("Axar Patel", ["Axar Patel.jpg"]),
    ("Noor Ahmad", ["Noor Ahmad.jpg"]),
]

def make_centered_square(img, pad=12):
    bbox = img.getbbox()
    if not bbox:
        return img
    cropped = img.crop(bbox)
    w, h = cropped.size
    dim = max(w, h) + pad * 2
    square = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    offset_x = (dim - w) // 2
    offset_y = pad
    square.paste(cropped, (offset_x, offset_y), cropped)
    return square

processed_count = 0

for name, filenames in players_to_process:
    src_file = None
    for fn in filenames:
        path = os.path.join(players_dir, fn)
        if os.path.exists(path):
            src_file = path
            break
    
    if not src_file:
        print(f"Skipping {name}: no source file found.")
        continue

    print(f"Processing {name} from {src_file}...")
    try:
        raw_img = Image.open(src_file)
        # Convert to RGB if palette/other
        if raw_img.mode not in ("RGB", "RGBA"):
            raw_img = raw_img.convert("RGB")
        
        nobg = remove(raw_img, session=session)
        final_img = make_centered_square(nobg)
        
        # Save canonical name as PNG
        canonical_out = os.path.join(players_dir, f"{name}.png")
        final_img.save(canonical_out, format="PNG")
        
        # Also save to dist
        dist_out = os.path.join(dist_dir, f"{name}.png")
        final_img.save(dist_out, format="PNG")
        
        # If there are aliases, save those too
        for fn in filenames:
            base, _ = os.path.splitext(fn)
            alias_pub = os.path.join(players_dir, f"{base}.png")
            final_img.save(alias_pub, format="PNG")
            alias_dist = os.path.join(dist_dir, f"{base}.png")
            final_img.save(alias_dist, format="PNG")
            
        print(f"Successfully processed {name} -> {canonical_out} (size: {final_img.size})")
        processed_count += 1
    except Exception as e:
        print(f"Error processing {name}: {e}")

print(f"\nDone! Processed {processed_count} players.")
