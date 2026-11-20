"""Install the selected generated frames without changing the PC or whiteboard."""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / 'scripts/showcase-sources/retro-intro'
original = Image.open(SOURCES / 'room-landscape-whiteboard.png').convert('RGB')
generated = ImageOps.fit(
    Image.open(SOURCES / 'posters/room-frames-imagegen-source.png').convert('RGB'),
    original.size, method=Image.Resampling.LANCZOS,
)
regions = [(292, 14, 474, 292), (1240, 34, 1426, 314), (1420, 5, 1656, 326)]
mask = Image.new('L', original.size)
draw = ImageDraw.Draw(mask)
for region in regions:
    draw.rectangle(region, fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(3))
result = Image.composite(generated, original, mask)

# These exact original pixels define the live screen and its fixed hardware.
protected = [(704, 267, 1227, 690), (698, 16, 1239, 267)]
for box in protected:
    result.paste(original.crop(box), box[:2])
    left, top, right, bottom = box
    assert np.array_equal(np.asarray(result)[top:bottom, left:right],
                          np.asarray(original)[top:bottom, left:right])

result.save(SOURCES / 'room-landscape-framed.png')
(SOURCES / 'posters/frame-install.json').write_text(json.dumps({
    'method': 'built-in imagegen frame edit, installed only in the three wall regions',
    'regions': regions, 'protected': protected,
    'placement': 'small panda on the left; raccoon and larger cat staggered on the right',
    'output': 'room-landscape-framed.png',
}, indent=2))
print('Installed scattered wall frames; original monitor and whiteboard pixels preserved.')
