// Build751 real Firefox desktop/mobile and Chromium Admin experience, fake provider/D1 only.
import assert from 'node:assert/strict';
import {firefox,chromium} from 'playwright';
const base=(process.env.DD_ORIGIN||'http://127.0.0.1:18751').replace(/\/$/,'');
const id='ed7745fc-a419-4d7c-bb34-b5687cb29c31';
const inbound='b00a755e-100b-4a82-aed6-22366a163666';
const outbound='9e9e98a4-dfde-435f-bdbe-c9dfc81c5d93';
const proof='9217d42e-17de-4291-91ce-b03ecc2b656a';
const closure='22d3ab68-2a33-47d2-8798-3398bef9cbfe';
const plan='c73e6e0b-abaf-45a3-b2d8-4d7dcbff321c';
const today=new Date().toISOString().slice(0,10);
for(const spec of [
 {name:'firefox-desktop',engine:firefox,width:1360,height:900},
 {name:'firefox-mobile',engine:firefox,width:390,height:844},
 {name:'chromium',engine:chromium,width:1280,height:800}
]){
 const b=await spec.engine.launch({headless:true,...(spec.engine===chromium?{args:['--no-sandbox']}:{})});
 try{
  const ctx=await b.newContext({viewport:{width:spec.width,height:spec.height},serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  let gets=0,posts=0,version=0,seen=false,reviewed=false,closed=false,planMade=false,approved=false;
  await page.route('**/api/admin/customer-care-sla-751*',async route=>{
   const req=route.request(),u=new URL(req.url());
   assert.equal(u.origin,base);
   if(req.method()==='POST'){
    posts++;const data=req.postDataJSON();
    assert.equal(data.expected_version,version);
    assert.equal(data.task_id,id);
    assert.match(data.request_key,/^[a-f0-9-]{36}$/i);
    assert.equal(req.headers()['content-type'],'application/json');
    if(data.kind==='provider_readback'){
     assert.equal(data.owner_clicked_readback,true);
     assert.equal(data.inbound_id,inbound);assert.equal(data.outbound_id,outbound);seen=true;
    }else if(data.kind==='provider_review'){
     assert.equal(data.subject_id,proof);reviewed=true;
    }else if(data.kind==='sla_close'){assert.equal(reviewed,true);closed=true;
    }else if(data.kind==='retention_plan'){
     assert.equal(data.review_on,today);planMade=true;
    }else if(data.kind==='retention_review'){
     assert.equal(data.subject_id,plan);approved=true;
    }else if(data.kind==='retention_check'){assert.equal(data.subject_id,plan);
    }else throw Error('Unexpected Build751 source action '+data.kind);
    version++;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     ok:true,saved:true,current_version:version,receipt:{id:closed?closure:planMade?plan:proof},
     provider_fetch_only:false,external_send:false,customer_notified:false,auto_purge:false})});
   }
   gets++;const q=u.searchParams.get('task_id');
   const status={task_id:id,order_id:17,original_source:q?'CURRENT':'NOT_RECHECKED_IN_SUMMARY',
    provider_state:closed?'INTERNALLY_CLOSED_PROVIDER_LINKED_CASE':
     reviewed?'REVIEWED_PROVIDER_THREAD_FOLLOWUP_OPEN':
     seen?'HOLD_SECOND_ADMIN_READBACK_REVIEW':'HOLD_NO_NATIVE_READBACK',
    provider_receipt_id:seen?proof:null,provider_review_id:reviewed?proof:null,
    independently_reviewed_provider_thread:reviewed,internally_closed:closed,
    closed_receipt_id:closed?closure:null,first_reply_minutes:seen?120:null,
    reply_target_minutes:2880,reply_sla:seen?'WITHIN_TARGET':'HOLD_MISSING_TIME',
    closed_loop_minutes:closed?125:null,close_sla:closed?'WITHIN_TARGET':'HOLD_NOT_CLOSED',
    retention_review_on:approved?today:null,retention_due:approved,
    retention_soon:approved,retention_schedule_id:planMade?plan:null,
    retention_approval_id:approved?proof:null,archived:true,
    legal_hold:false,unresolved_escalation:false,
    provider_cannot_verify_human_identity:true};
   const visible=u.searchParams.get('view')!=='due'||approved;
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    ok:true,version,provider_configured:true,
    rows:visible?[status]:[],selected:q?status:null,
    summary:{tasks:1,provider_threads_reviewed:reviewed?1:0,
     internally_closed:closed?1:0,retention_due:approved?1:0,
     retention_soon:approved?1:0},receipts:[],
    no_provider_fetch_on_get:true,no_auto_reminders:true})});
  });
  const pageResult=await page.goto(base+'/admin/storefront-acceptance/?utm_source=chatgpt.com',
   {waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(pageResult.status(),200);
  assert.equal(await page.locator('#a751Workflow').count(),1);
  assert.equal(gets,0);assert.equal(posts,0,'No automatic private request before manual load');
  await page.locator('#a751Load').click();
  await page.waitForFunction(()=>document.querySelector('#a751Summary')?.textContent?.includes('1 original tasks'));
  assert.equal(gets,1);assert.equal(posts,0);
  await page.getByRole('button',{name:'Inspect original task'}).click();
  await page.waitForFunction(()=>document.querySelector('#a751Detail')?.textContent?.includes('CURRENT'));
  assert.equal(await page.locator('#a751ReadTask').inputValue(),id);
  await page.locator('#a751ReadForm').evaluate(x=>x.closest('details').open=true);
  await page.locator('#a751InboundId').fill(inbound);
  await page.locator('#a751OutboundId').fill(outbound);
  await page.locator('#a751ReadConsent').check();
  await page.locator('#a751ReadRef').fill('original-provider-mailbox-id-evidence-20261122');
  await page.locator('#a751ReadNote').fill('Original Resend metadata will be fetched only after the explicit Admin click.');
  await page.locator('#a751ReadSave').click();
  await page.waitForFunction(()=>document.querySelector('#a751ReviewSubject')?.value?.length===36);
  assert.equal(posts,1);
  assert.equal(await page.locator('#a751ReviewSubject').inputValue(),proof);
  await page.locator('#a751ReviewForm').evaluate(x=>x.closest('details').open=true);
  await page.locator('#a751ReviewDecision').selectOption('pass');
  await page.locator('#a751ReviewRef').fill('second-admin-native-provider-source-readback');
  await page.locator('#a751ReviewNote').fill('Independent readback matches original trusted Resend metadata for the order.');
  await page.locator('#a751ReviewSave').click();
  await page.waitForFunction(()=>document.querySelector('#a751Detail')?.textContent?.includes('REVIEWED_PROVIDER_THREAD'));
  await page.locator('#a751CloseForm').evaluate(x=>x.closest('details').open=true);
  await page.locator('#a751CloseRef').fill('independent-care-sla-close-review');
  await page.locator('#a751CloseNote').fill('Internal SLA review is complete and did not execute a customer transaction.');
  await page.locator('#a751CloseSave').click();
  await page.waitForFunction(()=>document.querySelector('#a751Detail')?.textContent?.includes('INTERNALLY_CLOSED'));
  await page.locator('#a751PlanForm').evaluate(x=>x.closest('details').open=true);
  await page.locator('#a751PlanDate').fill(today);
  await page.locator('#a751PlanRef').fill('manual-retention-review-date-source');
  await page.locator('#a751PlanNote').fill('Original immutable archive needs manually reviewed future calendar attention.');
  await page.locator('#a751PlanSave').click();
  await page.waitForFunction(()=>document.querySelector('#a751ApproveSubject')?.value?.length===36);
  assert.equal(await page.locator('#a751ApproveSubject').inputValue(),plan);
  await page.locator('#a751ApproveForm').evaluate(x=>x.closest('details').open=true);
  await page.locator('#a751ApproveDecision').selectOption('approve');
  await page.locator('#a751ApproveRef').fill('independent-retention-approval-source');
  await page.locator('#a751ApproveNote').fill('Another original Admin approves the manual review date without deletion.');
  await page.locator('#a751ApproveSave').click();
  await page.waitForFunction(()=>document.querySelector('#a751Detail')?.textContent?.includes('(DUE)'));
  await page.locator('#a751View').selectOption('due');
  await page.locator('#a751Load').click();
  await page.waitForFunction(()=>document.querySelectorAll('#a751Rows button').length===1);
  assert.equal(posts,5);
  assert.deepEqual(errors,[]);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=5);
  console.log('BUILD751 '+spec.name+' PASS: manual-only provider readback IDs, second review, source SLA closure and retention due dashboard; no automatic provider writes.');
  await ctx.close();
 }finally{await b.close();}
}
