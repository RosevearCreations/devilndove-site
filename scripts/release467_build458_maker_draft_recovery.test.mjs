/* Build 458 — disposable browser storage and source contracts, NOT real maker evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DRAFT_MAX_AGE_MS,DRAFT_MAX_SCOPES,MakerDraftStore,makerDraftScope,makerFingerprint} from '../public/js/maker-draft-recovery-458.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=p=>readFileSync(resolve(root,p),'utf8');
function memoryStorage(){const data=new Map();return {
 get length(){return data.size},key(i){return Array.from(data.keys())[i]??null},getItem(k){return data.has(k)?data.get(k):null},
 setItem(k,v){data.set(k,String(v))},removeItem(k){data.delete(k)}
};}

test('drafts are opt-in, source scoped, 24-hour bounded and explicit restore only',()=>{
 let now=100000,rev=0;const storage=memoryStorage();
 const key=makerDraftScope('owner',15,'private_therapeutic');
 const instance=new MakerDraftStore(storage,key,()=>now,()=>`revision-${++rev}`);
 assert.equal(instance.read(),null);assert.equal(storage.length,0);
 const first=instance.save({note:'Actual workshop session, private',decision:'hold'},null);
 assert.equal(first.updated_at,now);assert.equal(first.expires_at,now+DRAFT_MAX_AGE_MS);
 assert.equal(instance.read().fields.note,'Actual workshop session, private');
 now+=DRAFT_MAX_AGE_MS+1;
 assert.equal(instance.read(),null,'expired drafts cannot be restored');
 assert.throws(()=>makerDraftScope('owner',15,'fabricated'),/Invalid real owner/);
 assert.throws(()=>makerDraftScope('cost','../15'),/real source/);
 assert.throws(()=>makerDraftScope('cost',15,'commission'),/cannot impersonate/);
});

test('second-tab newer version fails closed; explicit restore enables the later revision',()=>{
 const store=memoryStorage(),key=makerDraftScope('cost',19),make=()=>String(Math.random());
 const first=new MakerDraftStore(store,key,()=>1000,make),second=new MakerDraftStore(store,key,()=>1000,make);
 const v1=first.save({costLabel:'Sample A',costPrice:'20.00'},null);
 const seen=second.read();assert.equal(seen.revision,v1.revision);
 const v2=first.save({costLabel:'Sample A updated'},null,v1.revision);
 assert.throws(()=>second.save({costLabel:'Stale second tab'},null,seen.revision),/DRAFT_CONFLICT/);
 assert.throws(()=>second.discard(seen.revision),/DRAFT_CONFLICT/);
 assert.equal(second.read().revision,v2.revision);
 second.discard(v2.revision);assert.equal(second.read(),null);
});

test('capacity and size guards reject overflow without deleting live unsaved drafts',()=>{
 const storage=memoryStorage(),now=1000;
 for(let id=1;id<=DRAFT_MAX_SCOPES;id++)new MakerDraftStore(storage,makerDraftScope('cost',id),()=>now,()=>`r${id}`).save({note:'safe'},null);
 assert.equal(storage.length,DRAFT_MAX_SCOPES);
 assert.throws(()=>new MakerDraftStore(storage,makerDraftScope('cost',11),()=>now,()=>`r11`).save({note:'more'},null),/limit/);
 assert.equal(storage.length,DRAFT_MAX_SCOPES);
 const a=new MakerDraftStore(storage,makerDraftScope('cost',1),()=>now,()=>`rNew`);
 assert.throws(()=>a.save({note:'x'.repeat(1201)},null,a.read().revision),/unsupported/);
 assert.equal(a.read().fields.note,'safe');
 assert.throws(()=>a.save({note:'💜'.repeat(600),extra:'💜'.repeat(600),detail:'💜'.repeat(600),context:'💜'.repeat(600)},null,a.read().revision),/8 KB browser limit/);
 assert.equal(a.read().fields.note,'safe');
});

test('same payload retains original idempotency fingerprint; modified payload cannot impersonate retry',()=>{
 const body={project_id:8,scenario_key:'jewellery_metal',checkpoint_key:'source_identity',decision:'hold',review_note:'Factual observation from owner.',request_key:'trial_458_old_key_111'};
 const a=makerFingerprint(body),b=makerFingerprint({...body,request_key:'trial_458_retry_key_222'});
 assert.equal(a,b);
 assert.notEqual(a,makerFingerprint({...body,review_note:'Changed text after an uncertain request.'}));
 const store=memoryStorage(),d=new MakerDraftStore(store,makerDraftScope('owner',8,'jewellery_metal'),()=>1000,()=>`r1`);
 const saved=d.save({note:body.review_note,decision:'hold'},{fingerprint:a,key:body.request_key});
 assert.equal(saved.pending.key,body.request_key);
 assert.equal(d.read().pending.fingerprint,a);
});

test('owner and costs are guarded by same-actor indexed receipt lookup and no auto replay',()=>{
 const ownerAPI=file('functions/api/admin/maker-owner-trials.js'),costAPI=file('functions/api/admin/project-costs.js');
 for(const api of [ownerAPI,costAPI]){
  assert.match(api,/lookup_key/);assert.match(api,/request_key=\? AND (?:recorded_by|reviewed_by)_user_id=\?/);
  assert.match(api,/LIMIT 1/);
 }
 const owner=file('public/js/admin-maker-owner-trials.js'),cost=file('public/js/admin-project-costs.js');
 for(const client of [owner,cost]){
  assert.match(client,/MakerDraftStore/);assert.match(client,/makerFingerprint/);
  assert.match(client,/window\.addEventListener\('storage'/);
  assert.match(client,/window\.addEventListener\('beforeunload'/);
  assert.match(client,/window\.addEventListener\('offline'/);
  assert.match(client,/window\.addEventListener\('online'/);
  assert.match(client,/pending\.fingerprint!==/);
  assert.match(client,/if\(pending&&dirty\)/,'an uncertain key must not be repointed at new saved fields');
  assert.match(client,/store\.save\(/);
  assert.doesNotMatch(client,/setInterval\(|navigator\.serviceWorker|sync\.register/);
 }
 const ownerHTML=file('admin/maker-owner-trials/index.html'),costHTML=file('admin/project-costs/index.html');
 for(const html of [ownerHTML,costHTML]){
  assert.match(html,/Optional (?:draft|recovery)/i);assert.match(html,/Restore/);assert.match(html,/Discard/);assert.match(html,/Check uncertain receipt/);
  assert.match(html,/role="status" aria-live="polite"/);assert.match(html,/type="module"/);
 }
});
