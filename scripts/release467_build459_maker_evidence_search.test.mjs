/* Build 459: disposable SQLite records, authorized source projection and bounded finder proofs. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {findMakerEvidence,makerSearchPlan,parseMakerSearch,projectRecord,SEARCH_KINDS} from '../functions/api/admin/_lib/makerEvidenceSearch459.mjs';
import {onRequestGet} from '../functions/api/admin/maker-evidence-search.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=p=>readFileSync(resolve(root,p),'utf8');
const parse=s=>parseMakerSearch(new URLSearchParams(s));

function fixture(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(`
 CREATE TABLE users(user_id INTEGER PRIMARY KEY,email TEXT,display_name TEXT,role TEXT,is_active INTEGER);
 CREATE TABLE sessions(session_id INTEGER PRIMARY KEY,user_id INTEGER,session_token TEXT,token TEXT,expires_at TEXT);
 CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY,project_key TEXT,project_title TEXT,project_type TEXT,project_status TEXT);
 CREATE TABLE maker_design_file_revisions(maker_design_file_revision_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,design_title TEXT,design_key TEXT,revision_no INTEGER,machine_readiness TEXT,object_key TEXT,original_filename TEXT);
 CREATE TABLE workshop_knowledge_entries(workshop_knowledge_entry_id INTEGER PRIMARY KEY,entry_key TEXT,title TEXT);
 CREATE TABLE workshop_knowledge_recipe_versions(workshop_knowledge_recipe_version_id INTEGER PRIMARY KEY,workshop_knowledge_entry_id INTEGER,source_creative_work_project_id INTEGER,version_number INTEGER,recipe_state TEXT,observed_result TEXT);
 CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,item_name TEXT,source_type TEXT,external_key TEXT,is_active INTEGER,do_not_reuse INTEGER);
 CREATE TABLE creative_project_operations(creative_project_operation_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
 CREATE TABLE creative_project_operation_resources(creative_project_operation_id INTEGER,site_item_inventory_id INTEGER);
 CREATE TABLE maker_quality_attempts(maker_quality_attempt_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,review_note TEXT);
 CREATE TABLE maker_finished_pieces(maker_finished_piece_id INTEGER PRIMARY KEY,maker_quality_attempt_id INTEGER,product_id INTEGER,serial_code TEXT,variant_label TEXT,edition_label TEXT,piece_note TEXT);
 INSERT INTO creative_work_projects VALUES (1,'PRIVATE-JEWL-001','Therapeutic ring trial','jewellery','private'),(2,'FORGE-002','Forge tests','metal','active'),(3,'CLAY-003','Resin and clay studies','clay','active');
 INSERT INTO maker_design_file_revisions VALUES(15,1,'Ring model v1','ring_draft',1,'unreviewed','private/RING.stl','jack-private.stl'),(16,2,'Forged pendant','pendant',2,'ready','private/PENDANT.stl','supplier-secret.stl');
 INSERT INTO workshop_knowledge_entries VALUES(5,'RING-KNOW','Ring finishing test'),(6,'FORGE-KNOW','Forge observations');
 INSERT INTO workshop_knowledge_recipe_versions VALUES(7,5,1,1,'approved','private observation for maker only'),(8,6,2,2,'superseded','sensitive failure');
 INSERT INTO site_item_inventory VALUES(9,'Shared jewellers torch','tool','sensitive-location',1,0),(10,'Other forge','tool','other-project-asset',1,1),(11,'Resin supply','supply','private-shop-link',1,0);
 INSERT INTO creative_project_operations VALUES(2,1),(3,2);
 INSERT INTO creative_project_operation_resources VALUES(2,9),(2,9),(2,11),(3,10);
 INSERT INTO maker_quality_attempts VALUES(4,1,'private failure note'),(5,2,'other maker note');
 INSERT INTO maker_finished_pieces VALUES(12,4,100,'RING-01','Original',NULL,'confidential customer piece note'),(13,5,101,'FORGE-02','Gold',NULL,'confidential buyer note');
 INSERT INTO users VALUES(1,'owner@example.invalid','Owner','admin',1),(2,'staff@example.invalid','Staff','staff',1),(3,'retired@example.invalid','Disabled','admin',0);
 INSERT INTO sessions VALUES(1,1,'demo-admin-only','demo-admin-only','2099-12-31 00:00:00'),(2,2,'demo-staff','demo-staff','2099-12-31 00:00:00'),(3,3,'disabled-admin','disabled-admin','2099-12-31 00:00:00');`);
 return {
  prepare(sql){return {bind(...values){return {
   async all(){return {results:sqlite.prepare(sql).all(...values)}},
   async first(){return sqlite.prepare(sql).get(...values)||null}
  };}};},
  close(){sqlite.close()}
 };
}

test('strict allowlist, bounded keyset, literal wildcard and source scope validation',()=>{
 assert.deepEqual(SEARCH_KINDS,['project','design','recipe','tool','piece']);
 assert.deepEqual(parse('kind=design&project_id=1'),{kind:'design',projectId:1,cursor:Number.MAX_SAFE_INTEGER,limit:20,query:''});
 for(const q of ['kind=invoices','kind=tool','kind=design&project_id=-1','kind=piece&q=x','kind=piece&q=','kind=project&limit=99','kind=project&cursor=0','kind=project&project_id=../1'])assert.throws(()=>parse(q));
 const p=makerSearchPlan(parse('kind=project&q=RING%25_%5C&limit=2'));
 assert.match(p.sql,/ORDER BY p\.creative_work_project_id DESC LIMIT \?/);
 assert.match(p.sql,/ESCAPE/);
 assert.equal(p.bind.at(-1),3);
 assert.ok(p.bind.some(v=>typeof v==='string'&&v.includes('\\%\\_\\\\')),'Literal % _ and backslash must be escaped, not treated as LIKE wildcards');
});

test('project pagination is source-ID stable and preserves private internal status without media',async()=>{
 const db=fixture();try{
  const first=await findMakerEvidence(db,parse('kind=project&limit=2'));
  assert.deepEqual(first.results.map(x=>x.source_id),[3,2]);assert.equal(first.has_more,true);assert.equal(first.next_cursor,2);
  const second=await findMakerEvidence(db,parse('kind=project&cursor=2&limit=2'));
  assert.deepEqual(second.results.map(x=>x.source_id),[1]);assert.equal(second.has_more,false);
  assert.equal(second.results[0].status,'private');assert.match(second.results[0].source_href,/creative-process/);
  assert.equal(second.results[0].private_media_not_exposed,true);
 }finally{db.close()}
});

test('exact scoped design, recipe, linked tool and piece queries return only safe metadata',async()=>{
 const db=fixture();try{
  const checks=[
   ['kind=design&project_id=1',15,'/admin/project-design-files/'],
   ['kind=recipe&project_id=1',7,'/admin/workshop-knowledge/'],
   ['kind=tool&project_id=1',9,'/admin/shared-tools/'],
   ['kind=piece&project_id=1',12,'/admin/finished-pieces/']
  ];
  for(const [input,id,path] of checks){const r=await findMakerEvidence(db,parse(input));
   assert.equal(r.results.length,1,input);assert.equal(r.results[0].source_id,id,input);
   assert.equal(r.results[0].project_id,1,input);assert.equal(r.results[0].source_href.startsWith(path),true,input);
   assert.deepEqual(Object.keys(r.results[0]).sort(),[
    'detail','exact_source_id_must_be_checked_in_owner_module','kind','private_media_not_exposed',
    'project_href','project_id','publication_approval_inferred','source_href','source_id','status','title'].sort());
   assert.doesNotMatch(JSON.stringify(r),/private\/RING|jack-private|confidential|sensitive|object_key|original_filename|customer|note|https?:\/\//i);
  }
  assert.equal((await findMakerEvidence(db,parse('kind=tool&project_id=2'))).results[0].source_id,10);
  assert.equal((await findMakerEvidence(db,parse('kind=tool&project_id=1&q=other'))).results.length,0,'tool search must never leak another project');
  assert.equal((await findMakerEvidence(db,parse('kind=piece&project_id=2'))).results[0].source_id,13);
 }finally{db.close()}
});

test('user text stays bound; substring matching and no guessed status',async()=>{
 const db=fixture();try{
  const ring=await findMakerEvidence(db,parse('kind=design&q=ring'));
  assert.deepEqual(ring.results.map(x=>x.source_id),[15]);
  assert.equal(ring.results[0].status,'unreviewed');
  const injection=await findMakerEvidence(db,parse('kind=design&q=%27%20OR%201%3D1%20--'));
  assert.equal(injection.results.length,0);
  assert.equal(projectRecord({source_id:0,project_id:1,title:'fake'},'design'),null);
 }finally{db.close()}
});

test('anonymous caller is denied before D1 access; no public or writable maker search',async()=>{
 const response=await onRequestGet({request:new Request('https://devilndove.com/api/admin/maker-evidence-search?kind=project'),env:{}});
 assert.equal(response.status,401);assert.equal((await response.json()).code,'MAKER_AUTH_REQUIRED');
 const endpoint=file('functions/api/admin/maker-evidence-search.js');assert.match(endpoint,/getAdminUserFromRequest/);
 assert.match(endpoint,/Cache-Control/);assert.doesNotMatch(endpoint,/onRequestPost|onRequestPut|onRequestDelete|\.put\(|\.delete\(|\.run\(/);
 const helper=file('functions/api/admin/_lib/makerEvidenceSearch459.mjs');
 assert.doesNotMatch(helper,/R2|object_key\s+AS|original_filename\s+AS|customer_email|private_url|PRAGMA|CREATE TABLE|SELECT \*/);
});

test('only an active verified Admin can search; staff and disabled roles fail closed',async()=>{
 const db=fixture();try{
  for(const token of ['demo-staff','disabled-admin','incorrect-token']){
   const denied=await onRequestGet({request:new Request('https://devilndove.com/api/admin/maker-evidence-search?kind=design&project_id=1',{
    headers:{Cookie:'dd_auth_token='+token}}),env:{DB:db}});
   assert.equal(denied.status,401,token);
  }
  const ok=await onRequestGet({request:new Request('https://devilndove.com/api/admin/maker-evidence-search?kind=design&project_id=1',{
   headers:{Cookie:'dd_auth_token=demo-admin-only'}}),env:{DB:db}});
  assert.equal(ok.status,200);assert.match(ok.headers.get('Cache-Control'),/private, no-store/);
  const payload=await ok.json();assert.equal(payload.ok,true);assert.equal(payload.results.length,1);
  assert.equal(payload.results[0].source_id,15);
  assert.doesNotMatch(JSON.stringify(payload),/private\/RING|jack-private|confidential|sensitive/);
 }finally{db.close()}
});

test('maker workbench and Finder are keyboard-usable with every-card circular help',()=>{
 const html=file('admin/maker-evidence-search/index.html'),js=file('public/js/admin-maker-evidence-search-459.js');
 assert.match(html,/id="mfStatus"[^>]*role="status"[^>]*aria-live="polite"/);
 assert.match(html,/name="viewport" content="width=device-width,initial-scale=1"/);
 assert.match(html,/href="#mfMain"/);assert.match(html,/:focus-visible/);assert.match(html,/@media\(max-width:600px\)/);
 for(const label of ['mfKind','mfQuery','mfProject'])assert.match(html,new RegExp(`for="${label}"`));
 for(const id of ['mfPrevious','mfNext','mfSearch','mfClear'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(js,/document\.createElement\('details'\)/);assert.match(js,/ⓘ/);assert.match(js,/textContent/);
 assert.match(js,/credentials:'same-origin'/);assert.doesNotMatch(js,/localStorage|sessionStorage|method:'POST'|\.innerHTML/);
 assert.match(file('admin/maker-workbench/index.html'),/href="\/admin\/maker-evidence-search\/"/);
 assert.match(file('public/js/maker-workbench-policy-457.mjs'),/key:'finder'/);
 assert.ok(existsSync(resolve(root,'admin/maker-evidence-search/index.html')));
});
