"""Extract real photographed phone hardware; composite unchanged dark UI captures."""
from collections import deque
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'scripts/showcase-sources/cashbell-v2'


def largest_component(binary):
    h,w=binary.shape
    work=binary.copy()
    largest=[]
    for y,x in zip(*np.where(binary)):
        if not work[y,x]:continue
        queue=deque([(int(y),int(x))]);work[y,x]=False;component=[]
        while queue:
            cy,cx=queue.popleft();component.append((cy,cx))
            for ny,nx in ((cy-1,cx),(cy+1,cx),(cy,cx-1),(cy,cx+1)):
                if 0<=ny<h and 0<=nx<w and work[ny,nx]:
                    work[ny,nx]=False;queue.append((ny,nx))
        if len(component)>len(largest):largest=component
    result=np.zeros((h,w),np.uint8)
    if largest:
        ys,xs=zip(*largest);result[ys,xs]=255
    return result


def screen_corners(hole):
    yy,xx=np.where(hole>0)
    left,right,top,bottom=xx.min(),xx.max(),yy.min(),yy.max()
    rows=np.arange(round(top+(bottom-top)*.18),round(top+(bottom-top)*.82))
    xs=[np.where(hole[y]>0)[0] for y in rows]
    l=np.polyfit(rows,[v[0] for v in xs],1)
    r=np.polyfit(rows,[v[-1] for v in xs],1)
    columns=np.r_[np.arange(round(left+(right-left)*.12),round(left+(right-left)*.30)),
                  np.arange(round(left+(right-left)*.70),round(left+(right-left)*.88))]
    ys=[np.where(hole[:,x]>0)[0] for x in columns]
    t=np.polyfit(columns,[v[0] for v in ys],1)
    b=np.polyfit(columns,[v[-1] for v in ys],1)
    def intersection(side,end):
        x=(side[0]*end[1]+side[1])/(1-side[0]*end[0])
        return [x,end[0]*x+end[1]]
    return [intersection(l,t),intersection(r,t),intersection(r,b),intersection(l,b)]


def outside_region(rim):
    h,w=rim.shape
    visited=np.zeros((h,w),bool)
    queue=deque([(0,0)]);visited[0,0]=True
    while queue:
        y,x=queue.popleft()
        for ny,nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0<=ny<h and 0<=nx<w and not visited[ny,nx] and rim[ny,nx]==0:
                visited[ny,nx]=True;queue.append((ny,nx))
    return visited


def rectify(image,source,target,size):
    matrix=[];values=[]
    for (x,y),(u,v) in zip(target,source):
        matrix.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]])
        values.extend([u,v])
    coeff=np.linalg.solve(matrix,values)
    return image.transform(size,Image.Transform.PERSPECTIVE,coeff,Image.Resampling.BICUBIC)


def main():
    photo=Image.open(SOURCE/'hardware/hand-isolated.jpg').convert('RGB')
    photo=photo.rotate(29.6,Image.Resampling.BICUBIC,expand=True,fillcolor=(242,242,242))
    # This crop isolates the photographed phone; the hand remains in the original.
    photo=photo.crop((900,560,1770,2040))
    rgb=np.array(photo)
    rim=largest_component(np.max(rgb,axis=2)<102)
    body=np.where(outside_region(rim),0,255).astype(np.uint8)
    body_image=Image.fromarray(body)
    bbox=body_image.getbbox()
    photo=photo.crop(bbox);body_image=body_image.crop(bbox)
    rgb=np.array(photo)
    glass=largest_component((np.min(rgb,axis=2)>155)&(np.array(body_image)>0))
    corners=screen_corners(glass)
    hardware=photo.convert('RGBA')
    alpha=np.clip(np.array(body_image).astype(int)-glass.astype(int),0,255).astype(np.uint8)
    # Trim the hand's contact shadows outside the photographed device bezel.
    clip=Image.new('L',photo.size)
    expanded=np.array(corners)+np.array([[-28,-27],[28,-27],[29,34],[-28,34]])
    ImageDraw.Draw(clip).polygon([tuple(p)for p in expanded],fill=255)
    alpha=np.minimum(alpha,np.array(clip))
    hardware.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(.35)))
    # Correct the photographed perspective. An unobstructed strip from the
    # right bezel restores the small area hidden by the thumb on the left.
    target=[[28,28],[672,28],[672,1412],[28,1412]]
    hardware=rectify(hardware,corners,target,(700,1440))
    restored=hardware.crop((674,95,694,1340)).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    hardware.paste(restored,(6,95))
    outer=Image.new('L',hardware.size)
    ImageDraw.Draw(outer).rounded_rectangle((6,4,693,1435),70,fill=255)
    hardware.putalpha(Image.fromarray(np.minimum(np.array(hardware.getchannel('A')),np.array(outer))))
    hardware.save(SOURCE/'hardware/photographed-phone.png')
    glass_image=rectify(Image.fromarray(glass),corners,target,(700,1440))
    glass_image.save(SOURCE/'hardware/display-mask.png')
    (SOURCE/'hardware/geometry.json').write_text(json.dumps({'size':[700,1440],'screen':target,'source':'hand-isolated.jpg','rotation':29.6,'retouch':'Photographic perspective correction; small left bezel occlusion restored from the opposite photographed edge'},indent=2))
    print('Photographed device',hardware.size,'screen',target,flush=True)
    scene=Image.open(SOURCE/'hardware/hand-dark.jpg').convert('RGBA')
    roi=(900,630,1290,1300)
    rgb=np.array(scene.crop(roi).convert('RGB'))
    hole=largest_component(np.min(rgb,axis=2)>165)
    # Measured display edges exclude the bright fingertip touching the bezel.
    scene_corners=np.array([[946,674],[1170,656],[1256,1235],[1025,1266]],float)
    scene_mask=Image.new('L',scene.size)
    scene_mask.paste(Image.fromarray(hole),roi[:2])
    clip=Image.new('L',scene.size)
    ImageDraw.Draw(clip).polygon([tuple(p)for p in scene_corners],fill=255)
    scene_mask=Image.fromarray(np.minimum(np.array(scene_mask),np.array(clip)))
    scene_mask.save(SOURCE/'hardware/scene-display-mask.png')
    (SOURCE/'hardware/scene-geometry.json').write_text(json.dumps({'size':list(scene.size),'screen':scene_corners.tolist(),'source':'hand-dark.jpg','crop':[460,480,1780,1470]},indent=2))


if __name__=='__main__':main()
