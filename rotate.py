import sys
try:
    from PIL import Image
    img = Image.open('pngs/team_phts/IMG_6672.jpeg')
    # rotate 90 degrees left (counter-clockwise)
    rotated = img.rotate(90, expand=True)
    rotated.save('pngs/team_phts/IMG_6672_rotated.jpeg')
    print("Success")
except Exception as e:
    print("Error:", e)
