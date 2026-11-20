// Build 742 Development recovery page — Firefox source test; all network writes mocked.
import { firefox } from 'playwright';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:18746';
const browser=await firefox.launch({headless:true});
try {
  const ctx=await browser.newContext({serviceWorkers:'block'});
  const page=await ctx.newPage();
  const scriptFailures=[],runtimeErrors=[];
  const resetPosts=[];
  page.on('pageerror',e=>runtimeErrors.push(String(e)));
  page.on('response',res=>{
    const path=new URL(res.url()).pathname;
    if(path.endsWith('.js')&&res.status()!==200)scriptFailures.push(path+': HTTP '+res.status());
  });
  await page.route(origin+'/api/auth/recovery-734',async route=>{
    const req=route.request();
    if(req.method()==='POST'){
      const payload=req.postDataJSON();
      resetPosts.push(payload);
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
        ok:true,message:'If the details match an eligible account and email delivery is available, instructions will be sent to its registered address.',
        delivery_unconfirmed:true
      })});
    }
    return route.fulfill({status:405,contentType:'application/json',body:'{}'});
  });
  await page.goto(origin+'/account-help/',{waitUntil:'networkidle'});
  assert.equal(await page.title(),'Account Help | Devil n Dove');
  await page.locator('#recovery734Email').fill('owner@example.invalid');
  await page.getByRole('button',{name:'Email password reset link'}).click();
  await page.waitForFunction(()=>document.querySelector('#accountHelpMessage')?.textContent?.includes('If the details match'));
  assert.equal(resetPosts.length,1,'exactly one deliberate POST');
  assert.equal(resetPosts[0].action,'reset_request');
  assert.equal(resetPosts[0].email,'owner@example.invalid');
  assert.deepEqual(scriptFailures,[],'all recovery page JavaScript assets load without 404s');
  assert.deepEqual(runtimeErrors,[],'no uncaught Firefox page JavaScript errors');
  console.log('BUILD742 FIREFOX RECOVERY PAGE: PASS — form submits exact mock-only POST, status reads safely, 0 missing JS assets and 0 uncaught JS exceptions; no customer DB/email mutation.');
  await ctx.close();
}finally {await browser.close();}
