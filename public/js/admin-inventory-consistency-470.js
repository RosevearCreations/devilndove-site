/* Build 470: explicit, saved-row-only Inventory consistency audit. No API reads/writes. */
import {reviewInventoryItems470} from './inventory-consistency-policy-470.mjs';

function create(tag,value){const node=document.createElement(tag);if(value!==undefined)node.textContent=String(value);return node;}
function mountInventoryReview470(){
 const list=document.getElementById('siteInventoryList'),paging=document.getElementById('siteInventoryPagination');
 if(!list||!paging||document.getElementById('siteInventoryReview470'))return;
 const panel=create('section');panel.id='siteInventoryReview470';panel.className='card dd470-panel';panel.setAttribute('aria-labelledby','dd470Title');
 const title=create('h4','Tools, Consumables & Workstations — Build 470 consistency review');title.id='dd470Title';
 const explanation=create('p','Review only the saved records on this visible Inventory page (up to 40). Unit conversions, multiple workstation memberships, recorded location and source-cost gaps are checked locally. Original purchase receipts, physical location and actual recorded usage still require human review. Unsaved edits are not included.');explanation.className='small';
 const help=create('details'),summary=create('summary','ⓘ What does this review prove?');
 help.append(summary,create('p','It helps us find inconsistent source data before recording real inventory use. It does not scan all pages, verify receipts, modify a database, approve use of a Tool, or replace the existing canonical consumption engine. The current Location field is separate from the Tool’s many-to-many workstation memberships. A supplier URL is not proof of the original purchase price.'));
 const controls=create('div');controls.className='dd470-actions';
 const review=create('button','Review saved items on this page');review.type='button';review.className='btn';review.id='dd470Review';
 const download=create('button','Download local HOLD review');download.type='button';download.className='btn';download.disabled=true;download.id='dd470Download';
 controls.append(review,download);
 const output=create('div','HOLD: no source review has been performed. Press Review saved items on this page.');output.id='dd470Result';output.setAttribute('role','status');output.setAttribute('aria-live','polite');
 panel.append(title,explanation,help,controls,output);paging.insertAdjacentElement('beforebegin',panel);
 const style=create('style');style.textContent='.dd470-panel{margin:1rem 0;padding:1rem;border:1px solid #977cba;border-radius:12px}.dd470-panel summary{cursor:pointer;min-height:44px;font-weight:700}.dd470-panel :is(button,summary):focus-visible{outline:3px solid #ffda88;outline-offset:3px}.dd470-actions{display:flex;gap:.6rem;flex-wrap:wrap;margin:.7rem 0}.dd470-panel button{min-height:44px}.dd470-table{overflow-x:auto;max-width:100%}.dd470-table table{border-collapse:collapse;min-width:680px;width:100%}.dd470-table :is(td,th){border-bottom:1px solid #75668d;padding:.5rem;text-align:left;vertical-align:top;overflow-wrap:anywhere}.dd470-issue{margin:.35rem 0;padding-left:.5rem;border-left:3px solid #d9a66d}';document.head.append(style);
 let last=null;
 const invalidate=()=>{last=null;download.disabled=true;output.textContent='Saved inventory view changed. Review the currently visible page again; previous HOLD receipt is now stale.';};
 new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))invalidate();}).observe(list,{childList:true});
 function currentItems(){
  return Array.from(list.querySelectorAll('[data-inventory-row]')).map(row=>{
   const button=row.querySelector('[data-load-form-id][data-item]');
   try{return JSON.parse(button?.getAttribute('data-item')||'null');}catch{return null;}
  }).filter(Boolean);
 }
 review.addEventListener('click',()=>{
  const pageStatus=document.getElementById('siteInventoryPageStatus')?.textContent||'';
  const match=pageStatus.match(/Page\s+(\d+)\s+of\s+(\d+)/i);
  last=reviewInventoryItems470(currentItems(),{page:Number(match?.[1]||1),totalPages:Number(match?.[2]||1)});
  output.replaceChildren();
  output.append(create('p',`HOLD · ${last.reviewedRows} saved items on page ${last.page}/${last.totalPages}; ${last.issueCount} source-review findings. No other pages were scanned or altered.`));
  const scroll=create('div');scroll.className='dd470-table';const table=create('table');const head=create('thead');const hr=create('tr');
  for(const name of ['Saved inventory item','Package / usage conversion','Location and workstations','Owner evidence and findings'])hr.append(create('th',name));
  head.append(hr);table.append(head);const body=create('tbody');
  for(const item of last.rows){const tr=create('tr');tr.append(create('td',`${item.itemName} (#${item.id}) · ${item.sourceType}`));
   tr.append(create('td',`${item.stockUnit||'?'} → ${item.unitsPerStock??'?'} ${item.usageUnit||'?'}; estimated cost/usage: ${item.estimatedCostPerUsageCents===null?'HOLD':(item.estimatedCostPerUsageCents/100).toFixed(4)+' CAD'}`));
   tr.append(create('td',`Recorded location #${item.currentLocationId||'not set'}; station IDs: ${item.stationIds.join(', ')||'none'}`));
   const issues=create('td');for(const finding of item.issues){const line=create('p',`${finding.severity}: ${finding.label}`);line.className='dd470-issue';issues.append(line);}tr.append(issues);body.append(tr);}
  table.append(body);scroll.append(table);output.append(scroll);
  output.append(create('p','Original purchase invoices, stock counts, real usage movements and physical workstation locations have not been independently attested. Keep all unresolved items on HOLD.'));
  download.disabled=false;
 });
 download.addEventListener('click',()=>{
  if(!last)return;
  const payload={...last,preparedAtUtc:new Date().toISOString()};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const anchor=create('a');anchor.href=url;anchor.download='devilndove-build470-visible-inventory-HOLD.json';anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountInventoryReview470,{once:true});
else mountInventoryReview470();
