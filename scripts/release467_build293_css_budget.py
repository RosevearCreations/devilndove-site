#!/usr/bin/env python3
from pathlib import Path
import re,sys,json
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def q(ok,msg):
    if not ok:F.append(msg)

styles=t('css/styles.css')
responsive=t('css/current-responsive.css')
erg=t('css/admin-ergonomics-v237.css')
design=t('css/design-system-v293.css')
admin=t('css/admin-design-system-v293.css')

def count_important(s): return s.count('!important')

def hex_lum(value):
    h=value.lstrip('#')
    rgb=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    def f(c): return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
    r,g,b=map(f,rgb)
    return .2126*r+.7152*g+.0722*b

def contrast(a,b):
    x,y=hex_lum(a),hex_lum(b)
    hi,lo=max(x,y),min(x,y)
    return (hi+.05)/(lo+.05)

ratios={
 'text_on_bg':contrast('#f6f7fb','#0b0d10'),
 'muted_on_surface':contrast('#b8c1cf','#121722'),
 'focus_on_bg':contrast('#8bd3ff','#0b0d10'),
 'text_on_raised':contrast('#f6f7fb','#18202d'),
}
for name,value in ratios.items():q(value>=4.5,f'Core contrast ratio below 4.5: {name}={value:.2f}')

q(count_important(styles)<=190,f'styles.css specificity budget exceeded: {count_important(styles)} > 190')
q(count_important(responsive)<=49,f'current-responsive.css specificity budget exceeded: {count_important(responsive)} > 49')
q(count_important(erg)<=16,f'admin-ergonomics-v237.css specificity budget exceeded: {count_important(erg)} > 16')
q(count_important(design)==0,'design-system-v293.css may not use !important')
q(count_important(admin)==0,'admin-design-system-v293.css may not use !important')

for token in ('--dd-color-bg','--dd-color-surface','--dd-color-surface-raised','--dd-color-text','--dd-color-text-muted','--dd-color-border','--dd-color-focus','--dd-space-1','--dd-space-6','--dd-control-min','--dd-touch-min','--dd-breakpoint-mobile','--dd-breakpoint-desktop'):
    q(token in design,'Canonical design token missing: '+token)
for token in ('[role="dialog"]','[role="menu"]','.nav-mobile-panel','.resource-tile','.resource-linked-card','focus-visible','pointer:coarse'):
    q(token in design,'Design-system component protection missing: '+token)
for token in ('.dd-v237-card-mode','select option','thead th','[role="dialog"]','[role="menu"]'):
    q(token in admin,'Admin design-system protection missing: '+token)

# Exact duplicate top-level simple rules are pure cascade bloat and must stay removed.
depth=0;depth_at=[0]*(len(styles)+1)
for i,ch in enumerate(styles):
    depth_at[i]=depth
    if ch=='{':depth+=1
    elif ch=='}':depth-=1
depth_at[len(styles)]=depth
seen={};dup=[]
for m in re.finditer(r'([^{}@][^{}]*?)\{([^{}]*)\}',styles):
    if depth_at[m.start()]!=0:continue
    sel=re.sub(r'\s+',' ',m.group(1).strip());body=re.sub(r'\s+',' ',m.group(2).strip())
    if not sel or ';' in sel:continue
    key=sel+'{'+body+'}'
    if key in seen:dup.append(sel)
    else:seen[key]=m.start()
q(not dup,'Exact duplicate top-level CSS rules returned: '+', '.join(dup[:12]))

q('overflow-x:clip' not in responsive,'Responsive root/application layer may not clip horizontal content')
q('overflow-x:auto' in responsive,'Responsive local overflow contract missing')
q('min-height:44px' in responsive,'Responsive touch-target contract missing')
q('min-height:46px' in erg,'Admin narrow-screen touch-target contract missing')

summary={
 'styles_important':count_important(styles),
 'responsive_important':count_important(responsive),
 'ergonomics_important':count_important(erg),
 'design_system_important':count_important(design),
 'admin_design_system_important':count_important(admin),
 'top_level_exact_duplicates':len(dup),
 'contrast_ratios':{k:round(v,2) for k,v in ratios.items()},
}
print('RELEASE 467 BUILD 293 CSS DESIGN-SYSTEM BUDGET')
print(json.dumps(summary,indent=2,sort_keys=True))
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
