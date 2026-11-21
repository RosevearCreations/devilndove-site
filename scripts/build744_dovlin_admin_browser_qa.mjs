// Build 744 desktop/mobile Chromium source test. All API requests are intercepted;
// nothing writes to real D1, published products, inventory or social platforms.
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const source=JSON.parse(readFileSync(new URL('../dovlin/data/gallery_material_evidence.json',import.meta.url),'utf8')).records;
const base=(process.env.DOVLIN_BASE||'http://127.0.0.1:18744').replace(/\/$/,'');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [device,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  let calls=0,postCalls=0,version=0,current=null;
  const errors=[],failed=[];
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await ctx.newPage();
  await page.route('**/api/admin/dovlin-readiness-744*',async route=>{
   calls++;
   const req=route.request(),url=new URL(req.url());
   if(req.method()==='POST'){
    postCalls++;
    const payload=req.postDataJSON();
    assert.equal(payload.id,'plush/original-crimson');
    assert.equal(payload.expected_source_sha,source[0].source_git_blob_sha);
    assert.equal(payload.expected_version,0);
    assert.equal(payload.evidence.decision,'hold');
    assert.equal(payload.evidence.sample_observed,false);
    assert.equal(payload.evidence.components.length,1);
    assert.equal(payload.evidence.components[0].component,'Body fabric');
    assert.equal(payload.evidence.components[0].unit_cost_cents,1250);
    assert.ok(!('product_status' in payload));
    current={evidence:payload.evidence};
    version++;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     ok:true,saved:true,version,receipt:{receipt_id:'mock-receipt',stage:'HOLD_NEEDS_EVIDENCE'},
     readiness:{stage:'HOLD_NEEDS_EVIDENCE',holds:['PHYSICAL_SAMPLE_NOT_VERIFIED'],
      planning_cost_cents:null,commercial_release:false},
     product_published:false,inventory_mutated:false,accounting_posted:false
    })});
   }
   if(req.method()==='GET'&&url.searchParams.has('id')){
    const item=source.find(x=>x.id===url.searchParams.get('id'));
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     ok:true,record:{
      id:item.id,name:item.name,kind:item.record_type,category:item.category,
      art:item.source_webp,source_sha:item.source_git_blob_sha,
      original_filename:item.original_source_filename,provisional_art_match:!!item.provisional_art_match,
      version,current,history:[],readiness:{stage:version?'HOLD_NEEDS_EVIDENCE':'NOT_REVIEWED',
       holds:['PHYSICAL_SAMPLE_NOT_VERIFIED'],planning_cost_cents:null}
     }
    })});
   }
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    ok:true,records:source.map(x=>({id:x.id,name:x.name,kind:x.record_type,
     category:x.category,art:x.source_webp,source_sha:x.source_git_blob_sha,
     original_filename:x.original_source_filename,provisional_art_match:!!x.provisional_art_match,
     version:0,readiness:{stage:'NOT_REVIEWED',holds:['ARTWORK_NOT_COMPARED'],
      planning_cost_cents:null,commercial_release:false}})),
    record_count:68,kinds:{plush:10,workshop:38,colour:20},no_sale_without_separate_approval:true
   })});
  });
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).pathname.startsWith('/admin/dovlin-readiness/'))failed.push(r.status()+' '+r.url())});
  const initial=await page.goto(base+'/admin/dovlin-readiness/',{waitUntil:'networkidle',timeout:45000});
  assert.equal(initial.status(),200);
  assert.equal(await page.getByRole('heading',{name:/Dovlin Artwork, Sample/i}).count(),1);
  await page.getByRole('status').first().waitFor();
  await page.waitForFunction(()=>document.querySelector('#conceptId')?.options.length===69);
  assert.ok((await page.locator('#collectionCounts').innerText()).includes('Planned plush: 10'));
  assert.ok((await page.locator('#collectionCounts').innerText()).includes('Workshop ideas: 38'));
  await page.locator('#findConcept').fill('Original Crimson');
  assert.equal(await page.locator('#conceptId option').count(),2,'search filters source list');
  await page.locator('#findConcept').fill('');
  await page.locator('#conceptId').selectOption('plush/original-crimson');
  await page.locator('#activeWorkspace').waitFor({state:'visible'});
  assert.ok(await page.locator('#artImage').evaluate(im=>im.complete&&im.naturalWidth>0),'original WebP rendered');
  assert.equal(await page.locator('#readinessStage').innerText(),'NOT_REVIEWED');
  assert.match(await page.locator('#originalSha').innerText(),/^[0-9a-f]{40}$/);
  await page.locator('#addMaterial').click();
  assert.equal(await page.locator('#bomRows tr').count(),1);
  const row=page.locator('#bomRows tr').first();
  await row.locator('[data-field=component]').fill('Body fabric');
  await row.locator('[data-field=material]').fill('Unverified prototype fabric');
  await row.locator('[data-field=supplier]').fill('Sample vendor');
  await row.locator('[data-field=lot]').fill('Lot not finalized');
  await row.locator('[data-field=unit]').fill('m');
  await row.locator('[data-field=quantity]').fill('0.5');
  await row.locator('[data-field=unit_cost_cad]').fill('12.50');
  await row.locator('[data-field=evidence_ref]').fill('pending receipt reference');
  await page.locator('#reviewNote').fill('A test-only draft for checking the hold state, not actual prototype evidence.');
  await page.getByRole('button',{name:/Save private evidence receipt/}).click();
  await page.waitForFunction(()=>document.querySelector('#saveStatus')?.textContent?.includes('Saved version 1'));
  assert.equal(postCalls,1);
  assert.equal(version,1);
  assert.equal(await page.locator('#readinessStage').innerText(),'HOLD_NEEDS_EVIDENCE');
  const x=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(x<=3,'horizontal overflow '+x);
  assert.deepEqual(errors,[]);
  assert.deepEqual(failed,[]);
  assert.ok(calls>=3);
  await page.screenshot({path:'/tmp/dovlin744-'+device+'-admin.png',fullPage:true,animations:'disabled'});
  console.log('BUILD 744 '+device.toUpperCase()+' CHROMIUM PASS: Admin-only workbench, 68 source records, actual WebP, selective search, factual BOM form, mock-only saved HOLD receipt, zero overflow.');
  await ctx.close();
 }
}finally{await browser.close();}
