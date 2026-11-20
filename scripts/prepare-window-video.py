"""Prepare the supplied outside footage and the room window's occlusion matte."""
import argparse
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument('--ffmpeg', required=True)
parser.add_argument('--source', default='outside-reference.mp4', help='File inside the window source directory')
parser.add_argument('--crop-y', type=float, default=.3)
parser.add_argument('--description', default='User-supplied outside video, behind room foreground')
args = parser.parse_args()
ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / 'scripts/showcase-sources/retro-intro'
WINDOW = SOURCES / 'window'
source = (WINDOW / args.source).resolve()
if source.parent != WINDOW.resolve() or not source.is_file():
    raise ValueError('Choose an existing video inside the window source directory')
if not 0 <= args.crop_y <= 1:
    raise ValueError('crop-y must be between zero and one')
probe = subprocess.run([args.ffmpeg, '-v', 'error', '-i', str(source), '-an',
                        '-vf', 'fps=30', '-progress', 'pipe:1', '-f', 'null', '-'],
                       capture_output=True, text=True, check=True)
frames = int(re.findall(r'frame=(\d+)', probe.stdout)[-1])
subprocess.run([args.ffmpeg, '-v', 'error', '-y', '-i', str(source), '-frames:v', '1',
                str(WINDOW / 'outside-first-frame.png')], check=True)

room = Image.open(SOURCES / 'room-landscape-night-studio.png').convert('RGB')
box = (58, 61, 644, 647)
left, top, right, bottom = box
mask = Image.new('L', room.size)
draw = ImageDraw.Draw(mask)
draw.polygon([(59,63),(278,62),(278,645),(58,645)], fill=255)
draw.polygon([(305,62),(642,62),(642,645),(305,646)], fill=255)

# Keep individual warm indoor leaves in front of the neutral night footage.
# A soft chroma matte avoids the old frozen triangular fern pocket.
pixels = np.asarray(room, dtype=np.float32)
maximum = np.maximum(pixels[...,0], pixels[...,1])
chroma = (maximum-pixels[...,2])/np.maximum(1,maximum)
yy,xx = np.mgrid[0:room.height,0:room.width]
zones = ((xx<285)&(yy<275)) | ((xx<158)&(yy>=260)&(yy<620))
alpha = np.clip((chroma-.08)/.22,0,1)*np.clip((maximum-12)/18,0,1)*zones
foreground = Image.fromarray((alpha*255).astype(np.uint8))
foreground = foreground.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.5))
foreground.save(WINDOW / 'interior-foreground-mask.png')
mask = ImageChops.subtract(mask, foreground)
draw = ImageDraw.Draw(mask)
draw.ellipse((240,525,360,648), fill=0)  # globe and its meridian ring
draw.rectangle((276,640,335,675), fill=0)
draw.rectangle((431,572,644,675), fill=0)  # radio and its feet
draw.rectangle((154,574,220,675), fill=0)  # books on the sill
draw.polygon([(61,580),(146,584),(143,650),(73,650)], fill=0)  # plant pot
mask = mask.filter(ImageFilter.GaussianBlur(.45)).crop(box)
mask.save(WINDOW / 'window-glass-mask.png')

first = ImageOps.fit(Image.open(WINDOW / 'outside-first-frame.png').convert('RGB'),
                     mask.size, method=Image.Resampling.LANCZOS, centering=(.5,args.crop_y))
room.paste(first, box[:2], mask)
room.save(SOURCES / 'room-landscape-window-video.png')
config = {'source':f'window/{source.name}', 'box':list(box), 'frames':frames,
          'fps':30, 'duration':frames/30, 'crop_center':[.5,args.crop_y],
          'mask':'window/window-glass-mask.png', 'audio':False,
          'playback_speed':1, 'description':args.description}
(WINDOW / 'window-video.json').write_text(json.dumps(config, indent=2))
print(json.dumps({'frames':frames,'duration':frames/30,'window':box,'speed':1}))
