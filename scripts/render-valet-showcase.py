from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance
import json,math
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'scripts/showcase-sources/valet/screens';PUBLIC=ROOT/'src/showcases'
PLATE=Image.open(ROOT/'scripts/showcase-sources/devices/iphone-15-pro.png').convert('RGBA').resize((710,1399),Image.Resampling.LANCZOS)
LEFT,TOP,SW,SH=60,60,590,1279
names=['home','entry','entry-vip','parking-details','parking-progress','parked','retrieval-progress','retrieval-details','retrieval-queue','queue-details','guest-pickup','pickup-status','handover','handover-submit','driver-profile','account-settings','analytics']
PUBLIC.mkdir(exist_ok=True);(PUBLIC/'screens').mkdir(exist_ok=True)
for name in names:
 im=Image.open(SOURCE/(name+'.png')).convert('RGB')
 im.save(PUBLIC/'screens'/('valet-'+name+'.png'))
 im.save(PUBLIC/('valet-'+name+'.webp'),lossless=True,method=6)
PLATE.save(PUBLIC/'valet-phone-hardware.webp',quality=94,method=6)
def phone(name):
 ui=Image.open(SOURCE/(name+'.png')).convert('RGBA')
 # Uniform width scaling and a real phone viewport. Full-length originals remain public.
 h=round(ui.height*SW/ui.width);fitted=ui.resize((SW,h),Image.Resampling.LANCZOS)
 display=Image.new('RGBA',(SW,SH),'white');display.alpha_composite(fitted,(0,0))
 mask=Image.new('L',(SW,SH));ImageDraw.Draw(mask).rounded_rectangle((0,0,SW-1,SH-1),50,fill=255);display.putalpha(mask)
 out=Image.new('RGBA',PLATE.size);out.alpha_composite(display,(LEFT,TOP));out.alpha_composite(PLATE);return out
# Three selected screens on real phone hardware in the original generated valet plate.
from PIL import ImageOps
background=Image.open(ROOT/'scripts/showcase-sources/valet/valet-background.png').convert('RGB')
def tilted_phone(name,height,angles):
 # Perspective-project the existing photographic hardware and its exact UI.
 # No generated phone or screen is introduced by this transformation.
 im=phone(name);w=round(height*im.width/im.height);h=height
 im=im.resize((w,h),Image.Resampling.LANCZOS)
 ax,ay,az=[math.radians(n) for n in angles]
 rx=np.array([[1,0,0],[0,math.cos(ax),-math.sin(ax)],[0,math.sin(ax),math.cos(ax)]])
 ry=np.array([[math.cos(ay),0,math.sin(ay)],[0,1,0],[-math.sin(ay),0,math.cos(ay)]])
 rz=np.array([[math.cos(az),-math.sin(az),0],[math.sin(az),math.cos(az),0],[0,0,1]])
 corners=np.array([[-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0]])@(rz@ry@rx).T
 perspective=2200/(2200+corners[:,2]);quad=corners[:,:2]*perspective[:,None]
 quad-=quad.min(axis=0);quad+=24
 extent=np.ceil(quad.max(axis=0)+24).astype(int)
 equations=[];values=[]
 for (x,y),(u,v) in zip(quad,[(0,0),(w,0),(w,h),(0,h)]):
  equations.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]])
  values.extend([u,v])
 coeff=np.linalg.solve(np.array(equations),np.array(values))
 warped=im.transform(tuple(extent),Image.Transform.PERSPECTIVE,coeff,Image.Resampling.BICUBIC)
 # A narrow titanium side follows the same silhouette and projection.
 depth=Image.new('RGBA',(extent[0]+14,extent[1]+10))
 for offset in range(10,0,-1):
  edge=Image.new('RGBA',tuple(extent),(34+offset*2,36+offset*2,33+offset*2,255))
  edge.putalpha(warped.getchannel('A'));depth.alpha_composite(edge,(offset,round(offset*.45)))
 depth.alpha_composite(warped,(0,0))
 return depth

def composition(size,positions):
 W,H=size;hero=ImageOps.fit(background,size,Image.Resampling.LANCZOS,centering=(.5,.53)).convert('RGBA')
 # Darken only the typography side, keeping the scene continuous behind the copy.
 if W/H>1.8:
  xx=np.arange(W)[None,:];alpha=np.tile(np.clip((1-xx/(W*.53))*205,0,205),(H,1)).astype('uint8')
  wash=Image.new('RGBA',size,(5,11,17,0));wash.putalpha(Image.fromarray(alpha));hero.alpha_composite(wash)
 for index,(name,cx,cy,height,angles) in enumerate(positions):
  ph=tilted_phone(name,height,angles)
  if index<2:ph=ImageEnhance.Brightness(ph).enhance(.88)
  xx,yy=round(cx-ph.width/2),round(cy-ph.height/2)
  shadow=Image.new('RGBA',size)
  silhouette=Image.new('RGBA',ph.size,(0,0,0,0));silhouette.putalpha(ph.getchannel('A').point(lambda a:round(a*.45)))
  shadow.alpha_composite(silhouette,(xx+8,yy+24));shadow=shadow.filter(ImageFilter.GaussianBlur(22));hero.alpha_composite(shadow)
  hero.alpha_composite(ph,(xx,yy))
 return hero.convert('RGB')
hero=composition((2400,1200),[('parking-progress',1300,710,790,(18,24,-24)),('guest-pickup',1900,700,760,(12,-24,-12)),('home',1650,590,990,(12,-18,20))])
hero.save(PUBLIC/'valet-hero.webp',quality=94,method=6)
mobile=composition((1600,1350),[('parking-progress',485,855,850,(18,24,-24)),('guest-pickup',1125,820,810,(12,-24,-12)),('home',800,670,1080,(12,-18,20))])
mobile.save(PUBLIC/'valet-hero-mobile.webp',quality=94,method=6)
(ROOT/'scripts/showcase-sources/valet/manifest.json').write_text(json.dumps({'fileKey':'EHTtPQR6gj7jrmAtzUdiNZ','screens':names,'hardware':'Same photographic iPhone 15 Pro template used for CashBell. See ../devices/SOURCES.md.','source':'Original Figma frame exports. Configured PDF exports rasterized at 2x with pdfplumber; home/account PNGs exported at native size.','hero':'2400x1200 desktop / 1600x1350 mobile static hero, three exact screens on photographic hardware in a valet arrival environment. No video. Long screen content is scrollable in the gallery; full PNGs linked.'},indent=2))
print('Rendered',len(names),'screens, native hardware, and static hero:',(PUBLIC/'valet-hero.webp').stat().st_size)
