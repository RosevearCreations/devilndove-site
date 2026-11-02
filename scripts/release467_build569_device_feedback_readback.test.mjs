import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  FORMAT_569,STORAGE_KEY_569,DEVICES_569,CHECKS_569,STATUSES_569,
  makePacket569,validatePacket569,mergeRecords569,readback569,summary569,
} from '../public/js/admin-device-acceptance-569.mjs';
import {destinationProjection559} from '../public/js/product-destinations-559.mjs';

const source=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const a={device:'desktop',check:'entry',status:'observed-ok',note:'Read Product ID on my own desktop',observed_at:'2026-11-02T00:00:00.000Z'};
const b={device:'phone',check:'dock',status:'needs-correction',note:'Search button too low',observed_at:'2026-11-02T00:01:00.000Z'};

test('Fresh device worksheet is pending, not automatically accepted or remotely verified',()=>{
  assert.equal(DEVICES_569.length,3);
  assert.equal(CHECKS_569.length,9);
  assert.deepEqual(STATUSES_569.map(s=>s.id),['not-reviewed','observed-ok','needs-correction']);
  assert.equal(readback569([]).notReviewed,27);
  const state=readback569([a,b]);
  assert.deepEqual(state,{observed:1,needsCorrection:1,notReviewed:25,ownerSignoff:'PENDING',remoteVerification:'NOT_PERFORMED',publicationPerformed:false});
  assert.equal(makePacket569([]).owner_signoff,'PENDING');
});

test('Cross-device transfers merge distinct observations and never silently overwrite conflicts',()=>{
  assert.deepEqual(mergeRecords569([a],[b]),[a,b]);
  assert.deepEqual(mergeRecords569([a],[a]),[a]);
  assert.throws(()=>mergeRecords569([a],[{...a,status:'needs-correction'}]),/Conflicting observations/);
  assert.throws(()=>mergeRecords569([a,a],[b]),/Duplicate review row/);
  assert.deepEqual(validatePacket569(makePacket569([a,b])),[a,b]);
});

test('Imported JSON rejects forged acceptance, unknown devices, statuses and overlong/private notes',()=>{
  const packet=makePacket569([a]);
  assert.equal(packet.format,FORMAT_569);
  for(const change of [
    {...packet,owner_signoff:'COMPLETE'},
    {...packet,format:'untrusted-format'},
    {...packet,build:568},
    {...packet,records:[{...a,device:'somebody-else'}]},
    {...packet,records:[{...a,check:'fake-owner-acceptance'}]},
    {...packet,records:[{...a,status:'approved'}]},
    {...packet,records:[{...a,note:'n'.repeat(601)}]},
    {...packet,records:[{...a,observed_at:'not-a-timestamp'}]},
  ])assert.throws(()=>validatePacket569(change));
  const withSpoofedFields={...packet,records:[{...a,admin_approved:true,remote_published:true}]};
  assert.deepEqual(validatePacket569(withSpoofedFields),[a],'untrusted approval fields are discarded');
  assert.match(summary569(makePacket569([a,b])),/Owner sign-off: PENDING/);
  assert.match(summary569(makePacket569([a,b])),/Remote\/provider verification: NOT_PERFORMED/);
});

test('Review page offers keyboard, phone, local save, copy and explicit merge/clear controls',()=>{
  const html=source('admin/device-acceptance/index.html');
  for(const id of ['dd569Review','dd569Device','dd569Checks','dd569Save','dd569CopySummary','dd569CopyJson','dd569State','dd569Notice','dd569Export','dd569ImportText','dd569ImportConfirm','dd569Import','dd569ClearConfirm','dd569Clear'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:569|570)/);
  assert.match(html,/<meta name="viewport" content="width=device-width,initial-scale=1"/);
  assert.match(html,/<meta name="robots" content="noindex,nofollow"/);
  assert.match(html,/Owner sign-off PENDING/);
  assert.match(html,/no server-side synchronization/i);
  assert.match(html,/no passwords, customer information, private photos or access tokens/i);
  assert.match(html,/admin-device-acceptance-569\.css\?v=(?:569|570)/);
  assert.match(html,/admin-device-acceptance-569\.mjs\?v=(?:569|570)/);
  assert.doesNotMatch(html,/<form[^>]+action=|type="submit"/,'no remote form submission');
});

test('Readback module has no outbound network or business write handlers',()=>{
  const js=source('public/js/admin-device-acceptance-569.mjs');
  assert.ok(js.includes(STORAGE_KEY_569));
  assert.match(js,/localStorage\.setItem/);
  assert.match(js,/localStorage\.removeItem/);
  assert.match(js,/navigator\.clipboard\.writeText/);
  assert.match(js,/textContent=check\.name/,'owner scope never inserted as arbitrary HTML');
  assert.match(js,/note\.maxLength=600/);
  assert.match(js,/mergeRecords569\(rows,imported\)/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);
  assert.doesNotMatch(js,/owner_signoff\s*:\s*['"](?:PASS|APPROVED|COMPLETE)['"]/);
});

test('Device review is discoverable from the real Admin Dashboard and Product Editor without changing Save/Channel flow',()=>{
  const home=source('admin/index.html');
  const editor=source('admin/product-editor/index.html');
  assert.match(home,/href="\/admin\/device-acceptance\/"/);
  assert.match(editor,/href="\/admin\/device-acceptance\/"/);
  assert.match(editor,/Devil n Dove • Build 569/);
  for(const id of ['productEditorForm','productEditorIdentity','dd540SaveProduct','productEditorSave','dd567TabDetails','dd567TabRecipe','dd567TabPhotos','dd567TabDestinations','dd559EtsyTools'])assert.ok(editor.includes(`id="${id}"`),id);
  assert.match(editor,/Final owner walkthrough — Product, photos and channel handoff/);
  const projection=destinationProjection559({product:{product_id:54,status:'draft'},etsy:{listing_id:'4601705477',saved_link_readback_confirmed:true},connections:[]});
  assert.equal(projection.publication_performed,false);
  assert.equal(projection.provider_contacted,false);
});

test('Owner worksheet styling is scoped, mobile-readable and keyboard-accessible',()=>{
  const css=source('css/admin-device-acceptance-569.css');
  assert.match(css,/data-admin-page="device-acceptance-569"/);
  assert.match(css,/max-width:750px/);
  assert.match(css,/minmax\(0,1fr\)/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert.doesNotMatch(css,/^\s*(?:body|html|:root|\.card|\.btn)\s*\{/m);
});

test('New Build 569 regression is CI-required and Production marker matches',()=>{
  assert.match(source('.github/workflows/current-application-quality.yml'),/release467_build569_device_feedback_readback\.test\.mjs/);
  assert.match(source('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:569|570)/);
});
