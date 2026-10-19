#!/usr/bin/env python3
"""Generate Devil n Dove Set 7 decorative admin artwork, IDs 61–70.
Safe to rerun: only these ten explicitly named asset files are written.
No dashboard metrics, real customer data or functional controls are depicted.
"""
from pathlib import Path
from html import escape
import io, math, random
from PIL import Image
import cairosvg

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"assets/images/brand-v3"
OUT.mkdir(parents=True, exist_ok=True)
ITEMS=[
 (61,"61-media-content-studio.webp","Media & Content","Studio","Curate imagery and the stories behind each creation.","/admin/media-content-studio/","gallery"),
 (62,"62-product-photography.webp","Product Photo","Workflow","Bring every handmade detail into focus.","/admin/catalog-media/","camera"),
 (63,"63-packaging-labels.webp","Packaging &","Labels","A thoughtful finishing touch, from box to label.","/admin/packaging-studio/","package"),
 (64,"64-shipping-pickup.webp","Shipping &","Pickup","Carefully packed, ready for the next journey.","/admin/orders/","parcel"),
 (65,"65-customer-care.webp","Customer","Care","Connections made personal, one conversation at a time.","/admin/custom-request/","users"),
 (66,"66-marketplace-connections.webp","Marketplace","Connections","Coordinate listings with care and clarity.","/admin/marketplace-readiness/","network"),
 (67,"67-accounting-finance.webp","Accounting &","Finance","Keep the craft and the numbers in balance.","/admin/accounting/","ledger"),
 (68,"68-workshop-safety.webp","Workshop","Safety","Make room for creativity and safe practice.","/admin/workshop-readiness/","shield"),
 (69,"69-social-content.webp","Social &","Content","Capture the process, not just the polished result.","/admin/creative-automation/","film"),
 (70,"70-it-integrations.webp","IT &","Integrations","The connections that keep the workshop running.","/admin/it-integrations/","cog"),
]
ICONS={
"gallery":'<rect x="2.5" y="4" width="19" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.6"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
"camera":'<path d="M4 7h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="4"/><path d="M17.5 10h.01"/>',
"package":'<path d="m3 7 9-4 9 4v11l-9 4-9-4V7Z"/><path d="m3 7 9 4 9-4M12 11v11M8 5l9 4"/>',
"parcel":'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M10 5v15M15 14h3M15 17h3"/>',
"users":'<circle cx="8" cy="8" r="3"/><path d="M2.5 19v-1.6A5.5 5.5 0 0 1 8 12h1A5.5 5.5 0 0 1 14 17.5V19H2.5Z"/><path d="M16 5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v1"/>',
"network":'<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="2" y="16" width="7" height="6" rx="1"/><rect x="15" y="16" width="7" height="6" rx="1"/><path d="M12 8v4M5.5 16v-4h13v4"/>',
"ledger":'<rect x="4" y="2.5" width="16" height="19" rx="2"/><path d="M9 2.5v19M12 8h5M12 12h5M12 16h3"/>',
"shield":'<path d="M12 2 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="m8 12 3 3 5-6"/>',
"film":'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4m-4 5h4m10-5h4m-4 5h4"/><path d="m10 10 5 2-5 2z"/>',
"cog":'<circle cx="12" cy="12" r="3.5"/><path d="M10 2h4l.5 2.5 2 1L19 4l3 3-1.5 2.5 1 2L24 12v1l-2.5.5-1 2L22 18l-3 3-2.5-1.5-2 1L14 23h-4l-.5-2.5-2-1L5 21l-3-3 1.5-2.5-1-2L0 13v-1l2.5-.5 1-2L2 7l3-3 2.5 1.5 2-1z"/>',
}
def create(item,i):
 n,fn,t1,t2,subtitle,route,icon=item
 random.seed(2300+i)
 stars=[]
 for j in range(160):
  x=random.randrange(50,1150);y=random.randrange(50,710)
  if 115<x<650 and 185<y<625: continue
  radius=random.choice([1,1,1,2,2,3])
  stars.append(f'<circle cx="{x}" cy="{y}" r="{radius}" fill="#ca9a88" opacity="{random.choice([.12,.16,.21,.3,.5])}"/>')
 ticks=[]
 for deg in range(0,360,15):
  angle=math.radians(deg+i*3)
  r1=225 if deg%45==0 else 238
  r2=260 if deg%45==0 else 250
  x1=875+math.cos(angle)*r1;y1=381+math.sin(angle)*r1
  x2=875+math.cos(angle)*r2;y2=381+math.sin(angle)*r2
  ticks.append(f'<path d="M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}" stroke="#e7af79" opacity=".57" stroke-width="1.7"/>')
 subtitle=escape(subtitle).replace("&","&amp;") if "&" in subtitle else escape(subtitle)
 # One deliberately plain sentence below the ornamental title. Never fake live controls.
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
 <defs>
 <radialGradient id="bg"><stop stop-color="#4b1c63"/><stop offset=".57" stop-color="#211037"/><stop offset="1" stop-color="#10091c"/></radialGradient>
 <radialGradient id="glow"><stop stop-color="#a348a0" stop-opacity=".3"/><stop offset="1" stop-color="#10091c" stop-opacity="0"/></radialGradient>
 <linearGradient id="gold"><stop stop-color="#eab976"/><stop offset=".5" stop-color="#fff0bb"/><stop offset="1" stop-color="#c68558"/></linearGradient>
 </defs>
 <rect width="1200" height="760" fill="url(#bg)"/>
 <rect x="560" y="35" width="620" height="700" fill="url(#glow)"/>
 {''.join(stars)}
 <rect x="27" y="24" width="1146" height="712" rx="29" fill="none" stroke="#a5685a" opacity=".8" stroke-width="2"/>
 <rect x="41" y="38" width="1118" height="684" rx="22" fill="none" stroke="#916278" opacity=".42"/>
 <g fill="none" stroke="url(#gold)" stroke-width="2"><circle cx="63" cy="60" r="21"/><circle cx="1137" cy="60" r="21"/><circle cx="63" cy="699" r="21"/><circle cx="1137" cy="699" r="21"/></g>
 <g fill="#f3d6a1"><circle cx="63" cy="60" r="4"/><circle cx="1137" cy="60" r="4"/><circle cx="63" cy="699" r="4"/><circle cx="1137" cy="699" r="4"/></g>
 <text x="105" y="117" font-family="Liberation Serif,serif" font-size="59" fill="url(#gold)">D&amp;D</text>
 <text x="255" y="110" font-family="DejaVu Sans,sans-serif" font-size="17" letter-spacing="4" fill="#d3a184">DEVIL n DOVE</text>
 <path d="M105 143 H548" stroke="#ad745a" stroke-width="2"/>
 <rect x="83" y="170" width="565" height="481" rx="28" fill="#10071e" fill-opacity=".85" stroke="#a77470" stroke-opacity=".5" stroke-width="2"/>
 <rect x="101" y="192" width="5" height="436" fill="#b05f96"/>
 <text x="124" y="240" font-family="DejaVu Sans,sans-serif" font-weight="bold" font-size="17" letter-spacing="3" fill="#d0a082">COLLECTION 07 / {n}</text>
 <text x="122" y="356" font-family="Liberation Serif,serif" font-size="77" fill="url(#gold)">{escape(t1)}</text>
 <text x="122" y="439" font-family="Liberation Serif,serif" font-size="77" fill="url(#gold)">{escape(t2)}</text>
 <path d="M123 494 H471" stroke="#c38c75" stroke-width="2"/>
 <text x="123" y="540" font-family="DejaVu Sans,sans-serif" font-size="21" fill="#d9c6d5">{subtitle}</text>
 <text x="124" y="622" font-family="DejaVu Sans,sans-serif" font-size="16" fill="#b2a0b7" letter-spacing="1">ADMIN VISUAL SERIES / 61–70</text>
 <g fill="none" stroke="#d6a173"><circle cx="875" cy="381" r="231" opacity=".7" stroke-width="2"/><circle cx="875" cy="381" r="214" opacity=".7"/><circle cx="875" cy="381" r="188" stroke-width="3" opacity=".75"/></g>
 {''.join(ticks)}
 <circle cx="875" cy="381" r="169" fill="#12091e" stroke="url(#gold)" stroke-width="3"/>
 <path d="M875 208 L1048 381 L875 554 L702 381 Z" fill="none" stroke="#895a89" opacity=".65"/>
 <svg x="748" y="254" width="254" height="254" viewBox="0 0 24 24">
 <g fill="none" stroke="#f0cd90" stroke-width=".65" stroke-linecap="round" stroke-linejoin="round">{ICONS[icon]}</g>
 </svg>
 <text x="805" y="656" font-family="DejaVu Sans,sans-serif" font-size="18" fill="#dbac81" letter-spacing="2">{n} / BRAND V3</text>
 </svg>'''
 im=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode("utf-8")))).convert("RGB")
 im.save(OUT/fn,"WEBP",quality=90,method=6)
 print("created",fn,(OUT/fn).stat().st_size)
if __name__=="__main__":
 for i,item in enumerate(ITEMS):create(item,i)
