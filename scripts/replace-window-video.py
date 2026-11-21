"""Replace the window footage over the approved ambient room at natural speed.

The existing room is an intentional looping background. Preserve that approved
motion and mask the new sky behind its indoor foreground instead of rerendering
all the room's motion for every window-video revision.
"""
import argparse
import json
import subprocess
from pathlib import Path

from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--ffmpeg', required=True)
parser.add_argument('--output-stem', default='room-ambient')
args = parser.parse_args()
if not args.output_stem.replace('-','').replace('_','').isalnum():
    raise ValueError('Use a simple output filename stem')
root = Path(__file__).resolve().parent.parent
sources = root / 'scripts/showcase-sources/retro-intro'
output = root / 'src/intro'
config = json.loads((sources / 'window/window-video.json').read_text())
base = sources / 'window/room-ambient-starry-base.mp4'
if not base.is_file():
    raise FileNotFoundError('The approved ambient room source is required')
x,y,right,bottom = config['box']
width,height = right-x,bottom-y
cx,cy = config['crop_center']
graph = (
    f'[1:v]fps=30,scale={width}:{height}:force_original_aspect_ratio=increase:flags=lanczos,'
    f'crop={width}:{height}:(iw-ow)*{cx}:(ih-oh)*{cy},setsar=1,format=rgb24[sky];'
    '[2:v]format=gray,setsar=1[mask];'
    '[sky][mask]alphamerge=shortest=1[window];'
    f'[0:v][window]overlay={x}:{y}:shortest=1:format=auto,format=yuv420p[v]'
)
destination = output / f'{args.output_stem}.mp4'
pending = output / f'{args.output_stem}.pending.mp4'
subprocess.run([
    args.ffmpeg,'-hide_banner','-v','error','-y','-filter_complex_threads','1',
    '-stream_loop','-1','-i',str(base),
    '-i',str(sources / config['source']),
    '-loop','1','-i',str(sources / config['mask']),
    '-filter_complex',graph,'-map','[v]','-an','-frames:v',str(config['frames']),
    '-c:v','libx264','-threads','2','-preset','fast','-crf','19',
    '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',
    '-movflags','+faststart',str(pending),
],check=True)
pending.replace(destination)
mobile = output / f'{args.output_stem}-mobile.pending.mp4'
subprocess.run([
    args.ffmpeg,'-v','error','-y','-i',str(destination),'-an',
    '-vf','scale=960:540','-c:v','libx264','-threads','2','-preset','fast',
    '-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',str(mobile),
],check=True)
mobile.replace(output / f'{args.output_stem}-mobile.mp4')
Image.open(sources / 'room-landscape-window-video.png').save(output / 'room-poster.webp',quality=93)
metadata = json.loads((sources / 'room-render.json').read_text())
metadata.update({
    'frames':config['frames'],'duration':config['duration'],'window':config,
    'method':'FFmpeg masked window replacement over the approved looping ambient room; both sources at 1x',
    'ambient_source':'window/room-ambient-starry-base.mp4',
    'file':destination.name,'mobile_file':f'{args.output_stem}-mobile.mp4',
})
(sources / 'room-render.json').write_text(json.dumps(metadata,indent=2))
print(json.dumps({'duration':config['duration'],'frames':config['frames'],'audio':False,'file':str(destination)}))
