from pathlib import Path
import json,re,sqlite3,tempfile,subprocess,os
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(label, cond):
    checks.append(bool(cond)); print(('PASS' if cond else 'FAIL')+': '+label)
startup_api=(ROOT/'functions/api/admin/startup-readiness.js').read_text()
smoke_api=(ROOT/'functions/api/admin/post-deploy-smoke-tests.js').read_text()
startup_client=(ROOT/'public/js/admin-startup-readiness.js').read_text()
smoke_client=(ROOT/'public/js/admin-post-deploy-smoke-tests.js').read_text()
start_html=(ROOT/'admin/startup-readiness/index.html').read_text()
smoke_html=(ROOT/'admin/post-deploy-smoke-tests/index.html').read_text()
mig=(ROOT/'database_build254_startup_smoke_runtime_hardening.sql').read_text()
current=(ROOT/'database_upgrade_current_pass.sql').read_text()

m=re.search(r'const FALLBACK = (\[.*?\]);\n',startup_client,re.S)
fallback=json.loads(m.group(1)) if m else []
check('browser retains complete 46-gate guide', len(fallback)==46 and len({x.get('key') for x in fallback})==46)
check('Startup API uses compact status-v2 contract', "const CONTRACT = 'startup_status_v2'" in startup_api and 'guide_included:false' in startup_api)
check('Startup API no longer embeds full STARTUP_ITEMS guide', 'const STARTUP_ITEMS = [' not in startup_api and len(startup_api.encode()) < 20000)
check('Startup save returns a compact patch instead of rebuilding all 46 gates', "mode:'patch'" in startup_api and "mode:'batch_patch'" in startup_api and 'return json(await readData(access.db))' not in startup_api.split("if(action==='sync_items')",1)[1])
check('browser synchronizes all local recovery changes through one batch action', "action:'sync_items'" in startup_client and 'saved_items' in startup_client)
check('browser merges compact D1 statuses into complete local guide', "data.contract==='startup_status_v2'" in startup_client and 'mergeServerData' in startup_client)
check('smoke API performs no request-time CREATE TABLE', 'CREATE TABLE' not in smoke_api.upper())
check('smoke API restricts quick-run to same origin', 'url.origin!==origin' in smoke_api)
check('smoke quick-run stores results with one D1 batch', 'await auth.db.batch(results.map' in smoke_api)
check('both affected browser bundles are cache-busted to v254', 'admin-startup-readiness.js?v=254' in start_html and 'admin-post-deploy-smoke-tests.js?v=254' in smoke_html)
check('current migration is Build 254 or newer', mig==current or bool(re.search(r'(?:Devil n Dove )?Build (?:25[5-9]|2[6-9][0-9]|[3-9][0-9]{2,})',current)))
check('migration records Build 254 runtime contract and ledger marker', 'compact_status_v2_build254' in mig and 'build254_startup_smoke_runtime_hardening' in mig)

# Execute all aggregate schemas and reapply the migration twice.
for schema in ['database_full_schema.sql','database_schema.sql','database_store_schema.sql']:
    con=sqlite3.connect(':memory:')
    try:
        con.executescript((ROOT/schema).read_text()); con.executescript(mig); con.executescript(mig)
        gates=con.execute('SELECT COUNT(*) FROM startup_readiness_items WHERE is_active=1').fetchone()[0]
        table=con.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='post_deploy_smoke_test_results'").fetchone()[0]
        ledger=con.execute("SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key='build254_startup_smoke_runtime_hardening'").fetchone()[0]
        fk=con.execute('PRAGMA foreign_key_check').fetchall()
        check(f'{schema} executes with Build 254 twice and clean FKs', gates==46 and table==1 and ledger==1 and fk==[])
    finally: con.close()

# Exercise the real server modules with a bounded in-memory D1-shaped mock.
keys=[x['key'] for x in fallback]
node=r'''import fs from 'node:fs';
const root=process.argv[2];const keys=JSON.parse(process.argv[3]);
class Statement{constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}bind(...a){this.args=a;return this;}async first(){if(this.sql.includes('FROM sessions s'))return {session_id:1,user_id:1,resolved_user_id:1,email:'admin@example.test',display_name:'Admin',role:'admin',is_active:1};if(this.sql.includes("sqlite_master"))return {ok:1};if(this.sql.includes('FROM startup_readiness_items WHERE item_key')){const key=this.args[0];return {startup_readiness_item_id:keys.indexOf(key)+1,item_key:key,item_status:'not_started'};}return null;}async all(){if(this.sql.includes('FROM startup_readiness_items')&&this.sql.includes('WHERE is_active=1'))return {results:keys.map((k,i)=>({startup_readiness_item_id:i+1,item_key:k,item_status:'not_started',owner_name:'',due_date:'',evidence_url:'',evidence_notes:'',blocked_reason:'',completed_at:null,updated_at:null}))};if(this.sql.includes('FROM startup_readiness_history'))return {results:[]};if(this.sql.includes('FROM post_deploy_smoke_test_results'))return {results:[{post_deploy_smoke_test_result_id:1,page_url:'https://example.test/',result_status:'passed',http_status:200}]};return {results:[]};}async run(){return {success:true,meta:{}};}}
class DB{prepare(sql){return new Statement(this,sql);}async batch(stmts){return stmts.map(()=>({success:true,meta:{}}));}}
const db=new DB();const wait=[];const base={env:{DB:db},waitUntil(p){wait.push(Promise.resolve(p));}};
const startup=await import('file://'+root+'/functions/api/admin/startup-readiness.js?b254');
let ctx={...base,request:new Request('https://example.test/api/admin/startup-readiness',{headers:{Cookie:'dd_auth_token=test'}})};
let r=await startup.onRequestGet(ctx);let d=await r.json();if(r.status!==200||d.contract!=='startup_status_v2'||d.items.length!==46||d.items[0].item_title!==undefined)throw new Error('compact GET contract failed');
ctx={...base,request:new Request('https://example.test/api/admin/startup-readiness',{method:'POST',headers:{Cookie:'dd_auth_token=test','Content-Type':'application/json'},body:JSON.stringify({action:'save_item',item_key:keys[0],item_status:'in_progress',owner_name:'Admin'})})};r=await startup.onRequestPost(ctx);d=await r.json();if(r.status!==200||d.mode!=='patch'||d.item?.item_key!==keys[0])throw new Error('compact PATCH response failed');
ctx={...base,request:new Request('https://example.test/api/admin/startup-readiness',{method:'POST',headers:{Cookie:'dd_auth_token=test','Content-Type':'application/json'},body:JSON.stringify({action:'sync_items',items:[{item_key:keys[0],item_status:'in_progress',owner_name:'Admin'},{item_key:keys[1],item_status:'in_progress',owner_name:'Admin'}]})})};r=await startup.onRequestPost(ctx);d=await r.json();if(r.status!==200||d.mode!=='batch_patch'||d.saved_items.length!==2)throw new Error('batch sync failed');
const smoke=await import('file://'+root+'/functions/api/admin/post-deploy-smoke-tests.js?b254');ctx={...base,request:new Request('https://example.test/api/admin/post-deploy-smoke-tests',{headers:{Cookie:'dd_auth_token=test'}})};r=await smoke.onRequestGet(ctx);d=await r.json();if(r.status!==200||!d.ok||d.items.length!==1)throw new Error('smoke GET failed');
await Promise.allSettled(wait);console.log('runtime mock PASS');'''
with tempfile.NamedTemporaryFile('w',suffix='.mjs',delete=False) as f:
    f.write(node); tmp=f.name
try:
    proc=subprocess.run(['node','--experimental-default-type=module',tmp,str(ROOT),json.dumps(keys)],capture_output=True,text=True)
    check('real Startup/Smoke server modules pass compact D1 runtime mock', proc.returncode==0)
    if proc.returncode: print(proc.stdout,proc.stderr)
finally: Path(tmp).unlink(missing_ok=True)

passed=sum(checks)
print(f'\nBuild 254 Startup/Smoke runtime regression: {passed}/{len(checks)} passed')
raise SystemExit(0 if passed==len(checks) else 1)
