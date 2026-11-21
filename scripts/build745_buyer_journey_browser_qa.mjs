// Build 745 real browser acceptance: Source only, no login, D1, checkout or payment.
// Browser test serves the original source files, checks static live route contracts.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=(process.env.DD_ORIGIN||'http://127.0.0.1:18745').replace(/\/$/,'');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const [device,width,height] of [['desktop',1366,900],['mobile',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},acceptDownloads:true,serviceWorkers:'block'});
  const page=await ctx.newPage();
  let postCount=0;
  page.on('request',req=>{if(req.method()==='POST')postCount++});
  const response=await page.goto(base+'/admin/storefront-acceptance/',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  assert.equal(await page.locator('#a745Run').count(),1);
  assert.match(await page.locator('#a745Status').innerText(),/No live storefront inspection/);
  assert.equal(postCount,0);
  await page.locator('#a745Run').click();
  await page.waitForFunction(()=>document.querySelector('#a745Status')?.textContent?.includes('7/7'),{timeout:45000});
  assert.equal(await page.locator('#a745Results tr').count(),7);
  assert.equal(await page.locator('#a745Results td').filter({hasText:'PASS_STATIC_STRUCTURE'}).count(),7);
  assert.equal(await page.locator('#a745Results td').filter({hasText:'PASS_SOURCE_RESPONSE'}).count(),3);
  assert.equal(postCount,0,'manual preflight must not POST');
  const hrefs=await page.locator('#a745Results a').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
  assert.deepEqual(hrefs,['/shop/','/cart/','/checkout/','/pickup/','/contact/','/terms/','/help/']);
  assert.ok(hrefs.every(x=>!x.includes('dovlin')));
  const dl=page.waitForEvent('download');
  await page.locator('#a745Export').click();
  const file=await dl;
  assert.ok(file.suggestedFilename().startsWith('devilndove-buyer-preflight-745-'));
  const proof=JSON.parse(readFileSync(await file.path(),'utf8'));
  assert.equal(proof.build,745);
  assert.equal(proof.static_pass,7);
  assert.equal(proof.step_count,7);
  assert.equal(proof.payment_processed,false);
  assert.equal(proof.provider_settlement_verified,false);
  assert.equal(proof.original_device_acceptance_verified,false);
  assert.equal(proof.dovlin_collection_changed,false);
  assert.equal(postCount,0);
  // Inject an unreachable Checkout response on a deliberate second click.
  await page.route(base+'/checkout/',async route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.locator('#a745Run').click();
  await page.waitForFunction(()=>document.querySelector('#a745Status')?.textContent?.includes('6/7'),{timeout:45000});
  assert.ok((await page.locator('#a745Results').innerText()).includes('Page structure HOLD'));
  assert.equal(postCount,0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=5,'horizontal page overflow: '+overflow);
  await page.screenshot({path:'/tmp/dd-build745-'+device+'.png',fullPage:true,animations:'disabled'});
  console.log('BUILD745 '+device.toUpperCase()+' PASS: 7 genuine static routes, 3 original JS controllers, 0 business POST, JSON truth export, negative checkout HOLD, 0 Dovlin references.');
  await ctx.close();
 }
}finally{await browser.close();}
