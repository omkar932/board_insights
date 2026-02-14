#!/usr/bin/env python3
"""Generate placeholder icons for Sanketa Chrome extension"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """Create a simple gradient icon with 'S' letter"""
    # Create image with gradient background
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (purple)
    for y in range(size):
        # Gradient from #667eea to #764ba2
        r = int(102 + (118 - 102) * y / size)
        g = int(126 + (75 - 126) * y / size)
        b = int(234 + (162 - 234) * y / size)
        draw.rectangle([(0, y), (size, y+1)], fill=(r, g, b))
    
    # Draw white 'S' in the center
    try:
        # Try to use a system font
        font_size = int(size * 0.6)
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    text = "S"
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center the text
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]
    
    # Draw text with shadow for depth
    draw.text((x+2, y+2), text, fill=(0, 0, 0, 128), font=font)
    draw.text((x, y), text, fill=(255, 255, 255), font=font)
    
    # Save
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    # Create icons directory if it doesn't exist
    icons_dir = 'chrome-extension/icons'
    os.makedirs(icons_dir, exist_ok=True)
    
    # Create icons in different sizes
    create_icon(16, f'{icons_dir}/icon16.png')
    create_icon(48, f'{icons_dir}/icon48.png')
    create_icon(128, f'{icons_dir}/icon128.png')
    
    print("\n✅ All icons created successfully!")

if __name__ == '__main__':
    main()
