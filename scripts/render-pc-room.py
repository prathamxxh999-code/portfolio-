"""Render a 1920x1080 ambient room loop while retaining an identical PC plate."""
import argparse
import json
import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--ffmpeg', required=True)
parser.add_argument('--preview',action='store_true')
args = parser.parse_args()
sources = ROOT/'scripts/showcase-sources/retro-intro'
output = ROOT/'src/intro'
room_source=sources/'room-landscape-window-video.png'
if not room_source.exists():room_source=sources/'room-landscape-night-studio.png'
if not room_source.exists():room_source=sources/'room-landscape-collectibles.png'
if not room_source.exists():room_source=sources/'room-landscape-tower.png'
if not room_source.exists():room_source=sources/'room-landscape-framed.png'
if not room_source.exists():room_source=sources/'room-landscape-whiteboard.png'
if not room_source.exists():room_source=sources/'room-landscape-source.png'
base = ImageOps.fit(Image.open(room_source).convert('RGB'), (1920,1080), method=Image.Resampling.LANCZOS)
night_studio=room_source.name in ['room-landscape-night-studio.png','room-landscape-window-video.png']
has_tower=night_studio or room_source.name in ['room-landscape-tower.png','room-landscape-collectibles.png']
window_config=json.loads((sources/'window/window-video.json').read_text()) if room_source.name=='room-landscape-window-video.png' else None
window_mask=Image.open(sources/window_config['mask']).convert('L') if window_config else None
base.save(output/'room-poster.webp', quality=93)
wallpaper = ImageOps.fit(Image.open(sources/'desktop-wallpaper-source.png').convert('RGB'), (1280,1000), method=Image.Resampling.LANCZOS)
wallpaper.save(output/'desktop-wallpaper.webp',quality=91)

# No video tracking estimate is involved: the entire computer and keyboard are
# locked to this one photographic plate in every frame and in the web overlay.
hardware_mask = Image.new('L',base.size)
ImageDraw.Draw(hardware_mask).rectangle((665,245,1270,908),fill=255)
ImageDraw.Draw(hardware_mask).rectangle((635,760,1270,900),fill=255)
hardware_mask=hardware_mask.filter(ImageFilter.GaussianBlur(4))
hardware=base.convert('RGBA');hardware.putalpha(hardware_mask)
hardware.save(output/'room-hardware.webp',lossless=True)

width,height=base.size
yy,xx=np.mgrid[0:height,0:width]
warm=np.exp(-(((xx-570)/500)**2+((yy-190)/380)**2))
pink=np.exp(-(((xx-1470)/640)**2+((yy-180)/420)**2))
zones=[(110,140,155,200),(550,350,160,240),(1630,300,190,290),(1790,610,145,130),(105,800,155,260)]
fern_mask=Image.new('L',base.size)
ImageDraw.Draw(fern_mask).ellipse((-40,-45,260,255),fill=255)
fern_mask=fern_mask.filter(ImageFilter.GaussianBlur(23))
plant_zones=Image.new('L',base.size)
leaf_draw=ImageDraw.Draw(plant_zones)
for cx,cy,rx,ry in [(550,355,145,210),(1645,340,145,270),(1795,610,125,100),(105,800,155,235)]:
    leaf_draw.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=255)
plant_zones=plant_zones.filter(ImageFilter.GaussianBlur(3))
rgb=np.asarray(base,dtype=np.float32)
hsv=np.asarray(base.convert('HSV'))
green=((hsv[...,0]>28)&(hsv[...,0]<123)&(hsv[...,1]>40)&(rgb[...,1]>rgb[...,0]*.86)&(rgb[...,1]>rgb[...,2]*1.25))
isolated=Image.fromarray((green*np.asarray(plant_zones)).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.65))
leaf_mask=ImageChops.lighter(fern_mask,isolated)
if night_studio:
    leaf_mask=ImageChops.lighter(Image.fromarray((green*np.asarray(fern_mask)).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.5)),isolated)
    interior_mask=sources/'window/interior-foreground-mask.png'
    if interior_mask.exists():
        leaf_mask=ImageChops.lighter(leaf_mask,ImageChops.darker(Image.open(interior_mask).convert('L'),fern_mask))
frame_regions=([(500,620,693,840),(1240,34,1426,314),(1420,5,1656,326)] if night_studio else
               [(292,14,474,292),(1240,34,1426,314),(1420,5,1656,326)] if 'framed' in room_source.name or has_tower else [])
if has_tower:frame_regions.extend([(1232,317,1492,793),(1657,282,1919,414),(1505,414,1919,563)])
if night_studio:frame_regions.extend([(1335,210,1505,348),(1238,797,1400,880)])
for region in frame_regions:
    ImageDraw.Draw(leaf_mask).rectangle(region,fill=0)
if window_config:
    glass=Image.new('L',base.size);glass.paste(window_mask,tuple(window_config['box'][:2]))
    leaf_mask=ImageChops.subtract(leaf_mask,glass)
leaf_mask.save(sources/'plant-motion-mask.png')
# The small tape deck reels are real photographic crops, rotated in place.
reels=[]
for cx,cy,radius in ([(214,735,35),(283,735,35)] if night_studio else [(219,684,30),(286,684,30)]):
    crop=base.crop((cx-radius,cy-radius,cx+radius,cy+radius))
    mask=Image.new('L',crop.size)
    ImageDraw.Draw(mask).ellipse((1,1,radius*2-2,radius*2-2),fill=255)
    reels.append((cx-radius,cy-radius,crop,mask.filter(ImageFilter.GaussianBlur(.6))))

# Diaphragm motion is isolated inside the speaker rims.
cones=[]
for cx,cy,radius in ([] if has_tower else [(1380,408,43),(1312,605,32),(1404,605,32),(1404,707,33)]):
    crop=base.crop((cx-radius,cy-radius,cx+radius,cy+radius))
    mask=Image.new('L',crop.size)
    ImageDraw.Draw(mask).ellipse((2,2,radius*2-3,radius*2-3),fill=255)
    cones.append((cx-radius,cy-radius,radius,crop,mask.filter(ImageFilter.GaussianBlur(1.2))))

meter_box=(479,586,598,616) if night_studio else (196,395,300,423)
meter_pivots=[33,91] if night_studio else [28,77]
meter_base=24 if night_studio else 22
meter_plate=np.array(base.crop(meter_box))
for pivot in meter_pivots:
    for y in range(7,meter_base+1):
        for x in [pivot-1,pivot]:
            meter_plate[y,x]=(meter_plate[y,pivot-3].astype(float)+meter_plate[y,pivot+3])/2
meter_plate=Image.fromarray(meter_plate)

def energy(phase,offset=0):
    return .5+.25*math.sin(phase*3+offset)+.15*math.sin(phase*7+offset*.7)+.1*math.sin(phase*11+offset)

def animate_meters(image,phase):
    plate=meter_plate.resize((meter_plate.width*4,meter_plate.height*4),Image.Resampling.BICUBIC)
    draw=ImageDraw.Draw(plate)
    for index,pivot in enumerate(meter_pivots):
        angle=math.radians(-122+64*energy(phase,index*.9))
        point=((pivot+13*math.cos(angle))*4,(meter_base+13*math.sin(angle))*4)
        draw.line((pivot*4,meter_base*4,*point),fill=(74,40,16),width=3)
        draw.ellipse((pivot*4-2,meter_base*4-2,pivot*4+2,meter_base*4+2),fill=(91,49,18))
    image.paste(plate.resize(meter_plate.size,Image.Resampling.LANCZOS),meter_box[:2])

def bulb_power(phase,offset):
    second=(phase/(2*math.pi)*6+offset)%6
    dip=0
    for centre,halfwidth,depth in [(1.18,.15,.38),(1.57,.09,.23),(3.62,.12,.3),(3.96,.19,.42)]:
        distance=abs(second-centre)/halfwidth
        if distance<1:dip=max(dip,depth*(.5+.5*math.cos(math.pi*distance)))
    return 1-dip

def add_dust(pixels,phase,power):
    for index in range(14):
        progress=(phase/(2*math.pi)+index*.61803398875)%1
        x=round(413+(index*37%246)+12*math.sin(phase+index))
        y=round(525-progress*315)
        radius=2+(index%2)
        local_y,local_x=np.mgrid[-radius:radius+1,-radius:radius+1]
        alpha=np.exp(-(local_x**2+local_y**2)/(1.2+index%3))*.17*math.sin(math.pi*progress)**2*(.35+.65*power)
        patch=pixels[y-radius:y+radius+1,x-radius:x+radius+1]
        patch[:]=patch*(1-alpha[...,None])+np.array([244,215,161])*alpha[...,None]

pages=[]
page_regions=([
    ((1502,797,1632,849),[(8,6),(107,30),(31,37)],0,19),
    ((1385,802,1506,852),[(8,6),(96,31),(29,38)],1.7,13),
] if night_studio else [
    ((1480,790,1590,843),[(12,8),(95,35),(28,39)],0,19),
    ((1350,803,1445,850),[(12,8),(78,32),(28,36)],1.7,13),
])
for box,polygon,offset,amplitude in page_regions:
    pages.append((box,polygon,offset,amplitude,base.crop(box)))

def animate_pages(image,phase):
    for box,polygon,offset,amplitude,crop in pages:
        # A gust lifts only the free paper corner; the spine and book stack
        # never move. Broad rests separate the two small ripples in each loop.
        # A fast lift followed by a longer fall gives the corner paper weight.
        cycle=(phase*(3 if window_config else 2)+offset)%(2*math.pi)/(2*math.pi)
        gust=math.sin(math.pi*min(1,cycle/.26)/2)**2 if cycle<.26 else math.cos(math.pi*(cycle-.26)/.74/2)**2
        lift=amplitude*gust*(.8+.2*math.sin(phase*6+offset)**2)
        width,height=crop.size
        def bend(x,y):
            free=max(0,min(1,(x-15)/(width-29)))
            return lift*(.5-.5*math.cos(math.pi*free))
        mesh=[]
        for y in range(0,height,8):
            for x in range(0,width,12):
                right,bottom=min(width,x+12),min(height,y+8)
                corners=[]
                for sx,sy in [(x,y),(x,bottom),(right,bottom),(right,y)]:corners.extend((sx,sy+bend(sx,sy)))
                mesh.append(((x,y,right,bottom),tuple(corners)))
        lifted=crop.transform(crop.size,Image.Transform.MESH,mesh,Image.Resampling.BICUBIC)
        mask=Image.new('L',crop.size)
        ImageDraw.Draw(mask).polygon(polygon,fill=255)
        mask=mask.transform(crop.size,Image.Transform.MESH,mesh,Image.Resampling.BICUBIC)
        mask=mask.filter(ImageFilter.GaussianBlur(.6))
        shadow=Image.new('RGBA',crop.size)
        shadow_draw=ImageDraw.Draw(shadow)
        shadow_draw.polygon(polygon,fill=(35,14,12,round(lift*1.8)))
        shadow_draw.line(polygon[1:],fill=(35,14,12,min(150,round(lift*8))),width=2)
        shadow=shadow.filter(ImageFilter.GaussianBlur(.8+lift*.07))
        image.paste(shadow,box[:2],shadow)
        image.paste(lifted,box[:2],mask)

# Each sticky note is a small independent paper surface. Its upper adhesive
# edge is pinned; only the free lower half bends, with a moving contact shadow.
notes=[]
for box,polygon,offset in [
    ((714,194,788,269),[(8,13),(62,7),(66,60),(13,68)],0),
    ((1069,207,1140,270),[(7,12),(60,6),(63,51),(13,57)],2.1),
    ((1140,186,1213,265),[(7,12),(61,6),(65,66),(13,72)],4.2),
]:
    crop=base.crop(box)
    mask=Image.new('L',crop.size);ImageDraw.Draw(mask).polygon(polygon,fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(.4))
    pixels=np.asarray(crop,dtype=np.float32)
    blend=np.linspace(0,1,crop.width)[None,:,None]
    board=pixels[:,2:5].mean(axis=1)[:,None,:]*(1-blend)+pixels[:,-4:-1].mean(axis=1)[:,None,:]*blend
    notes.append((box,crop,mask,Image.fromarray(board.astype(np.uint8)),offset))

def animate_notes(image,phase):
    for box,crop,mask,board,offset in notes:
        gust=(.5+.5*math.sin(phase*2+offset))**2
        lift=5*gust;sway=1.8*math.sin(phase*2+offset)
        def bend(x,y):
            free=max(0,min(1,(y-19)/(crop.height-28)))**1.6
            return sway*free,lift*free*(.65+.35*x/crop.width)
        mesh=[]
        for y in range(0,crop.height,8):
            for x in range(0,crop.width,12):
                right,bottom=min(crop.width,x+12),min(crop.height,y+8)
                corners=[]
                for sx,sy in [(x,y),(x,bottom),(right,bottom),(right,y)]:
                    dx,dy=bend(sx,sy);corners.extend((sx-dx,sy+dy))
                mesh.append(((x,y,right,bottom),tuple(corners)))
        paper=crop.transform(crop.size,Image.Transform.MESH,mesh,Image.Resampling.BICUBIC)
        alpha=mask.transform(crop.size,Image.Transform.MESH,mesh,Image.Resampling.BICUBIC)
        image.paste(board,box[:2],mask.filter(ImageFilter.MaxFilter(5)))
        shadow=Image.new('RGBA',crop.size,(36,20,10,0))
        shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(1.3)).point(lambda a:round(a*.22)))
        image.paste(shadow,(box[0]+1,box[1]+2),shadow)
        image.paste(paper,box[:2],alpha)

# Warm, semi-transparent coffee vapour. Advected filaments remain attached to
# the cup rim at (350, 752), spreading and fading as they rise into the room.
steam_x,steam_y,steam_width,steam_height=275,520,150,232
sy,sx=np.mgrid[0:steam_height,0:steam_width]
rise=(steam_height-1-sy)/(steam_height-1)
lamp_glows=[]
for cx,cy,rx,ry in ([(1870,223,100,110),(536,600,125,60)] if night_studio else
                     [(570,155,210,150),(321,574,115,145),(1840,451,130,145),(1870,223,100,110),(235,414,125,60)]):
    lamp_glows.append(np.exp(-(((xx-cx)/rx)**2+((yy-cy)/ry)**2)*2))
small_bulbs=[]
for cx,cy,rx,ry,offset in ([(1870,223,29,44,1.7)] if night_studio else
                           [(1836,447,43,46,.2),(1870,223,29,44,1.7),(321,574,28,42,3.3)]):
    distance=((xx-cx)/rx)**2+((yy-cy)/ry)**2
    # Dim the complete lantern/globe, including its textured edge, rather
    # than punching a dark spot into its centre. Its housing stays fixed.
    emitter=np.clip((1.2-distance)/.35,0,1)
    spill=np.exp(-distance*.17)
    small_bulbs.append((emitter,spill,offset))

def add_steam(pixels,phase):
    density=np.zeros((steam_height,steam_width),dtype=np.float32)
    for stream in range(5):
        centre=75+rise*(16*math.sin(phase+stream*1.7)+20*np.sin(rise*7-phase*2+stream*.9))+(stream-2)*(2+rise*7)
        spread=1.7+rise*(4.5+stream)
        band=np.exp(-((sx-centre)/spread)**2/2)
        flow=.56+.44*np.sin(rise*18-phase*3+stream*2)**2
        density+=band*flow
    patch=pixels[steam_y:steam_y+steam_height,steam_x:steam_x+steam_width]
    veil=np.exp(-((sx-(75+18*rise*np.sin(rise*5-phase)))/(7+rise*22))**2/2)
    veil=(veil*.1*np.sin(math.pi*rise)**1.1)[...,None]
    patch[:]=patch*(1-veil)+np.array([208,199,181])*veil
    alpha=np.clip(density*.17*(1-rise)**.8*np.minimum(1,rise*12),0,.39)[...,None]
    patch[:]=patch*(1-alpha)+np.array([244,235,217])*alpha

def wind(x,y,phase):
    if window_config:phase*=2
    weights=[math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2)*2) for cx,cy,rx,ry in zones]
    # Retain the approved fern sway. Other leaves move gently and coherently;
    # the shelf, posters, books and speaker edges are excluded by the mask.
    rest=sum(weight*amount for weight,amount in zip(weights[1:],[2,2.4,1.6,3]))
    return (6.5*math.sin(phase+y/330)*weights[0]+math.sin(phase+y/700)*rest,
            1.4*math.cos(phase+x/400)*weights[0]+.18*math.cos(phase+x/700)*rest)

def render(phase,window_frame=None):
    scene=base
    if window_frame is not None:
        scene=base.copy();scene.paste(window_frame,tuple(window_config['box'][:2]),window_mask)
    mesh=[];step=80
    for y in range(0,height,step):
        for x in range(0,width,step):
            right,bottom=min(width,x+step),min(height,y+step)
            corners=[]
            for sx,sy in [(x,y),(x,bottom),(right,bottom),(right,y)]:
                dx,dy=wind(sx,sy,phase);corners.extend((sx+dx,sy+dy))
            mesh.append(((x,y,right,bottom),tuple(corners)))
    displaced=scene.transform(scene.size,Image.Transform.MESH,mesh,Image.Resampling.BICUBIC)
    moving=Image.composite(displaced,scene,leaf_mask)
    assert np.array_equal(np.asarray(moving)[330:500,1290:1460],np.asarray(base)[330:500,1290:1460])
    for left,top,right,bottom in frame_regions:
        assert np.array_equal(np.asarray(moving)[top:bottom,left:right],np.asarray(base)[top:bottom,left:right])
    for index,(x,y,crop,mask) in enumerate(reels):
        moving.paste(crop.rotate(-phase*180/math.pi*(index+1),resample=Image.Resampling.BICUBIC),(x,y),mask)
    for index,(x,y,radius,crop,mask) in enumerate(cones):
        scale=1+.018*energy(phase,index*.8)*math.sin(phase*12+index*.3)
        inverse=1/scale;offset=radius*(1-inverse)
        cone=crop.transform(crop.size,Image.Transform.AFFINE,(inverse,0,offset,0,inverse,offset),Image.Resampling.BICUBIC)
        moving.paste(cone,(x,y),mask)
    animate_meters(moving,phase)
    animate_pages(moving,phase)
    animate_notes(moving,phase)
    pixels=np.asarray(moving,dtype=np.float32)
    add_steam(pixels,phase)
    add_dust(pixels,phase,1)
    light=1+(.0 if night_studio else .045*math.sin(phase)*warm)+.028*math.sin(phase*2+.7)*pink
    for index,glow in enumerate(lamp_glows):
        # Irregular-looking but periodic, low-amplitude filament flicker.
        flutter=.012*math.sin(phase*(17+index*2)+index)+.008*math.sin(phase*(31-index)+index*.7)
        breath=.055*math.sin(phase*(index%2+1)+index*1.3)
        light+=(flutter+breath)*glow
    for emitter,spill,offset in small_bulbs:
        light*=1-(1-bulb_power(phase,offset))*(.72*emitter+.13*spill)
    pixels*=light[...,None]
    moving=Image.fromarray(np.clip(pixels,0,255).astype(np.uint8))
    moving.paste(base,(0,0),hardware_mask)
    return moving

if args.preview:
    sheet=Image.new('RGB',(1920,1080))
    for index,second in enumerate([0,1.18,1.57,3.96]):
        shot=render(second/6*2*math.pi)
        shot.save(sources/f'room-motion-preview-{index}.webp',quality=94)
        sheet.paste(shot.resize((960,540),Image.Resampling.LANCZOS),((index%2)*960,(index//2)*540))
    sheet.save(sources/'room-motion-preview.jpg',quality=93)
    print('Saved four object-motion and flicker preview frames.')
    raise SystemExit(0)

fps=30
frames=window_config['frames'] if window_config else 180
seconds=frames/fps
decoder=None
if window_config:
    x,y,right,bottom=window_config['box'];window_width=right-x;window_height=bottom-y
    crop_x,crop_y=window_config.get('crop_center',[.5,.3])
    filters=f'fps=30,scale={window_width}:{window_height}:force_original_aspect_ratio=increase:flags=lanczos,crop={window_width}:{window_height}:(iw-ow)*{crop_x}:(ih-oh)*{crop_y}'
    decoder=subprocess.Popen([args.ffmpeg,'-v','error','-i',str(sources/window_config['source']),'-an','-vf',filters,'-f','rawvideo','-pix_fmt','rgb24','pipe:1'],stdout=subprocess.PIPE)
destination=output/'room-ambient.mp4'
temporary=output/'room-ambient.pending.mp4'
encoder=subprocess.Popen([args.ffmpeg,'-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','1920x1080','-r',str(fps),'-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','19','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',str(temporary)],stdin=subprocess.PIPE)
for frame in range(frames):
    window_frame=None
    if decoder:
        raw=decoder.stdout.read(window_width*window_height*3)
        if len(raw)!=window_width*window_height*3:raise RuntimeError('Window footage ended before its measured duration')
        window_frame=Image.frombytes('RGB',(window_width,window_height),raw)
    image=render(frame/frames*math.pi*2,window_frame)
    if frame in [0,45,90,135]:
        # The rigid PC region is byte-identical before encoding.
        assert np.array_equal(np.asarray(image)[265:885,695:1250],np.asarray(base)[265:885,695:1250])
        if frame==45:image.crop((260,575,430,840)).save(sources/'coffee-steam-detail.webp',quality=95)
    encoder.stdin.write(image.tobytes())
    if frame%30==0:print(f'Rendered {frame+1}/{frames} frames',flush=True)
encoder.stdin.close()
if encoder.wait()!=0:raise RuntimeError('Ambient room encoding failed')
if decoder:
    decoder.stdout.close()
    if decoder.wait()!=0:raise RuntimeError('Window footage decoding failed')
temporary.replace(destination)
mobile=output/'room-ambient-mobile.pending.mp4'
subprocess.run([args.ffmpeg,'-v','error','-y','-i',str(destination),'-an','-vf','scale=960:540','-c:v','libx264','-threads','2','-preset','fast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',str(mobile)],check=True)
mobile.replace(output/'room-ambient-mobile.mp4')
metadata={'size':[1920,1080],'mobile_size':[960,540],'fps':fps,'frames':frames,'duration':seconds,'audio':False,'camera':'fixed','pc':'fixed source plate, independent of animated environment','motion':'isolated fern and leaf sway, layered coffee steam, differential tape reels, moving VU needles, curled magazine corners, pinned sticky-note flutter, ambient dust and upper-right lantern flicker; removed lamps have no effects','window':window_config,'source':room_source.name,'method':'local ambient motion with user-supplied window video at natural speed'}
(sources/'room-render.json').write_text(json.dumps(metadata,indent=2))
print(json.dumps({'file':str(destination),'duration':seconds,'frames':frames,'bytes':destination.stat().st_size}))
