"""Silent CashBell film: photographic phone hardware and native dark Flutter UI.

Reference language: macro pull-backs, screen-to-card continuity, paired phones,
real UI selections and a three-screen closing spread. No generated hardware.
"""
import argparse
from functools import lru_cache
import json
import math
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'scripts/showcase-sources/cashbell-v2'
SCREENS=SOURCE/'screens'
MEDIA=ROOT/'src/showcases'
W,H,FPS,FRAMES=1440,1080,60,2160
INK,MUTE,LIME='#f3f5ed','#a0b29e','#b8f53a'
TIMES=[0,3.6,7.2,11.5,16,20.5,25,29.2,33,36]
GEOMETRY=json.loads((SOURCE/'hardware/geometry.json').read_text())
SCENE=json.loads((SOURCE/'hardware/scene-geometry.json').read_text())
HARDWARE=Image.open(SOURCE/'hardware/photographed-phone.png').convert('RGBA')
DISPLAY=Image.open(SOURCE/'hardware/display-mask.png').convert('L')
FONT=ROOT/'scripts/showcase-sources/fonts/DM-Sans.ttf'


def ease(x):
    x=max(0,min(1,x));return x*x*x*(x*(x*6-15)+10)


def mix(a,b,x):return a+(b-a)*x


@lru_cache(maxsize=30)
def font(size,weight=500):
    f=ImageFont.truetype(str(FONT),size);f.set_variation_by_axes([32,weight]);return f


@lru_cache(maxsize=20)
def screen(name):return Image.open(SCREENS/(name+'.png')).convert('RGBA')


def canvas_ui(image):
    # Real UI fits below the physical camera notch, without cropping any control.
    fitted=ImageOps.fit(image,(860,1760),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(860,1860),image.getpixel((0,0)))
    canvas.alpha_composite(fitted,(0,100));return canvas


def homography(source,target):
    matrix=[];values=[]
    for (x,y),(u,v) in zip(source,target):
        matrix.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]])
        values.extend([u,v])
    return np.r_[np.linalg.solve(matrix,values),1].reshape(3,3)


def warp(image,size,quad):
    source=np.array([[0,0],[image.width,0],[image.width,image.height],[0,image.height]],float)
    forward=homography(source,np.array(quad,float))
    inverse=np.linalg.inv(forward);inverse/=inverse[2,2]
    return image.transform(size,Image.Transform.PERSPECTIVE,inverse.ravel()[:8],Image.Resampling.BICUBIC)


def make_device(image):
    mapped=warp(canvas_ui(image),HARDWARE.size,GEOMETRY['screen'])
    mapped.putalpha(DISPLAY)
    mapped.alpha_composite(HARDWARE)
    return mapped


def backdrop(tone=0):
    y,x=np.mgrid[0:H,0:W].astype(np.float32)
    pool=np.exp(-(((x-W*.53)/(W*.6))**2+((y-H*.54)/(H*.8))**2)*2)
    rgb=np.stack([8+pool*(14+tone),13+pool*(24+tone),11+pool*(17+tone)],axis=-1)
    grain=np.random.default_rng(52).normal(0,.28,(H,W,1))
    return Image.fromarray(np.uint8(np.clip(rgb+grain,0,255))).convert('RGBA')


def label(image,title,subtitle='',alpha=1):
    layer=Image.new('RGBA',(W,H));d=ImageDraw.Draw(layer)
    d.text((88,88),title,font=font(43,500),fill=INK)
    if subtitle:d.text((90,150),subtitle,font=font(19,400),fill=MUTE)
    if alpha<1:layer.putalpha(layer.getchannel('A').point(lambda v:round(v*alpha)))
    image.alpha_composite(layer)


def paste(dst,im,xy,opacity=1):
    if opacity<=0:return
    if opacity<1:
        im=im.copy();im.putalpha(im.getchannel('A').point(lambda v:round(v*opacity)))
    dst.alpha_composite(im,tuple(round(v)for v in xy))


SHADOW=Image.new('RGBA',(700,130))
ImageDraw.Draw(SHADOW).ellipse((30,30,670,96),fill=(0,0,0,150))
SHADOW=SHADOW.filter(ImageFilter.GaussianBlur(24))


def place_device(dst,device,center,height,angle=0,opacity=1,shadow=True):
    ratio=height/device.height
    size=(round(device.width*ratio),round(height))
    texture=device.resize(size,Image.Resampling.BICUBIC)
    texture=texture.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    if shadow:
        shade=SHADOW.resize((round(height*.7),round(height*.13)),Image.Resampling.BICUBIC)
        paste(dst,shade,(center[0]-shade.width/2,min(H-72,center[1]+height*.44)),opacity)
    paste(dst,texture,(center[0]-texture.width/2,center[1]-texture.height/2),opacity)


SCREEN_FORWARD=homography(np.array([[0,0],[1,0],[1,1],[0,1]],float),np.array(GEOMETRY['screen']))


def card_quad(bounds,center,height,angle):
    x,y,w,h=bounds
    points=np.array([[x,y+50],[x+w,y+50],[x+w,y+h+50],[x,y+h+50]],float)/[430,930]
    projected=np.c_[points,np.ones(4)]@SCREEN_FORWARD.T
    projected=projected[:,:2]/projected[:,2:3]
    projected-=[HARDWARE.width/2,HARDWARE.height/2]
    projected*=height/HARDWARE.height
    a=math.radians(angle)
    rotation=np.array([[math.cos(a),-math.sin(a)],[math.sin(a),math.cos(a)]])
    return projected@rotation+center


def native_card(name,bounds):
    x,y,w,h=bounds
    source=screen(name).crop((round(x*2),round(y*2),round((x+w)*2),round((y+h)*2)))
    m=Image.new('L',source.size)
    ImageDraw.Draw(m).rounded_rectangle((0,0,source.width-1,source.height-1),round(23*2),fill=255)
    source.putalpha(m);return source


def flyout(dst,card,start_quad,target,amount):
    x,y,w,h=target
    end=np.array([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],float)
    quad=np.array(start_quad)*(1-amount)+end*amount
    left,top=np.floor(np.min(quad,axis=0)).astype(int)
    right,bottom=np.ceil(np.max(quad,axis=0)).astype(int)
    shade=Image.new('RGBA',(W,H))
    ImageDraw.Draw(shade).polygon([tuple(p+[0,16*amount])for p in quad],fill=(0,0,0,round(90*amount)))
    dst.alpha_composite(shade.filter(ImageFilter.GaussianBlur(18*amount)))
    transformed=warp(card,(right-left,bottom-top),quad-[left,top])
    paste(dst,transformed,(left,top))


def photographed_scene(image,size=(W,H),portrait=False):
    original=Image.open(SOURCE/'hardware/hand-dark.jpg').convert('RGB')
    # Grade the photographed room first; native UI is composited afterwards.
    photo=ImageEnhance.Brightness(original).enhance(.60).convert('RGBA')
    ui=warp(canvas_ui(image),photo.size,SCENE['screen'])
    hole=Image.open(SOURCE/'hardware/scene-display-mask.png').convert('L')
    photo=Image.composite(ui,photo,hole)
    bounds=(750,430,1450,1524) if portrait else SCENE['crop']
    return ImageOps.fit(photo.crop(bounds),size,Image.Resampling.LANCZOS)


class SourceVideo:
    def __init__(self,ffmpeg):
        self.process=subprocess.Popen([ffmpeg,'-hide_banner','-loglevel','error','-ss','3.49','-i',str(ROOT/'scripts/showcase-sources/recordings/cashbell.mp4'),'-t','4.3','-vf',f'fps={FPS}','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],stdout=subprocess.PIPE)
    def read(self):
        data=self.process.stdout.read(430*880*3)
        return Image.frombytes('RGB',(430,880),data).convert('RGBA') if len(data)==430*880*3 else None
    def close(self):
        self.process.stdout.read();self.process.stdout.close()
        if self.process.wait():raise RuntimeError('Native UI recording could not be decoded')


class Film:
    def __init__(self):
        names=['home','loan','application','offers','repayment-review','repayment-bank','activity']
        self.devices={name:make_device(screen(name))for name in names}
        self.background=backdrop()
        self.photo=photographed_scene(screen('home'))
        self.balance_bounds=(20,110,390,190)
        self.offer_bounds=(20,202,390,400)
        self.review_bounds=(20,199,390,271)
        self.balance=native_card('loan',self.balance_bounds)
        self.offer=native_card('offers',self.offer_bounds)
        self.review=native_card('repayment-review',self.review_bounds)
        self.last_loan=self.devices['loan']

    def scene(self,index,t,live=None):
        start,end=TIMES[index],TIMES[index+1]
        p=ease((t-start)/(end-start))
        im=self.background.copy()
        if index in (0,8):
            # The last camera returns to the exact opening composition.
            zoom=1+.035*(p if index==0 else 1-p)
            photo=self.photo.resize((round(W*zoom),round(H*zoom)),Image.Resampling.BICUBIC)
            x=(photo.width-W)//2;y=(photo.height-H)//2
            im=photo.crop((x,y,x+W,y+H))
            veil=Image.new('RGBA',(W,H))
            alpha=np.tile(np.uint8(np.clip(np.linspace(175,0,W),0,175)),(H,1))
            veil.putalpha(Image.fromarray(alpha));im.alpha_composite(veil)
            label(im,'CashBell 360','Clarity, from application to repayment.')
        elif index==1:
            height=mix(1320,910,p)
            place_device(im,self.devices['home'],(W*.63,H*.56),height,mix(-4,0,p))
            label(im,'Your money, in view.','CashBell · Native dark mode')
        elif index==2:
            center=np.array([W*.29,640]);height=840;angle=-4
            if live is not None:self.last_loan=make_device(live)
            place_device(im,self.last_loan,center,height,angle)
            amount=ease((t-start-.55)/1.15)
            flyout(im,self.balance,card_quad(self.balance_bounds,center,height,angle),(790,390,560,273),amount)
            label(im,'Know what remains.','Loan balance · next EMI · repayment details')
        elif index==3:
            enter=ease((t-start)/.75)
            place_device(im,self.devices['application'],(W*.31,640+(1-enter)*80),850,3)
            second=ease((t-start-.125)/.75)
            place_device(im,self.devices['offers'],(W*.69,620+(1-second)*80),900,-3,second)
            label(im,'A clearer way to compare.','From amount and tenure to sample options.')
        elif index==4:
            center=np.array([W*.29,640]);height=850;angle=3
            place_device(im,self.devices['offers'],center,height,angle)
            amount=ease((t-start-.35)/1.10)
            flyout(im,self.offer,card_quad(self.offer_bounds,center,height,angle),(790,290,540,554),amount)
            label(im,'The details before the decision.','Actual offer comparison · illustrative figures')
        elif index==5:
            picture=self.devices['repayment-review']
            switch=ease((t-23.10)/.25)
            if switch:picture=Image.blend(picture,self.devices['repayment-bank'],switch)
            center=np.array([W*.70,H*.57]);height=mix(940,990,p);angle=-2
            place_device(im,picture,center,height,angle)
            amount=ease((t-start-.35)/.95)
            flyout(im,self.review,card_quad(self.review_bounds,center,height,angle),(90,350,550,382),amount)
            label(im,'Every EMI, understood.','Review principal, interest and payment method.')
        elif index==6:
            center=(mix(W*.66,W*.62,p),H*.56)
            place_device(im,self.devices['activity'],center,mix(1020,920,p),mix(3,-2,p))
            label(im,'Keep the story together.','Applications · repayments · loan activity')
        elif index==7:
            spread=ease((t-start)/1.3)
            for name,direction in [('application',-1),('loan',1)]:
                place_device(im,self.devices[name],(W*.5+direction*390*spread,650),740,-direction*3,spread)
            place_device(im,self.devices['home'],(W*.5,620),900,0)
            label(im,'One connected lending experience.','Explore. Compare. Manage.')
        return im

    def frame(self,number,live=None):
        t=number/FPS
        index=next((i for i in range(9)if t<TIMES[i+1]),8)
        image=self.scene(index,t,live)
        if index<8:
            transition=TIMES[index+1]-.38
            if t>=transition:
                progress=ease((t-transition)/.38)
                incoming=self.scene(index+1,max(TIMES[index+1],t))
                outgoing=Image.new('RGBA',(W,H));paste(outgoing,image,(0,-14*progress))
                arriving=Image.new('RGBA',(W,H));paste(arriving,incoming,(0,14*(1-progress)))
                image=Image.blend(outgoing,arriving,progress)
        if number==FRAMES-1:image=self.scene(0,0)
        return image.convert('RGB')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg')
    parser.add_argument('--proofs',action='store_true')
    args=parser.parse_args()
    film=Film()
    proofs=SOURCE/'proofs';proofs.mkdir(exist_ok=True)
    for t in [0,2,5.4,9.5,13.5,18.5,23,27,31.5,35.5]:film.frame(round(t*FPS)).save(proofs/f'{t:05.2f}.jpg',quality=95)
    film.frame(0).save(MEDIA/'cashbell-poster.jpg',quality=95)
    for name in ['home','offers','loan']:
        photographed_scene(screen(name),(1024,1600),True).convert('RGB').save(MEDIA/f'cashbell-{name}-mockup.webp',quality=94)
    if args.proofs:return
    if not args.ffmpeg:parser.error('--ffmpeg is required')
    output=MEDIA/'cashbell-reference-film.mp4'
    native=SourceVideo(args.ffmpeg)
    encoder=subprocess.Popen([args.ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-an','-vf','scale=out_color_matrix=bt709:out_range=tv','-c:v','libx264','-preset','fast','-crf','18','-threads','3','-pix_fmt','yuv420p','-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
    try:
        for n in range(FRAMES):
            t=n/FPS
            live=native.read()if 7.2<=t<11.5 else None
            encoder.stdin.write(film.frame(n,live).tobytes())
            if n%180==0:print(f'CashBell reference film: {n}/{FRAMES}',flush=True)
    finally:
        encoder.stdin.close();native.close()
    if encoder.wait():raise RuntimeError('CashBell export failed')
    result={'width':W,'height':H,'fps':FPS,'frames':FRAMES,'duration':FRAMES/FPS,'audio':False,'theme':'native-dark','hardware':'Photographs by Jakub Zerdzicki / Unsplash','reference':'eb608ed3e91117b79d0275adce3095e7.mp4','source_speed':1.0}
    (MEDIA/'cashbell-reference-film.json').write_text(json.dumps(result,indent=2))
    print(json.dumps(result),flush=True)


if __name__=='__main__':main()
