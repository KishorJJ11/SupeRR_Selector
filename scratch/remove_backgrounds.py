import os
import glob
from PIL import Image
from rembg import remove, new_session

# Point to existing model directory
u2net_home = os.path.expanduser("~/.rembg/models")
os.environ["U2NET_HOME"] = u2net_home

session = new_session("u2net")

players_dir = "public/assets/players"
test_img = os.path.join(players_dir, "Suryakumar Yadav.jpg")

if os.path.exists(test_img):
    print(f"Processing test image: {test_img}")
    inp = Image.open(test_img)
    out = remove(inp, session=session)
    test_out = os.path.join(players_dir, "Suryakumar Yadav.png")
    out.save(test_out, format="PNG")
    print(f"Saved transparent PNG to {test_out}, size={os.path.getsize(test_out)} bytes")
else:
    print(f"File not found: {test_img}")
