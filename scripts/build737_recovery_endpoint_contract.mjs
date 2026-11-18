import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestPost} from '../functions/api/auth/recovery-734.js';

const origin='https://devilndove.com';
const url=origin+'/api/auth/recovery-734';
const send=(body,headers={})=>onRequestPost({
  request:new Request(url,{method:'POST',headers:{
    'Content-Type':'application/json',Origin:origin,'Sec-Fetch-Site':'same-origin',...headers
  },body:typeof body==='string'?body:JSON.stringify(body)}),
  env:{}
});
assert.equal((await send('null')).status,400,'JSON null must not become a 500');
assert.equal((await send('[]')).status,400,'Arrays are not recovery commands');
assert.equal((await send('{')).status,400,'Malformed JSON is rejected');
assert.equal((await send({action:'delete_all'})).status,400,'No arbitrary action');
assert.equal((await send({action:'reset_request',email:'test@example.invalid'},
  {Origin:'https://attacker.invalid'})).status,403,'Cross-origin blocked');
assert.equal((await send({action:'reset_request',email:'test@example.invalid'},
  {'Sec-Fetch-Site':'cross-site'})).status,403,'Cross-site blocked');
assert.equal((await send({action:'reset_request',email:'test@example.invalid'})).status,503,
 'Missing D1 must not become an unprotected customer-email send');
assert.equal((await send({action:'reset_redeem',token:'0'.repeat(64),
  new_password:'123456789012',confirm_password:'123456789012'})).status,503,
 'Missing D1 must not update a credential');
const large={action:'reset_request',email:'x'.repeat(1900)+'@example.invalid'};
assert.equal((await send(large)).status,413,'Oversized body rejected');
const source=readFileSync(new URL('../functions/api/auth/recovery-734.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../account-help/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/js/account-help.js',import.meta.url),'utf8');
for(const marker of ['rateProof734','providerReady734','consumed_at IS NULL',
  "action==='reset_redeem'","response.ok","context.waitUntil(",
  "return String(request.headers.get('CF-Connecting-IP')||'unknown')"])
  assert.ok(source.includes(marker),'Source guard missing: '+marker);
assert.ok(!source.includes("request.headers.get('X-Forwarded-For')"),
  'Untrusted forwarded-header fallback can bypass the per-IP abuse ceiling');
assert.ok(page.includes('forgotPasswordForm')&&page.includes('forgotEmailForm')&&page.includes('reset734Form'));
assert.ok(js.includes('history.replaceState')&&js.includes('reset_redeem'));
assert.ok(!source.includes('console.log('));
console.log('BUILD737 PASS: malformed requests, same-origin policy, fail-closed D1, trusted IP source and no automated password change');
