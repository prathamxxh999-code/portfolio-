"""PaySphere: a silent 26.35-second product film, 1440 x 1080 at 60 fps.

Original UI captures, actual demonstrated states, and the photographed CRM
monitor scene. A continuous camera travels between sections and returns to
the opening photograph for the loop. No synthetic device or UI assets.
"""
import argparse
from functools import lru_cache
import json
import math
import subprocess

from PIL import Image,ImageDraw,ImageFilter,ImageOps
from merchant_media import ROOT,SOURCE,OUTPUT,BG,INK,MUTE,ACCENT,shot,font,photographed_monitor,prepare_assets

W,H,FPS,FRAMES=1440,1080,60,1581
STARTS=[.8,4.3,7.4,10.4,14.2,18.3,21.7,24.4,25.2]
SPEC=[
    ('Merchant operations,\nconnected.','COMMAND CENTRE','overview',None),
    ('Know every merchant.\nKeep the context.','MERCHANT NETWORK','merchant-directory','merchant-profile'),
    ('Every payment.\nA visible trail.','PAYMENT OPERATIONS','payments','payment-detail'),
    ('Evidence before\nthe next attempt.','SETTLEMENT SAFEGUARDS','payout-detail','payout-evidence'),
    ('One profile.\nEvery touchpoint.','PAYMENT PRODUCT SETUP','merchant-products','products-selected'),
    ('Independent checks.\nClear ownership.','MAKER & CHECKER REVIEW','approval-request','approval-review'),
    ('Context for every\nnext step.','OPERATIONS COPILOT','copilot-welcome','copilot-trace'),
]


def ease(value):
    t=max(0,min(1,value));return t*t*t*(t*(t*6-15)+10)


def paste(dst,image,xy,alpha=1):
    if alpha<=0:return
    if alpha<1:
        image=image.copy();image.putalpha(image.getchannel('A').point(lambda n:round(n*alpha)))
    dst.alpha_composite(image,tuple(round(v) for v in xy))


def text_layer(text,size,weight=500,color=INK,width=1260):
    face=font(size,weight)
    lines=text.split('\n');line_height=round(size*1.1)
    image=Image.new('RGBA',(width,line_height*len(lines)+12))
    draw=ImageDraw.Draw(image)
    for i,line in enumerate(lines):
        assert draw.textlength(line,font=face)<width, 'Editorial headline overflow: '+line
        draw.text((0,i*line_height),line,font=face,fill=color)
    return image


@lru_cache(maxsize=16)
def ui_panel(key):
    image=shot(key)
    # Actual app content is cropped for the film; the gallery retains full pages.
    if key in ('merchant-products','products-selected'):
        bounds=(224,350,image.width-12,min(image.height,1140))
    elif key.startswith('copilot'):
        bounds=(224,105,image.width-12,min(image.height,950))
    else:
        bounds=(224,120,image.width-12,min(image.height,950))
    image=image.crop(bounds)
    result=Image.new('RGBA',(1264,700),BG)
    fitted=ImageOps.contain(image,(1260,696),Image.Resampling.LANCZOS)
    result.alpha_composite(fitted,((1264-fitted.width)//2,(700-fitted.height)//2))
    mask=Image.new('L',result.size)
    ImageDraw.Draw(mask).rounded_rectangle((0,0,1263,699),18,fill=255)
    result.putalpha(mask)
    ImageDraw.Draw(result).rounded_rectangle((0,0,1263,699),18,outline='#414760',width=1)
    return result


class Film:
    def __init__(self):
        self.photo=photographed_monitor(shot('overview'),(W,H))
        # Feather the physical photograph into the same canvas as the web hero.
        matte=Image.new('L',(W,H),255)
        d=ImageDraw.Draw(matte)
        for i in range(45):
            alpha=round(255*ease(i/44))
            d.rectangle((i,i,W-i-1,H-i-1),outline=alpha)
        self.photo=Image.composite(self.photo,Image.new('RGBA',(W,H),BG),matte)
        self.brand=shot('overview').crop((20,20,196,64))
        self.brand.thumbnail((160,40),Image.Resampling.LANCZOS)
        self.headings=[text_layer(s[0],62,550) for s in SPEC]
        self.kickers=[text_layer(s[1],14,600,ACCENT) for s in SPEC]
        self.panels=[(ui_panel(s[2]),ui_panel(s[3]) if s[3] else None) for s in SPEC]
        self.footer=Image.new('RGBA',(W,H),BG)
        paste(self.footer,text_layer('PaySphere',84,650),(96,340))
        paste(self.footer,text_layer('Merchant operations, connected.',35,450,MUTE),(96,480))
        paste(self.footer,text_layer('An interface prototype using sample records.',20,450,MUTE),(96,560))
        self.last_reading=24.05

    def section(self,index,t):
        if index==8:return self.photo.copy()
        if index==7:return self.footer.copy()
        canvas=Image.new('RGBA',(W,H),BG)
        start=STARTS[index]
        entrance=ease((t-start-.08)/.44)
        paste(canvas,self.brand,(90,50),entrance)
        paste(canvas,self.kickers[index],(90,114+12*(1-entrance)),entrance)
        paste(canvas,self.headings[index],(88,151+18*(1-entrance)),entrance)
        first,second=self.panels[index]
        current=first
        if second is not None:
            change=start+(1.36 if index!=4 else 1.65)
            alpha=ease((t-change)/.28)
            if alpha>=1:current=second
            elif alpha>0:
                # A soft native-state wipe keeps text from ghosting over text.
                reveal_mask=Image.new('L',first.size)
                edge=round(first.width*alpha)
                ImageDraw.Draw(reveal_mask).rectangle((0,0,edge,first.height),fill=255)
                current=Image.composite(second,first,reveal_mask.filter(ImageFilter.GaussianBlur(9)))
        age=max(0,min(1,(t-start)/3.8))
        # Subpixel push inside the interface layer; typography settles for reading.
        zoom=1+.018*math.sin(age*math.pi)
        sx=1/zoom;dx=(1264-1264*sx)*.5;dy=(700-700*sx)*.47
        current=current.transform(current.size,Image.Transform.AFFINE,(sx,0,dx,0,sx,dy),Image.Resampling.BICUBIC)
        ui_enter=ease((t-start-.23)/.5)
        paste(canvas,current,(88,340+22*(1-ui_enter)),ui_enter)
        return canvas

    def camera(self,t):
        transitions=[(3.98,4.55,0,1),(7.06,7.65,1,2),(10.06,10.66,2,3),
                     (13.87,14.48,3,4),(17.98,18.58,4,5),(21.38,21.99,5,6),
                     (24.08,25.03,6,7),(25.03,(FRAMES-1)/FPS,7,8)]
        y=0
        for a,b,old,new in transitions:
            if t<a:return y
            if t<b:return (old+(new-old)*ease((t-a)/(b-a)))*H
            y=new*H
        return y

    def frame(self,n):
        t=n/FPS;y=self.camera(t)
        index=min(8,int(y//H));fraction=y-index*H
        image=self.section(index,t)
        if fraction>.001 and index<8:
            strip=Image.new('RGBA',(W,H*2),BG)
            paste(strip,image,(0,0));paste(strip,self.section(index+1,t),(0,H))
            image=strip.transform((W,H),Image.Transform.AFFINE,(1,0,0,0,1,fraction),Image.Resampling.BICUBIC)
            velocity=abs(self.camera(t+1/FPS)-y)
            if velocity>18:image=image.filter(ImageFilter.GaussianBlur(min(.8,velocity/100)))
        if t<.8:
            if t<.46:
                zoom=1+.018*ease(t/.46);scale=1/zoom
                image=self.photo.transform((W,H),Image.Transform.AFFINE,(scale,0,(W-W*scale)/2,0,scale,(H-H*scale)/2),Image.Resampling.BICUBIC)
            else:
                progress=ease((t-.46)/.34);edge=round(H*(1-progress))
                mask=Image.new('L',(W,H));ImageDraw.Draw(mask).rectangle((0,0,W,edge),fill=255)
                mask=mask.filter(ImageFilter.GaussianBlur(18))
                image=Image.composite(self.photo,image,mask)
                glow=Image.new('RGBA',(W,H));ImageDraw.Draw(glow).rectangle((0,edge-12,W,edge+12),fill=(176,167,255,90))
                image.alpha_composite(glow.filter(ImageFilter.GaussianBlur(18)))
        return image.convert('RGB')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare',action='store_true')
    parser.add_argument('--proofs',action='store_true')
    parser.add_argument('--ffmpeg')
    args=parser.parse_args()
    if args.prepare:prepare_assets()
    film=Film()
    proofs=SOURCE/'proofs';proofs.mkdir(parents=True,exist_ok=True)
    for second in [0,2.0,3.3,5.9,8.9,12.4,15.2,17.4,20.0,23.3,25.8]:
        film.frame(round(second*FPS)).save(proofs/f'{second:05.2f}.jpg',quality=94)
    film.frame(0).save(OUTPUT/'merchant-poster.jpg',quality=95)
    assert film.frame(0).tobytes()==film.frame(FRAMES-1).tobytes(),'Opening and closing monitor frames must match.'
    if args.proofs:return
    if not args.ffmpeg:parser.error('--ffmpeg is required for the final encode')
    output=OUTPUT/'merchant-showcase-film.mp4'
    encoder=subprocess.Popen([args.ffmpeg,'-hide_banner','-loglevel','error','-y',
        '-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0',
        '-an','-vf','scale=out_color_matrix=bt709:out_range=tv','-c:v','libx264',
        '-preset','fast','-crf','18','-threads','3','-pix_fmt','yuv420p',
        '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',
        '-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1',
        '-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
    try:
        for n in range(FRAMES):
            encoder.stdin.write(film.frame(n).tobytes())
            if n%180==0:print(f'Merchant film: {n}/{FRAMES}',flush=True)
    finally:encoder.stdin.close()
    if encoder.wait():raise RuntimeError('Merchant encode failed')
    metadata={'width':W,'height':H,'fps':FPS,'frames':FRAMES,'duration':FRAMES/FPS,'audio':False,
              'style':'Native dark PaySphere palette, CRM motion structure',
              'screens':45,'hardware':'Teddy GR / Unsplash photograph','source':'Original PaySphere local interface captures',
              'loop':'First and last authored RGB frames are identical'}
    (OUTPUT/'merchant-showcase-film.json').write_text(json.dumps(metadata,indent=2)+'\n')
    print(json.dumps(metadata),flush=True)


if __name__=='__main__':main()
