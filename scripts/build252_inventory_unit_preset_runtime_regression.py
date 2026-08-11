from pathlib import Path
import re
import json, re, subprocess, tempfile, textwrap

ROOT=Path(__file__).resolve().parents[1]
js=(ROOT/'public/js/admin-site-item-inventory.js').read_text(encoding='utf-8')
api=(ROOT/'functions/api/admin/inventory-bootstrap.js').read_text(encoding='utf-8')
checks=[]

def check(label, ok):
    checks.append((label,bool(ok)))
    print(('PASS' if ok else 'FAIL')+': '+label)

# Declaration must exist before render's datalist use.
decl=js.find('let unitPresetOptions = [')
use=js.find('${unitPresetOptions.map')
assign=js.find('unitPresetOptions = Array.isArray(data?.unit_presets)')
check('unit presets initialized before render use', decl >= 0 and use >= 0 and decl < use)
check('bootstrap may replace initialized unit presets', assign > decl)
check('inventory bootstrap cache key is current', "inventory-bootstrap-v252" in js)

# Verify client defaults and server defaults remain the same ordered list.
def extract_list(text, prefix):
    i=text.find(prefix)
    if i<0: return []
    j=text.find(']',i)
    body=text[text.find('[',i)+1:j]
    return re.findall(r"'([^']+)'", body)
client=extract_list(js,'let unitPresetOptions = [')
server=extract_list(api,'unit_presets: [')
check('client unit defaults are nonempty', len(client) >= 20)
check('client/server unit presets are identical', client == server)

for rel in ['admin/inventory-operations/index.html','admin/mobile-inventory/index.html','admin/products/index.html']:
    text=(ROOT/rel).read_text(encoding='utf-8')
    m = re.search(r'/public/js/admin-site-item-inventory\.js\?v=(\d+)', text)
    check(f'{rel} cache-busts inventory bundle at v252 or newer', bool(m and int(m.group(1)) >= 252))

# Run the browser bundle in a minimal DOM VM with authentication off. This exercises
# the exact synchronous render path that previously threw before any API call.
node_script = r'''
const fs=require('fs'), vm=require('vm');
const code=fs.readFileSync(process.argv[2],'utf8');
class El {
  constructor(id=''){this.id=id;this.value='';this.textContent='';this.innerHTML='';this.style={};this.classList={toggle(){},add(){},remove(){}};this.dataset={};this.options=[];this.checked=false;this.disabled=false;this.hidden=false;}
  addEventListener(){} removeEventListener(){} getAttribute(){return null} setAttribute(){} querySelector(){return new El()} querySelectorAll(){return []} closest(){return new El()} scrollIntoView(){}
}
const els=new Map();
const document={
  addEventListener(name,cb){ if(name==='DOMContentLoaded') cb(); },
  getElementById(id){ if(!els.has(id)) els.set(id,new El(id)); return els.get(id); },
  querySelector(){return new El()},querySelectorAll(){return []}
};
els.set('siteInventoryAdminMount',new El('siteInventoryAdminMount'));
const context={document,window:{DDAuth:{isLoggedIn(){return false}}},console,setTimeout,clearTimeout,Intl,Number,String,Array,Math,JSON,encodeURIComponent,decodeURIComponent};
context.window.window=context.window;context.window.document=document;context.window.confirm=()=>false;context.window.prompt=()=>null;context.window.localStorage={getItem(){return null},setItem(){},removeItem(){}};
vm.createContext(context);
vm.runInContext(code,context,{filename:'admin-site-item-inventory.js'});
'''
with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False) as f:
    f.write(node_script)
    node_path=f.name
try:
    proc=subprocess.run(['node',node_path,str(ROOT/'public/js/admin-site-item-inventory.js')],capture_output=True,text=True)
    check('initial Inventory Operations render has no ReferenceError', proc.returncode == 0)
    if proc.returncode:
        print(proc.stderr)
finally:
    Path(node_path).unlink(missing_ok=True)

# Simple undeclared statement-assignment guard in this bundle; catches the class of
# mistake that caused unitPresetOptions without pretending to be a full JS linter.
assignment_candidates=[]
for lineno,line in enumerate(js.splitlines(),1):
    m=re.match(r'^\s*([A-Za-z_$][\w$]*)\s*=(?!=)',line)
    if not m: continue
    name=m.group(1)
    if not re.search(r'\b(?:let|const|var)\s+'+re.escape(name)+r'\b',js):
        assignment_candidates.append((lineno,name))
check('no obvious undeclared statement assignments remain in inventory bundle', not assignment_candidates)
if assignment_candidates:
    print('Candidates:',assignment_candidates)

failed=[name for name,ok in checks if not ok]
print(f'\nBuild 252 inventory unit-preset runtime regression: {len(checks)-len(failed)}/{len(checks)} passed')
raise SystemExit(1 if failed else 0)
