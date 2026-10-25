import base64
import os
import re

svg_dir = r"c:\Users\omagg\OneDrive\Desktop\C - 01\EXAMPAD\SVG"
output_dir = r"c:\Users\omagg\OneDrive\Desktop\C - 01\EXAMPAD\SVG\extracted"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

files = ["converted-image.svg", "converted-image (1).svg", "converted-image (2).svg", "converted-image (3).svg"]

for f in files:
    path = os.path.join(svg_dir, f)
    with open(path, 'r') as file:
        content = file.read()
        match = re.search(r'data:image/png;base64,([^"]+)', content)
        if match:
            b64_data = match.group(1)
            with open(os.path.join(output_dir, f.replace(".svg", ".png")), "wb") as png_file:
                png_file.write(base64.b64decode(b64_data))
            print(f"Extracted {f}")
