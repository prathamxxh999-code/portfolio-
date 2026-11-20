"""Make a silent, steady ambient loop from the user's actual computer video."""
import argparse
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--ffmpeg', required=True)
args = parser.parse_args()
source = ROOT / 'scripts/showcase-sources/retro-intro/reference-computer.mp4'
output = ROOT / 'src/intro'
output.mkdir(exist_ok=True)

native_width, native_height, rate, frame_count = 720, 1280, 24, 24
decoded = subprocess.run([args.ffmpeg, '-v', 'error', '-i', str(source), '-frames:v', str(frame_count),
    '-vf', 'fps=24', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], check=True, capture_output=True).stdout
raw = np.frombuffer(decoded, np.uint8).reshape(frame_count, native_height, native_width, 3)
# Glass corners measured in the supplied clip. Align the gradual source push
# back to its opening position before making a quiet ambient loop.
first = np.array([[150,405], [407,420], [408,626], [149,630]], dtype=float)
last = np.array([[131,397], [436,412], [436,648], [131,658]], dtype=float)

def perspective(destination, current):
    rows, values = [], []
    for (x, y), (u, v) in zip(destination, current):
        rows += [[x,y,1,0,0,0,-u*x,-u*y], [0,0,0,x,y,1,-v*x,-v*y]]
        values += [u,v]
    return np.linalg.solve(np.array(rows), np.array(values)).tolist()

yy, xx = np.mgrid[0:native_height, 0:native_width]
distance = np.clip(((xx-279)/164)**2 + ((yy-517)/140)**2, 0, 1)
rng = np.random.default_rng(20261120)
grain = rng.normal(0, .7, (native_height, native_width))
glass = np.stack([7+(1-distance)*5+grain, 14+(1-distance)*9+grain, 10+(1-distance)*5+grain], axis=2)
glass = Image.fromarray(np.clip(glass,0,255).astype(np.uint8))
mask = Image.new('L', (native_width,native_height))
ImageDraw.Draw(mask).polygon([(155,411),(402,425),(403,620),(155,623)], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(2))
steady = []
for index, frame in enumerate(raw):
    current = first + (last-first) * index / (frame_count-1)
    aligned = Image.fromarray(frame).transform((native_width,native_height), Image.Transform.PERSPECTIVE,
        perspective(first,current), Image.Resampling.BICUBIC)
    aligned.paste(glass, (0,0), mask)
    steady.append(aligned)

# Preserve the original portrait footage's proportions. Its own dark forest
# colors form a subdued widescreen surround; no generated environment is used.
back = steady[0].resize((1920,3413), Image.Resampling.LANCZOS)
back = back.crop((0,1166,1920,2246)).filter(ImageFilter.GaussianBlur(65))
back = ImageEnhance.Brightness(back).enhance(.24)
edge = np.minimum(np.arange(720), np.arange(720)[::-1]) / 58
edge = np.clip(edge,0,1); edge = edge*edge*(3-2*edge)
feather = Image.fromarray(np.broadcast_to((edge*255).astype('uint8'), (1280,720)).copy())

def wide(frame):
    plate = back.copy()
    plate.paste(frame, (600,-100), feather)
    return plate

sequence = steady[:-1] + steady[:0:-1]
wide(steady[0]).save(output/'retro-reference-poster.webp', quality=91)
destination = output/'retro-reference-loop.mp4'
command = [args.ffmpeg,'-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','1920x1080','-r',str(rate),
    '-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',
    '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',str(destination)]
encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
for frame in sequence:
    encoder.stdin.write(wide(frame).tobytes())
encoder.stdin.close()
if encoder.wait() != 0:
    raise RuntimeError('Reference-loop encoding failed')
metadata = {'source':'reference-computer.mp4','source_range_seconds':[0,1],
    'fps':rate,'frames':len(sequence),'duration_seconds':len(sequence)/rate,
    'size':[1920,1080],'audio':False,'loop':'forward and reverse ambient loop',
    'portrait_position':[600,-100],'glass_corners':first.tolist(),
    'notes':'Original source retained. Camera push aligned to first frame. Original countdown cleared. No generated background.'}
(ROOT/'scripts/showcase-sources/retro-intro/reference-loop.json').write_text(json.dumps(metadata,indent=2))
print(json.dumps({'file':str(destination),'frames':len(sequence),'duration':len(sequence)/rate,'bytes':destination.stat().st_size}))
