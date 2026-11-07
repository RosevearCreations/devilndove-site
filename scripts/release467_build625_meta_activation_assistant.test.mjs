import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {HOLD_625,ORIGINAL_TABLES_625,RECEIPT_TABLES_625,
  schemaReadback625,deriveAssistance625}
  from '../functions/api/_lib/trustActivationAssistant625.js';
import {onRequestGet,onRequestPost}
  from '../functions/api/admin/trust-activation-assistant-625.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const known=ORIGINAL_TABLES_625.flatMap(g=>g[1]);
function fakeD1(tables=known,counts={}){
  const seen=[];return {seen,prepare(sql){seen.push(sql);
    assert.match(sql,/^SELECT /);
    assert.doesNotMatch(sql,/INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|REPLACE|PRAGMA/i);
    if(sql.includes('sqlite_master'))return {all:async()=>({results:tables.map(name=>({name}))})};
    const name=sql.match(/^SELECT COUNT\(\*\) AS n FROM (\w+)$/)?.[1];
    assert.ok(RECEIPT_TABLES_625.includes(name),'only pre-approved receipt tables');
    return {first:async()=>({n:counts[name]||0})};
  }};
}

test('625 reads every source table from SQLite only; missing proposed schema is an exact HOLD',async()=>{
  const db=fakeD1(known.filter(t=>t!=='dd624_meta_witness_acceptances'),
    {dd614_authorities:3,dd614_owner_decisions:1});
  const snapshot=await schemaReadback625(db);
  assert.equal(snapshot.all_source_tables_present,false);
  assert.deepEqual(snapshot.migration_tables.at(-1).missing,['dd624_meta_witness_acceptances']);
  assert.equal(snapshot.receipt_counts.dd624_meta_witness_acceptances,null);
  assert.equal(snapshot.provenance_certified,false);
  const assistant=deriveAssistance625({schema:snapshot,originalWindow:true,liveWitness:true,
    credentialPresent:true,credentialUnexpired:true,providerCandidate:true});
  assert.equal(assistant.source_proof_verified,false);
  assert.equal(assistant.checks[0].complete,false);
  assert.match(assistant.first_action,/0052–0062/);
  assert.equal(assistant.connected,false);
  assert.equal(assistant.automatic_provider_get,false);
});

test('625 never turns counts, archived receipts or simulated GET into verified live original proof',async()=>{
  const count=Object.fromEntries(RECEIPT_TABLES_625.map(t=>[t,100]));
  count.dd616_key_quarantines=0;
  const schema=await schemaReadback625(fakeD1(known,count));
  const missingOriginal=deriveAssistance625({schema,originalWindow:false,liveWitness:false,
    credentialPresent:true,credentialUnexpired:true,providerCandidate:true});
  assert.equal(missingOriginal.source_proof_verified,false);
  assert.equal(missingOriginal.checks.find(c=>c.id==='original_meta_window').complete,false);
  assert.equal(missingOriginal.checks.find(c=>c.id==='independent_witness').complete,false);
  const expired=deriveAssistance625({schema,originalWindow:true,liveWitness:false,
    credentialPresent:true,credentialUnexpired:false,providerCandidate:true});
  assert.equal(expired.checks.find(c=>c.id==='saved_meta_credential').complete,false);
  const quarantine=deriveAssistance625({schema:{...schema,receipt_counts:{...count,
    dd616_key_quarantines:1}},originalWindow:true,liveWitness:true});
  assert.equal(quarantine.checks.find(c=>c.id==='original_authorities').complete,false);
  assert.equal(quarantine.source_proof_verified,false);
  const accepted=deriveAssistance625({schema,originalWindow:true,liveWitness:true,
    credentialPresent:true,credentialUnexpired:true,providerCandidate:true});
  assert.equal(accepted.source_proof_verified,true);
  assert.equal(accepted.actual_readonly_meta_test_witnessed,true);
  assert.equal(accepted.connected,false);
  assert.equal(accepted.publishing_enabled,false);
  assert.equal(accepted.release_gate,HOLD_625);
});

test('625 proposed source schema matches actual 0052–0062 SQL in memory; never applies migrations',()=>{
  const migrations=['0052','0053','0054','0055','0056','0057','0058','0059',
    '0060','0061','0062'];
  const names=readdirSync(new URL('../migrations/proposed/',import.meta.url));
  const files=migrations.map(id=>'migrations/proposed/'+
    names.find(n=>n.startsWith(id+'_')));
  assert.equal(files.length,11);assert.ok(files.every(f=>!f.endsWith('/undefined')));
  const script=`import sqlite3\nc=sqlite3.connect(':memory:')\nfor f in ${JSON.stringify(files)}: c.executescript(open(f).read())\nfor t in ${JSON.stringify(known)}: assert c.execute('SELECT name FROM sqlite_master WHERE name=?',(t,)).fetchone(), t\nprint('625_FULL_SOURCE_SCHEMA_IN_MEMORY_ONLY')`;
  assert.match(execFileSync('python3',['-c',script],{
    cwd:new URL('..',import.meta.url),encoding:'utf8'}),
  /625_FULL_SOURCE_SCHEMA_IN_MEMORY_ONLY/);
  assert.equal(new Set(known).size,known.length);
});

test('625 admin readback is authenticated, no POST action and independent verifiers remain authoritative',async()=>{
  const request=new Request('https://devilndove.com/api/admin/trust-activation-assistant-625');
  assert.equal((await onRequestGet({request,env:{}})).status,401);
  assert.equal((await onRequestPost()).status,405);
  const server=read('functions/api/admin/trust-activation-assistant-625.js');
  assert.match(server,/readOriginalWindow623/);
  assert.match(server,/readActualWitness624/);
  assert.match(server,/ORIGINAL_ONE_GENUINE_META_GET_WITNESSED_READ_ONLY_NO_CONNECTION/);
  assert.doesNotMatch(server,/fetch\(|decryptOAuthSecret|probeMetaPage620|INSERT INTO|UPDATE |DELETE FROM|CREATE TABLE|POST \/feed/);
  assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),/46\. Original-owner Meta activation assistant/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=625/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":625/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build625_meta_activation_assistant\.test\.mjs/);
});
