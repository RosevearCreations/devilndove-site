#!/usr/bin/env python3
"""Build 81-90 owner-approved brand-v3 decorative headers from 71-80 art.
Reads original AI-generated category art, never real product/shop photos.
Idempotent: only the ten exact 81-90 WebPs are written.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import math, random

ROOT=Path(__file__).resolve().parents[1]
D=ROOT/"assets/images/brand-v3"
SOURCES={
81:("75-workshop-experiments-category.webp","81-workshop-process-header.webp"),
82:("71-jewellery-category.webp","82-our-story-banner.webp"),
83:("76-custom-gifts-category.webp","83-contact-care-banner.webp"),
84:("79-wire-wrapping-category.webp","84-custom-request-banner.webp"),
85:("80-featured-collection-banner.webp","85-admin-dashboard-header.webp"),
86:("73-polymer-clay-category.webp","86-admin-product-management-header.webp"),
87:("72-resin-art-category.webp","87-admin-inventory-header.webp"),
88:("77-cricut-apparel-category.webp","88-admin-orders-header.webp"),
89:("78-coin-spoon-rings-category.webp","89-admin-production-calendar-header.webp"),
90:("74-candles-category.webp","90-admin-workstations-header.webp")
}
W,H=1440,640
def render(id,original,target):
    src=D/original
    if not src.is_file():
        raise FileNotFoundError(f"Missing source art: {src}")
    im=Image.open(src).convert("RGB")
    sw,sh=im.size
    crop=im.crop((int(sw*.485),int(sh*.17),sw,int(sh*.83)))
    cw,ch=crop.size
    scale=max(865/cw,H/ch)
    crop=crop.resize((round(cw*scale),round(ch*scale)),Image.Resampling.LANCZOS)
    xx=555+(885-crop.width)//2
    yy=(H-crop.height)//2
    base=Image.new("RGB",(W,H))
    pix=base.load()
    for y in range(H):
        glow=.5+.5*math.cos((y/H-.5)*2*math.pi)
        for x in range(W):
            u=x/W
            pix[x,y]=(int(12+19*u+4*glow),int(9+7*u),int(23+25*u+5*glow))
    base.paste(crop,(xx,yy))
    veil=Image.new("RGBA",(W,H),(0,0,0,0))
    mask=Image.new("L",(W,1),0)
    mp=mask.load()
    for x in range(W):
        a=254 if x<455 else max(0,round(254*(1-(x-455)/530))) if x<985 else 10
        mp[x,0]=a
    mask=mask.resize((W,H))
    veil.paste((12,8,28,255),(0,0,W,H))
    veil.putalpha(mask)
    base=Image.alpha_composite(base.convert("RGBA"),veil)
    overlay=Image.new("RGBA",(W,H),(0,0,0,0))
    d=ImageDraw.Draw(overlay)
    d.rounded_rectangle((14,14,W-15,H-15),radius=22,outline=(199,143,95,135),width=2)
    d.line((70,510,445,510),fill=(214,172,94,150),width=2)
    d.ellipse((61,502,77,518),outline=(219,180,105,190),width=2)
    rng=random.Random(9000+id)
    for _ in range(33):
        px=rng.randrange(45,680);py=rng.randrange(55,H-50)
        radius=rng.choice((1,1,1,2,3))
        d.ellipse((px-radius,py-radius,px+radius,py+radius),fill=(222,165,95,rng.randrange(45,140)))
    output=D/target
    Image.alpha_composite(base,overlay).convert("RGB").save(output,"WEBP",quality=89,method=6)
    with Image.open(output) as check:
        assert check.format=="WEBP" and check.size==(W,H)
    print("Created",target,output.stat().st_size,"bytes")
if __name__=="__main__":
    for ident,(source,name) in SOURCES.items():render(ident,source,name)
