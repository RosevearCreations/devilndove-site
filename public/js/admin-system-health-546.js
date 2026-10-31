/* Build 546: opt-in, read-only route latency and incident monitoring.
   Local history belongs to this browser only; no background D1 polling. */
(()=>{'use strict';
const $=id=>document.getElementById(id),root=$('dd546Health');if(!root)return;
const ROUTES=[['Homepage','/'],['Shop','/shop/'],['Admin','/admin/'],['Product Editor','/admin/product-editor/?product_id=54'],['System Operations','/admin/system-operations/']];
const HISTORY_KEY='dnd-system-route-history-546';let busy=false;
function node(tag,content,klass){const element=document.createElement(tag);if(klass)element.className=klass;if(content!=null)element.textContent=String(content);return element;}
function history(){try{const value=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(value)?value.filter(row=>row&&typeof row==='object').slice(-60):[];}catch{return [];}}
function saveHistory(rows){try{localStorage.setItem(HISTORY_KEY,JSON.stringify(rows.slice(-60)));}catch{/* storage blocked; current results still shown */}}
function renderHistory(rows){const table=$('dd546History');table.replaceChildren();if(!rows.length){const cell=node('td','No checks yet. Select Refresh health now.');cell.colSpan=4;const row=node('tr');row.append(cell);table.append(row);return;}
  for(const item of [...rows].reverse()){
    const tr=node('tr');for(const value of [new Date(item.at).toLocaleString(),item.name,item.status,item.ms+' ms'])tr.append(node('td',value));
    tr.dataset.state=item.status==='200'?'ok':'warning';table.append(tr);
  }
}
async function checkRoute(name,path){
  const started=performance.now(),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
  try{const response=await fetch(path,{method:'GET',cache:'no-store',credentials:'same-origin',signal:controller.signal,headers:{'Accept':'text/html'}});
    return {name,path,status:String(response.status),ms:Math.round(performance.now()-started),at:new Date().toISOString()};
  }catch(error){return {name,path,status:error.name==='AbortError'?'TIMEOUT':'NETWORK ERROR',ms:Math.round(performance.now()-started),at:new Date().toISOString()};}
  finally{clearTimeout(timeout);}
}
function renderRoutes(rows){const cards=$('dd546Routes');cards.replaceChildren();for(const row of rows){const card=node('article',null,'dd546-route');card.dataset.state=row.status==='200'?'ok':'warning';
  card.append(node('strong',row.name),node('p',row.status==='200'?'Available':row.status==='TIMEOUT'?'Timed out — investigate origin':'Unavailable — '+row.status),node('small',`${row.ms} ms · ${row.path}`));cards.append(card);}}
async function incidents(){const status=$('dd546IncidentStatus'),list=$('dd546Incidents');status.textContent='Reading saved incidents…';list.replaceChildren();
  try{const path='/api/admin/runtime-incidents?days=30&limit=15&review_status=all';const fetcher=window.DDAuth?.apiFetch?window.DDAuth.apiFetch(path,{cache:'no-store'}):fetch(path,{credentials:'same-origin',cache:'no-store'});
    const response=await fetcher;const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Incident records unavailable.');
    const rows=Array.isArray(data.incidents)?data.incidents:[];status.textContent=`${data.summary?.total_count??rows.length} saved incident(s) in the last 30 days; showing ${rows.length}.`;
    for(const incident of rows){const card=node('article',null,'dd546-incident');const title=node('strong',`${incident.severity||'warning'} · ${incident.incident_code||incident.incident_scope||'Runtime incident'}`);
      const summary=node('p',incident.message||'No incident description');const meta=node('small',`${incident.created_at||'Time unavailable'} · ${incident.endpoint_path||'Path unavailable'} · ${incident.review_status||'open'}`);card.append(title,summary,meta);list.append(card);}
    if(!rows.length)list.append(node('p','No incident records returned for this filter.'));
  }catch(error){status.textContent='Incident history unavailable: '+error.message+'. Route checks remain available.';}
}
async function refresh(){if(busy)return;busy=true;const button=$('dd546Refresh');button.disabled=true;button.textContent='Checking routes…';$('dd546Status').textContent='Checking public and admin pages; allow up to 10 seconds per route…';
  try{const rows=await Promise.all(ROUTES.map(([name,path])=>checkRoute(name,path)));renderRoutes(rows);const saved=[...history(),...rows].slice(-60);saveHistory(saved);renderHistory(saved);
    const failed=rows.filter(row=>row.status!=='200');$('dd546Status').textContent=failed.length?`${failed.length} route(s) unavailable or timed out: ${failed.map(row=>row.name).join(', ')}. Green deployment does not override these failures.`:`All ${rows.length} tested routes responded HTTP 200 at this check. This is a point-in-time result, not an uptime guarantee.`;
    await incidents();
  }finally{busy=false;button.disabled=false;button.textContent='Refresh health now';}
}
$('dd546Refresh').addEventListener('click',()=>void refresh());renderHistory(history());
// No automatic remote probes: the owner explicitly decides when to check.
})();
