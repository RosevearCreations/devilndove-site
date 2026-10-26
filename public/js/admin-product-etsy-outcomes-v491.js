/* Build 491: owner-click-only, read-only field/photo package reconciliation. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),local=$('dd491LocalRetest'),remote=$('dd491RemoteRetest');
 if(!local||!remote||!window.DDAuth?.apiFetch)return;
 const id=Number(new URLSearchParams(location.search).get('product_id')||0),form=$('productEditorForm');
 let busy=false,latest=null;
 const say=text=>{$('dd491OutcomeStatus').textContent=text;};
 const item=(message,hold=false)=>{const li=document.createElement('li');li.textContent=(hold?'HOLD — ':'✓ ')+message;li.dataset.outcome=hold?'hold':'confirmed';$('dd491OutcomeList').append(li);};
 async function get(path){const r=await window.DDAuth.apiFetch(path,{method:'GET',cache:'no-store'}),x=await r.json().catch(()=>null);if(!r.ok||!x?.ok)throw Error(x?.error||`HTTP ${r.status}`);return x;}
 const ready=()=>id>0&&form?.dataset.productDirty!=='1';
 function controls(){local.disabled=busy||!id;remote.disabled=busy||!id||!latest?.linked_listing_id;}
 async function review(){if(busy)return;if(!ready()){say('Save Product edits first. No Etsy outcome read attempted.');return;}
  busy=true;controls();$('dd491OutcomeList').replaceChildren();say('Comparing bounded local Etsy field, approval and photo receipts…');
  try{
   const [ledger,source]=await Promise.all([get(`/api/admin/product-etsy-outcome-reconciliation?product_id=${id}`),get(`/api/admin/product-etsy-images?product_id=${id}`)]);
   latest=ledger;item(ledger.approval?`Owner approval receipt #${ledger.approval.receipt_id} (${ledger.approval.mode}).`:'No Build 490 owner approval receipt yet.',!ledger.approval);
   item(ledger.linked_listing_id?`Product is linked locally to Etsy draft #${ledger.linked_listing_id}. Live state must be verified separately.`:'No verified Etsy draft link currently recorded.',!ledger.linked_listing_id);
   item(`Field transaction: ${ledger.fields.state.replaceAll('_',' ')}${ledger.fields.receipt_id?' (receipt #'+ledger.fields.receipt_id+')':''}.`,ledger.fields.state!=='confirmed');
   for(const image of ledger.images)item(`Image #${image.product_image_id}: ${image.state.replaceAll('_',' ')}${image.confirmation_receipt_id?' (receipt #'+image.confirmation_receipt_id+')':''}.`,image.state!=='confirmed');
   item(`${source.pending||0} approved original image(s) still awaiting transfer; ${source.transferred||0} with local accepted receipts; ${source.hold_unconfirmed_claims||0} unresolved claim(s).`,Boolean(source.hold_unconfirmed_claims));
   item('Product entry, Product QA and image-quality scores must be inspected in their respective panels; a receipt is not an image-quality score.');
   say(ledger.hold||source.hold_unconfirmed_claims?'HOLD: at least one unconfirmed field/photo claim. Open the real Etsy draft and reconcile manually. No retry was initiated.':'Local evidence review complete. For a current Etsy photo comparison, use the separate read-only button. No provider write.');
  }catch(e){latest=null;item(e.message,true);say('Outcome comparison unavailable. No assumption of success and no Etsy provider write.');}
  finally{busy=false;controls();}
 }
 async function live(){if(busy||!latest?.linked_listing_id)return;if(!ready()){say('Save edits before checking the original Etsy draft.');return;}
  busy=true;controls();say('Reading the linked Etsy draft and photo list. This will not edit, overwrite or publish anything.');
  try{
   const result=await get(`/api/admin/product-etsy-images?product_id=${id}&reconcile=1`),comparison=result.remote_reconciliation||{};
   item(`Live Etsy photo comparison: ${comparison.reason||'unavailable'}; tracked ${comparison.tracked_count??'unknown'}, remote ${comparison.remote_count??'unknown'}.`,comparison.ready!==true);
   const gap=result.photo_gap_492,box=$('dd492PhotoGaps');if(box){box.replaceChildren();const line=(message,hold)=>{const li=document.createElement('li');li.textContent=(hold?'HOLD — ':'✓ ')+message;li.dataset.outcome=hold?'hold':'confirmed';box.append(li);};
    if(gap){line(`Photo status: ${gap.state.replaceAll('_',' ')}. ${gap.next_step}`,gap.state==='hold');
     for(const remoteId of gap.unexpected_etsy_image_ids||[])line(`Etsy photo #${remoteId} has no accepted local receipt. Do not replace it.`,true);
     for(const remoteId of gap.missing_etsy_image_ids||[])line(`Previously confirmed Etsy photo #${remoteId} is now absent. Inspect the draft.`,true);
     for(const imageId of gap.uncertain_product_image_ids||[])line(`Local image #${imageId} has an unconfirmed upload claim. Never retry blindly.`,true);
     for(const photo of gap.pending_local_images||[])line(`Local image #${photo.product_image_id}: ${photo.transferable&&photo.alt_text_ready?'eligible for separate owner-approved transfer':'check original JPEG/PNG and image alt description before transfer'}.`,false);
    }else line('Gap evidence unavailable. No transfer allowed from this diagnostic.',true);}
   say(comparison.ready?'Live Etsy photos match tracked receipts. Check all remaining Product QA and media requirements before further transfer.':'HOLD: live Etsy photographs differ or could not be verified. Inspect the original draft; no automatic retry or replacement.');
  }catch(e){item('Live Etsy read failed: '+e.message,true);say('HOLD: Etsy photo verification could not be completed; no provider write attempted.');}
  finally{busy=false;controls();}
 }
 local.addEventListener('click',()=>void review());remote.addEventListener('click',()=>void live());
 document.addEventListener('dd:save-succeeded',()=>{latest=null;$('dd491OutcomeList').replaceChildren();$('dd492PhotoGaps')?.replaceChildren();say('Product changed. Run a fresh local outcome review before trusting previous results.');controls();});
 if(id)$('dd491MediaScoreLink').href=`/admin/catalog-media/?product_id=${encodeURIComponent(id)}`;
 controls();
})();
