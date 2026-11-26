import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.DD_ORIGIN||'http://127.0.0.1:18762';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [device,width,height] of [['phone',390,844],['tablet',820,1180],['desktop',1440,900]]){
  const context=await browser.newContext({viewport:{width,height}});
  const page=await context.newPage();
  let providerReads=0,orderSubmits=0,paymentSubmits=0;
  await page.route('**/api/payment-providers',r=>{
   providerReads++;
   return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    ok:true,payment_execution_boundary:{production_execution:false},
    providers:[{code:'paypal',ready:false,execution_authorized:false,execution_code:'payment_execution_development_only'},
    {code:'stripe',ready:false,execution_authorized:false,execution_code:'payment_execution_development_only'},
    {code:'square',ready:false,execution_authorized:false,execution_code:'payment_provider_execution_not_implemented'},
    {code:'manual',ready:true,execution_authorized:true}]
   })});
  });
  await page.route('**/api/checkout-create-order',r=>{orderSubmits++;return r.fulfill({status:423,body:'blocked'});});
  await page.route('**/api/checkout-prepare-payment',r=>{paymentSubmits++;return r.fulfill({status:423,body:'blocked'});});
  await page.goto(origin+'/checkout/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('checkoutWallet761')?.textContent?.includes('unavailable'),{timeout:18000});
  const source=await page.locator('#checkoutWallet761').textContent();
  assert.match(source,/PayPal, card and Square live handoffs are currently unavailable/);
  const choice=await page.locator('#payment_method').evaluate(el=>({
   selected:el.value,
   remote:[...el.options].filter(x=>['paypal','stripe','square'].includes(x.value))
     .map(x=>({name:x.value,disabled:x.disabled})),
   manual:[...el.options].find(x=>x.value==='manual')?.disabled
  }));
  assert.equal(choice.selected,'manual',device+' selected method');
  assert.equal(choice.manual,false,device+' available manual order');
  assert.equal(choice.remote.length,3);
  assert.ok(choice.remote.every(x=>x.disabled),device+' no unavailable eWallet advertised as operational');
  assert.ok(providerReads>=1,device+' actual readiness GET observed');
  assert.equal(orderSubmits,0,'no guest order was created');
  assert.equal(paymentSubmits,0,'no provider payment was created');
  console.log('BUILD762 BROWSER PASS '+device+' '+width+'x'+height+
    ' guest source GET='+providerReads+' remote disabled=3 manual unpaid checkout; provider writes=0');
  await context.close();
 }
}finally{await browser.close();}
