from PIL import Image, ImageDraw

def process_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    # The logo is centered. Let's crop the center 70% 
    # based on the 140% scale factor we used before (100/140 = 0.71)
    crop_w, crop_h = int(w * 0.72), int(h * 0.72)
    left = (w - crop_w) // 2
    top = (h - crop_h) // 2
    right = left + crop_w
    bottom = top + crop_h
    
    cropped = img.crop((left, top, right, bottom))
    
    # Apply rounded corners mask
    mask = Image.new('L', cropped.size, 0)
    draw = ImageDraw.Draw(mask)
    rad = int(crop_w * 0.22) # 22% radius for rounded square
    draw.rounded_rectangle((0, 0, crop_w, crop_h), rad, fill=255)
    
    cropped.putalpha(mask)
    cropped.save(output_path, "PNG")

process_logo("public/assets/aerocmd_logo.png", "public/assets/aerocmd_logo.png")
print("Logo processed!")
