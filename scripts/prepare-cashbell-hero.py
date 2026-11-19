"""Extend the approved film's studio lighting beyond its frame for the web hero.

The original movie and UI remain unchanged. The source coordinates match
render-cashbell-motion.py: a 1440 x 1080 stage, extended left and vertically.
CSS anchors this backdrop to the video's exact display size and centre.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
W,H=1440,1080
LEFT,RIGHT,TOP,HEIGHT=874,640,960,3000
y,x=np.mgrid[-TOP:HEIGHT-TOP,-LEFT:W+RIGHT].astype(np.float32)
pool=np.exp(-(((x-W*.55)/(W*.55))**2+((y-H*.46)/(H*.72))**2)*2)
floor=np.exp(-(((x-W*.5)/(W*.55))**2+((y-H*.87)/(H*.18))**2)*2)
# The green pool varies by five levels through the film's six sections.
# Its midpoint keeps the background join within about one level at frame edges.
rgb=np.stack([9+pool*13+floor*4,14+pool*27.5+floor*9,12+pool*15+floor*6],axis=-1)
target=ROOT/'src/showcases/cashbell-hero-backdrop.webp'
Image.fromarray(np.uint8(rgb)).save(target,lossless=True,method=6)
print(f'Created matching studio backdrop: {target.name} ({target.stat().st_size} bytes)')
