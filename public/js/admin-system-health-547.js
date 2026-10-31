/* Build 547: explicit server persistence for shared owner monitoring history. */
(()=>{'use strict';const $=id=>document.getElementById(id);if(!$('dd547Status'))return;
const PATHS=['/','/shop/','/admin/','/admin/product-editor/?product_id=54','/admin/system-operations/'];
let latest=[],busy=false,lastHistory=[],lastPriorities=[];
const say=message=>{$('dd547Status').textContent=message;};
function element(tag,value,klass){const item=document.createElement(tag);if(value!==undefined)item.textContent=String(value);if(klass)item.className=klass;return item;}
async function api(payload){if(!window.DDAuth?.apiFetch)throw Error('Sign in to the admin account to access shared monitoring.');
  const response=await window.DDAuth.apiFetch('/api/admin/system-health-547',{method:payload?'POST':'GET',cache:'no-store',...(payload?{headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{})});
  const result=await response.json().catch(()=>({error:'Unreadable server response.'}));if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);return result;}
function table(rows){const root=$('dd547History');root.replaceChildren();if(!rows.length){const tr=element('tr'),td=element('td','No shared checks recorded yet.');td.colSpan=4;tr.append(td);root.append(tr);return;}
  for(const item of [...rows].reverse()){
    const tr=element('tr');tr.dataset.state=item.status==='200'?'ok':'warning';
    for(const cell of [new Date(item.at).toLocaleString(),item.name,item.status,`${item.ms} ms`])tr.append(element('td',cell));root.append(tr);
  }
}
function priorities(rows){const root=$('dd547Priorities');root.replaceChildren();const sums=new Map();for(const item of rows){const key=String(item.severity||'warning').toLowerCase();const bucket=sums.get(key)||{total:0,open:0};bucket.total+=Number(item.count||0);if(!['resolved','ignored'].includes(item.review_status))bucket.open+=Number(item.count||0);sums.set(key,bucket);}
  for(const level of ['critical','error','warning','info']){const entry=sums.get(level)||{total:0,open:0},card=element('article',undefined,'dd547-priority');card.dataset.severity=level;const review=$('dd548Review')?.value||'all';const info=review==='closed'?`${entry.total} resolved or ignored`:review==='open'?`${entry.open} awaiting review`:`${entry.open} awaiting review / ${entry.total} total`;card.append(element('strong',level.toUpperCase()),element('p',info));root.append(card);}
}
const selectedRoutes=()=>[...document.querySelectorAll('[data-dd547-route]:checked')].map(item=>item.dataset.dd547Route).filter(route=>PATHS.includes(route));
function showSelected(){const routes=selectedRoutes(),severity=$('dd547Severity').value,review=$('dd548Review')?.value||'all';table(lastHistory.filter(row=>routes.includes(row.path)));priorities(lastPriorities.filter(row=>(severity==='all'||row.severity===severity)&&(review==='all'||(review==='closed'?['resolved','ignored'].includes(row.review_status):!['resolved','ignored'].includes(row.review_status)))));}
function views(rows){const root=$('dd547Views');root.replaceChildren();if(!rows.length)root.append(element('p','No saved views yet.'));for(const row of rows){const card=element('article',undefined,'dd547-view'),name=element('strong',row.label),description=element('p',`${row.filters?.severity||'all'} priority · ${row.filters?.review||'all'} review status · ${Array.isArray(row.filters?.routes)?row.filters.routes.length:0} routes · ${row.updated_at||'date unavailable'}`),button=element('button','Use this view','btn secondary');button.type='button';button.addEventListener('click',()=>{const routes=Array.isArray(row.filters?.routes)?row.filters.routes:PATHS;for(const input of document.querySelectorAll('[data-dd547-route]'))input.checked=routes.includes(input.dataset.dd547Route);$('dd547Severity').value=['all','critical','error','warning','info'].includes(row.filters?.severity)?row.filters.severity:'all';if($('dd548Review'))$('dd548Review').value=['all','open','closed'].includes(row.filters?.review)?row.filters.review:'all';$('dd547ViewName').value=row.label;showSelected();say(`Loaded “${row.label}”. Selected ${selectedRoutes().length} routes and the saved incident filters.`);});card.append(name,description,button);root.append(card);}}
async function load(){if(busy)return;busy=true;$('dd547Reload').disabled=true;say('Reading saved cross-device history and incident priority…');
  try{const data=await api();lastHistory=Array.isArray(data.history)?data.history:[];lastPriorities=Array.isArray(data.incident_summary)?data.incident_summary:[];showSelected();views(Array.isArray(data.presets)?data.presets:[]);document.dispatchEvent(new CustomEvent('dd:system-health-reconciled-549',{detail:{timeline:data.incident_timeline||[],history:lastHistory,presets:data.presets||[],ownerReviews:data.owner_reviews||[],followUp:data.incident_follow_up||null}}));say(`${data.history?.length||0} shared route samples loaded. ${data.presets?.length||0} saved view(s). Data is scoped to this signed-in administrator.`);}
  catch(error){say('Shared history unavailable: '+error.message+'. Local checks are still available above.');document.dispatchEvent(new CustomEvent('dd:system-health-unavailable-550',{detail:{reason:error.message}}));}
  finally{busy=false;$('dd547Reload').disabled=false;}
}
document.addEventListener('dd:system-health-sampled',event=>{latest=Array.isArray(event.detail?.rows)?event.detail.rows:[];$('dd547SaveChecks').disabled=!latest.length;say('Latest route checks are ready. Choose Save latest checks to make them available on another device.');});
$('dd547SaveChecks').addEventListener('click',async()=>{if(busy||!latest.length)return;busy=true;const button=$('dd547SaveChecks');button.disabled=true;say('Saving the latest route checks to the admin database…');
  try{const data=await api({action:'record',samples:latest});if(data.readback_confirmed!==true)throw Error('Independent database readback was not confirmed.');say(`Saved and independently read back ${data.saved_count} checks; ${data.history_count} shared samples retained.`);if($('dd548Receipt'))$('dd548Receipt').textContent=`Verified history save receipt: ${data.saved_count} new checks, ${data.history_count} retained. Latest check ${data.verified_last_at||'time unavailable'}. Owner second-device acceptance is still pending.`;document.dispatchEvent(new CustomEvent('dd:health-receipt-549',{detail:{kind:'history',path:latest[0].path,at:latest[0].at}}));}
  catch(error){say('Save was not confirmed: '+error.message+'. Refresh shared monitoring before trying again.');}
  finally{busy=false;button.disabled=false;void load();}
});
$('dd547SaveView').addEventListener('click',async()=>{if(busy)return;const label=$('dd547ViewName').value.trim();if(!label){say('Enter a name for the monitoring view.');return;}
  busy=true;const button=$('dd547SaveView');button.disabled=true;say('Saving the named monitoring view…');
  try{const data=await api({action:'save_view',label,severity:$('dd547Severity').value,review:$('dd548Review')?.value||'all',routes:selectedRoutes()});if(data.readback_confirmed!==true)throw Error('Saved view database readback was not confirmed.');say(`Saved and independently read back view “${data.label}”.`);if($('dd548Receipt'))$('dd548Receipt').textContent=`Verified saved-view receipt: “${data.label}”. Open this page on the second device and confirm the same view is present.`;document.dispatchEvent(new CustomEvent('dd:health-receipt-549',{detail:{kind:'view',key:data.key}}));}
  catch(error){say('Saved view not confirmed: '+error.message);}
  finally{busy=false;button.disabled=false;void load();}
});
$('dd547Reload').addEventListener('click',()=>void load());void load();
for(const input of document.querySelectorAll('[data-dd547-route]'))input.addEventListener('change',showSelected);
$('dd547Severity').addEventListener('change',showSelected);
$('dd548Review')?.addEventListener('change',showSelected);
})();
