"""Export the selected no-hand charcoal folder for cards and desktop icons."""
import argparse
import shutil
from pathlib import Path
from PIL import Image, ImageDraw

parser=argparse.ArgumentParser();parser.add_argument('source');args=parser.parse_args()
root=Path(__file__).resolve().parent.parent
sources=root/'scripts/showcase-sources/project-folders';sources.mkdir(exist_ok=True)
shutil.copyfile(args.source,sources/'folder-no-hand-source.png')
image=Image.open(args.source).convert('RGBA')
mask=image.getchannel('A').point(lambda value:255 if value>12 else 0)
image=image.crop(mask.getbbox())
image.thumbnail((1152,1000),Image.Resampling.LANCZOS)
image.save(root/'src/intro/folder-charcoal.webp',quality=94,method=6)
image.thumbnail((112,88),Image.Resampling.LANCZOS)
image.save(root/'src/intro/folder-icon.png',optimize=True)
cursor=Image.new('RGBA',(32,32))
draw=ImageDraw.Draw(cursor)
draw.polygon([(2,1),(2,25),(7,20),(11,29),(16,27),(12,18),(21,18)],fill='#000000')
draw.polygon([(3,4),(3,22),(7,18),(12,27),(14,26),(10,17),(18,17)],fill='#ffffff')
cursor.save(root/'src/intro/desktop-arrow.png',optimize=True)
print('Exported charcoal folder card and desktop icon with transparent alpha.')
