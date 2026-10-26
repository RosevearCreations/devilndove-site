/* Build 490: one explicit owner click dispatches to exactly one already-gated Etsy action.
   A local approval receipt must commit before we activate an existing safe provider handler. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),form=$('productEditorForm'),button=$('dd490Dispatch'),authorize=$('dd490Authorize');
 if(!form||!button||!authorize||!window.DDAuth?.apiFetch)return;
 const productId=Number(new URLSearchParams(location.search).get('product_id')||0);
 let mode='',busy=false,dispatched=false;
 const target=()=>mode==='new'?$('dd438EtsyCreate'):mode==='existing'?$('dd486EtsyUpdate'):null;
 const status=message=>{$('dd490DispatchStatus').textContent=message;};
 function ready(){return productId>0&&!busy&&!dispatched&&!!mode&&authorize.checked&&form.dataset.productDirty!=='1'&&target()?.disabled===false;}
 function refresh(){button.disabled=!ready();button.textContent=mode==='new'?'Create ONE unpublished Etsy draft':mode==='existing'?'Update the linked unpublished Etsy draft':'Send approved fields to selected Etsy draft';}
 function reset(message){dispatched=false;authorize.checked=false;status(message||'Review the chosen workflow and its checks again before authorizing another attempt.');refresh();}
 document.addEventListener('dd:etsy-draft-mode-changed',event=>{mode=['new','existing'].includes(event.detail?.mode)?event.detail.mode:'';reset('Workflow selected: '+(mode==='new'?'NEW Etsy draft.':'UPDATE existing Etsy draft.')+' Complete its verification and consent boxes below, then authorize one attempt here.');});
 authorize.addEventListener('change',refresh);
 form.addEventListener('change',refresh);form.addEventListener('input',refresh);
 document.addEventListener('dd:save-succeeded',()=>reset('Product saved. Recheck the connected Etsy target and authorize against the newly saved fields.'));
 $('dd490Reset')?.addEventListener('click',()=>reset('Owner authorization cleared locally. No Etsy operation performed by Reset. A prior dispatched attempt cannot be safely undone or retried without reconciliation.'));
 // Observe only disabled state of the existing guarded action buttons. No polling or remote activity.
 const observer=new MutationObserver(refresh);for(const id of ['dd438EtsyCreate','dd486EtsyUpdate']){const node=$(id);if(node)observer.observe(node,{attributes:true,attributeFilter:['disabled']});}
 button.addEventListener('click',async()=>{
  if(!ready())return;
  const action=target(),selectedMode=mode;
  busy=true;refresh();status('Recording one owner approval receipt before any Etsy call…');
  try{
   const requestKey=crypto.randomUUID();
   const response=await window.DDAuth.apiFetch('/api/admin/product-etsy-unified-approval',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({product_id:productId,mode:selectedMode,request_key:requestKey,owner_authorized:true})});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok||!data?.dispatch_authorized||!data.receipt_id)throw Error(data?.error||`Approval receipt not confirmed (HTTP ${response.status}).`);
   // A mode switch, unsaved edit or newly disabled native action invalidates this approval.
   if(selectedMode!==mode||form.dataset.productDirty==='1'||action?.disabled!==false){
    dispatched=true;status(`Approval receipt #${data.receipt_id} saved; no Etsy request sent because readiness changed. Reinspect this receipt before authorizing another attempt.`);return;
   }
   dispatched=true;authorize.checked=false;
   status(`Owner approval receipt #${data.receipt_id} recorded. One ${selectedMode==='new'?'NEW':'EXISTING'} draft field action dispatched through existing safeguards. Check the detailed Etsy status below. If the outcome is uncertain, inspect Etsy manually; never blindly retry.`);
   action.click();
  }catch(error){dispatched=true;authorize.checked=false;status('HOLD — '+error.message+' No unified Etsy action dispatched. Do not assume an approval receipt or retry without reviewing the state.');}
  finally{busy=false;refresh();}
 });
 mode=$('dd488ChooseNew')?.getAttribute('aria-pressed')==='true'?'new':$('dd488ChooseExisting')?.getAttribute('aria-pressed')==='true'?'existing':'';
 refresh();
})();
