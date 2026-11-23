"""Composite original screens into the existing photographic device templates.

No generated interfaces or devices. Gallery files remain untouched; the hero
shows the top of long screens at the device's native display proportions.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'src' / 'showcases' / 'references'
DEVICES = ROOT / 'scripts' / 'showcase-sources' / 'devices'
SIZE = (1800, 1120)
phone_plate=Image.open(DEVICES/'iphone-15-pro.png').convert('RGBA')
phone_plate.thumbnail((900,1800),Image.Resampling.LANCZOS)
phone_plate.save(MEDIA/'phone-hardware.webp',quality=94,method=6)

def screen(group, key):
    return Image.open(MEDIA / group / (key + '.webp')).convert('RGBA')

def device(image, mobile=False):
    name = 'iphone-15-pro.png' if mobile else 'macbook-pro-14.png'
    bounds = (120, 120, 1179, 2556) if mobile else (459, 299, 3024, 1964)
    plate = Image.open(DEVICES / name).convert('RGBA')
    x, y, width, height = bounds
    # Fit the width; crop only the hero preview, never the source gallery file.
    fitted = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
    display = Image.new('RGBA', (width, height), '#f5f7fa')
    display.alpha_composite(fitted, (0, 0))
    if mobile:
        mask = Image.new('L', display.size)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, width-1, height-1), round(width*.08), fill=255)
        display.putalpha(mask)
    result = Image.new('RGBA', plate.size)
    result.alpha_composite(display, (x, y))
    result.alpha_composite(plate)
    return result

def place(canvas, image, box):
    image = ImageOps.contain(image, (box[2], box[3]), Image.Resampling.LANCZOS)
    x = box[0] + (box[2]-image.width)//2
    y = box[1] + (box[3]-image.height)//2
    shadow = Image.new('RGBA', canvas.size)
    shadow.alpha_composite(Image.new('RGBA', image.size, (0,0,0,110)), (x+8,y+22))
    shadow.putalpha(shadow.getchannel('A').filter(ImageFilter.GaussianBlur(24)))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(image, (x,y))

def canvas():
    return Image.new('RGBA', SIZE, (0,0,0,0))

for key, group, image in [
    ('core-banking','core-banking','cbs-dash'),
    ('internet-banking','internet-banking','net-dash'),
    ('corporate-banking','corporate-banking','corp-dash'),
]:
    output=canvas()
    place(output, device(screen(group,image)), (35,0,1730,1080))
    output.save(MEDIA/(key+'-hero.webp'), quality=91, method=6)

output=canvas()
place(output,device(screen('mobile-banking','m-quick'),True),(245,95,580,935))
place(output,device(screen('mobile-banking','m-home'),True),(945,0,610,1070))
output.save(MEDIA/'mobile-banking-hero.webp',quality=92,method=6)

output=canvas()
for image,box in [('g-post1',(90,130,480,880)),('g-kerala',(625,15,550,1010)),('g-post7',(1230,130,480,880))]:
    picture=screen('banners-posters',image)
    picture=ImageOps.expand(picture,border=12,fill='#252e25')
    place(output,picture,box)
output.save(MEDIA/'banners-posters-hero.webp',quality=92,method=6)
print('Rendered five static hero compositions with original project artwork.')
