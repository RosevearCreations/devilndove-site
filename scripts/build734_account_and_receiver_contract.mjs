import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestPost,providerReady734} from '../functions/api/auth/recovery-734.js';
import {onRequestGet} from '../functions/api/admin/privacy-readiness-734.js';
const host='https://devilndove.com',path=host+'/api/auth/recovery-734';
const send=(action,extra={},origin=host)=>new Request(path,{method:'POST',
 headers:{'Content-Type':'application/json',Origin:origin},
 body:JSON.stringify({action,...extra})});
assert.equal(providerReady734({}),false);
assert.equal(providerReady734({RESEND_API_KEY:'x',NOTIFICATION_FROM_EMAIL:'support@example.test'}),true);
assert.equal((await onRequestPost({request:send('reset_request',{email:'a@example.com'},'https://evil.example'),env:{}})).status,403);
assert.equal((await onRequestPost({request:send('reset_request',{email:'a@example.com'}),env:{}})).status,503);
assert.equal((await onRequestPost({request:send('reset_redeem',{token:'f'.repeat(64)}),env:{}})).status,503);
assert.equal((await onRequestPost({request:send('strange'),env:{}})).status,400);
assert.equal((await onRequestGet({request:new Request(host+'/api/admin/privacy-readiness-734'),env:{},data:{}})).status,401);
const page=readFileSync(new URL('../account-help/index.html',import.meta.url),'utf8');
const client=readFileSync(new URL('../public/js/account-help.js',import.meta.url),'utf8');
const recovery=readFileSync(new URL('../functions/api/auth/recovery-734.js',import.meta.url),'utf8');
const peer=readFileSync(new URL('../functions/api/admin/privacy-readiness-734.js',import.meta.url),'utf8');
const worker=readFileSync(new URL('../wrangler.privacy730.toml',import.meta.url),'utf8');
for(const needle of ['forgotPasswordForm','forgotEmailForm','accountReminder734Form',
 'reset734Form','reset734Card'])assert.ok(page.includes(needle),needle);
for(const needle of ["mode==='reset'","history.replaceState","reset_redeem",
 'account_reminder','reset_request'])assert.ok(client.includes(needle),needle);
for(const needle of ["dnd_password_reset_tokens_734","token_sha256",
 'crypto.getRandomValues','sent_at IS NOT NULL','consumed_at IS NULL',
 'DELETE FROM sessions','claim_id','providerReady734','no-store',
 'new_password','response.ok','reset_id'])assert.ok(recovery.includes(needle),needle);
for(const needle of ["BUILD729_PEERS",'peerConfig729','signature_verified',
 'pinned_public_key_sha256','owner_activation_received:false',
 'remote_deletion_proven:false'])assert.ok(peer.includes(needle),needle);
assert.ok(worker.includes('DND730_AUTOMATION_ENABLED = "false"'));
assert.ok(!recovery.includes('console.log(')&&!recovery.includes('raw_token'));
console.log('Build734 auth reset, account reminder, privacy no-leak and original Master readiness HOLD boundaries: PASS');
