/* Build 550: recover owner-scoped receipts from persisted records and inspect bounded incident milestones. */
(()=>{'use strict';const $=id=>document.getElementById(id);if(!$('dd550ReceiptPicker'))return;
let incidents=[];
const node=(tag,value,klass)=>{const el=document.createElement(tag);if(value!==undefined&&value!==null)el.textContent=String(value);if(klass)el.className=klass;return el;};
const nice=date=>{const time=Date.parse(date);return Number.isFinite(time)?new Date(time).toLocaleString():String(date||'Unknown time');};
function receipts(history,presets){const picker=$('dd550ReceiptPicker'),prior=picker.value;picker.disabled=false;picker.replaceChildren();
  picker.append(new Option('Choose a saved check or view…',''));
  const rows=Array.isArray(history)?history:[],views=Array.isArray(presets)?presets:[];
  const sorted=[...rows].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
  for(const row of sorted.slice(0,60)){
    if(!row.path||!row.at||!row.status||!Number.isInteger(row.ms))continue;
    const receipt={kind:'history',path:row.path,at:row.at,status:row.status,ms:row.ms};
    picker.append(new Option(`${row.name||row.path} · ${nice(row.at)} · ${row.status} (${row.ms} ms)`,JSON.stringify(receipt)));
  }
  for(const view of views.slice(0,8)){
    if(!view.key||!view.label)continue;
    const receipt={kind:'view',key:view.key,label:view.label,...(view.updated_at?{updated_at:view.updated_at}:{})};
    picker.append(new Option(`Saved view: ${view.label} · ${nice(view.updated_at)}`,JSON.stringify(receipt)));
  }
  if([...picker.options].some(option=>option.value===prior))picker.value=prior;
  $('dd550Retention').textContent=`Available to recover: ${rows.length} of 60 shared route checks; ${views.length} of 8 saved views. When the history reaches 60, older checks are removed from this saved history. These receipts exist only while their source records are retained.`;
}
const closed=status=>['resolved','ignored'].includes(String(status||'open').toLowerCase());
function review(){const root=$('dd549Timeline'),severity=$('dd550Priority').value,reviewStatus=$('dd550Review').value;
  const filtered=incidents.filter(item=>(severity==='all'||String(item.severity||'warning').toLowerCase()===severity)&&(reviewStatus==='all'||(reviewStatus==='closed'?closed(item.review_status):!closed(item.review_status))));
  root.replaceChildren();$('dd550Count').textContent=`Showing ${filtered.length} of ${incidents.length} recent incident records (maximum 25 returned).`;
  if(!filtered.length){root.append(node('p',incidents.length?'No incidents match the selected filters.':'No recent incident records returned. This does not prove there were no outages.'));return;}
  for(const incident of filtered){
    const card=node('article',undefined,'dd549-event dd550-incident'),title=node('strong',`${String(incident.severity||'warning').toUpperCase()} · ${incident.code||incident.scope||'Runtime incident'} · #${incident.id||'?'}`),summary=node('p',`${incident.path||'Route not recorded'} · ${closed(incident.review_status)?'Closed':'Open / under review'}`),detail=node('details'),toggle=node('summary','Review recorded milestones');
    card.dataset.review=String(incident.review_status||'open').toLowerCase();
    const dl=node('dl');for(const [name,value] of [['Incident ID',incident.id||'Unknown'],['Scope',incident.scope||'Not recorded'],['Created',nice(incident.created_at)],['Current review status',incident.review_status||'open'],['Latest review',incident.reviewed_at?nice(incident.reviewed_at):'Not recorded']]){dl.append(node('dt',name),node('dd',value));}
    detail.append(toggle,dl);card.append(title,summary,detail);root.append(card);
  }
}
document.addEventListener('dd:system-health-reconciled-549',event=>{
  receipts(event.detail?.history,event.detail?.presets);incidents=Array.isArray(event.detail?.timeline)?event.detail.timeline.slice(0,25):[];review();
});
document.addEventListener('dd:system-health-unavailable-550',()=>{
  const picker=$('dd550ReceiptPicker');picker.replaceChildren(new Option('Shared records unavailable — sign in or reload',''));picker.disabled=true;
  $('dd550Retention').textContent='No fresh shared record inventory is available. Reload shared monitoring after signing in; do not treat an earlier receipt as verified.';
  $('dd550Count').textContent='Incident timeline unavailable — no current database readback.';
  $('dd549Timeline').replaceChildren(node('p','Current incident records could not be loaded. Try Reload shared monitoring.'));
});
$('dd550ReceiptPicker').addEventListener('change',()=>{if(!$('dd550ReceiptPicker').value)return;$('dd549ReceiptCode').value=$('dd550ReceiptPicker').value;document.dispatchEvent(new CustomEvent('dd:health-receipt-changed-551'));$('dd549ReceiptStatus').textContent='Saved receipt recovered from shared history. Copy it to the other signed-in device and verify there. This has not confirmed cross-device owner acceptance.';});
$('dd550Priority').addEventListener('change',review);$('dd550Review').addEventListener('change',review);
})();
