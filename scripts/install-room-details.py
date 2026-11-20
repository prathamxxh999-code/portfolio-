"""Install localized tower/collectible edits while retaining the original PC plate."""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / 'scripts/showcase-sources/retro-intro'
original = Image.open(SOURCES / 'room-landscape-framed.png').convert('RGB')
final_source = SOURCES / 'decor/room-final-imagegen-source.png'
result = (ImageOps.fit(Image.open(final_source).convert('RGB'), original.size,
                       method=Image.Resampling.LANCZOS) if final_source.exists()
          else original.copy())
edits = [
    ('tower/room-tower-imagegen-source.png', (1232, 317, 1512, 793)),
    ('collectibles/room-collectibles-imagegen-source.png', (1580, 282, 1919, 551)),
    ('window/room-large-window-imagegen-source.png', (0, 0, 698, 904)),
    ('window/room-large-window-imagegen-source.png', (1540, 278, 1919, 555)),
    ('window/room-large-window-imagegen-source.png', (1480, 568, 1655, 808)),
]
installed = ['decor/room-final-imagegen-source.png'] if final_source.exists() else []
for relative, region in ([] if final_source.exists() else edits):
    path = SOURCES / relative
    if not path.exists():
        continue
    edited = ImageOps.fit(Image.open(path).convert('RGB'), original.size,
                         method=Image.Resampling.LANCZOS)
    mask = Image.new('L', original.size)
    ImageDraw.Draw(mask).rectangle(region, fill=255)
    result = Image.composite(edited, result, mask.filter(ImageFilter.GaussianBlur(3)))
    installed.append(relative)

protected = [(704, 267, 1227, 765), (698, 16, 1239, 267)]
protection = Image.new('L', original.size)
protection_draw = ImageDraw.Draw(protection)
for box in protected:
    protection_draw.rectangle(box, fill=255)
# The real keyboard and computer stay registered to the live HTML screen.
protection_draw.polygon([(706,774),(1198,775),(1270,884),(642,884)], fill=255)
# Preserve the supplied prints, allowing the tower statue to overlap them.
prints = Image.new('L', original.size)
print_draw = ImageDraw.Draw(prints)
for box in [(1240,34,1426,314),(1420,5,1656,326)]:
    print_draw.rectangle(box, fill=255)
print_draw.rectangle((1335,210,1505,348), fill=0)
protection = ImageChops.lighter(protection, prints)
has_large_window = (SOURCES / 'window/room-large-window-imagegen-source.png').exists()
if not has_large_window:
    ImageDraw.Draw(protection).rectangle((292,14,474,292), fill=255)
result.paste(original, (0,0), protection)
locked = np.asarray(protection) == 255
assert np.array_equal(np.asarray(result)[locked], np.asarray(original)[locked])

name = ('room-landscape-night-studio.png' if has_large_window else
        'room-landscape-collectibles.png' if len(installed) > 1 else 'room-landscape-tower.png')
result.save(SOURCES / name)
(SOURCES / 'room-details-install.json').write_text(json.dumps({
    'method': 'selected built-in imagegen room; original live PC, keyboard, board and print plates preserved',
    'installed': installed, 'regions': [region for _, region in edits],
    'protected': protected, 'output': name,
}, indent=2))
print(f'Installed {len(installed)} room detail edits: {name}')
