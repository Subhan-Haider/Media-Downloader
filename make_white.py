import sys
from PIL import Image

def make_white(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    for item in data:
        # If the pixel is not fully transparent, make it white but keep its original alpha
        if item[3] > 0:
            new_data.append((255, 255, 255, item[3]))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved white logo to {output_path}")

if __name__ == "__main__":
    make_white(sys.argv[1], sys.argv[2])
