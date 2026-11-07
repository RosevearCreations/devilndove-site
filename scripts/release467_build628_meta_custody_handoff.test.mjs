import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {FORMAT_627,DECISION_627,canonicalDecision627}
  from '../functions/api/_lib/trustChannelDecision627.js';
import {FORMAT_628,DECISION_628,HOLD_628,canonicalCustody628,verifyCustody628}
  from '../functions/api/_lib/trustCustodyHandoff628.js';
import {onRequestGet,onRequestPost}
  from '../functions/api/admin/trust-custody-handoff-628.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const H=x=>x.repeat(64),now='2026-11-07T09:00:00.000Z';
const b64=x=>Buffer.from(x).toString('base64url');
const hash=async s=>Buffer.from(await webcrypto.subtle.digest('SHA-256',
  new TextEncoder().encode(s))).toString('hex');

async function fixture(){
  const ids={ISSUER:'original-meta-issuer-628',WITNESS:'independent-meta-witness-628',
    OWNER:'original-meta-account-owner-628'},keys={},roots={},pins={};
  for(const [role,id] of Object.entries(ids)){
    const key=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
    const raw=new Uint8Array(await webcrypto.subtle.exportKey('raw',key.publicKey));
    const fp=Buffer.from(await webcrypto.subtle.digest('SHA-256',raw)).toString('hex');
    keys[id]=key.privateKey;pins[id]=fp;
    roots[id]={authority_id:id,role,public_key:b64(raw),key_sha256:fp,
      status:'ACTIVE_EXTERNAL_VERIFIED'};
  }
  const signatures=async msg=>Promise.all(['ISSUER','WITNESS','OWNER'].map(async role=>({
    role,authority_id:ids[role],
    signature:b64(await webcrypto.subtle.sign('Ed25519',keys[ids[role]],
      new TextEncoder().encode(msg)))})));
  const original={format:FORMAT_627,witness_sha256:H('a'),
    authorization_id:'one-actual-verified-original-meta-get-628',
    enrollment_sha256:H('b'),test_nonce:'one-original-meta-provider-get-nonce-628',
    page_id:'112233445566',receipt_sha256:H('c'),window_sha256:H('d'),
    owner_ledger_head_sha256:H('e'),decision:DECISION_627,
    nonce:'fresh-original-signed-decision-628',
    issued_at:'2026-11-07T08:58:00.000Z',expires_at:'2026-11-07T09:04:00.000Z'};
  const originalBundle={payload:original,
    signatures:await signatures(canonicalDecision627(original,now))};
  const packetHash=await hash(JSON.stringify(originalBundle));
  const custody={format:FORMAT_628,
    original_decision_sha256:await hash(canonicalDecision627(original,now)),
    original_packet_sha256:packetHash,witness_sha256:original.witness_sha256,
    receipt_sha256:original.receipt_sha256,page_id:original.page_id,
    primary_custody_ref:'https://archive-original.example.org/meta/receipt-628',
    secondary_custody_ref:'https://independent-custodian.example.net/meta/receipt-628',
    primary_packet_sha256:packetHash,secondary_packet_sha256:packetHash,
    decision:DECISION_628,nonce:'independent-original-custody-nonce-628',
    issued_at:'2026-11-07T08:59:00.000Z',expires_at:'2026-11-07T09:03:00.000Z'};
  const custodyBundle={payload:custody,
    signatures:await signatures(canonicalCustody628(custody,now))};
  const receipt={witness_sha256:original.witness_sha256,
    authorization_id:original.authorization_id,enrollment_sha256:original.enrollment_sha256,
    test_nonce:original.test_nonce,page_id:original.page_id,
    receipt_sha256:original.receipt_sha256,window_sha256:original.window_sha256,
    owner_ledger_head_sha256:original.owner_ledger_head_sha256,
    window_expires_at:'2026-11-07T09:06:00.000Z',
    original_signers:originalBundle.signatures.map(s=>({role:s.role,authority_id:s.authority_id})),
    original_source_verified:true,actual_meta_get_verified:true};
  return {ids,roots,pins,original,custody,originalBundle,custodyBundle,
    context:{receipt,roots:async id=>roots[id],pins,now,cryptoApi:webcrypto}};
}

test('628 verifies three original custody signatures against exact already-witnessed 627 packet',async()=>{
  const f=await fixture();
  const result=await verifyCustody628(f.custodyBundle,
    {originalBundle:f.originalBundle,...f.context});
  assert.equal(result.verified_original_custody_signatures,true);
  assert.equal(result.actual_original_meta_get_witness_reverified,true);
  assert.equal(result.distinct_archive_domains_declared,true);
  assert.equal(result.archive_contents_independently_read_back,false);
  assert.equal(result.owner_handoff_review_candidate_only,true);
  assert.equal(result.go_live_eligible,false);
  assert.equal(result.provider_channel_connected,false);
  assert.equal(result.release_gate,HOLD_628);
});

test('628 denies forged, expired, reused, changed, single-domain and over-scoped custody',async()=>{
  const f=await fixture();
  const invalid=[{page_id:'98765'},{original_packet_sha256:H('f')},
    {primary_packet_sha256:H('f')},{secondary_packet_sha256:H('f')},
    {original_decision_sha256:H('f')},{receipt_sha256:H('f')},
    {primary_custody_ref:f.custody.secondary_custody_ref},
    {primary_custody_ref:'http://archive-original.example.org/meta/receipt-628'},
    {secondary_custody_ref:'https://archive-original.example.org/second'},
    {primary_custody_ref:'https://archive-original.example.org/meta?token=unsafe'},
    {decision:'ACTIVATE_META_CHANNEL'},
    {expires_at:'2026-11-07T09:06:00.000Z'}];
  for(const change of invalid)
    await assert.rejects(verifyCustody628({payload:{...f.custody,...change},
      signatures:f.custodyBundle.signatures},
    {originalBundle:f.originalBundle,...f.context}));
  await assert.rejects(verifyCustody628(f.custodyBundle,
    {originalBundle:f.originalBundle,...f.context,pins:{}}));
  await assert.rejects(verifyCustody628(f.custodyBundle,
    {originalBundle:f.originalBundle,...f.context,
      roots:async id=>({...f.roots[id],status:'QUARANTINED'})}));
  await assert.rejects(verifyCustody628(f.custodyBundle,
    {originalBundle:f.originalBundle,...f.context,
      receipt:{...f.context.receipt,window_expires_at:'2026-11-07T08:59:00.000Z'}}));
  const stolen=f.custodyBundle.signatures.map(s=>({...s}));
  stolen[1].authority_id=stolen[0].authority_id;
  await assert.rejects(verifyCustody628({...f.custodyBundle,signatures:stolen},
    {originalBundle:f.originalBundle,...f.context}));
  assert.throws(()=>canonicalCustody628({...f.custody,provider_publish:'yes'},now));
});

test('628 proposes immutable owner-approved D1 custody without provider or channel side effects',async()=>{
  const sql=read('migrations/proposed/0063_devilndove_build628_original_meta_decision_custody_hold.sql');
  assert.match(sql,/PROPOSED ONLY/);
  assert.match(sql,/dd628_original_meta_signed_decision_custody/);
  assert.match(sql,/BEFORE UPDATE/);
  assert.match(sql,/BEFORE DELETE/);
  const python=`import sqlite3,sys\n`+
    `db=sqlite3.connect(':memory:')\n`+
    `db.execute('CREATE TABLE dd624_meta_witness_acceptances(witness_sha256 TEXT PRIMARY KEY)')\n`+
    `db.executescript(sys.stdin.read())\n`+
    `db.execute("INSERT INTO dd628_original_meta_signed_decision_custody VALUES("+','.join(['?']*13)+")",`+
    `( 'a'*64,'b'*64,'c'*64,'d'*64,'e'*64,'123','https://a.example.org/a','https://b.example.net/b','{}','{}','ORIGINAL_META_READONLY_DECISION_CUSTODY_OWNER_REVIEW_ONLY',1,'2026-11-07 01:00:00'))\n`+
    `for sql in ['UPDATE dd628_original_meta_signed_decision_custody SET page_id=\"987\"',`+
    `'DELETE FROM dd628_original_meta_signed_decision_custody']:\n`+
    ` try: db.execute(sql);sys.exit(9)\n`+
    ` except sqlite3.IntegrityError: pass\n`+
    `print('IMMUTABLE_CUSTODY_OK')\n`;
  const run=spawnSync('python3',['-c',python],{input:sql,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.match(run.stdout,/IMMUTABLE_CUSTODY_OK/);
  const req=new Request('https://devilndove.com/api/admin/trust-custody-handoff-628');
  assert.equal((await onRequestGet({request:req,env:{}})).status,401);
  assert.equal((await onRequestPost({request:req,env:{}})).status,401);
  const api=read('functions/api/admin/trust-custody-handoff-628.js');
  assert.match(api,/requireAdminStepUp/);
  assert.match(api,/originalReceipt627/);
  assert.match(api,/trustedPins614/);
  assert.match(api,/INSERT INTO dd628_original_meta_signed_decision_custody/);
  assert.doesNotMatch(api,/UPDATE\s+dd628|DELETE FROM dd628|CREATE TABLE|decryptOAuthSecret|probeMetaPage620|refreshOAuthToken|fetch\(/);
  assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),
    /49\. Original Meta signed decision custody/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),
    /trust-authority-614\.mjs\?v=629/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":629/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build628_meta_custody_handoff\.test\.mjs/);
});
