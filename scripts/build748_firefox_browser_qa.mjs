// Build 748 real Playwright Firefox + Chromium, source-hosted only, mock D1.
import assert from 'node:assert/strict';
import {firefox,chromium} from 'playwright';
const base=(process.env.DD_ORIGIN||'http://127.0.0.1:18748').replace(/\/$/,'');
const ROUTES=['/shop/','/cart/','/checkout/','/pickup/','/contact/','/terms/','/help/'];
const cases=[
 {name:'firefox-desktop',engine:firefox,width:1366,height:900,bad:null},
 {name:'firefox-mobile',engine:firefox,width:390,height:844,bad:'/help/'},
 {name:'chromium-fallback',engine:chromium,width:1280,height:800,bad:null}
];
const publicHtml=path=>'<!doctype html><html lang="en"><head><title>Original '+path+
 '</title></head><body><h1>Source-backed page '+path+'</h1><p>Test-only public HTML without customer records or mutations.</p></body></html>';
for(const config of cases){
 const instance=await config.engine.launch({headless:true,...(config.engine===chromium?{args:['--no-sandbox']}:{})});
 try{
  const ctx=await instance.newContext({viewport:{width:config.width,height:config.height},
   acceptDownloads:true,serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  let publicGets=0,privateGets=0,privatePosts=0,privateVersion=0;
  await page.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname;
   if(ROUTES.includes(path)&&req.resourceType()==='fetch'){
    assert.equal(req.method(),'GET');
    publicGets++;
    if(path===config.bad)return route.fulfill({status:503,contentType:'text/html',body:'Unavailable test path'});
    return route.fulfill({status:200,contentType:'text/html',body:publicHtml(path)});
   }
   if(path==='/api/admin/customer-journey-closure-748'){
    if(req.method()==='POST'){
     privatePosts++;const payload=req.postDataJSON();
     assert.equal(payload.kind,'firefox_observation');
     assert.equal(payload.browser_family,'firefox');
     assert.equal(payload.static_pass,config.bad?6:7);
     assert.equal(payload.static_hold,config.bad?1:0);
     assert.equal(payload.owner_clicked_confirmation,true);
     assert.equal(payload.expected_version,privateVersion);
     privateVersion++;
     return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({ok:true,saved:true,receipt:{
       id:'MOCK-OWNER-748',kind:payload.kind,decision:payload.decision,
       actor_user_id:91,source_reference:payload.source_reference},
       current_version:privateVersion,customer_message_sent:false,refund_executed:false})});
    }
    privateGets++;
    return route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify({ok:true,journal:{version:privateVersion,
      firefox_review_state:'HOLD_INDEPENDENT_FIREFOX_REVIEW',
      receipts:privateVersion?[{id:'MOCK-OWNER-748',kind:'firefox_observation',
       decision:config.bad?'hold':'observed',actor_user_id:91,device_class:config.width<600?'mobile':'desktop'}]:[]}})});
   }
   return route.continue();
  });
  const first=await page.goto(base+'/admin/customer-journey-recovery/?utm_source=chatgpt.com',
   {waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(first.status(),200);
  assert.equal(await page.getByRole('heading',{name:/lightweight recovery/i}).count(),1);
  assert.equal(publicGets,0);assert.equal(privateGets,0);assert.equal(privatePosts,0);
  await page.locator('#a748Probe').click();
  await page.waitForFunction(()=>document.querySelector('#a748Export')?.disabled===false,{timeout:30000});
  assert.equal(publicGets,7);
  assert.equal(privateGets,0);assert.equal(privatePosts,0);
  assert.equal(await page.locator('#a748ProbeRows li').count(),7);
  const status=await page.locator('#a748ProbeStatus').innerText();
  assert.ok(status.includes(config.bad?'6/7':'7/7'),status);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#a748Export').click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/firefox-diagnostics-748\.json$/);
  const main=await page.goto(base+'/admin/storefront-acceptance/?utm_source=chatgpt.com',
   {waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(main.status(),200);
  assert.equal(await page.locator('#a748EvidenceLoad').count(),1);
  assert.equal(privatePosts,0);assert.equal(privateGets,0);
  await page.locator('#a748Probe').click();
  await page.waitForFunction(()=>document.querySelector('#a748Export')?.disabled===false,{timeout:30000});
  assert.equal(publicGets,14);
  await page.locator('#a748EvidenceLoad').click();
  await page.waitForFunction(()=>document.querySelector('#a748Status')?.textContent?.includes('Original private evidence loaded'));
  assert.equal(privateGets,1);assert.equal(privatePosts,0);
  await page.locator('#a748FirefoxRef').fill('original-owner-firefox-screenshot-reference-748');
  await page.locator('#a748FirefoxNote').fill('Personally inspected the original browser status and seven customer routes; this is not payment evidence.');
  await page.locator('#a748Confirm').check();
  await page.locator('#a748FirefoxDecision').selectOption(config.bad?'hold':'observed');
  await page.locator('#a748FirefoxSave').click();
  if(config.engine===firefox){
   await page.waitForFunction(()=>document.querySelector('#a748Status')?.textContent?.includes('Private firefox_observation receipt recorded'),{timeout:20000});
   assert.equal(privatePosts,1);
   assert.equal(privateGets,2);
   assert.match(await page.locator('#a748Receipts').textContent(),/MOCK-OWNER-748/);
  }else{
   await page.waitForFunction(()=>document.querySelector('#a748Status')?.textContent?.includes('HOLD:'));
   assert.equal(privatePosts,0,'Chrome may not impersonate real Firefox proof');
  }
  assert.equal(errors.length,0,'JavaScript errors '+errors.join(' | '));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=5,'Horizontal overflow '+overflow);
  console.log('BUILD748 '+config.name+' PASS: real engine recovery route, bounded public GETs, no auto D1, explicit Firefox consent or Chrome refusal, no provider/order mutations');
  await ctx.close();
 }finally{await instance.close();}
}
