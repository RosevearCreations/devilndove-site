// Build 749: source-hosted Firefox desktop/mobile + Chromium negative, fake private API only.
import assert from 'node:assert/strict';
import {firefox,chromium} from 'playwright';
const origin=(process.env.DD_ORIGIN||'http://127.0.0.1:18749').replace(/\/$/,'');
const tests=[
 {engine:firefox,name:'firefox-desktop',w:1366,h:900},
 {engine:firefox,name:'firefox-mobile',w:390,h:844},
 {engine:chromium,name:'chromium-not-original-firefox',w:1280,h:800}
];
const T='f25e687f-b7e6-46a1-89f2-8270b180e51d',C='5b7f7e5f-e119-4a6c-9119-2c4e72f6e9a0';
const future=new Date(Date.now()+86400000).toISOString().slice(0,10);
for(const spec of tests){
 const runner=await spec.engine.launch({headless:true,...(spec.engine===chromium?{args:['--no-sandbox']}:{})});
 try{
  const ctx=await runner.newContext({viewport:{width:spec.w,height:spec.h},serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  let gets=0,posts=0,version=0,taskExists=false,ack=false;
  await page.route('**/api/admin/customer-care-queue-749*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(req.method()==='POST'){
    posts++;const body=req.postDataJSON();
    assert.equal(body.expected_version,version);
    assert.match(body.request_key,/^[a-f\d-]{36}$/i);
    if(body.kind==='task_open'){
     assert.equal(body.order_id,'17');assert.equal(body.case_id,C);assert.equal(body.assignee_user_id,'91');
     assert.equal(body.priority,'urgent');assert.equal(body.due_date,future);
     taskExists=true;
    }else if(body.kind==='owner_ack_firefox'){
     assert.equal(spec.engine,firefox,'Chromium cannot submit original Firefox acknowledgment');
     assert.equal(body.browser_family,'firefox');
     assert.equal(body.observation_id,T);
     assert.equal(body.review_id,'f31d7a61-31b9-4bc4-b08f-9dc97ce68f18');
     assert.equal(body.owner_clicked_confirmation,true);
     ack=true;
    }else throw Error('Unexpected Build749 write kind '+body.kind);
    version++;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     ok:true,saved:true,current_version:version,receipt:{id:taskExists?'FAKE-TASK-749':'FAKE-ACK-749'},
     customer_notified:false,refund_executed:false,provider_notification:false})});
   }
   gets++;const selected=url.searchParams.get('task_id');
   const tasks=taskExists?[{
    task_id:T,order_id:17,case_id:C,case_type:'return_request',
    assignee_user_id:91,priority:'urgent',due_date:future,days_until_due:1,
    state:'OPEN_SOURCE_UNRECHECKED',overdue:false,due_soon:true
   }]:[];
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    ok:true,viewer_admin_user_id:91,queue:{version,today_utc:future,total:tasks.length,
      overdue:0,due_soon:tasks.length,held:0,tasks},
    firefox:{state:ack?'OWNER_ACKNOWLEDGED_REVIEWED_FIREFOX_EVIDENCE':'HOLD_OWNER_ACKNOWLEDGMENT_REQUIRED',
      source_observation_id:T,source_review_id:'f31d7a61-31b9-4bc4-b08f-9dc97ce68f18',
      independently_verified_physical_device:false},
    receipts:[],
    selected_task:selected?{...tasks[0],source_check:'ORIGINAL_ORDER_CASE_CURRENT'}:null})});
  });
  const p=await page.goto(origin+'/admin/storefront-acceptance/?utm_source=chatgpt.com',
   {waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(p.status(),200);
  assert.equal(await page.locator('#a749WorkQueue').count(),1);
  assert.equal(gets,0);assert.equal(posts,0,'Admin page must not auto-read/write new queue');
  await page.locator('#a749Load').click();
  await page.waitForFunction(()=>document.querySelector('#a749Summary')?.textContent?.includes('0 original work items'));
  assert.equal(gets,1);assert.equal(posts,0);
  assert.equal(await page.locator('#a749Assignee').inputValue(),'91');
  await page.locator('#a749Order').fill('17');
  await page.locator('#a749Case').fill(C);
  await page.locator('#a749Due').fill(future);
  await page.locator('#a749Priority').selectOption('urgent');
  await page.locator('#a749OpenRef').fill('original-source-case-2026-11-22-749');
  await page.locator('#a749OpenNote').fill('Original customer-care request requires one real human follow-up and independent source review.');
  await page.locator('#a749OpenSave').click();
  await page.waitForFunction(()=>document.querySelector('#a749Status')?.textContent?.includes('receipt saved and re-read'));
  assert.equal(posts,1);assert.equal(gets,2);
  assert.match(await page.locator('#a749Rows').textContent(),/Original|Order 17/);
  await page.getByRole('button',{name:'Inspect original source'}).click();
  await page.waitForFunction(()=>document.querySelector('#a749TaskStatus')?.textContent?.includes('ORIGINAL_ORDER_CASE_CURRENT'));
  assert.equal(gets,3);
  assert.equal(await page.locator('#a749ProgressId').inputValue(),T);
  await page.locator('#a749AckRef').fill('original-firefox-owner-review-20261122');
  await page.locator('#a749AckNote').fill('Owner read the second Admin review linked to the original Firefox browser observation.');
  await page.locator('#a749AckConfirm').check();
  await page.locator('#a749AckSave').click();
  if(spec.engine===firefox){
   await page.waitForFunction(()=>document.querySelector('#a749Status')?.textContent?.includes('receipt saved and re-read'));
   assert.equal(posts,2);
   assert.equal(gets,4);
   assert.match(await page.locator('#a749FirefoxStatus').textContent(),/OWNER_ACKNOWLEDGED/);
  }else{
   await page.waitForFunction(()=>document.querySelector('#a749Status')?.textContent?.includes('HOLD: Firefox owner acknowledgement'));
   assert.equal(posts,1,'Chromium must refuse original Firefox acknowledgement');
   assert.equal(gets,3);
  }
  assert.equal(errors.length,0,'Browser script errors: '+errors.join(' | '));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=5,'Unexpected horizontal overflow '+overflow);
  console.log('BUILD749 '+spec.name+' PASS: no auto private read, authorized click-only fake D1 queue, manual task creation, original source detail, owner Firefox-only acknowledgement or Chromium HOLD; no customer/provider calls.');
  await ctx.close();
 }finally{await runner.close();}
}
