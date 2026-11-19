import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet} from '../functions/api/admin/privacy-readiness-734.js';

const root='https://devilndove.com',url=root+'/api/admin/privacy-readiness-734?review=peer739';
const admin={ddModuleAccess:{allowed:true,user:{user_id:8,is_active:1,role:'admin'}}};
let called=0;
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{called++;throw Error('No external peer calls permitted in offline source gate')};
try{
 const anonymous=await onRequestGet({request:new Request(url),env:{},data:{}});
 assert.equal(anonymous.status,401);
 const missing=await onRequestGet({request:new Request(url),env:{},data:admin});
 assert.equal(missing.status,503);
 let counts=0;
 const db={prepare(sql){assert.ok(sql.startsWith('SELECT'));return {bind(...values){
  assert.ok(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub'].includes(values[0]));
  return {async first(){counts++;return {manual:0,automatic:0,queued:0}}};
 }};}};
 const x=await onRequestGet({request:new Request(url),env:{DB:db},data:admin});
 assert.equal(x.status,200);const p=await x.json();
 assert.equal(p.build,739);
 assert.equal(p.status,'HOLD_MISSING_OR_STALE_ORIGINAL_MASTER_PROOFS');
 assert.equal(p.required_peers,3);assert.equal(p.configured_peers,0);
 assert.equal(p.current_local_signed_proofs,0);
 assert.deepEqual(p.peers.map(q=>q.peer_app),['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub']);
 assert.ok(p.peers.every(q=>q.state==='HOLD_PEER_CONFIG_REQUIRED' &&
 q.next_step==='ENROLL_ORIGINAL_CONFIG_PRIVATELY'&&q.independent_receiver_owner_attested===false));
 assert.equal(p.independent_three_master_receiver_ack_verified,false);
 assert.equal(p.cross_application_statistics_enabled,false);
 assert.equal(p.original_windows_host_reboot_event_verified,false);
 assert.equal(p.new_live_probe_performed,false);
 assert.equal(p.external_call_performed,false);
 assert.equal(p.secret_values_exposed,false);
 assert.equal(p.customer_identifiers_exposed,false);
 assert.equal(counts,3);assert.equal(called,0);
 const raw=JSON.stringify(p);
 for(const forbidden of ['RESEND_API_KEY','DND728_PEER_AI_DATA_PLATFORM_HMAC_KEY_B64URL','password_hash']){
  assert.ok(!raw.includes(forbidden),forbidden);
 }
}finally{globalThis.fetch=originalFetch;}
const supplier=readFileSync(new URL('../public/js/admin-vendor-reviews.js',import.meta.url),'utf8');
const begin=supplier.indexOf('  function reviewVideo739(value) {');
const end=supplier.indexOf('  function mountVideo739(button) {');
assert.ok(begin>=0&&end>begin);
const resolver=new Function('text',supplier.slice(begin,end)+';return reviewVideo739;')(
 v=>String(v??'').trim());
assert.equal(resolver('https://www.youtube.com/watch?v=Abcdef12345').src,
 'https://www.youtube-nocookie.com/embed/Abcdef12345');
assert.equal(resolver('https://youtu.be/Abcdef12345').platform,'YouTube');
assert.equal(resolver('https://www.instagram.com/reel/C0exampleID/').platform,'Instagram');
assert.equal(resolver('https://www.facebook.com/watch/?v=123456789012').platform,'Facebook');
for(const bad of ['javascript:alert(1)','http://www.youtube.com/watch?v=Abcdef12345',
 'https://youtube.com.attacker.invalid/watch?v=Abcdef12345',
 'https://www.youtube.com:8080/watch?v=Abcdef12345',
 'https://www.instagram.com.evil.invalid/reel/C0exampleID/',
 'https://www.youtube.com/watch?v=../../etc',
 'https://www.facebook.com/watch/?v=not-an-id']){
 assert.equal(resolver(bad),null,bad);
}
assert.ok(supplier.includes('data-review-video')&&supplier.includes("frame.loading='lazy'")&&
 supplier.includes('allow-scripts allow-same-origin allow-presentation'));
const html=readFileSync(new URL('../admin/vendor-reviews/index.html',import.meta.url),'utf8');
assert.ok(html.includes('VEVOR Canada')&&html.includes('Special Tools &amp; Supplies'));
const peerHtml=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const peerJs=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
assert.ok(peerHtml.includes('peer739Refresh')&&peerHtml.includes('peer739Status'));
assert.ok(peerJs.includes('review=peer739')&&peerJs.includes('peer739Status'));
console.log('BUILD739 PASS: three source-only Master HOLDs, verified Admin, no network/PII/secrets, gated supplier YouTube/Instagram/Facebook media');
