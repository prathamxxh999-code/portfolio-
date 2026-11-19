"""CashBell continuous product film: real Flutter interaction, native UI, licensed hardware.

45.3 s, 1440 x 1080, 60 fps, silent. See cashbell-v3/BRIEF.txt and SOURCES.md.
The camera shares one vertical world, as in the approved CRM film. No slide deck.
"""
import argparse
from functools import lru_cache
import json
import math
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'scripts/showcase-sources/cashbell-v3'
PUBLIC=ROOT/'src/showcases'
W,H,FPS,FRAMES=1440,1080,60,2718
INK='#f4f1ec'
INFO=json.loads((SOURCE/'capture.json').read_text())
PLATE=Image.open(ROOT/'scripts/showcase-sources/devices/iphone-15-pro.png').convert('RGBA').resize((710,1399),Image.Resampling.LANCZOS)
LEFT,TOP,SW,SH=60,60,590,1279
UIH=round(SW*880/430)
UITOP=TOP+SH-UIH
MASK=Image.new('L',(SW,SH))
ImageDraw.Draw(MASK).rounded_rectangle((0,0,SW-1,SH-1),50,fill=255)
CURSOR=Image.new('RGBA',(42,50))
ImageDraw.Draw(CURSOR).polygon([(5,3),(5,38),(14,29),(22,46),(29,43),(21,27),(35,27)],fill='#f8faf3',outline='#1d3028',width=2)


def ease(x):
    x=max(0,min(1,x));return x*x*x*(x*(x*6-15)+10)


def mix(a,b,p):return a+(b-a)*p


def track(t,keys):
    if t<=keys[0][0]:return keys[0][1]
    for (a,x),(b,y) in zip(keys,keys[1:]):
        if t<=b:return mix(x,y,ease((t-a)/(b-a)))
    return keys[-1][1]


def paste(dst,picture,xy,alpha=1):
    if alpha<=0:return
    if alpha<1:
        picture=picture.copy();picture.putalpha(picture.getchannel('A').point(lambda v:round(v*alpha)))
    dst.alpha_composite(picture,tuple(round(v) for v in xy))


@lru_cache(maxsize=30)
def still(name):return Image.open(SOURCE/'screens'/f'{name}.png').convert('RGBA')


def face(ui):
    # Contain the app uniformly. Camera space is outside, never cut from the UI.
    image=Image.new('RGBA',PLATE.size)
    display=Image.new('RGBA',(SW,SH),'#121214')
    fitted=ui.resize((SW,UIH),Image.Resampling.BICUBIC)
    display.alpha_composite(fitted,(0,SH-UIH));display.putalpha(MASK)
    image.alpha_composite(display,(LEFT,TOP));image.alpha_composite(PLATE)
    return image


@lru_cache(maxsize=24)
def static_phone(name):return face(still(name))


def projection(source,center,height,yaw=0,tilt=0):
    # A shallow photographic-plane move; source hardware and UI stay coherent.
    a=math.radians(yaw);r=math.radians(tilt)
    corners=np.array([[-source.width/2,-source.height/2],[source.width/2,-source.height/2],[source.width/2,source.height/2],[-source.width/2,source.height/2]],float)
    points=np.c_[corners[:,0]*math.cos(a),corners[:,1],-corners[:,0]*math.sin(a)]
    points*=height/source.height
    depth=2200/(2200-points[:,2])
    xy=points[:,:2]*depth[:,None]
    rotation=np.array([[math.cos(r),-math.sin(r)],[math.sin(r),math.cos(r)]])
    return xy@rotation+center


def warp(source,quad):
    left,top=np.floor(quad.min(axis=0)).astype(int)
    right,bottom=np.ceil(quad.max(axis=0)).astype(int)
    local=quad-[left,top]
    rows=[];values=[]
    for (x,y),(u,v) in zip(local,[(0,0),(source.width,0),(source.width,source.height),(0,source.height)]):
        rows.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]]);values.extend([u,v])
    coefficients=np.linalg.solve(rows,values)
    return source.transform((max(1,right-left),max(1,bottom-top)),Image.Transform.PERSPECTIVE,coefficients,Image.Resampling.BICUBIC),(left,top)


def phone(dst,texture,center,height,yaw=0,tilt=0,alpha=1):
    if alpha<=0:return
    quad=projection(texture,center,height,yaw,tilt)
    if quad[:,0].max()<0 or quad[:,0].min()>W:return
    picture,xy=warp(texture,quad)
    paste(dst,picture,xy,alpha)


def ui_point(point,center,height,yaw=0,tilt=0):
    x=LEFT+point[0]*SW/430-PLATE.width/2
    y=UITOP+point[1]*UIH/880-PLATE.height/2
    a=math.radians(yaw);r=math.radians(tilt)
    p=np.array([x*math.cos(a),y,-x*math.sin(a)])*height/PLATE.height
    p=p[:2]*2200/(2200-p[2])
    rotation=np.array([[math.cos(r),-math.sin(r)],[math.sin(r),math.cos(r)]])
    return p@rotation+center


def pointer(dst,local,clip,center,height,yaw=0,tilt=0):
    events=next((r['events']for r in INFO['records']if r['name']==clip),[])
    event=None
    for candidate in events:
        if candidate['time']-.45<=local<=candidate['time']+.45+candidate.get('duration',0):event=candidate
    if not event:return
    when=event['time'];progress=ease((local-when+.4)/.4)
    point=np.array([event['x'],event['y']],float)
    if event['type']=='drag':
        p=ease((local-when)/event['duration'])
        point=point*(1-p)+np.array([event['endX'],event['endY']])*p
    else:point+=np.array([30,28])*(1-progress)
    # A physical cursor leaves the phone as the real pointer-captured drag does.
    alpha=min(1,max(0,(local-when+.45)/.16),max(0,(when+.45+event.get('duration',0)-local)/.2))
    xy=ui_point(point,center,height,yaw,tilt)
    if point[0]>440:alpha*=max(0,(500-point[0])/60)
    paste(dst,CURSOR,xy-[5,3],alpha)
    ring=ease((local-when)/.32)
    if event['type']=='tap'and 0<ring<1:
        size=round(22+28*ring);layer=Image.new('RGBA',(size*2,size*2))
        ImageDraw.Draw(layer).ellipse((1,1,size*2-2,size*2-2),outline=(208,252,143,round(150*(1-ring))),width=2)
        paste(dst,layer,xy-[size,size])


@lru_cache(maxsize=9)
def background(index):
    y,x=np.mgrid[0:H,0:W].astype(np.float32)
    pool=np.exp(-(((x-W*.55)/(W*.55))**2+((y-H*.46)/(H*.72))**2)*2)
    floor=np.exp(-(((x-W*.5)/(W*.55))**2+((y-H*.87)/(H*.18))**2)*2)
    rgb=np.stack([9+pool*13+floor*4,14+pool*(25+index)+floor*9,12+pool*15+floor*6],axis=-1)
    return Image.fromarray(np.uint8(rgb)).convert('RGBA')


@lru_cache(maxsize=14)
def icon(name):
    return Image.open(SOURCE/'icons'/name).convert('RGBA')


def object_at(dst,name,center,width,alpha=1,rotation=0):
    source=icon(name)
    source=ImageOps.contain(source,(round(width),round(width)),Image.Resampling.LANCZOS)
    if rotation:source=source.rotate(rotation,Image.Resampling.BICUBIC,expand=True)
    paste(dst,source,(center[0]-source.width/2,center[1]-source.height/2),alpha)


class Clips:
    """On-demand natural-speed source decoding. Seeking is deterministic by frame."""
    def __init__(self,ffmpeg):self.ffmpeg=ffmpeg;self.streams={}
    def get(self,name,t):
        n=max(0,round(t*FPS))
        current=self.streams.get(name)
        if current is None or n<current['index'] or n-current['index']>90:
            if current:self.stop(current)
            process=subprocess.Popen([self.ffmpeg,'-hide_banner','-loglevel','error','-ss',str(n/FPS),'-i',str(SOURCE/'clips'/f'{name}.mp4'),'-f','rawvideo','-pix_fmt','rgb24','pipe:1'],stdout=subprocess.PIPE)
            current={'process':process,'index':n-1,'frame':None,'face':None};self.streams[name]=current
        changed=False
        while current['index']<n:
            data=current['process'].stdout.read(430*880*3)
            if len(data)!=430*880*3:break
            current['frame']=Image.frombytes('RGB',(430,880),data).convert('RGBA');current['index']+=1;changed=True
        if changed:current['face']=face(current['frame'])
        return current['face']or static_phone({'payment':'payment-pending','submission':'submit-ready','offer':'offers','need':'need','home':'home','login':'login','bell':'bell'}[name])
    def stop(self,current):
        if current['process'].poll()is None:current['process'].terminate()
        current['process'].wait()
        current['process'].stdout.close()
    def close(self):
        for current in self.streams.values():self.stop(current)


class Film:
    def __init__(self,ffmpeg):
        self.clips=Clips(ffmpeg)if ffmpeg else None
        self.offer=still('offers').crop((40,404,820,1204))
        self.logo=Image.open(SOURCE/'icons/cashbell-dark-wordmark.png').convert('RGBA')
        box=self.logo.getbbox()
        if box:self.logo=self.logo.crop(box)
    def live(self,name,t):
        return self.clips.get(name,t)if self.clips else static_phone({'login':'login','home':'home','offer':'review'if t>1.7 else'offers','need':'need-selected'if t>1.5 else'need','submission':'tracker'if t>5 else'submit-ready','bell':'bell-answer'if t>3 else'bell','payment':'payment-pending'if t>2.6 else'emi'}[name])
    def collage(self,t,scale=1,center=None,disperse=0):
        im=background(0).copy();center=np.array(center or[W*.5,H*.5])
        # Symmetric, device-led composition; the central phone remains the anchor.
        items=[('home',(-470,-40),650,-8,0),('offers',(470,25),650,8,0),('activity',(-330,490),470,-6,0),('tracker',(355,-470),470,6,0)]
        for name,offset,h,yaw,tilt in items:
            phone(im,static_phone(name),center+np.array(offset)*scale*(1+.7*disperse),h*scale,yaw,tilt,.72*(1-disperse))
        phone(im,static_phone('login'),center,850*scale)
        object_at(im,'bell-ai-glass-core.png',center+np.array([-195,-402])*scale,130*scale,.7*(1-disperse))
        object_at(im,'icon-kyc-shield-3d.png',center+np.array([205,425])*scale,110*scale,.7*(1-disperse))
        return im
    def section(self,index,t):
        im=background(index).copy()
        if index==0:
            if t<2:
                scale=track(t,[(0,.82),(.45,.82),(2,1.08)])
                im=self.collage(t,scale,disperse=ease((t-1.15)/.85))
                return im
            if t<9.2:
                center=np.array([720,540.]);height=918.
                if t<5.2:
                    # The same central device survives the opening move and sign-in.
                    height=track(t,[(2,918),(4.8,960),(5.2,960)])
                    texture=self.live('login',t-2)
                    phone(im,texture,center,height)
                    pointer(im,t-2,'login',center,height)
                else:
                    height=track(t,[(5.2,960),(6.0,1270),(7.3,1270),(9.2,925)])
                    center[1]=track(t,[(5.2,540),(6,660),(7.3,660),(9.2,540)])
                    phone(im,self.live('home',t-5.2),center,height)
                return im
            if t<13:
                # A genuine travelling gallery, not slides replacing one another.
                camera=track(t,[(9.2,0),(9.65,0),(10.25,480),(10.5,480),(11.12,960),(11.35,960),(12,1440),(12.2,1440),(13,1920)])
                names=['home','activity','bell','profile','offers']
                visible=sorted(range(5),key=lambda i:abs(i*480-camera),reverse=True)
                for i in visible:
                    x=720+i*480-camera;distance=min(1,abs(x-720)/650)
                    phone(im,static_phone(names[i]),(x,540+20*distance),925-80*distance,-(x-720)/100,.3*(x-720)/400,1-.33*distance)
                return im
            center=np.array([720.,540.]);height=track(t,[(13,925),(13.55,960),(16.1,1040),(18,960)])
            extraction=track(t,[(13,0),(13.75,1),(14.0,1),(14.42,0),(18,0)])
            center[0]=720-270*extraction
            phone(im,self.live('offer',t-13),center,height,0)
            pointer(im,t-13,'offer',center,height)
            if extraction>0:
                # The real card lifts and returns before the captured selection.
                p0=ui_point((20,202),center,height)
                p1=ui_point((410,602),center,height)
                natural_width=p1[0]-p0[0]
                width=mix(natural_width,530,extraction)
                card=ImageOps.contain(self.offer,(round(width),round(width*self.offer.height/self.offer.width)),Image.Resampling.BICUBIC)
                xy=np.array([mix(p0[0],790,extraction),mix(p0[1],272,extraction)])
                paste(im,card,xy)
            return im
        if index==1:
            local=max(0,t-18);height=track(local,[(0,960),(.8,1210),(2.5,1210),(4,960)])
            center=np.array([720,track(local,[(0,540),(.8,580),(2.5,580),(4,540)])])
            # Small, actual app artwork stays peripheral to the live controls.
            object_at(im,'icon-emi-calendar-3d.png',(1180,230+8*math.sin(t)),150,.72)
            object_at(im,'icon-kyc-shield-3d.png',(260,785-7*math.sin(t)),145,.65)
            phone(im,self.live('need',local),center,height)
            for when,point in[(.4,(373,305)),(1.25,(57,481))]:
                if when-.3<local<when+.5:
                    xy=ui_point(point,center,height);paste(im,CURSOR,xy-[5,3])
            return im
        if index==2:
            local=max(0,t-22)
            height=track(local,[(0,960),(1.15,1110),(3.2,1110),(4.8,960),(6.2,960)])
            center=np.array([720,track(local,[(0,540),(1.15,630),(3.2,630),(4.8,540),(6.2,540)])])
            phone(im,self.live('submission',local),center,height)
            pointer(im,local,'submission',center,height)
            return im
        if index==3:
            local=max(0,t-28.2)
            if local<4.2:
                # The existing native orb and answer transition supply the motion.
                height=track(local,[(0,960),(1,1130),(2.4,1130),(4.2,960)])
                phone(im,self.live('bell',local),(720,540),height)
                if .18<local<.82:paste(im,CURSOR,ui_point((86,663),(720,540),height)-[5,3])
            else:
                camera=track(local,[(4.2,0),(4.9,490),(5.15,490),(5.8,980)])
                for i,name in enumerate(['bell-answer','activity','profile']):
                    x=720+i*490-camera
                    phone(im,static_phone(name),(x,540),960,-(x-720)/110,0,max(.4,1-abs(x-720)/1600))
            return im
        if index==4:
            local=max(0,t-34)
            height=track(local,[(0,960),(.45,1090),(1.5,1090),(2.2,960),(3.2,1090),(4.5,1090),(5.2,960)])
            center=np.array([720,track(local,[(0,540),(.45,485),(1.5,485),(2.2,540),(3.2,560),(5.2,540)])])
            phone(im,self.live('payment',local),center,height)
            pointer(im,local,'payment',center,height)
            return im
        local=max(0,t-39.2)
        if t<43:
            amount=ease(local/3.8)
            for name,offset in [('home',(-490,-100)),('offers',(490,-100)),('need',(-380,550)),('tracker',(380,550)),('bell',(-350,-660)),('profile',(350,-660))]:
                position=np.array([720,540])+np.array(offset)*amount
                phone(im,static_phone(name),position,mix(960,580,amount),offset[0]/80*amount,0,amount*.78*(1-ease((t-42.55)/.45)))
            phone(im,static_phone('payment-pending'),(720,540),mix(960,780,amount))
            return im
        logo=ImageOps.contain(self.logo,(660,190),Image.Resampling.LANCZOS)
        end=self.collage(0,.82)
        # A deliberate brand moment followed by the exact original opening.
        old_alpha=1-ease((t-43)/.35)
        if old_alpha>0:
            phone(im,static_phone('payment-pending'),(720,540),780,alpha=old_alpha)
        alpha=ease((t-43)/.45)*(1-ease((t-44.65)/.5))
        paste(im,logo,((W-logo.width)/2,(H-logo.height)/2),alpha)
        if t>44.65:im=Image.blend(im,end,ease((t-44.65)/.65))
        return im
    def camera(self,t):
        value=0
        for index,start in enumerate([18,22,28.2,34,39.2],1):
            if t<start-.55:return value
            if t<start:return mix((index-1)*H,index*H,ease((t-start+.55)/.55))
            value=index*H
        return value
    def frame(self,n):
        if n==FRAMES-1:return self.collage(0,.82).convert('RGB')
        t=n/FPS;camera=self.camera(t);index=min(5,int(camera//H));fraction=camera-index*H
        image=self.section(index,t)
        if fraction>.001 and index<5:
            following=self.section(index+1,t)
            strip=Image.new('RGBA',(W,H*2));paste(strip,image,(0,0));paste(strip,following,(0,H))
            image=strip.transform((W,H),Image.Transform.AFFINE,(1,0,0,0,1,fraction),Image.Resampling.BICUBIC)
        return image.convert('RGB')


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--ffmpeg');parser.add_argument('--proofs',action='store_true');parser.add_argument('--start-frame',type=int,default=0);parser.add_argument('--end-frame',type=int,default=FRAMES);parser.add_argument('--output',type=Path);args=parser.parse_args()
    film=Film(args.ffmpeg);proofs=SOURCE/'proofs';proofs.mkdir(exist_ok=True)
    try:
        for t in[0,3,6.5,10.7,13.85,15.5,19.4,24.7,29.8,35,37.3,41.7,43.7]:film.frame(round(t*FPS)).save(proofs/f'{t:05.2f}.jpg',quality=96)
        if args.proofs:return
        if not args.ffmpeg:parser.error('--ffmpeg is required to export the film')
        target=args.output or PUBLIC/'cashbell-motion-film.mp4'
        target.parent.mkdir(parents=True,exist_ok=True)
        encoder=subprocess.Popen([args.ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-an','-vf','scale=out_color_matrix=bt709:out_range=tv','-c:v','libx264','-preset','fast','-crf','17','-threads','3','-pix_fmt','yuv420p','-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1','-movflags','+faststart',str(target)],stdin=subprocess.PIPE)
        try:
            for n in range(args.start_frame,args.end_frame):
                encoder.stdin.write(film.frame(n).tobytes())
                if n%180==0:print(f'CashBell continuous film: {n}/{FRAMES}',flush=True)
        finally:encoder.stdin.close()
        if encoder.wait():raise RuntimeError('CashBell motion export failed')
        if args.output:return
        film.frame(579).save(PUBLIC/'cashbell-motion-poster.jpg',quality=96)
        result={'width':W,'height':H,'fps':FPS,'frames':FRAMES,'duration':FRAMES/FPS,'audio':False,'theme':'native-dark','ui':'Real Flutter interactions at 1x; native 2x stills','hardware':'iPhone 15 Pro template, Apple Design Resources via MockUPhone','sequence':'Connected camera, travelling phone gallery, real card selection, application animation, native Bell AI, pending payment demo'}
        (PUBLIC/'cashbell-motion-film.json').write_text(json.dumps(result,indent=2));print(json.dumps(result),flush=True)
    finally:
        if film.clips:film.clips.close()


if __name__=='__main__':main()
