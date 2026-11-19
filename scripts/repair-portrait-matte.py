"""Repair the original portrait's hair transparency, without changing RGB pixels.

The old matte accidentally removed dark hair between the left curl and temple.
Those original pixels remain in the WebP, so only their alpha needs restoring.
No face synthesis, inpainting, recolouring or replacement photograph is used.
"""
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFilter

ROOT=Path(__file__).resolve().parents[1]
original=Image.open(ROOT/'src/hero-original.webp').convert('RGBA')
pixels=np.array(original)
old_alpha=pixels[:,:,3].copy()
scale=8
repair=Image.new('L',(original.width*scale,original.height*scale))
boundary=[(295,66),(304,73),(299,82),(292,92),(287,100),(282,114),(281,125),(279,137),(271,132),(266,118),(263,103),(274,94),(281,80),(290,70)]
ImageDraw.Draw(repair).polygon([(x*scale,y*scale)for x,y in boundary],fill=254)
repair=repair.resize(original.size,Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(.25))
fill=np.array(repair)
alpha=np.maximum(old_alpha,fill)
# Preserve every fully covered face/body pixel and clean low-opacity matte noise
# only around the hair's outer edge, above and beside the face.
alpha[old_alpha>=250]=old_alpha[old_alpha>=250]
hair=alpha[0:140,248:455]
hair[hair<24]=0
pixels[:,:,3]=alpha
result=Image.fromarray(pixels)
target=ROOT/'src/hero-original-clean.webp'
result.save(target,lossless=True,exact=True,method=6)
decoded=np.array(Image.open(target).convert('RGBA'))
assert np.array_equal(decoded[:,:,:3],pixels[:,:,:3]),'Original photograph RGB must stay exact.'
assert np.array_equal(decoded[145:,:,:],np.array(original)[145:,:,:]),'Face/body below the repair must stay unchanged.'
print(f'Repaired original hair matte; RGB preserved. Alpha changed at {np.count_nonzero(alpha!=old_alpha)} pixels.')
