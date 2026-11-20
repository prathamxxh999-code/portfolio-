"""Export screen assets from the room master and the unchanged public PDF."""
from pathlib import Path
import subprocess
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parent.parent
output=ROOT/'src/intro'
room_source=ROOT/'scripts/showcase-sources/retro-intro/room-landscape-whiteboard.png'
if not room_source.exists():room_source=ROOT/'scripts/showcase-sources/retro-intro/room-landscape-source.png'
room=ImageOps.fit(Image.open(room_source).convert('RGB'),(1920,1080),method=Image.Resampling.LANCZOS)
# Only the inner bevel: 18px sides, 14px top and 24px bottom. Exclude the
# monitor's outer casing and the broad lower controls panel after expansion.
room.crop((720,286,1211,648)).save(output/'room-bezel.webp',quality=95)
scratch=ROOT/'../../tmp/pdfs/pc-resume'
scratch.mkdir(parents=True,exist_ok=True)
subprocess.run(['pdftoppm','-scale-to-x','1240','-scale-to-y','-1','-png',str(ROOT/'src/Prathamesh_Phadatare_Resume.pdf'),str(scratch/'page')],check=True)
for index,path in enumerate(sorted(scratch.glob('page-*.png')),1):
    image=Image.open(path).convert('RGB')
    image.save(output/f'resume-page-{index}.webp',quality=95)
    print(f'Resume page {index}: {image.size}')
room.crop((20,610,230,765)).save(scratch/'tape-reels-detail.png')
