"""Render the supplied CRM storyboard at 1440 x 1080 / 60 fps, without audio.

Existing interface captures and a photographed monitor are the only picture
assets. Python owns the deterministic camera, typography, masks and assembly.
"""
import argparse
from functools import lru_cache
import json
import math
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/showcase-sources/crm-v2'
SCREENS = SOURCE / 'screens'
OUTPUT = ROOT / 'src/showcases'
W, H, FPS, FRAMES = 1440, 1080, 60, 1581
CREAM, INK, MUTE = '#f7f7f1', '#183e31', '#728375'
GREEN, LIME, LINE = '#174b38', '#d2ee91', '#dbe3d5'
FONT = ROOT / 'scripts/showcase-sources/fonts/DM-Sans.ttf'
STARTS = [.8, 4.3, 7.4, 10.4, 14.2, 18.3, 21.7, 24.4, 25.2]
CAPTURE = json.loads((SCREENS/'capture.json').read_text())


def ease(x):
    x = max(0, min(1, x))
    return x*x*x*(x*(x*6-15)+10)


def mix(a, b, x):
    return a+(b-a)*x


@lru_cache(maxsize=80)
def font(size, weight=500):
    f = ImageFont.truetype(str(FONT), size)
    f.set_variation_by_axes([32, weight])
    return f


@lru_cache(maxsize=90)
def asset(name):
    return Image.open(SCREENS/(name+'.png')).convert('RGBA')


def native(name, bounds=None):
    im = asset(name)
    if bounds:
        x,y,w,h = bounds
        im=im.crop(tuple(round(v*2) for v in (x,y,x+w,y+h)))
    return im


def fit(im, size):
    return ImageOps.contain(im, tuple(map(round,size)), Image.Resampling.LANCZOS)


def mask(size, r=20):
    m=Image.new('L',size)
    ImageDraw.Draw(m).rounded_rectangle((0,0,size[0]-1,size[1]-1),r,fill=255)
    return m


def rounded(im, radius=20):
    im=im.copy();im.putalpha(mask(im.size,radius));return im


def gradient(size, a=(228,240,222), b=(247,248,241)):
    w,h=size
    y,x=np.mgrid[0:h,0:w].astype(np.float32)
    f=np.clip(x/w*.65+y/h*.35,0,1)[...,None]
    rgb=np.array(a)*(1-f)+np.array(b)*f
    return Image.fromarray(np.uint8(rgb)).convert('RGBA')


def panel(im, size, mint=False, pad=16):
    w,h=size
    p=gradient(size) if mint else Image.new('RGBA',size,'#ffffff')
    fitted=fit(im,(w-pad*2,h-pad*2))
    p.alpha_composite(fitted,((w-fitted.width)//2,(h-fitted.height)//2))
    p=rounded(p,22)
    ImageDraw.Draw(p).rounded_rectangle((0,0,w-1,h-1),22,outline=LINE,width=1)
    return p


def text_image(text, size, weight=500, color=INK, width=1250, spacing=8):
    f=font(size,weight)
    lines=text.split('\n')
    line_h=round(size*1.12)
    im=Image.new('RGBA',(width,line_h*len(lines)+spacing+8))
    d=ImageDraw.Draw(im)
    for i,line in enumerate(lines):d.text((0,i*line_h),line,font=f,fill=color,stroke_width=0)
    return im


def paste(dst, im, xy, alpha=1):
    if alpha<=0:return
    if alpha<1:
        im=im.copy();im.putalpha(im.getchannel('A').point(lambda v:round(v*alpha)))
    dst.alpha_composite(im,tuple(round(v) for v in xy))


def reveal(dst, im, xy, now, start, duration=.42, rise=18):
    progress=ease((now-start)/duration)
    paste(dst,im,(xy[0],xy[1]+rise*(1-progress)),progress)


def blend_states(states, now):
    previous=states[0][1]
    for start,im in states[1:]:
        if now<start:return previous
        if now<start+.16:return Image.blend(previous,im,ease((now-start)/.16))
        previous=im
    return previous


def module_panel(source,title,index):
    base=gradient((400,568),(232,243,220),(247,249,240))
    d=ImageDraw.Draw(base)
    d.text((25,27),str(index+1).zfill(2),font=font(15,500),fill=MUTE)
    d.text((25,64),title,font=font(25,550),fill=INK)
    card=fit(source,(350,390))
    paste(base,card,((400-card.width)//2,142+(390-card.height)//2))
    return rounded(base,22)


class Section:
    def __init__(self,index,headline,kicker='THE CLIENT WORKSPACE',mint=False):
        self.index=index
        self.start=STARTS[index]
        self.background=gradient((W,H),(220,240,222),(249,248,240)) if mint else Image.new('RGBA',(W,H),CREAM)
        self.layers=[]
        self.add(text_image('IDSSPL CRM',21,650), (96,54), -.12)
        self.add(text_image(kicker,13,600,MUTE),(96,127),.0)
        self.add(text_image(headline,65,500),(96,166),.09)

    def add(self,im,xy,delay=.25):
        self.layers.append((im,xy,self.start+delay))

    def render(self,now):
        im=self.background.copy()
        for picture,xy,start in self.layers:reveal(im,picture,xy,now,start)
        return im


def warp_into(photo,screen,quad):
    x0,y0=np.floor(np.min(quad,axis=0)).astype(int)
    x1,y1=np.ceil(np.max(quad,axis=0)).astype(int)
    source=[(0,0),(screen.width,0),(screen.width,screen.height),(0,screen.height)]
    matrix=[];values=[]
    for (x,y),(u,v) in zip(quad-[x0,y0],source):
        matrix.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]])
        values.extend([u,v])
    coeff=np.linalg.solve(matrix,values)
    warped=screen.transform((x1-x0,y1-y0),Image.Transform.PERSPECTIVE,coeff,Image.Resampling.BICUBIC)
    paste(photo,warped,(x0,y0))


def photographed_monitor(screen=None,size=(W,H)):
    photo=Image.open(SOURCE/'hardware/monitor-teddy-gr.jpg').convert('RGBA')
    # Measured inner display corners in the original 2400 x 1600 photograph.
    corners=np.array([[680,357],[1648,396],[1648,976],[687,1038]],dtype=float)*(photo.width/2400)
    warp_into(photo,screen if screen is not None else asset('overview'),corners)
    return ImageOps.fit(photo,size,Image.Resampling.LANCZOS)


class Film:
    def __init__(self):
        self.photo=photographed_monitor()
        self.sections=[
            Section(0,'Every client. Every task.\nOne workspace.'),
            Section(1,'Keep every relationship\nmoving.'),
            Section(2,'See progress at a glance.'),
            Section(3,'Your daily work, connected.'),
            Section(4,'A clear next step.\nFor everyone.'),
            Section(5,'Clear ownership.\nControlled access.'),
            Section(6,'One workspace for\nyour entire team.',mint=True),
        ]
        # Actual full-page capture provides the native Overview-to-map scroll.
        self.overview=asset('overview').resize((1440,900),Image.Resampling.LANCZOS)
        self.full=asset('overview-full')
        if self.full.width!=1440:self.full=self.full.resize((1440,round(self.full.height*1440/self.full.width)),Image.Resampling.LANCZOS)
        self.intro_frame=gradient((1248,780))
        self.sections[0].add(self.intro_frame,(96,320),.21)
        self.client_panels=[
            panel(native('clients',(278,93,770,730)),(610,610)),
            panel(native('profile-history',(278,94,1050,760)),(610,610)),
        ]
        self.sections[1].add(self.client_panels[0],(96,348),.20)
        self.sections[1].add(self.client_panels[1],(734,348),.33)
        self.sections[1].add(text_image('Client directory',19,600),(110,978),.29)
        self.sections[1].add(text_image('Client profile · tasks & support history',19,600),(748,978),.42)
        self.sections[2].add(text_image('Workspace snapshot · sample records',18,400,MUTE),(98,308),.15)
        self.metric_labels=CAPTURE['metrics']
        for i,item in enumerate(self.metric_labels):
            card=Image.new('RGBA',(294,330),'#ffffff')
            d=ImageDraw.Draw(card)
            d.rounded_rectangle((0,0,293,329),20,outline=LINE,width=1)
            icon_name=['users','task','help','task'][i]
            ic=fit(asset('icon-'+icon_name),(46,46))
            paste(card,ic,(25,28))
            d.text((26,101),item['label'],font=font(22,500),fill=INK)
            self.sections[2].add(rounded(card,20),(96+i*318,430),.23+i*.125)
        self.sections[2].add(panel(native('insights',(278,595,1120,260)),(1248,205),pad=10),(96,805),.40)
        self.module_bases=[]
        for i,(name,title) in enumerate([('module-prospect','Prospect pipeline'),('module-task','Task manager'),('module-case','Helpdesk')]):
            base=module_panel(asset(name),title,i)
            self.module_bases.append(base)
            self.sections[3].add(base,(96+i*424,337),.20+i*.125)
        self.module_selected=[]
        for i,name in enumerate(['module-prospect-detail','module-task-priority','module-case-action']):
            source=asset(name)
            if i==0:source=source.crop((0,0,source.width,min(source.height,round(source.width*1.35))))
            self.module_selected.append(module_panel(source,['Prospect pipeline','Task manager','Helpdesk'][i],i))
        self.feature_labels=['Assign work','Set priorities','Track deadlines','Mark complete']
        self.editor_bounds=(400,44,640,812)
        modal=CAPTURE['boxes'].get('modal')
        if modal:self.editor_bounds=(modal['x'],modal['y'],modal['width'],modal['height'])
        self.editor_states=[]
        for start,name in [(14.49,'task-editor'),(14.88,'task-assigned'),(15.68,'task-priority'),(16.48,'task-deadline')]:
            self.editor_states.append((start,panel(native(name,self.editor_bounds),(830,700),mint=True,pad=14)))
        self.task_done=panel(asset('module-task-completed'),(830,700),mint=True,pad=60)
        for index,(name,label) in enumerate([('mahesh','Mahesh'),('varshika','Varshika'),('sameer','Sameer'),('prathamesh','Prathamesh')]):
            self.sections[4].add(fit(asset('avatar-'+name),(52,52)),(100+index*86,833),.21+index*.05)
            self.sections[4].add(text_image(label,13,500,width=100),(91+index*86,895),.26+index*.05)
        self.roles_states=[
            (18.50,panel(native('roles',(278,91,1120,760)),(1248,684),mint=True,pad=20)),
            (19.36,panel(asset('member-panel'),(1248,684),mint=True,pad=16)),
        ]
        self.orbit_icons=[fit(asset('icon-'+name),(55,55)) for name in ['users','nav-prospects','task','help','chart','note']]
        self.brand=fit(asset('brand'),(270,100))
        self.footer=Image.new('RGBA',(W,H),CREAM)
        d=ImageDraw.Draw(self.footer)
        d.line((96,90,1344,90),fill=LINE,width=1)
        d.text((96,135),'IDSSPL CRM',font=font(38,600),fill=INK)
        d.text((96,210),'The client workspace.',font=font(22,400),fill=MUTE)
        for i,label in enumerate(['Clients','Prospects','Tasks','Helpdesk','Reports','Notes']):
            d.text((96+i*204,360),label,font=font(21,500),fill=INK)
        d.text((78,530),'IDSSPL CRM',font=font(180,550),fill='#e4e8dc')

    def overview_scroll(self,t):
        scroll=round(900*ease((t-2.02)/1.05))
        current=self.overview.copy()
        scrolling=self.full.crop((252,70+scroll,1440,900+scroll))
        current.alpha_composite(scrolling,(252,70))
        return panel(current,(1204,752),pad=0)

    def render_section(self,index,t):
        if index==7:return self.footer
        if index==8:return self.photo
        section=self.sections[index]
        im=section.render(t)
        if index==0:
            reveal(im,self.overview_scroll(t),(118,340),t,1.08,.5,24)
        elif index==2:
            d=ImageDraw.Draw(im)
            for i,item in enumerate(self.metric_labels):
                alpha=ease((t-(7.73+i*.125))/.38)
                if not alpha:continue
                value=round(item['value']*ease((t-(7.80+i*.125))/.82))
                label=text_image(str(value),112,500,width=250)
                paste(im,label,(121+i*318,598),alpha)
        elif index==3:
            for i,selected in enumerate(self.module_selected):
                amount=ease((t-(11.36+i*.65))/.25)
                if amount:paste(im,selected,(96+i*424,337),amount)
        elif index==4:
            feature=min(3,max(0,int((t-14.60)/.8)))
            d=ImageDraw.Draw(im)
            for i,label in enumerate(self.feature_labels):
                y=390+i*86
                active=i==feature
                if active:d.rounded_rectangle((96,y-10,421,y+53),14,fill='#e5efda')
                d.ellipse((112,y+11,120,y+19),fill=GREEN if active else '#bac7b5')
                d.text((140,y),label,font=font(26,550 if active else 400),fill=INK if active else MUTE)
            source=blend_states(self.editor_states,t)
            if t>17.23:source=Image.blend(source,self.task_done,ease((t-17.23)/.22))
            # A shallow anchored focus zoom, never a perspective warp of the UI.
            z=1+.023*math.sin(max(0,min(1,(t-14.5)/3.5))*math.pi)
            source=source.resize((round(830*z),round(700*z)),Image.Resampling.BICUBIC)
            anchors=[(.27,.66),(.73,.80),(.27,.80),(.50,.50)]
            ax,ay=anchors[feature]
            ox,oy=round((source.width-830)*ax),round((source.height-700)*ay)
            source=source.crop((ox,oy,ox+830,oy+700))
            reveal(im,source,(500,332),t,14.45,.35,16)
        elif index==5:
            reveal(im,blend_states(self.roles_states,t),(96,345),t,18.48,.4,22)
        elif index==6:
            # Native CRM icon paths and brand artwork, kept distinct from UI.
            center=(720,680)
            glow=Image.new('RGBA',(W,H))
            ImageDraw.Draw(glow).ellipse((530,500,910,860),fill=(172,231,153,65))
            im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(64)))
            d=ImageDraw.Draw(im)
            d.rounded_rectangle((554,623,886,751),30,fill=GREEN)
            paste(im,self.brand,((W-self.brand.width)//2,638))
            for i,(picture,label) in enumerate(zip(self.orbit_icons,['Clients','Prospects','Tasks','Helpdesk','Reports','Notes'])):
                angle=-math.pi/2+i*math.pi/3
                x=center[0]+430*math.cos(angle)
                y=center[1]+265*math.sin(angle)+math.sin(t*.9+i)*5
                card=Image.new('RGBA',(154,121),'#ffffff')
                card=rounded(card,24)
                paste(card,picture,((154-picture.width)//2,14))
                dc=ImageDraw.Draw(card);f=font(18,500)
                dc.text((77-dc.textlength(label,font=f)/2,82),label,font=f,fill=INK)
                reveal(im,card,(x-77,y-60),t,21.99+i*.11,.42,12)
        return im

    def camera(self,t):
        # Each section settles before its reading hold. Transitions are continuous
        # vertical travel on one long canvas, with quintic ease-in-out.
        transitions=[(3.98,4.55,0,1),(7.06,7.65,1,2),(10.06,10.66,2,3),
                     (13.87,14.48,3,4),(17.98,18.58,4,5),(21.38,21.99,5,6),
                     (24.08,25.03,6,7),(25.03,(FRAMES-1)/FPS,7,8)]
        y=0
        for start,end,a,b in transitions:
            if t<start:return y
            if t<end:return mix(a*H,b*H,ease((t-start)/(end-start)))
            y=b*H
        return y

    def frame(self,number):
        t=number/FPS
        camera=self.camera(t)
        index=min(8,int(camera//H))
        fraction=camera-index*H
        current=self.render_section(index,t)
        if fraction>.01 and index<8:
            next_image=self.render_section(index+1,t)
            strip=Image.new('RGBA',(W,H*2),CREAM)
            paste(strip,current,(0,0));paste(strip,next_image,(0,H))
            # Fractional-pixel transform avoids staircase movement at 60 fps.
            current=strip.transform((W,H),Image.Transform.AFFINE,(1,0,0,0,1,fraction),Image.Resampling.BICUBIC)
            velocity=abs(self.camera(t+1/FPS)-camera)
            if velocity>15:current=current.filter(ImageFilter.GaussianBlur(min(1.0,velocity/90)))
        if t<.8:
            if t<.46:
                zoom=1+.022*ease(t/.46)
                photo=self.photo.resize((round(W*zoom),round(H*zoom)),Image.Resampling.BICUBIC)
                current=photo.crop(((photo.width-W)//2,(photo.height-H)//2,(photo.width+W)//2,(photo.height+H)//2))
            else:
                progress=ease((t-.46)/.34)
                edge=round(H*(1-progress))
                matte=Image.new('L',(W,H))
                ImageDraw.Draw(matte).rectangle((0,0,W,edge),fill=255)
                matte=matte.filter(ImageFilter.GaussianBlur(19))
                photo=self.photo.filter(ImageFilter.GaussianBlur(progress*1.1))
                current=Image.composite(photo,current,matte)
                glow=Image.new('RGBA',(W,H))
                ImageDraw.Draw(glow).rectangle((0,edge-15,W,edge+15),fill=(217,245,216,120))
                current.alpha_composite(glow.filter(ImageFilter.GaussianBlur(22)))
        return current.convert('RGB')


def main():
    global CREAM
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg')
    parser.add_argument('--proofs',action='store_true')
    parser.add_argument('--paper',default=CREAM)
    parser.add_argument('--output',default='crm-reference-film')
    args=parser.parse_args()
    CREAM=args.paper
    film=Film()
    proof_dir=SOURCE/'proofs';proof_dir.mkdir(exist_ok=True)
    for time in [0,2.0,3.4,5.8,8.9,12.7,15.4,17.65,20.4,23.0,25.8]:
        film.frame(round(time*FPS)).save(proof_dir/f'{time:05.2f}.jpg',quality=94)
    film.frame(0).save(OUTPUT/'crm-poster.jpg',quality=96)
    for screen in ['overview','clients','tasks','reports']:
        actual=Image.open(OUTPUT/'screens'/f'crm-{screen}.png').convert('RGBA')
        photographed_monitor(actual,(2560,1600)).convert('RGB').save(OUTPUT/f'crm-{screen}-mockup.webp',quality=94)
    if args.proofs:return
    if not args.ffmpeg:parser.error('--ffmpeg is required to export the film')
    output=OUTPUT/(args.output+'.mp4')
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
            if n%180==0:print(f'CRM reference film: {n}/{FRAMES}',flush=True)
    finally:encoder.stdin.close()
    if encoder.wait():raise RuntimeError('CRM export failed')
    result={'width':W,'height':H,'fps':FPS,'frames':FRAMES,'duration':FRAMES/FPS,
            'audio':False,'reference':'8faaac8aca8d68724dade4e4dc46dea9.mp4',
            'hardware':'Photograph by Teddy GR / Unsplash','ui':'Actual CRM captures'}
    result['paper']=CREAM
    (OUTPUT/(args.output+'.json')).write_text(json.dumps(result,indent=2))
    print(json.dumps(result),flush=True)


if __name__=='__main__':main()
