/* Build 531: optional, read-only per-Product owner trial summary and manual
 * Facebook readiness. All marketplace work is local; no Meta POST API calls. */
import {marketplaceManualReadiness531,ownerTrialDisposition531} from './marketplace-owner-trial-531.mjs';
const $=id=>document.getElementById(id),summary=$('dd531TrialSummary'),rows=$('dd531TrialRows'),copy=$('dd531CopyTrial'),
 status=$('dd531TrialStatus'),marketButton=$('dd531MarketplaceCheck'),marketResult=$('dd531MarketplaceResult');
const trial=new Map();let run=0;
const text=(parent,value,tag='p')=>{const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;};
const get=async path=>window.DDAuth.readApiJson(await window.DDAuth.apiFetch(path,{method:'GET',cache:'no-store'}),
 {fallbackMessage:'The current Product gallery / Marketplace mapping could not be read.'});
const cleanName=value=>String(value||'').replace(/[\r\n\t]+/g,' ').slice(0,120);
function render(){if(!summary||!rows||!status||!copy)return;
 summary.hidden=false;rows.replaceChildren();
 let completed=0;
 for(const [id,item] of trial){const disposition=ownerTrialDisposition531({productId:id,closure:item.closure,save:item.save,marketplace:item.marketplace,failedReason:item.failed_reason});
  const article=document.createElement('article');article.className='dd531-trial-row';
  text(article,`Product #${id}${item.readback?.name?' · '+cleanName(item.readback.name):''}`,'h4');
  text(article,`Etsy owner: ${disposition.etsy_owner_state} · Save comparison: ${disposition.save_state} · Marketplace: ${disposition.marketplace_state}`);
  const verdict=text(article,`${disposition.state}: ${disposition.issues.join(' ')||'Current owner receipt recorded and local Marketplace copy readiness checked.'}`);
  verdict.className=disposition.state==='CURRENT_OWNER_TRIAL_ACCEPTED'?'dd531-ok':'dd531-hold';
  if(disposition.state!=='CURRENT_OWNER_TRIAL_ACCEPTED'){
   const links=document.createElement('div');links.className='dd531-fix-links';
   for(const [label,href] of [
    ['Review saved Product / Etsy',`/admin/product-editor/?product_id=${id}&tab=etsy`],
    ['Review original photos',`/admin/catalog-media/?product_id=${id}`],
    ['Marketplace preparation',`/admin/product-editor/?product_id=${id}&tab=facebook`]]){
     const a=document.createElement('a');a.className='btn';a.href=href;a.textContent=label;links.append(a);}
   article.append(links);
  }
  if(item.marketplace?.state==='MANUAL_DRAFT_READY')text(article,`Original image IDs prepared for manual Marketplace copy: ${item.marketplace.selected_image_ids.join(', ')}`);
  rows.append(article);if(disposition.state==='CURRENT_OWNER_TRIAL_ACCEPTED')completed++;
 }
 status.textContent=`${completed}/${trial.size} Products have current Etsy owner evidence and local Marketplace manual readiness. A historic failed POST remains unknown without its saved browser request. No Facebook listing was posted.`;
 copy.disabled=!trial.size;
}
async function facebookCheck(id,stamp){
 try{const response=await get(`/api/admin/product-distribution-406?product_id=${id}&channel=facebook`);
  if(stamp!==run||!trial.has(id))return;
  trial.get(id).marketplace=marketplaceManualReadiness531(response,id);
 }catch(error){if(stamp!==run||!trial.has(id))return;
  trial.get(id).marketplace={state:'HOLD',issues:[String(error.message||'Read-only connection unavailable').slice(0,200)]};}
 render();
}
if(summary&&rows&&copy&&status&&window.DDAuth?.apiFetch){
 $('dd529Check')?.addEventListener('click',()=>{run++;trial.clear();summary.hidden=true;copy.disabled=true;});
 document.addEventListener('dd:owner-trial-product-531',event=>{const row=event.detail||{},id=Number(row.product_id);
  if(!Number.isSafeInteger(id)||id<1)return;trial.set(id,{...row,marketplace:{state:'HOLD',issues:['Marketplace gallery not yet checked.']}});
  render();void facebookCheck(id,run);
 });
 document.addEventListener('dd:owner-trial-accepted-531',event=>{const id=Number(event.detail?.product_id),row=trial.get(id);
  if(!row||event.detail?.confirmed!==true||String(row.readback?.listing_id)!==String(event.detail.listing_id))return;
  row.closure={...row.closure,state:'OWNER_RECEIPT_CURRENT'};render();
 });
 copy.addEventListener('click',async()=>{const report=['Devil n Dove owner trial — current readback, not a provider publication receipt'];
  for(const [id,row] of trial){const result=ownerTrialDisposition531({productId:id,closure:row.closure,save:row.save,marketplace:row.marketplace,failedReason:row.failed_reason});
   report.push(`Product #${id} · ${cleanName(row.readback?.name)} · saved Etsy ID ${row.readback?.listing_id||'not confirmed'}`);
   report.push(`Etsy owner: ${result.etsy_owner_state}; Save comparison: ${result.save_state}; Marketplace manual: ${result.marketplace_state}; Result: ${result.state}`);
   if(result.issues.length)report.push(`Follow-up: ${result.issues.join(' ')}`);
  }
  report.push('No Etsy draft, Product save, image upload or Facebook listing was submitted by this summary.');
  try{await navigator.clipboard.writeText(report.join('\n'));status.textContent='Sanitized trial summary copied. No credentials, customer data or provider request details included.';}
  catch{status.textContent='Clipboard permission unavailable. Select the visible trial summary to copy it manually.';}
 });
}
if(marketButton&&marketResult&&window.DDAuth?.apiFetch){
 marketButton.addEventListener('click',async()=>{const id=Number(new URLSearchParams(location.search).get('product_id')||0);
  marketResult.replaceChildren();if(!Number.isSafeInteger(id)||id<1){text(marketResult,'Save or select a Product first. No Marketplace request was sent.');return;}
  marketButton.disabled=true;text(marketResult,'Checking saved original Product photos and local Facebook destination approval (GET only)…');
  try{const value=marketplaceManualReadiness531(await get(`/api/admin/product-distribution-406?product_id=${id}&channel=facebook`),id);
   marketResult.replaceChildren();text(marketResult,`${value.state}: ${value.issues.join(' ')||'The original Product photos and local distribution policy are ready for a MANUAL draft copy.'}`);
   text(marketResult,`${value.approved_gallery_count} approved original photos, ${value.selected_image_ids.length} selected. ${value.next}`);
   if(value.state==='MANUAL_DRAFT_READY')text(marketResult,`Selected original image IDs: ${value.selected_image_ids.join(', ')}. Use the existing Prepare saved Product listing text action; no Meta API was contacted.`);
  }catch(error){marketResult.replaceChildren();text(marketResult,`HOLD — ${String(error.message||'Gallery verification unavailable').slice(0,220)}. No Marketplace write.`);}
  finally{marketButton.disabled=false;}
 });
}
