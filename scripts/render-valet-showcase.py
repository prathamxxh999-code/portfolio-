from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
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
# Two straight phone mockups with their original, undistorted screen proportions.
from PIL import ImageOps
background=Image.open(ROOT/'scripts/showcase-sources/valet/valet-background.png').convert('RGB')
def composition(size,positions):
 W,H=size;hero=ImageOps.fit(background,size,Image.Resampling.LANCZOS,centering=(.5,.53)).convert('RGBA')
 # Darken only the typography side, keeping the scene continuous behind the copy.
 if W/H>1.8:
  xx=np.arange(W)[None,:];alpha=np.tile(np.clip((1-xx/(W*.53))*205,0,205),(H,1)).astype('uint8')
  wash=Image.new('RGBA',size,(5,11,17,0));wash.putalpha(Image.fromarray(alpha));hero.alpha_composite(wash)
 for name,cx,base,height in positions:
  ph=phone(name)
  ph=ph.resize((round(height*ph.width/ph.height),height),Image.Resampling.LANCZOS)
  xx,yy=round(cx-ph.width/2),round(base-ph.height)
  shadow=Image.new('RGBA',size)
  silhouette=Image.new('RGBA',ph.size,(0,0,0,0));silhouette.putalpha(ph.getchannel('A').point(lambda a:round(a*.45)))
  shadow.alpha_composite(silhouette,(xx+8,yy+24));shadow=shadow.filter(ImageFilter.GaussianBlur(22));hero.alpha_composite(shadow)
  hero.alpha_composite(ph,(xx,yy))
 return hero.convert('RGB')
desktop_phones=[('parking-progress',1280,1100,840),('home',1770,1100,920)]
mobile_phones=[('parking-progress',490,1230,970),('home',1040,1230,1090)]
hero=composition((2400,1200),desktop_phones)
hero.save(PUBLIC/'valet-hero-straight.webp',quality=94,method=6)
mobile=composition((1600,1350),mobile_phones)
mobile.save(PUBLIC/'valet-hero-straight-mobile.webp',quality=94,method=6)
(ROOT/'scripts/showcase-sources/valet/manifest.json').write_text(json.dumps({'fileKey':'EHTtPQR6gj7jrmAtzUdiNZ','screens':names,'hardware':'Same photographic iPhone 15 Pro template used for CashBell. See ../devices/SOURCES.md.','source':'Original Figma frame exports. Configured PDF exports rasterized at 2x with pdfplumber; home/account PNGs exported at native size.','hero':'2400x1200 desktop / 1600x1350 mobile static hero, exactly two original screens in straight, front-facing photographic phone plates. Uniform scaling only: no rotation, perspective, generated hardware or screen distortion. Parking arrival background retained. No video.','hero_devices':{'desktop':desktop_phones,'mobile':mobile_phones}},indent=2))
print('Rendered',len(names),'screens, native hardware, and two-phone hero:',(PUBLIC/'valet-hero-straight.webp').stat().st_size)
