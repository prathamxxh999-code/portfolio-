"""Composite exact original interfaces into existing front-facing hardware."""
from pathlib import Path
import json
import shutil
from PIL import Image, ImageOps, ImageDraw, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'src/showcases/case-media'
WEB=ROOT/'src/showcases/websites'
DEV=ROOT/'scripts/showcase-sources/devices'
SOURCE=Path('C:/Users/Prathamesh Phadatare/Documents/Codex/2026-10-29/as-x20/outputs')
OUT.mkdir(parents=True,exist_ok=True)
WEB.mkdir(exist_ok=True)

def device(image,mobile=False):
    hardware=Image.open(DEV/('iphone-15-pro.png' if mobile else 'macbook-pro-14.png')).convert('RGBA')
    x,y,w,h=(120,120,1179,2556) if mobile else (459,299,3024,1964)
    image=image.convert('RGBA')
    fitted=image.resize((w,round(image.height*w/image.width)),Image.Resampling.LANCZOS)
    display=Image.new('RGBA',(w,h),'#0c1310')
    display.alpha_composite(fitted,(0,0))
    if mobile:
        mask=Image.new('L',(w,h))
        ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),int(w*.08),fill=255)
        display.putalpha(mask)
    result=Image.new('RGBA',hardware.size)
    result.alpha_composite(display,(x,y))
    result.alpha_composite(hardware)
    return result

def place(canvas,image,box):
    image=ImageOps.contain(image,(box[2],box[3]),Image.Resampling.LANCZOS)
    x=box[0]+(box[2]-image.width)//2
    y=box[1]+(box[3]-image.height)//2
    alpha=Image.new('L',canvas.size)
    alpha.paste(image.getchannel('A'),(x+5,y+16))
    shadow=Image.new('RGBA',canvas.size)
    shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(17)))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(image,(x,y))

def compose(image,path,mobile=False,artwork=False):
    canvas=Image.new('RGBA',(1800,1120))
    if artwork:
        mounted=ImageOps.expand(image.convert('RGBA'),border=12,fill='#263021')
        place(canvas,mounted,(80,30,1640,1050))
    else:
        place(canvas,device(image,mobile),(35,25,1730,1060))
    canvas.save(path,quality=90,method=4)

for key,name in [('home','manoeuvre-navy-preview.png'),('about','about-hero-cta-preview.png'),('projects','project-grid-with-company-logos.png')]:
    Image.open(SOURCE/name).convert('RGB').save(WEB/f'manoeuvre-{key}.webp',quality=93,method=4)

projects=json.loads((ROOT/'scripts/showcase-sources/case-system/media-manifest.json').read_text(encoding='utf8'))['projects']
for p in projects:
    if p['processOnly']:continue
    for s in p['screens']:
        source=ROOT/'src'/s['src'].removeprefix('./')
        compose(Image.open(source),OUT/(s['key']+'.webp'),p['mobile'],p['artwork'])
    for i,s in enumerate(p['chapters']):
        target=OUT/f"chapter-{p['id']}-{i}.webp"
        if s.get('detail'):
            image=Image.open(ROOT/'src'/s['src'].removeprefix('./'))
            # A labelled detail crop of the same original; no new screen invented.
            if image.height>image.width:
                top=max(0,image.height-min(image.height,round(image.width*1.5)))
                image=image.crop((0,top,image.width,image.height))
            else:
                image=image.crop((round(image.width*.16),round(image.height*.16),image.width,image.height))
            compose(image,target,p['mobile'],p['artwork'])
        else:
            shutil.copyfile(OUT/(s['key']+'.webp'),target)
    if p['key'] in ['cashbell','crm','merchant','idsspl','manoeuvre']:
        first=Image.open(ROOT/'src'/p['screens'][0]['src'].removeprefix('./'))
        if p['mobile']:
            second=Image.open(ROOT/'src'/p['screens'][1]['src'].removeprefix('./'))
            canvas=Image.new('RGBA',(1800,1120))
            place(canvas,device(second,True),(170,100,660,955))
            place(canvas,device(first,True),(930,15,660,1060))
            canvas.save(OUT/(p['key']+'-hero.webp'),quality=91,method=4)
        else:compose(first,OUT/(p['key']+'-hero.webp'))
    print('Prepared front-facing original media: '+p['key'],flush=True)
