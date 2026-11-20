// Build 743: real headless Chromium local-source acceptance (not Cloudflare production).
// This never authenticates to customer accounts or changes inventory, payments, orders or private media.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = (process.env.DOVLIN_BASE || 'http://127.0.0.1:18743').replace(/\/$/,'');
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  for (const [device,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[],responses=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('response',res=>{if(res.status()>=400 && res.url().startsWith(base))responses.push(res.status()+' '+res.url())});

    let response=await page.goto(base+'/dovlin/',{waitUntil:'networkidle',timeout:45000});
    assert.equal(response.status(),200,device+' Dovlin collection HTTP 200');
    await page.locator('#plush-grid article').first().waitFor({timeout:20000});
    assert.equal(await page.locator('#plush-grid article').count(),10,device+' ten planned plush');
    assert.equal(await page.locator('#product-grid article').count(),38,device+' 38 workshop concepts');
    assert.equal(await page.locator('#colour-grid figure').count(),20,device+' 20 colour studies');
    const legend=await page.locator('#legend-copy').textContent();
    assert.ok(legend.includes('Long ago, in a little workshop where imagination had no boundaries'),device+' exact original legend begins');
    assert.ok(legend.includes('From all of us at Devil n Dove.'),device+' legend ends');
    assert.ok(await page.locator('.hero-visual img').first().evaluate(img=>img.complete&&img.naturalWidth>0),device+' source WebP loads');
    assert.equal(await page.getByRole('link',{name:/Evidence Gallery/i}).count(),1,device+' gallery discovery');
    await page.locator('#search').fill('CNC');
    let filtered=await page.locator('#product-grid article').count();
    assert.ok(filtered>0&&filtered<38,device+' workshop search filter');
    await page.locator('#search').fill('');
    assert.equal(await page.locator('#product-grid article').count(),38,device+' workshop filter reset');
    const artwork=page.locator('#plush-grid img[role="button"]').first();
    await artwork.click();
    assert.ok(await page.locator('#dovlinLightbox').evaluate(d=>d.open),device+' modal visible');
    await page.locator('#dovlinNext').click();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Escape');
    assert.ok(!(await page.locator('#dovlinLightbox').evaluate(d=>d.open)),device+' Escape close');
    assert.equal(await page.getByRole('button',{name:/^buy|add to cart|checkout/i}).count(),0,device+' no phantom sale buttons');
    const xOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(xOverflow<=3,device+' collection horizontal overflow '+xOverflow);
    await page.screenshot({path:'/tmp/dovlin-browser-'+device+'-collection.png',fullPage:true,animations:'disabled'});

    response=await page.goto(base+'/dovlin/gallery/',{waitUntil:'networkidle',timeout:45000});
    assert.equal(response.status(),200,device+' gallery HTTP 200');
    await page.locator('#galleryGrid article').first().waitFor({timeout:20000});
    assert.equal(await page.locator('#galleryGrid article').count(),68,device+' all source-indexed concepts');
    assert.equal(await page.locator('#galleryFailure').isHidden(),true,device+' evidence register loaded');
    assert.ok((await page.locator('#galleryCount').innerText()).includes('68 of 68'),device+' count');
    await page.locator('#conceptType').selectOption('plush_concept');
    assert.equal(await page.locator('#galleryGrid article').count(),10,device+' plush filter');
    await page.locator('#conceptType').selectOption('workshop_concept');
    assert.equal(await page.locator('#galleryGrid article').count(),38,device+' workshop filter');
    await page.locator('#conceptType').selectOption('colour_study');
    assert.equal(await page.locator('#galleryGrid article').count(),20,device+' future colour filter');
    await page.locator('#conceptType').selectOption('all');
    await page.locator('#conceptSearch').fill('Ivory Dove');
    assert.equal(await page.locator('#galleryGrid article').count(),1,device+' text filter');
    await page.locator('#galleryGrid article button').first().click();
    assert.ok(await page.locator('#recordDialog').evaluate(d=>d.open),device+' details accessible');
    assert.match(await page.locator('#detailNote').innerText(),/provisional approximate artwork/i,device+' exact art mismatch honestly labeled');
    assert.match(await page.locator('#detailMetadata').innerText(),/Not yet verified/i,device+' material evidence not invented');
    assert.match(await page.locator('#detailMetadata').innerText(),/Concept only — not for sale/i,device+' no phantom inventory');
    await page.locator('#detailClose').click();
    assert.ok(!(await page.locator('#recordDialog').evaluate(d=>d.open)),device+' details closed');
    await page.locator('#conceptSearch').fill('');
    assert.equal(await page.locator('#galleryGrid article').count(),68,device+' gallery reset');
    assert.ok(await page.locator('.hero img').first().evaluate(img=>img.complete&&img.naturalWidth>0),device+' gallery master image loaded');
    const galleryOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(galleryOverflow<=3,device+' gallery horizontal overflow '+galleryOverflow);
    await page.screenshot({path:'/tmp/dovlin-browser-'+device+'-evidence-gallery.png',fullPage:true,animations:'disabled'});
    assert.deepEqual(responses,[],device+' local assets all loaded without HTTP errors');
    assert.deepEqual(errors,[],device+' no uncaught JavaScript errors');
    console.log('BUILD 743 '+device.toUpperCase()+' BROWSER PASS: collection 10+38+20, approved legend, filters, modal and gallery 68, material disclosure, mobile overflow '+galleryOverflow);
    await page.close();
  }
} finally {
  await browser.close();
}
