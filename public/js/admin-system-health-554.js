/* Build 554: owner-guided monitoring review without inventing second-device evidence. */
(()=>{'use strict';const $=id=>document.getElementById(id);if(!$('dd554Guide'))return;
let sourceLoaded=false,receiptVerified=false,ownerChecked=false,previousSave=null,saveUnconfirmed=false;
const status=(id,value,state='waiting')=>{const target=$(id);if(!target)return;target.textContent=value;target.dataset.state=state;};
const date=raw=>{const ms=Date.parse(raw||'');return Number.isFinite(ms)?new Date(ms).toLocaleString():'time unavailable';};
const validReceipt=receipt=>(receipt?.kind==='history'&&typeof receipt.status==='string'&&Number.isInteger(receipt.ms))||(receipt?.kind==='view'&&typeof receipt.label==='string'&&typeof receipt.updated_at==='string');
function paint(){
  status('dd554Step1',sourceLoaded?'Saved source loaded for this signed-in administrator.':'Waiting for a fresh signed-in saved-record read.',sourceLoaded?'ready':'waiting');
  status('dd554Step2',receiptVerified?'Exact current receipt verified in this browser.':'No exact receipt verified in this browser session.',receiptVerified?'ready':'waiting');
  status('dd554Step3',ownerChecked&&receiptVerified?'Personal comparison box checked — owner-reported, not independent device proof.':'The other signed-in device must be checked by the owner; this page cannot detect it.',ownerChecked&&receiptVerified?'review':'waiting');
  const msg=saveUnconfirmed?'Latest owner acknowledgment save not confirmed. Reload shared monitoring before trying again.':previousSave?`Owner-reported acknowledgment saved and read back at ${date(previousSave)}. Second-device use was not independently verified.`:'No confirmed owner acknowledgment save in this browser session.';
  status('dd554Step4',msg,saveUnconfirmed?'warning':previousSave?'ready':'waiting');
}
function clearReceipt(){receiptVerified=false;ownerChecked=false;paint();}
document.addEventListener('dd:system-health-sampled',event=>{
  const rows=Array.isArray(event.detail?.rows)?event.detail.rows:[];
  const ok=rows.filter(item=>String(item.status)==='200').length;
  status('dd554RoutesStatus',`Routes: ${rows.length} manual checks in this browser snapshot; ${ok} returned HTTP 200, ${rows.length-ok} returned another result. This is not continuous uptime monitoring.`,rows.length&&ok===rows.length?'ready':'review');
});
document.addEventListener('dd:system-health-reconciled-549',event=>{
  const detail=event.detail||{},history=Array.isArray(detail.history)?detail.history:[],views=Array.isArray(detail.presets)?detail.presets:[],incidents=Array.isArray(detail.timeline)?detail.timeline:[],reviews=Array.isArray(detail.ownerReviews)?detail.ownerReviews:[];
  sourceLoaded=true;receiptVerified=false;ownerChecked=false;
  status('dd554SharedStatus',`Shared records: ${history.length} saved route checks, ${views.length} saved views and ${reviews.length} owner-reported acknowledgments read from the signed-in account.`,'ready');
  status('dd554IncidentStatus',`Incidents: ${Math.min(25,incidents.length)} latest records returned for the bounded timeline. See the 30-day aging summary below for broader totals.`,'ready');
  paint();
});
document.addEventListener('dd:system-health-unavailable-550',()=>{
  sourceLoaded=false;receiptVerified=false;ownerChecked=false;
  status('dd554SharedStatus','Shared records unavailable. Sign in and reload; previous values cannot be treated as current.','warning');
  status('dd554IncidentStatus','Incidents unavailable — no current signed-in database readback.','warning');paint();
});
document.addEventListener('dd:health-receipt-verified-551',event=>{
  receiptVerified=event.detail?.comparison?.found===true&&validReceipt(event.detail?.receipt);
  ownerChecked=false;paint();
  if(!receiptVerified)status('dd554Step2','Exact current receipt was not confirmed. Review the receipt details and try again.','warning');
});
document.addEventListener('dd:health-receipt-changed-551',clearReceipt);
document.addEventListener('dd:health-receipt-549',clearReceipt);
$('dd549ReceiptCode')?.addEventListener('input',clearReceipt);
$('dd551OwnerCheck')?.addEventListener('change',()=>{ownerChecked=receiptVerified&&$('dd551OwnerCheck').checked;paint();});
document.addEventListener('dd:owner-review-recorded-554',event=>{
  if(event.detail?.readbackConfirmed!==true)return;
  previousSave=event.detail.reviewedAt||new Date().toISOString();saveUnconfirmed=false;receiptVerified=false;ownerChecked=false;paint();
});
document.addEventListener('dd:owner-review-save-unconfirmed-554',()=>{saveUnconfirmed=true;receiptVerified=false;ownerChecked=false;paint();});
$('dd554ReloadShared')?.addEventListener('click',()=>{
  const button=$('dd547Reload');if(!button||button.disabled){status('dd554SharedStatus','Shared monitoring is already loading or its reload control is unavailable.','review');return;}
  sourceLoaded=false;clearReceipt();status('dd554SharedStatus','Reload requested. Waiting for signed-in saved-record readback…','review');button.click();
});
paint();
})();
