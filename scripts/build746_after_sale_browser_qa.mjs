// Build 746 source-hosted Firefox-like entry + desktop/mobile Chromium owner UI.
// Every after-sale API request is mocked; no actual customer, D1, payment or
// carrier record accessed, and no live session is simulated or claimed.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
const origin=(process.env.DD_ORIGIN||'http://127.0.0.1:18746').replace(/\/$/,'');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const [label,width,height] of [['desktop',1366,900],['mobile',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block',acceptDownloads:true});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  let calls=0,posts=0,version=0,history=[];
  await page.route('**/api/admin/after-sale-746*',async route=>{
   const req=route.request(),url=new URL(req.url());calls++;
   if(req.method()==='POST'){
    posts++;
    const payload=req.postDataJSON();
    assert.equal(payload.order_id,'91');
    assert.equal(payload.expected_version,version);
    assert.equal(payload.case_type,'pickup_coordination');
    assert.equal(payload.stage,'received');
    assert.ok(payload.notes.length>=20);
    assert.ok(!('customer_email' in payload));
    version++;
    const receipt={receipt_id:'MOCK-RECEIPT-'+version,case_type:payload.case_type,
     stage:payload.stage,notes:payload.notes,recorded_at:'2026-11-21T22:00:00Z',
     evidence_reference:payload.evidence_reference};
    history.unshift(receipt);
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     ok:true,saved:true,current_version:version,receipt,provider_actions_executed:false,
     customer_notified:false,return_approved:false,refund_issued:false,pickup_completed:false,finance_posted:false
    })});
   }
   if(url.searchParams.get('order_id')!=='91')
    return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({ok:false,error:'Original Order not found.'})});
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    ok:true,order:{order_id:91,order_number:'MOCK-91',order_status:'paid',payment_status:'paid',
     fulfillment_type:'pickup',currency:'CAD',total_cents:4100,updated_at:'2026-11-21'},
    case_journal:{version,history,refund_settlement_verified:false,pickup_completion_verified:false}
   })});
  });
  const response=await page.goto(origin+'/admin/storefront-acceptance/?utm_source=chatgpt.com',
   {waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200);
  assert.equal(await page.getByRole('heading',{name:/Customer Storefront, Checkout/i}).count(),1);
  assert.equal(await page.locator('#a746Load').count(),1);
  assert.equal(calls,0,'No auto-fetch by newly added case desk');
  await page.locator('#a660Id').fill('91');
  await page.locator('#a746Load').click();
  await page.waitForFunction(()=>document.querySelector('#a746CaseForm')?.hidden===false);
  assert.equal(version,0);
  assert.equal(await page.locator('#a746Order').innerText().then(t=>t.includes('MOCK-91')),true);
  await page.locator('#a746CaseType').selectOption('pickup_coordination');
  await page.locator('#a746Stage').selectOption('received');
  await page.locator('#a746Notes').fill('Original customer asked whether pickup might be arranged, pending the workshop reply.');
  await page.locator('#a746Save').click();
  await page.waitForFunction(()=>document.querySelector('#a746SaveStatus')?.textContent?.includes('Private case receipt saved'),{timeout:20000});
  assert.equal(posts,1);
  assert.equal(version,1);
  assert.ok((await page.locator('#a746History').innerText()).includes('pickup_coordination'));
  await page.locator('#a660Id').fill('92');
  await page.locator('#a746Load').click();
  await page.waitForFunction(()=>document.querySelector('#a746Status')?.textContent?.includes('HOLD:'));
  assert.equal(await page.locator('#a746CaseForm').isHidden(),true);
  assert.equal(posts,1,'No automatic repeat or fake action');
  assert.equal(errors.length,0,'JavaScript errors: '+errors.join(' / '));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=5,'horizontal overflow '+overflow);
  await page.screenshot({path:'/tmp/dnd-build746-'+label+'.png',fullPage:true,animations:'disabled'});
  console.log('BUILD746 '+label+' PASS: query-tracked Admin link, initial visible page, explicit private Order load, pickup note, no auto payment, unknown Order HOLD, zero JS errors.');
  await ctx.close();
 }
}finally{await browser.close();}
