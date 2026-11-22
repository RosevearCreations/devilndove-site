// Build 747 desktop/mobile original Admin page: APIs are mocked, not Production.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=(process.env.DD_ORIGIN||'http://127.0.0.1:18747').replace(/\/$/,'');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [label,width,height] of [['desktop',1366,900],['mobile',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block',acceptDownloads:true});
  const page=await ctx.newPage(),errors=[];let gets=0,posts=0,version=0;
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/api/admin/customer-journey-747*',async route=>{
   const req=route.request();if(req.method()==='POST'){
    posts++;const body=req.postDataJSON();assert.equal(body.kind,'device');
    assert.equal(body.route,'/shop/');assert.equal(body.expected_version,version);
    version++;return route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify({ok:true,saved:true,current_version:version,
      receipt:{id:'MOCK-747',kind:'device'},customer_notified:false,refund_executed:false})});
   }
   gets++;return route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({ok:true,journal:{version,receipts:version?[{
     id:'MOCK-747',kind:'device',decision:'pass',actor_user_id:91,
     route:'/shop/',device:label,browser:'firefox',recorded_at:'2026-11-21T00:00:00Z'}]:[],
     routes:[{route:'/shop/',device_classes:[],cross_device_reviewed:false}]}})});
  });
  const response=await page.goto(origin+'/admin/storefront-acceptance/?utm_source=chatgpt.com',
   {waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200);
  assert.equal(await page.locator('#a747Local').count(),1);
  assert.equal(gets,0);assert.equal(posts,0,'No automatic private API action');
  await page.locator('#a747Local').click();
  await page.waitForFunction(()=>document.querySelector('#a747Export')?.disabled===false);
  assert.match(await page.locator('#a747Status').innerText(),/Local diagnostic snapshot ready/);
  assert.equal(gets,0);assert.equal(posts,0,'Local diagnostic must not contact the server');
  const report=await page.evaluate(()=>document.querySelector('#a747Diagnostics').textContent);
  assert.ok(report.includes('admin-after-sale-746.js'));
  await page.locator('#a747Load').click();
  await page.waitForFunction(()=>document.querySelector('#a747Status')?.textContent?.includes('journal loaded'));
  assert.equal(gets,1);assert.equal(posts,0);
  await page.locator('#a747Device').selectOption(label);
  await page.locator('#a747Decision').selectOption('pass');
  await page.locator('#a747Ref').fill('original-field-device-reference-20261121');
  await page.locator('#a747Note').fill('Personally observed original Shop controls on the specified browser and physical device.');
  await page.locator('#a747DeviceSave').click();
  await page.waitForFunction(()=>document.querySelector('#a747Status')?.textContent?.includes('Private evidence receipt saved'));
  assert.equal(posts,1);assert.equal(gets,2);
  assert.match(await page.locator('#a747Receipts').innerText(),/MOCK-747/);
  assert.equal(errors.length,0,errors.join(' / '));
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=5,'Unexpected horizontal overflow');
  console.log('BUILD747 '+label+' PASS: tracked Admin URL, zero automatic requests, click diagnostics, one consented fake private observation, no JS errors.');
  await ctx.close();
 }
}finally{await browser.close();}
