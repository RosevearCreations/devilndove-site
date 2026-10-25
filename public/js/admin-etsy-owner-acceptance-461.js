/* Build 461: explicit operator-triggered, original Admin GETs only. No provider POST. */
import {evaluateEtsyOwner461,OWNER_461_CHECKS} from './etsy-owner-acceptance-policy-461.mjs?v=461';
const el=id=>document.getElementById(id),form=el('eaForm'),product=el('eaProduct'),draft=el('eaDraft');
const refresh=el('eaRefresh'),loadDrafts=el('eaLoadDrafts'),savedDraft=el('eaSavedDraft'),status=el('eaStatus'),summary=el('eaSummary'),sources=el('eaSources'),holds=el('eaHolds');
const checklist=el('eaChecklist'),checkStatus=el('eaCheckStatus');
const positive=value=>/^[1-9]\d{0,9}$/.test(String(value||''))?String(value):'';
const validDraft=value=>/^[A-Za-z0-9-]{16,80}$/.test(String(value||''))?String(value):'';
const node=(tag,text,className)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(className)x.className=className;return x;};
let busy=false;
function announce(text,error=false){status.textContent=text;status.className='ea-status'+(error?' ea-error':'');}
async function get(url){
 try{const response=await fetch(url,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  const data=await response.json().catch(()=>({error:'Invalid source response.'}));
  return response.ok&&data?.ok?data:{ok:false,error:String(data?.error||`HTTP ${response.status}`).slice(0,180)};
 }catch{return {ok:false,error:'Connection or Admin source is unavailable.'};}
}
function drawChecks(enabled=false){checklist.replaceChildren();for(const check of OWNER_461_CHECKS){const box=node('div'),label=node('label',undefined,'ea-check'),input=document.createElement('input');
  input.type='checkbox';input.value=check.key;input.disabled=!enabled;
  label.append(input,node('span',check.label));box.append(label);
  const details=node('details',undefined,'ea-help'),head=node('summary','ⓘ '+check.key);details.append(head,node('p',check.help));box.append(details);checklist.append(box);
 }countChecks();}
function countChecks(){const checked=checklist.querySelectorAll('input:checked').length,enabled=Boolean(checklist.querySelector('input:not(:disabled)'));
 checkStatus.textContent=enabled?`${checked} of ${OWNER_461_CHECKS.length} personal checks marked on this screen only. Nothing saved, approved, posted or published; owner acceptance HOLD.`:
 'Original source pair not verified. Personal checks unavailable; Etsy/Meta acceptance remains HOLD.';
}
function addCard(title,fields,link){const card=node('article',undefined,'ea-card');card.append(node('h3',title));for(const [label,value] of fields)card.append(node('p',label+': '+String(value||'Not yet verified')));
 if(link){const p=node('p'),a=node('a','Open original authority');a.href=link;p.append(a);card.append(p)}sources.append(card);}
function paint(result,data){sources.replaceChildren();holds.replaceChildren();
 summary.textContent=`HOLD: ${result.holds.length} open source/owner verification conditions. Etsy Shop ${result.shopId||'unverified'} · local Product ${result.productId||'unverified'} · draft ${result.draftId||'unverified'} · linked listing ${result.listingId||'unverified'}. No publication or provider write occurred.`;
 addCard('Etsy main-domain identity',[['Shop ID',result.shopId],['Currency',data.oauth?.shop?.currency_code],['Connection',data.oauth?.connection?.status],['Original source',data.oauth?.ok?'Main OAuth acceptance GET':'Unavailable · '+String(data.oauth?.error||'').slice(0,150)]],'/admin/it-integrations/');
 addCard('Product and one-attempt draft',[['Product #',result.productId],['Local draft',result.draftId],['Canada-first policy',data.trial?.shippingPolicy],['Trial receipt',data.trial?.trial_receipt],['Creation claim',data.local?.claim_receipt||data.trial?.remote_attempt_claim]],'/admin/product-editor/');
 addCard('Unpublished listing evidence',[['Etsy listing ID',result.listingId],['Local draft status',data.local?.local_status],['Prior provider receipt',data.trial?.provider_verified_receipt_present?'Present (historical)':'Not confirmed'],['Independent packet',data.packet?.packet_status],['Current live Etsy state','Owner must inspect in Etsy']],'/admin/it-integrations/');
 addCard('Meta manual-only handoff',[['Supported Meta posting API permission','HOLD · not verified'],['Fallback','Manual Product Editor field copy'],['Meta provider writes','Disabled in this acceptance screen']],'/admin/product-editor/');
 for(const issue of result.holds)holds.append(node('p','HOLD: '+issue,'ea-hold'));
 for(const [name,value] of Object.entries(data))if(value?.ok===false&&value.error)holds.append(node('p',`SOURCE HOLD (${name}): ${String(value.error).slice(0,180)}`,'ea-hold'));
 drawChecks(Boolean(data.oauth?.ok&&data.trial?.ok&&data.local?.ok&&data.packet?.ok&&result.listingId));
}
function invalidate(){sources.replaceChildren();holds.replaceChildren();summary.textContent='HOLD: Source selection changed. Recheck the exact original records before any owner conclusion.';drawChecks();}
product.addEventListener('input',invalidate);draft.addEventListener('input',invalidate);
form.addEventListener('submit',async event=>{event.preventDefault();if(busy)return;
 const productId=positive(product.value.trim()),localDraftId=validDraft(draft.value.trim());
 if(!productId||!localDraftId){announce('Choose a real positive Product ID and its 16–80-character local Etsy draft UUID.',true);return;}
 busy=true;refresh.disabled=true;product.disabled=true;draft.disabled=true;drawChecks();sources.replaceChildren();holds.replaceChildren();
 announce('Reading existing Admin evidence only: no Etsy, Meta, Product or D1 write is being attempted…');
 try{
  const oauth=await get('/api/admin/etsy-oauth-acceptance');
  if(!oauth.ok){const result=evaluateEtsyOwner461({productId,localDraftId,oauth});paint(result,{oauth});announce('HOLD: Etsy Admin identity cannot be verified. Check production sign-in and integrations.',true);return;}
  const pair=new URLSearchParams({product_id:productId,draft_id:localDraftId}),single=new URLSearchParams({draft_id:localDraftId});
  const [trial,local,packet]=await Promise.all([
   get('/api/admin/etsy-trial-409?'+pair),
   get('/api/admin/etsy-remote-draft-evidence?'+single),
   get('/api/admin/etsy-publication-packet?'+single)]);
  paint(evaluateEtsyOwner461({productId,localDraftId,oauth,trial,local,packet}),{oauth,trial,local,packet});
  announce('Read-only source review complete. Confirm exact remote DRAFT and Canada-only shipping in Etsy before recording real owner acceptance. No data changed.');
 }catch{announce('HOLD: Unable to load source evidence; no record was changed.',true);}
 finally{busy=false;refresh.disabled=false;product.disabled=false;draft.disabled=false;}
});
loadDrafts.addEventListener('click',async()=>{if(busy)return;busy=true;loadDrafts.disabled=true;
 announce('Reading at most 200 existing local Etsy drafts; no external Etsy call…');
 try{const data=await get('/api/admin/etsy-product-syndication');
  if(!data.ok||!data.schema_ready||!Array.isArray(data.drafts))throw Error(data.error||'Local Etsy draft register unavailable.');
  savedDraft.replaceChildren(new Option('Choose a real local draft…',''));
  for(const item of data.drafts){const id=validDraft(item.id),p=positive(item.product_id);if(!id||!p)continue;
   const o=new Option(`#${p} ${String(item.draft_title||'Local draft').slice(0,70)} · ${String(item.status||'unknown').slice(0,24)} · ${id}`,id);
   o.dataset.productId=p;savedDraft.append(o);
  }
  announce(`Loaded ${savedDraft.options.length-1} existing local draft choices (bounded source list). Select one, then review its original evidence. No provider action occurred.`);
 }catch(error){announce('HOLD: '+String(error.message||'Local draft register unavailable.').slice(0,180),true)}
 finally{busy=false;loadDrafts.disabled=false;}
});
savedDraft.addEventListener('change',()=>{const selected=savedDraft.selectedOptions[0];if(!selected?.value)return;
 product.value=selected.dataset.productId||'';draft.value=selected.value;invalidate();
 announce('Local draft selected. Press Review existing evidence to verify its exact original source and owner HOLDs.');
});
checklist.addEventListener('change',countChecks);drawChecks();
