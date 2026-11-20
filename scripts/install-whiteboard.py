"""Install the generated board locally without changing any original PC pixels."""
import argparse
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

parser=argparse.ArgumentParser()
parser.add_argument('generated_image')
args=parser.parse_args()
ROOT=Path(__file__).resolve().parent.parent
sources=ROOT/'scripts/showcase-sources/retro-intro'
original=ImageOps.fit(Image.open(sources/'room-landscape-source.png').convert('RGB'),(1920,1080),method=Image.Resampling.LANCZOS)
shutil.copyfile(args.generated_image,sources/'whiteboard-imagegen-source.png')
edited=ImageOps.fit(Image.open(args.generated_image).convert('RGB'),original.size,method=Image.Resampling.LANCZOS)
mask=Image.new('L',original.size)
ImageDraw.Draw(mask).rectangle((698,16,1245,334),fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(3))
result=Image.composite(edited,original,mask)
# The original foreground monitor physically occludes the board's lower edge.
pc=(704,267,1227,690)
result.paste(original.crop(pc),pc[:2])
assert np.array_equal(np.asarray(result)[267:690,704:1227],np.asarray(original)[267:690,704:1227])
result.save(sources/'room-landscape-whiteboard.png')
(sources/'whiteboard-edit.json').write_text(json.dumps({'method':'built-in imagegen board edit composited only onto the upper wall','wall_region':[698,16,1245,334],'original_pc_preserved':list(pc),'quote':'Wake up to reality! Nothing ever goes as planned in this world. The longer you live, the more you realize that, in this reality only pain, suffering, and futility exist.','handwriting':'small fine-tip marker, brainstorm arrows, underlines and sticky notes','output':'room-landscape-whiteboard.png'},indent=2))
print('Installed whiteboard; original monitor pixels preserved.')
