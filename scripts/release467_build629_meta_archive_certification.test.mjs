import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {FORMAT_627,DECISION_627,canonicalDecision627}
  from '../functions/api/_lib/trustChannelDecision627.js';
import {FORMAT_628,DECISION_628,canonicalCustody628}
  from '../functions/api/_lib/trustCustodyHandoff628.js';
import {FORMAT_629,APPROVE_629,HOLD_DECISION_629,HOLD_629,
  canonicalGoLive629,readExactOriginalArchives629,verifyGoLiveDecision629}
  from '../functions/api/_lib/trustArchiveCertification629.js';
import {onRequestGet,onRequestPost}
  from '../functions/api/admin/trust-archive-certification-629.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const H=x=>x.repeat(64),now='2026-11-07T09:00:00.000Z';
const b64=x=>Buffer.from(x).toString('base64url');
const hash=async s=>Buffer.from(await webcrypto.subtle.digest('SHA-256',
  new TextEncoder().encode(s))).toString('hex');

async function fixture(){
  const ids={ISSUER:'original-meta-issuer-629',WITNESS:'independent-meta-witness-629',
    OWNER:'original-meta-page-owner-629'},keys={},roots={},pins={};
  for(const [role,id] of Object.entries(ids)){
    const key=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
    const raw=new Uint8Array(await webcrypto.subtle.exportKey('raw',key.publicKey));
    const fp=Buffer.from(await webcrypto.subtle.digest('SHA-256',raw)).toString('hex');
    roots[id]={authority_id:id,role,public_key:b64(raw),key_sha256:fp,
      status:'ACTIVE_EXTERNAL_VERIFIED'};
    pins[id]=fp;keys[id]=key.privateKey;
  }
  const sign=async msg=>Promise.all(['ISSUER','WITNESS','OWNER'].map(async role=>({
    role,authority_id:ids[role],signature:b64(await webcrypto.subtle.sign('Ed25519',
      keys[ids[role]],new TextEncoder().encode(msg)))})));
  const p627={format:FORMAT_627,witness_sha256:H('a'),
    authorization_id:'original-live-meta-authorization-629',
    enrollment_sha256:H('b'),test_nonce:'original-provider-single-use-nonce-629',
    page_id:'112233445566',receipt_sha256:H('c'),window_sha256:H('d'),
    owner_ledger_head_sha256:H('e'),decision:DECISION_627,
    nonce:'fresh-owner-decision-nonce-629',
    issued_at:'2026-11-07T08:57:00.000Z',expires_at:'2026-11-07T09:04:00.000Z'};
  const originalBundle={payload:p627,
    signatures:await sign(canonicalDecision627(p627,now))};
  const packetHash=await hash(JSON.stringify(originalBundle));
  const p628={format:FORMAT_628,
    original_decision_sha256:await hash(canonicalDecision627(p627,now)),
    original_packet_sha256:packetHash,
    witness_sha256:p627.witness_sha256,receipt_sha256:p627.receipt_sha256,
    page_id:p627.page_id,
    primary_custody_ref:'https://custody-original.example.org/original/packet629',
    secondary_custody_ref:'https://separate-archive.example.net/record/packet629',
    primary_packet_sha256:packetHash,secondary_packet_sha256:packetHash,
    decision:DECISION_628,nonce:'fresh-original-archive-custody-629',
    issued_at:'2026-11-07T08:58:00.000Z',expires_at:'2026-11-07T09:03:00.000Z'};
  const custodyBundle={payload:p628,
    signatures:await sign(canonicalCustody628(p628,now))};
  const receipt={witness_sha256:p627.witness_sha256,
    authorization_id:p627.authorization_id,enrollment_sha256:p627.enrollment_sha256,
    test_nonce:p627.test_nonce,page_id:p627.page_id,
    receipt_sha256:p627.receipt_sha256,window_sha256:p627.window_sha256,
    owner_ledger_head_sha256:p627.owner_ledger_head_sha256,
    window_expires_at:'2026-11-07T09:06:00.000Z',
    original_signers:originalBundle.signatures.map(x=>({role:x.role,authority_id:x.authority_id})),
    original_source_verified:true,actual_meta_get_verified:true};
  const calls=[];
  const fetchApi=async(url,options)=>{calls.push({url,options});
    return new Response(JSON.stringify(originalBundle),{
      status:200,headers:{'Content-Type':'application/json'}});};
  const readback=await readExactOriginalArchives629(custodyBundle,originalBundle,
    {now,cryptoApi:webcrypto,fetchApi});
  const p629={format:FORMAT_629,custody_sha256:readback.custody_sha256,
    original_decision_sha256:p628.original_decision_sha256,
    original_packet_sha256:p628.original_packet_sha256,
    readback_sha256:readback.readback_sha256,
    witness_sha256:p627.witness_sha256,receipt_sha256:p627.receipt_sha256,
    page_id:p627.page_id,decision:APPROVE_629,
    nonce:'new-independent-original-readiness-629',
    issued_at:'2026-11-07T08:59:00.000Z',expires_at:'2026-11-07T09:02:00.000Z'};
  const signed={payload:p629,signatures:await sign(canonicalGoLive629(p629,now))};
  return {ids,roots,pins,p627,p628,p629,originalBundle,custodyBundle,
    readback,signed,calls,fetchApi,sign,
    context:{receipt,roots:async id=>roots[id],pins,now,cryptoApi:webcrypto}};
}

test('629 byte-for-byte reads TWO exact original signed HTTPS archives without provider credentials',async()=>{
  const f=await fixture();
  assert.equal(f.calls.length,2);
  assert.deepEqual(f.calls.map(c=>c.url),[
    f.p628.primary_custody_ref,f.p628.secondary_custody_ref]);
  for(const {options} of f.calls){
    assert.equal(options.method,'GET');
    assert.equal(options.redirect,'manual');
    assert.equal(options.credentials,'omit');
    assert.equal(options.cache,'no-store');
    assert.equal(options.headers.Accept,'application/octet-stream, application/json');
    assert.equal(options.headers.Authorization,undefined);
  }
  assert.equal(f.readback.actual_external_https_get_verified,true);
  assert.equal(f.readback.both_archived_packets_byte_identical,true);
  assert.equal(f.readback.primary_sha256,f.p628.original_packet_sha256);
  assert.equal(f.readback.secondary_sha256,f.p628.original_packet_sha256);
  assert.match(f.readback.readback_sha256,/^[0-9a-f]{64}$/);
});

test('629 blocks mismatched, overlarge, redirected, HTML, private-host and credential-like archives',async()=>{
  const f=await fixture();
  const go=async(fetchApi,custodyBundle=f.custodyBundle)=>
    readExactOriginalArchives629(custodyBundle,f.originalBundle,
      {now,cryptoApi:webcrypto,fetchApi});
  await assert.rejects(go(async()=>new Response('different raw archive content',{status:200})));
  await assert.rejects(go(async()=>new Response('x'.repeat(17000),{status:200})));
  await assert.rejects(go(async()=>new Response('',{status:302,
    headers:{Location:'https://other.example.com/'}})));
  await assert.rejects(go(async()=>new Response(JSON.stringify(f.originalBundle),{
    status:200,headers:{'Content-Type':'text/html'}})));
  for(const host of ['https://localhost/private','https://metadata.google.internal/archive',
    'https://127.0.0.1/private','https://user:password@public.example.org/archive',
    'https://archive.example.org/p?token=bad'])
    await assert.rejects(go(f.fetchApi,{payload:{...f.p628,primary_custody_ref:host}}));
  await assert.rejects(go(f.fetchApi,{payload:{...f.p628,
    secondary_custody_ref:f.p628.primary_custody_ref}}));
});

test('629 certifies owner-controlled READINESS only with original three signatures and exact source receipts',async()=>{
  const f=await fixture();
  const result=await verifyGoLiveDecision629(f.signed,{
    custodyBundle:f.custodyBundle,originalBundle:f.originalBundle,
    readback:f.readback,...f.context});
  assert.equal(result.signed_original_go_live_decision_verified,true);
  assert.equal(result.independent_external_archive_bytes_verified,true);
  assert.equal(result.go_live_readiness_certified,true);
  assert.equal(result.provider_channel_connected,false);
  assert.equal(result.provider_get_performed,false);
  assert.equal(result.publishing_enabled,false);
  assert.equal(result.release_gate,HOLD_629);
  const hold={...f.p629,decision:HOLD_DECISION_629};
  const declined={payload:hold,signatures:await f.sign(canonicalGoLive629(hold,now))};
  const no=await verifyGoLiveDecision629(declined,{
    custodyBundle:f.custodyBundle,originalBundle:f.originalBundle,
    readback:f.readback,...f.context});
  assert.equal(no.go_live_readiness_certified,false);
});

test('629 denies forged source scope, expired window, changed archive receipts and unpinned decisions',async()=>{
  const f=await fixture();
  const verify=(signed=f.signed,context={})=>verifyGoLiveDecision629(signed,{
    custodyBundle:f.custodyBundle,originalBundle:f.originalBundle,
    readback:f.readback,...f.context,...context});
  for(const patch of [{page_id:'999'}, {receipt_sha256:H('f')},
    {readback_sha256:H('f')},{custody_sha256:H('f')},
    {decision:'PUBLISH_OR_CONNECT_META'},
    {expires_at:'2026-11-07T09:09:00.000Z'}])
    await assert.rejects(verify({payload:{...f.p629,...patch},
      signatures:f.signed.signatures}));
  await assert.rejects(verify(f.signed,{pins:{}}));
  await assert.rejects(verify(f.signed,{
    roots:async id=>({...f.roots[id],status:'QUARANTINED'})}));
  await assert.rejects(verify(f.signed,{receipt:{...f.context.receipt,
    window_expires_at:'2026-11-07T08:59:00.000Z'}}));
  await assert.rejects(verify(f.signed,{readback:{...f.readback,
    secondary_sha256:H('f')}}));
  const reused=f.signed.signatures.map(s=>({...s}));reused[1].authority_id=reused[0].authority_id;
  await assert.rejects(verify({...f.signed,signatures:reused}));
  assert.throws(()=>canonicalGoLive629({...f.p629,provider_write:'true'},now));
});

test('629 proposed append-only readback/decision schema and owner-only endpoint fail closed',async()=>{
  const sql=read('migrations/proposed/0064_devilndove_build629_original_meta_archive_readback_go_live_hold.sql');
  assert.match(sql,/PROPOSED ONLY/);
  assert.match(sql,/dd629_original_meta_archive_readbacks/);
  assert.match(sql,/dd629_original_meta_go_live_decisions/);
  assert.equal((sql.match(/BEFORE UPDATE/g)||[]).length,2);
  assert.equal((sql.match(/BEFORE DELETE/g)||[]).length,2);
  const script=`import sqlite3,sys\n`+
    `db=sqlite3.connect(':memory:')\n`+
    `db.execute('CREATE TABLE dd628_original_meta_signed_decision_custody(custody_sha256 TEXT PRIMARY KEY)')\n`+
    `db.executescript(sys.stdin.read())\n`+
    `db.execute('INSERT INTO dd629_original_meta_archive_readbacks VALUES('+','.join(['?']*12)+')',`+
    `('a'*64,'b'*64,'c'*64,'https://archive-one.example.org/p','https://archive-two.example.net/p',`+
    `'d'*64,'e'*64,120,120,'TWO_ORIGINAL_INDEPENDENT_HTTPS_ARCHIVES_BYTE_IDENTICAL',1,'2026-11-07'))\n`+
    `db.execute('INSERT INTO dd629_original_meta_go_live_decisions VALUES('+','.join(['?']*10)+')',`+
    `('f'*64,'b'*64,'a'*64,'g'*64,'CERTIFY_ORIGINAL_META_READ_ONLY_CHANNEL_READINESS_NO_ACTIVATION','2026-11-07','{}',`+
    `'SIGNED_ORIGINAL_OWNER_READINESS_DECISION_NO_CHANNEL',1,'2026-11-07'))\n`+
    `db.execute('INSERT INTO dd629_original_meta_go_live_decisions VALUES('+','.join(['?']*10)+')',`+
    `('h'*64,'b'*64,'a'*64,'g'*64,'HOLD_ORIGINAL_META_CHANNEL_READINESS','2026-11-07','{}',`+
    `'SIGNED_ORIGINAL_OWNER_READINESS_DECISION_NO_CHANNEL',1,'2026-11-07'))\n`+
    `latest=db.execute('SELECT owner_decision FROM dd629_original_meta_go_live_decisions ORDER BY rowid DESC LIMIT 1').fetchone()[0]\n`+
    `assert latest=='HOLD_ORIGINAL_META_CHANNEL_READINESS'\n`+
    `for name in ['dd629_original_meta_archive_readbacks','dd629_original_meta_go_live_decisions']:\n`+
    ` for action in ['UPDATE','DELETE']:\n`+
    `  sql=('UPDATE '+name+' SET status=\"bad\"' if action=='UPDATE' else 'DELETE FROM '+name)\n`+
    `  try: db.execute(sql);sys.exit(7)\n`+
    `  except sqlite3.IntegrityError: pass\n`+
    `print('IMMUTABLE_629_OK')\n`;
  const r=spawnSync('python3',['-c',script],{input:sql,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/IMMUTABLE_629_OK/);
  const req=new Request('https://devilndove.com/api/admin/trust-archive-certification-629');
  assert.equal((await onRequestGet({request:req,env:{}})).status,401);
  assert.equal((await onRequestPost({request:req,env:{}})).status,401);
  const api=read('functions/api/admin/trust-archive-certification-629.js');
  assert.match(api,/requireAdminStepUp/);
  assert.match(api,/originalReceipt627/);
  assert.match(api,/trustedPins614/);
  assert.match(api,/readExactOriginalArchives629/);
  assert.match(api,/INSERT INTO dd629_original_meta_archive_readbacks/);
  assert.match(api,/INSERT INTO dd629_original_meta_go_live_decisions/);
  assert.match(api,/ORDER BY rowid DESC LIMIT 1/);
  assert.doesNotMatch(api,/UPDATE\s+dd629|DELETE FROM dd629|CREATE TABLE|decryptOAuthSecret|probeMetaPage620|refreshOAuthToken/);
  assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),
    /50\. Original Meta external archive byte readback/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),
    /trust-authority-614\.mjs\?v=629/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":629/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build629_meta_archive_certification\.test\.mjs/);
});
