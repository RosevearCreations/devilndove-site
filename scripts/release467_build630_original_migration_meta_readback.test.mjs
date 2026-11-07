import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {readOriginalMigration630,HOLD_630}
  from '../functions/api/_lib/trustOriginalMigration630.js';
import {onRequestGet,onRequestPost}
  from '../functions/api/admin/trust-original-readiness-630.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const migrations=readdirSync(new URL('../migrations/proposed/',import.meta.url))
  .filter(f=>/^00(?:5[2-9]|6[0-4])_/.test(f)).sort();
function fixture(){
  const sql=read('migrations/proposed/0064_devilndove_build629_original_meta_archive_readback_go_live_hold.sql');
  const source=`import sqlite3,json,sys\n`+
    `db=sqlite3.connect(':memory:')\n`+
    `db.execute('CREATE TABLE dd628_original_meta_signed_decision_custody('+','.join([x+' TEXT' for x in `+
    `${JSON.stringify(['custody_sha256','original_decision_sha256','original_packet_sha256','witness_sha256','receipt_sha256','page_id','primary_custody_ref','secondary_custody_ref','signed_original_decision_json','signed_custody_json','status'])}])+')')\n`+
    `db.executescript(sys.stdin.read())\n`+
    `rows=[dict(type=r[0],name=r[1],tbl_name=r[2],sql=r[3]) for r in db.execute(`+
    `'SELECT type,name,tbl_name,sql FROM sqlite_master WHERE type IN ("table","trigger")')]\n`+
    `columns={r['name']:[{'name':x[1]} for x in db.execute('PRAGMA table_info("'+r['name']+'")')] `+
    `for r in rows if r['type']=='table'}\n`+
    `print(json.dumps({'rows':rows,'columns':columns}))\n`;
  const r=spawnSync('python3',['-c',source],{input:sql,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const original=JSON.parse(r.stdout);
  const calls=[];
  const db={prepare(query){calls.push(query);
    return {bind(...args){return {all:async()=>({results:original.rows.filter(x=>args.includes(x.name))})}},
      all:async()=>({results:query.includes('d1_migrations')?
        migrations.map(name=>({name})):original.columns[query.match(/'([^']+)'/)?.[1]]||[]})};}};
  return {db,calls,original};
}

test('630 inspects ACTUAL bound D1 schema and all thirteen migration ledger entries without DDL',async()=>{
  const f=fixture();const result=await readOriginalMigration630(f.db);
  assert.equal(migrations.length,13);
  assert.equal(result.migration_schema_verified,true);
  assert.equal(result.migration_history_verified,true);
  assert.equal(result.live_migration_readback_verified,true);
  assert.match(result.schema_sha256,/^[a-f0-9]{64}$/);
  assert.equal(result.original_database_identity_independently_attested,false);
  assert.equal(result.release_gate,HOLD_630);
  assert.ok(f.calls.some(x=>x.includes('sqlite_master')));
  assert.ok(f.calls.some(x=>x.includes('d1_migrations')));
  assert.ok(f.calls.every(x=>/^SELECT|^PRAGMA/i.test(x.trim())));
});

test('630 refuses missing ledger entries, altered immutable triggers, absent columns and missing original D1',async()=>{
  assert.equal((await readOriginalMigration630(null)).live_migration_readback_verified,false);
  const original=fixture();const p=original.db.prepare.bind(original.db);
  original.db.prepare=query=>query.includes('d1_migrations')?
    {all:async()=>({results:migrations.filter(n=>!n.startsWith('0064_')).map(name=>({name}))})}:p(query);
  const noLedger=await readOriginalMigration630(original.db);
  assert.equal(noLedger.migration_schema_verified,true);
  assert.equal(noLedger.migration_history_verified,false);
  assert.equal(noLedger.live_migration_readback_verified,false);
  assert.ok(noLedger.missing_original_migration_history.some(n=>n.startsWith('0064_')));
  const altered=fixture();
  altered.original.rows.find(x=>x.name==='dd629_owner_decision_no_delete').sql=
    'CREATE TRIGGER dd629_owner_decision_no_delete BEFORE DELETE ON dd629_original_meta_go_live_decisions BEGIN SELECT 1; END';
  assert.equal((await readOriginalMigration630(altered.db)).migration_schema_verified,false);
  const missing=fixture();missing.original.columns.dd629_original_meta_go_live_decisions=
    missing.original.columns.dd629_original_meta_go_live_decisions.filter(x=>x.name!=='signed_bundle_json');
  assert.equal((await readOriginalMigration630(missing.db)).migration_schema_verified,false);
});

test('630 original-owner first external GET requires separate affirmative consent, no automatic connection',async()=>{
  const api=read('functions/api/admin/trust-original-readiness-630.js');
  const trust=read('functions/api/_lib/trustOriginalMigration630.js');
  const ui=read('public/js/admin-channel-trust-authority-614.mjs');
  assert.match(api,/explicit_two_external_https_get_authorization!==true/);
  assert.match(api,/owner629\(/);
  assert.match(api,/readOriginalMigration630\(getDb\(c\.env\)\)/);
  assert.match(api,/live_migration_readback_verified/);
  assert.doesNotMatch(api,/CREATE TABLE|ALTER TABLE|DELETE FROM|UPDATE\s+dd629|refreshOAuthToken|probeMetaPage620/);
  assert.match(trust,/d1_migrations/);
  assert.match(ui,/51\. Original bound D1 migration readback/);
  assert.match(ui,/owner_supervised_first_archive_readback/);
  assert.match(ui,/reconcile_original_signed_readiness/);
  const req=new Request('https://devilndove.com/api/admin/trust-original-readiness-630');
  assert.equal((await onRequestGet({request:req,env:{}})).status,401);
  assert.equal((await onRequestPost({request:req,env:{}})).status,401);
});

test('630 preserves protected regression, deployment marker and owner-only 0064 migration',()=>{
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":630/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build630_original_migration_meta_readback\.test\.mjs/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),
    /trust-authority-614\.mjs\?v=630/);
  const proposed=read('migrations/proposed/0064_devilndove_build629_original_meta_archive_readback_go_live_hold.sql');
  assert.match(proposed,/PROPOSED ONLY/);
});
