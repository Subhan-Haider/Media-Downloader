import sys
from PIL import Image

def make_transparent(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    # Any pixel that is close to white will be made transparent
    # A threshold of 240 is usually good to catch off-white artifacts without destroying the logo
    threshold = 240
    for item in data:
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

if __name__ == "__main__":
    make_transparent(sys.argv[1], sys.argv[2])
