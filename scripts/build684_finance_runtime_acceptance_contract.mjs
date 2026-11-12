import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {claim684,nonce684,fresh684,verify684,same684,endpoint684,lookup684} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const backend=read('functions/api/admin/social-post-queue.js'),html=read('admin/social-publishing/index.html');
const ui=read('public/js/admin-social-platform-preflight.js');
const source={queue_id:42,campaign:'signed-test',source_revision:'release-sha',
 fingerprint_sha256:'a'.repeat(64),source_signer_receipt_id:400,
 signer_id:'source-independent',nonce:'src-enrollment-123456789',
 issued_at:new Date().toISOString()};
const enrollment=claim684('enrollment',source);
assert.deepEqual(enrollment,{v:1,purpose:'devilndove_finance_signer_runtime_684',source:'devilndove',...source});
assert.throws(()=>claim684('unknown',source));
assert.equal(same684(source,{...source,fingerprint_sha256:'b'.repeat(64)}),false);
assert.equal(nonce684('bad'),false);
assert.equal(fresh684(new Date(Date.now()-86400000).toISOString()),false);
const keys=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const pub=Buffer.from(await crypto.subtle.exportKey('raw',keys.publicKey)).toString('base64');
const sign=async claim=>Buffer.from(await crypto.subtle.sign('Ed25519',keys.privateKey,
 new TextEncoder().encode(JSON.stringify(claim)))).toString('base64');
const signature=await sign(enrollment);
assert.equal(await verify684(pub,enrollment,signature),true);
assert.equal(await verify684(pub,{...enrollment,nonce:'wrong'},signature),false);
assert.equal(await verify684('',enrollment,signature),false);
assert.equal(await verify684(pub,enrollment,'not-a-valid-signature'),false);
const env={FINANCIAL_MASTER_ACCEPTANCE_URL_684:'https://master.test.local/v1/finance-acceptance',
 FINANCIAL_MASTER_ACCEPTANCE_ORIGIN_684:'https://master.test.local/',
 FINANCIAL_MASTER_ACCEPTANCE_TOKEN_684:'validated-test-token-1234567890',
 AI_DATA_MASTER_ACK_PUBLIC_KEY:pub};
assert.ok(endpoint684(env));
assert.equal(endpoint684({...env,FINANCIAL_MASTER_ACCEPTANCE_URL_684:'http://master.test.local/v1/finance-acceptance'}),null);
assert.equal(endpoint684({...env,FINANCIAL_MASTER_ACCEPTANCE_URL_684:'https://attacker.test.local/v1/finance-acceptance'}),null);
assert.equal(endpoint684({...env,FINANCIAL_MASTER_ACCEPTANCE_TOKEN_684:''}),null);
const identity={...source,enrollment_receipt_id:500,master_signed_receipt_id:600,master_revision:'master-v684'};
const reply=async (url,opts)=>{
 assert.equal(url,env.FINANCIAL_MASTER_ACCEPTANCE_URL_684);
 assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');assert.equal(opts.cache,'no-store');
 assert.match(opts.headers.Authorization,/^Bearer validated-test-token/);
 const c=claim684('acceptance',{...identity,receiver_receipt_id:'receiver:finance-abc123456',
 request_nonce:opts.headers['X-Finance-Request-Nonce'],issued_at:new Date().toISOString()});
 return new Response(JSON.stringify({claim:c,signature:await sign(c)}),{
 status:200,headers:{'Content-Type':'application/json'}});
};
const ok=await lookup684(env,identity,reply);
assert.equal(ok.claim.decision,'accepted');
assert.equal(ok.claim.source_signer_receipt_id,400);
assert.equal(await verify684(pub,ok.claim,ok.signature),true);
await assert.rejects(lookup684(env,identity,async(u,o)=>{
 const c=claim684('acceptance',{...identity,receiver_receipt_id:'receiver:finance-abc123456',
 request_nonce:'forged-supplied-nonce',issued_at:new Date().toISOString()});
 return new Response(JSON.stringify({claim:c,signature:await sign(c)}),{
 status:200,headers:{'Content-Type':'application/json'}});
}),/signature, nonce, receipt or freshness mismatch/);
await assert.rejects(lookup684(env,identity,async(u,o)=>{
 const c=claim684('acceptance',{...identity,source_revision:'wrong',
 receiver_receipt_id:'receiver:finance-abc123456',
 request_nonce:o.headers['X-Finance-Request-Nonce'],issued_at:new Date().toISOString()});
 return new Response(JSON.stringify({claim:c,signature:await sign(c)}),{
 status:200,headers:{'Content-Type':'application/json'}});
}),/signature, nonce, receipt or freshness mismatch/);
await assert.rejects(lookup684({...env,FINANCIAL_MASTER_ACCEPTANCE_TOKEN_684:''},identity,reply),/not enrolled/);
for(const marker of [/async function financial684/,/async function enroll684/,/async function accept684/,
 /async function continuity684/,/INSERT INTO social_post_attempts/,
 /WHERE NOT EXISTS/,/result\?\.meta\?\.changes/,/finance_enrollment_684/,/finance_acceptance_684/,
 /finance_continuity_684/,/owner_reviewed!==true/,/expected_fingerprint_sha256/,
 /source_blockers/,/HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY/,
 /master_accepted:!!accepted/,/financial684:await financial684/,
 /enroll_finance_signer_684/,/verify_finance_master_684/,/close_finance_continuity_684/
])assert.match(backend,marker);
for(const id of ['dd684-finance','dd684Enrollment','dd684Prepare','dd684Master',
 'dd684Continuity','dd684Status'])assert.ok(html.includes(id));
for(const marker of [/DDAuth\.apiFetch/,/financial684/,/crypto\.randomUUID/,
 /JSON\.stringify\(c\)/,/verify_finance_master_684/,/close_finance_continuity_684/])assert.match(ui,marker);
assert.doesNotMatch(ui,/PRIVATE_KEY_684|MASTER_ACCEPTANCE_TOKEN_684|AI_DATA_MASTER_ACK_PUBLIC_KEY/);
console.log('BUILD 684: external signer signature, pinned authenticated GET, exact Master response, durable owner continuity: PASS');
