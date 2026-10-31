import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compactOwnerReviews,ownerReviewReceipt} from '../functions/api/_lib/systemHealthOwnerReview551.mjs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Build 551 accepts only an exact saved monitoring record for an owner-reported comparison',()=>{
  const sample={path:'/shop/',at:'2026-10-31T14:00:00.000Z',status:'200',ms:150};
  const view={view_key:'system-health-preset-17-owner-check',view_label:'Owner check',updated_at:'2026-10-31 14:00:00'};
  const receipt={kind:'history',...sample};
  assert.deepEqual(ownerReviewReceipt(receipt,[sample],[view]),receipt);
  assert.equal(ownerReviewReceipt({...receipt,ms:151},[sample],[view]),null);
  assert.equal(ownerReviewReceipt({...receipt,status:'524'},[sample],[view]),null);
  assert.equal(ownerReviewReceipt({...receipt,path:'/api/private'},[sample],[view]),null);
  assert.equal(ownerReviewReceipt({kind:'history',path:sample.path,at:sample.at},[sample],[view]),null,'legacy non-exact receipt cannot be attested');
  const viewReceipt={kind:'view',key:view.view_key,label:view.view_label,updated_at:view.updated_at};
  assert.deepEqual(ownerReviewReceipt(viewReceipt,[sample],[view]),viewReceipt);
  assert.equal(ownerReviewReceipt({...viewReceipt,updated_at:'older'},[sample],[view]),null);
  assert.equal(ownerReviewReceipt({...viewReceipt,key:'system-health-preset-99-owner-check'},[sample],[view]),null);
});

test('Build 551 never silently discards bounded owner evidence and avoids duplicate attestations',()=>{
  const candidate={receipt:{kind:'history',path:'/shop/',at:'2026-10-31T14:00:00Z',status:'200',ms:10},reviewed_at:'2026-10-31T14:05:00Z',claim:'owner_reported_second_device_comparison'};
  const once=compactOwnerReviews([],candidate);
  assert.equal(once.rows.length,1);assert.equal(once.already_recorded,false);
  const duplicate=compactOwnerReviews(once.rows,{...candidate,reviewed_at:'later'});
  assert.equal(duplicate.rows.length,1);assert.equal(duplicate.already_recorded,true);assert.equal(duplicate.review.reviewed_at,candidate.reviewed_at);
  const full=Array.from({length:12},(_,i)=>({...candidate,receipt:{...candidate.receipt,at:`2026-10-31T14:${String(i).padStart(2,'0')}:00Z`}}));
  const blocked=compactOwnerReviews(full,{...candidate,receipt:{...candidate.receipt,at:'2026-10-31T15:00:00Z'}});
  assert.equal(blocked.full,true);assert.equal(blocked.rows.length,12);assert.equal(blocked.review,null);
});

test('Build 551 presents honest owner evidence and bounded read-only incident age groups',()=>{
  const page=read('admin/system-operations/index.html'),api=read('functions/api/admin/system-health-547.js'),ui=read('public/js/admin-system-health-551.js');
  for(const id of ['dd551ComparisonSummary','dd551OwnerCheck','dd551SaveReview','dd551ReviewStatus','dd551ReviewList','dd551Aging','dd551AgingContext'])assert.match(page,new RegExp(`id="${id}"`));
  assert.match(page,/Build (?:551|552|553|554)/);assert.match(page,/personally compared/);assert.match(page,/not independent device proof/i);
  assert.match(page,/admin-system-health-551\.js\?v=(?:551|552|553|554)/);
  assert.match(ui,/dd:health-receipt-verified-551/);assert.match(ui,/comparison\.found/);
  assert.match(ui,/second_device_compared:true/);assert.match(ui,/action:'owner_review_551'/);
  assert.match(ui,/readback_confirmed!==true/);assert.match(ui,/dd551OwnerCheck'\)\.checked/);
  assert.match(ui,/dd:system-health-reconciled-549/);assert.doesNotMatch(ui,/setInterval|localStorage/);
  assert.match(api,/created_by_user_id=\?/);assert.match(api,/body\.second_device_compared!==true/);
  assert.match(api,/ownerReviewReceipt\(body\.receipt,history,presets\)/);
  assert.match(api,/readback_confirmed:true/);assert.match(api,/system_health_owner_comparison_attested_551/);
  assert.match(api,/filter_json=\?/);assert.match(api,/changed\?\.meta\?\.changes/);
  assert.match(api,/open_24h/);assert.match(api,/open_7d/);assert.match(api,/open_without_review/);
  assert.match(api,/datetime\(created_at\)>=datetime\('now','-30 days'\)/);
  assert.doesNotMatch(api,/UPDATE runtime_incidents|DELETE FROM runtime_incidents|CREATE TABLE/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:551|552|553|554)/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build551_owner_review_aging\.test\.mjs/);
});
