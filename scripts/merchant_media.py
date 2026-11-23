"""Original PaySphere captures and the existing photographic CRM monitor scene."""
from functools import lru_cache
import hashlib
import json
from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageOps, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/showcase-sources/merchant-v1'
SCREENS = SOURCE / 'screens'
OUTPUT = ROOT / 'src/showcases'
PUBLIC = OUTPUT / 'merchant'
FONT = ROOT / 'scripts/showcase-sources/fonts/DM-Sans.ttf'
PHOTO = ROOT / 'scripts/showcase-sources/crm-v2/hardware/monitor-teddy-gr.jpg'
BG, INK, MUTE, ACCENT = '#0a0f1c', '#f0f2ff', '#aeb9d0', '#b3a5ff'

GROUPS = [
    ('overview','Overview & merchant network','A shared operating view, a searchable directory and merchant-scoped access.',
     ['overview','merchant-directory','merchant-self-service','merchant-payments']),
    ('setup','Onboarding & product setup','Business records, payment products, outlet locations, devices and team setup.',
     ['merchant-create','merchant-edit','merchant-products','products-selected','profile-product-configured','outlet-create','device-create','team-create']),
    ('profile','The complete merchant profile','Identity, verification, money, locations, teams, service history and activity.',
     ['merchant-profile','merchant-kyc','merchant-money','merchant-outlets','merchant-team','merchant-cases','merchant-activity']),
    ('control','Verification & independent review','Requests, evidence and separate maker/checker roles keep changes accountable.',
     ['merchant-status','bank-change','pricing-change','document-upload','document-detail','verification-review','approval-request','approval-review']),
    ('payments','Payment operations','Trace a payment, inspect its settlement context and prepare a refund request.',
     ['payments','payment-detail','refund-request']),
    ('settlement','Settlement & reconciliation','Keep calculated funds, original bank outcomes and statement matching distinct.',
     ['settlements','payout-detail','payout-evidence','failed-payout','retry-review','reconciliation']),
    ('service','Service, queues & audit','Review work, track onboarding and keep service cases connected to the merchant.',
     ['work-queue','onboarding-queue','case-queue','operations-audit','case-create','case-detail']),
    ('copilot','Operations Copilot','A prototype assistant that answers from the local sample records and workflow guidance.',
     ['copilot-welcome','copilot-answer','copilot-trace']),
]
TITLES = {
    'overview':'Command centre','merchant-directory':'Merchant directory',
    'merchant-self-service':'Merchant workspace','merchant-payments':'Merchant payment view',
    'merchant-create':'Add a merchant','merchant-edit':'Edit a merchant',
    'merchant-products':'Choose payment products','products-selected':'Select and feature products',
    'profile-product-configured':'The configured merchant overview','outlet-create':'Add an outlet',
    'device-create':'Register a payment device','team-create':'Add a team member',
    'merchant-profile':'Merchant overview','merchant-kyc':'Business & KYC',
    'merchant-money':'Merchant payments & settlements','merchant-outlets':'Outlets & devices',
    'merchant-team':'Merchant team','merchant-cases':'Merchant cases','merchant-activity':'Merchant activity',
    'merchant-status':'Request a status change','bank-change':'Request a bank change',
    'pricing-change':'Preview a pricing change','document-upload':'Add a document',
    'document-detail':'Document details & versions','verification-review':'Verification review',
    'approval-request':'Prepared change request','approval-review':'Independent review decision',
    'payments':'Payment ledger','payment-detail':'Payment trace','refund-request':'Request a refund',
    'settlements':'Settlement ledger','payout-detail':'Unknown transfer outcome',
    'payout-evidence':'Check the original instruction','failed-payout':'Confirmed failed payout',
    'retry-review':'Controlled retry review','reconciliation':'Reconciliation workbench',
    'work-queue':'Independent review queue','onboarding-queue':'Onboarding queue',
    'case-queue':'Cross-merchant case queue','operations-audit':'Operations audit trail',
    'case-create':'Create a support case','case-detail':'Case investigation',
    'copilot-welcome':'Meet the operations assistant','copilot-answer':'An evidence-led summary',
    'copilot-trace':'Trace a payout with context',
}


@lru_cache(maxsize=16)
def shot(key):
    return Image.open(SCREENS / (key+'.jpg')).convert('RGBA')


@lru_cache(maxsize=30)
def font(size, weight=500):
    result=ImageFont.truetype(str(FONT),size)
    result.set_variation_by_axes([32,weight])
    return result


@lru_cache(maxsize=1)
def photo_base():
    original=Image.open(PHOTO).convert('RGB')
    original=original.resize((1920,round(original.height*1920/original.width)),Image.Resampling.LANCZOS)
    # Grade the existing photograph; the photographed device is never generated.
    rgb=np.asarray(original,dtype=np.float32)
    rgb=rgb*np.array([.57,.61,.70],dtype=np.float32)
    return Image.fromarray(np.uint8(np.clip(rgb,0,255))).convert('RGBA')


def photographed_monitor(image, size=(1920,1200)):
    photo=photo_base().copy()
    canvas=Image.new('RGBA',(1600,1000),BG)
    # Gallery previews show the initial viewport; the complete original is linked.
    preview=image.crop((0,0,image.width,min(image.height,960)))
    fitted=ImageOps.contain(preview,canvas.size,Image.Resampling.LANCZOS)
    canvas.alpha_composite(fitted,((canvas.width-fitted.width)//2,(canvas.height-fitted.height)//2))
    quad=np.array([[680,357],[1648,396],[1648,976],[687,1038]],dtype=float)*(photo.width/2400)
    x0,y0=np.floor(quad.min(axis=0)).astype(int)
    x1,y1=np.ceil(quad.max(axis=0)).astype(int)
    matrix=[];values=[]
    for (x,y),(u,v) in zip(quad-[x0,y0],[(0,0),(1600,0),(1600,1000),(0,1000)]):
        matrix.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]])
        values.extend([u,v])
    coeff=np.linalg.solve(matrix,values)
    warped=canvas.transform((x1-x0,y1-y0),Image.Transform.PERSPECTIVE,coeff,Image.Resampling.BICUBIC)
    photo.alpha_composite(warped,(int(x0),int(y0)))
    return ImageOps.fit(photo,size,Image.Resampling.LANCZOS)


def prepare_assets():
    PUBLIC.mkdir(parents=True,exist_ok=True)
    originals=OUTPUT/'screens';originals.mkdir(exist_ok=True)
    capture=json.loads((SCREENS/'capture.json').read_text(encoding='utf8'))
    by_key={s['key']:s for s in capture['screens']}
    expected=[key for _,_,_,keys in GROUPS for key in keys]
    assert len(expected)==len(set(expected))==45
    assert set(expected)==set(by_key), 'Capture inventory must match the complete gallery.'
    groups=[]
    for group_id,title,intro,keys in GROUPS:
        items=[]
        for key in keys:
            source=SCREENS/(key+'.jpg')
            image=shot(key)
            original=originals/('merchant-'+key+'.jpg')
            shutil.copyfile(source,original)
            photographed_monitor(image).convert('RGB').save(PUBLIC/(key+'-mockup.webp'),quality=90,method=4)
            record=by_key[key]
            record['raster']={'width':image.width,'height':image.height}
            record['sha256']=hashlib.sha256(source.read_bytes()).hexdigest()
            items.append({'key':key,'title':TITLES[key],'description':record['description'],
                          'src':'./showcases/screens/merchant-'+key+'.jpg',
                          'width':image.width,'height':image.height,
                          'mockup':'./showcases/merchant/'+key+'-mockup.webp'})
            print('Prepared merchant screen: '+key,flush=True)
        groups.append({'id':group_id,'title':title,'intro':intro,'screens':items})
    data={'name':'PaySphere','screenCount':45,'groups':groups}
    (ROOT/'src/merchant-assets.js').write_text('// Captured native PaySphere screens and photographed monitor previews.\nwindow.merchantShowcaseAssets = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
    (SCREENS/'capture.json').write_text(json.dumps(capture,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return data
