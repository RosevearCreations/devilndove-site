// Build 750 real Firefox desktop/mobile and Chromium, with fake-only D1 receipts.
// No original private customer data or provider endpoint is touched.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {firefox,chromium} from 'playwright';
const base=(process.env.DD_ORIGIN||'http://127.0.0.1:18750').replace(/\/$/,'');
const tests=[
 {engine:firefox,name:'firefox-desktop',w:1366,h:900},
 {engine:firefox,name:'firefox-mobile',w:390,h:844},
 {engine:chromium,name:'chromium-fallback',w:1280,h:800}
];
const TASK='47eae237-c633-4db4-a848-3f94dc3e4dc0';
const CASE='15a4f2dc-e9c8-4c20-a888-ce0a8c0d60d5';
const REF='f6e385f3-a754-4da4-9f29-ceced6a178d2';
const REVIEW='ff951e32-8e0c-4900-93c4-ffad7664d056';
const PROPOSAL='1324d8b4-c9ea-4f80-9aa3-73d21c7afc08';
const contents=Buffer.from('Original local test-only customer response artifact without contact details.\n');
const expected=createHash('sha256').update(contents).digest('hex');
const retention=new Date(Date.now()+300*86400000).toISOString().slice(0,10);
for(const spec of tests){
 const browser=await spec.engine.launch({headless:true,...(spec.engine===chromium?{args:['--no-sandbox']}:{})});
 try{
  const context=await browser.newContext({viewport:{width:spec.w,height:spec.h},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  let privateGets=0,privatePosts=0,version=0,hasResponse=false,hasReview=false,
   hasProposal=false,archived=false,restored=false;
  await page.route('**/api/admin/customer-care-custody-750*',async route=>{
   const req=route.request(),url=new URL(req.url());
   assert.equal(url.origin,base,'Fake API must remain same-origin');
   if(req.method()==='POST'){
    privatePosts++;
    const request=req.postDataJSON();
    assert.equal(request.expected_version,version);
    assert.equal(request.task_id,TASK);
    assert.ok(request.source_reference.length>=8&&request.note.length>=20);
    assert.equal(req.headers()['content-type'],'application/json');
    assert.equal(typeof request.file,'undefined','Raw file must never upload');
    assert.equal(typeof request.original_file_contents,'undefined');
    if(request.kind==='response_record'){
     assert.equal(request.sha256,expected);
     assert.equal(request.source_channel,'email');
     hasResponse=true;
    }else if(request.kind==='response_review'){
     assert.equal(request.subject_id,REF);
     assert.equal(request.sha256,expected);
     assert.equal(request.decision,'pass');
     hasReview=true;
    }else if(request.kind==='archive_propose'){
     assert.equal(request.retention_review_on,retention);
     assert.equal(hasReview,true);
     hasProposal=true;
    }else if(request.kind==='archive_review'){
     assert.equal(request.subject_id,PROPOSAL);
     assert.equal(request.decision,'approve');
     archived=true;
    }else if(request.kind==='archive_restore'){
     restored=true;archived=false;
    }else throw Error('Unexpected mock-only action '+request.kind);
    version++;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     ok:true,saved:true,current_version:version,receipt:{
      id:hasProposal?PROPOSAL:hasReview?REVIEW:REF,kind:request.kind,decision:request.decision},
     external_provider_verified:false,customer_notified:false,refund_executed:false,
     original_evidence_deleted:false})});
   }
   privateGets++;
   const chosen=url.searchParams.get('task_id'),v=url.searchParams.get('view')||'active';
   const task={task_id:TASK,order_id:17,case_id:CASE,source_status:chosen?'ORIGINAL_ORDER_CASE_CURRENT':'NOT_RECHECKED_ON_SUMMARY',
    response_state:hasReview?'INDEPENDENT_LOCAL_ARTIFACT_HASH_MATCH':
     hasResponse?'HOLD_INDEPENDENT_ARTIFACT_REVIEW':'HOLD_NO_ORIGINAL_RESPONSE_ARTIFACT',
    response_receipt_id:hasResponse?REF:null,
    independent_response_review_id:hasReview?REVIEW:null,independent_local_hash_match:hasReview,
    escalation_state:'NONE',escalation_id:null,retention_hold_state:'NONE',
    retention_hold_id:null,archive_state:archived?'ARCHIVED_IMMUTABLE_RECEIPTS':
     restored?'RESTORED_TO_ACTIVE':'ACTIVE',
    archive_proposal_id:hasProposal?PROPOSAL:null,retention_review_on:archived?retention:null,
    customer_reply_provider_confirmed:false,external_provider_verified:false};
   const rows=v==='archived'?(archived?[task]:[]):
    v==='active'?(archived?[]:[task]):[task];
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    ok:true,version,view:v,
    summary:{active:archived?0:1,archived:archived?1:0,escalated:0,
     response_hash_matched:hasReview?1:0,retention_review_due:0,active_holds:0},
    rows,selected:chosen?task:null,
    receipts:[],provider_delivery_verified:false,no_message_sent:true,no_automatic_archive_or_delete:true})});
  });
  const p=await page.goto(base+'/admin/storefront-acceptance/?utm_source=chatgpt.com',
   {waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(p.status(),200);
  assert.equal(await page.locator('#a750Custody').count(),1);
  assert.equal(privateGets,0,'No automatic private custody reads');
  assert.equal(privatePosts,0);
  await page.locator('#a750Load').click();
  await page.waitForFunction(()=>document.querySelector('#a750Summary')?.textContent?.includes('1 active'));
  assert.equal(privateGets,1);
  await page.getByRole('button',{name:'Inspect case source'}).click();
  await page.waitForFunction(()=>document.querySelector('#a750Task')?.textContent?.includes('ORIGINAL_ORDER_CASE_CURRENT'));
  assert.equal(privateGets,2);
  assert.equal(await page.locator('#a750ResponseTask').inputValue(),TASK);
  await page.locator('#a750ResponseForm').evaluate(el=>{el.closest('details').open=true;});
  await page.locator('#a750ResponseForm').locator('input[type=file]').setInputFiles({
   name:'original-response.txt',mimeType:'text/plain',buffer:contents});
  await page.locator('#a750HashResponse').click();
  await page.waitForFunction(()=>document.querySelector('#a750ResponseSha')?.value?.length===64);
  assert.equal(await page.locator('#a750ResponseSha').inputValue(),expected);
  await page.locator('#a750ResponseRef').fill('original-local-response-20261122');
  await page.locator('#a750ResponseNote').fill('Original customer response artifact was inspected locally and was not uploaded.');
  await page.locator('#a750ResponseSave').click();
  await page.waitForFunction(()=>document.querySelector('#a750Status')?.textContent?.includes('receipt saved and read back'));
  assert.equal(privatePosts,1);
  assert.equal(privateGets,3);
  assert.equal(await page.locator('#a750ReviewSubject').inputValue(),REF);
  await page.locator('#a750ReviewForm').evaluate(el=>{el.closest('details').open=true;});
  await page.locator('#a750ReviewFile').setInputFiles({
   name:'original-response-copy.txt',mimeType:'text/plain',buffer:contents});
  await page.locator('#a750HashReview').click();
  await page.waitForFunction(()=>document.querySelector('#a750ReviewSha')?.value?.length===64);
  assert.equal(await page.locator('#a750ReviewSha').inputValue(),expected);
  await page.locator('#a750ReviewDecision').selectOption('pass');
  await page.locator('#a750ReviewRef').fill('second-admin-locally-matched-artifact-2026');
  await page.locator('#a750ReviewNote').fill('Independent source comparison matches the original local SHA256 digest without provider confirmation.');
  await page.locator('#a750ReviewSave').click();
  await page.waitForFunction(()=>document.querySelector('#a750Status')?.textContent?.includes('receipt saved and read back'));
  assert.equal(privatePosts,2);
  assert.equal(privateGets,4);
  await page.locator('#a750ArchiveForm').evaluate(el=>{el.closest('details').open=true;});
  await page.locator('#a750ArchiveDate').fill(retention);
  await page.locator('#a750ArchiveRef').fill('original-private-archive-review-20261122');
  await page.locator('#a750ArchiveNote').fill('The original internal follow-up and matched response evidence support immutable archival review.');
  await page.locator('#a750ArchiveSave').click();
  await page.waitForFunction(()=>document.querySelector('#a750Status')?.textContent?.includes('receipt saved and read back'));
  assert.equal(privatePosts,3);
  assert.equal(await page.locator('#a750ApproveSubject').inputValue(),PROPOSAL);
  await page.locator('#a750ApproveForm').evaluate(el=>{el.closest('details').open=true;});
  await page.locator('#a750ApproveDecision').selectOption('approve');
  await page.locator('#a750ApproveRef').fill('distinct-admin-archive-evidence-review');
  await page.locator('#a750ApproveNote').fill('Independent second Admin confirms original case and response digest are immutable archive ready.');
  await page.locator('#a750ApproveSave').click();
  await page.waitForFunction(()=>document.querySelector('#a750Task')?.textContent?.includes('ARCHIVED_IMMUTABLE_RECEIPTS'));
  assert.equal(privatePosts,4);
  await page.locator('#a750View').selectOption('archived');
  await page.locator('#a750Load').click();
  await page.waitForFunction(()=>document.querySelector('#a750Summary')?.textContent?.includes('1 archived'));
  assert.equal(await page.getByRole('button',{name:'Inspect case source'}).count(),1);
  await page.getByRole('button',{name:'Inspect case source'}).click();
  await page.waitForFunction(()=>document.querySelector('#a750Task')?.textContent?.includes('ARCHIVED_IMMUTABLE_RECEIPTS'));
  await page.locator('#a750RestoreForm').evaluate(el=>{el.closest('details').open=true;});
  await page.locator('#a750RestoreRef').fill('original-independent-archive-restoration');
  await page.locator('#a750RestoreNote').fill('Original immutable case is reopened for a genuine operational follow-up without deleting receipts.');
  await page.locator('#a750RestoreSave').click();
  await page.waitForFunction(()=>document.querySelector('#a750Task')?.textContent?.includes('RESTORED_TO_ACTIVE'));
  assert.equal(privatePosts,5);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=5,'Horizontal overflow '+overflow);
  assert.deepEqual(errors,[],'Uncaught browser errors');
  console.log('BUILD750 '+spec.name+' PASS: no auto private read, real local file SHA-256 (not uploaded), original task source, explicit review, retention proposal, independent archive/restore UI, no customer/provider requests.');
  await context.close();
 }finally{await browser.close();}
}
