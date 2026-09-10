// Release 467 Build 92 — read-only Prelaunch Action Queue Completeness & Ownership.
// Every unresolved Startup Readiness row remains visible/actionable; external acceptance stays a separate lane.
(() => {
  const BUILD=92;
  const VERIFIED_BUILD=91;
  const VERIFIED_SHA='1d5519b976d108e7d4a558876863be5559a67e35';
  const VERIFIED_TREE='6a62d01c1be002b78c3c8d05993c40676e41e208';
  const VERIFIED_PROOFS=Object.freeze({system:34486729268,quality:34486729227,it:34486729225,hygiene:34486729311,production_pages:34488492622,live_resources:34488622668});
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const apiFetch=(...args)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...args):fetch(...args);
  const closed=(status)=>['passed','not_applicable'].includes(String(status||'').toLowerCase());
  const statusText=(value)=>String(value||'unknown').replaceAll('_',' ').replaceAll('-',' ').toUpperCase();
  const stateClass=(value)=>String(value||'review').toLowerCase().replaceAll('_','-');
  const pill=(value)=>`<span class="badge ${esc(stateClass(value))}">${esc(statusText(value))}</span>`;
  const laneOrder=['stripe_development','paypal_sandbox','social_oauth','caip_private_media','cloudflare_access_service_token'];
  const startupPriority=Object.freeze({failed:0,blocked:0,needs_review:1,in_progress:2,not_started:3});

  function humanizeKey(value){return String(value||'Readiness item').replaceAll('_',' ').replace(/\b\w/g,(c)=>c.toUpperCase());}
  function dueValue(value){const raw=String(value||'').trim();const stamp=Date.parse(`${raw}T00:00:00Z`);return Number.isFinite(stamp)?stamp:Number.MAX_SAFE_INTEGER;}
  function summarizeStartup(data){
    const items=Array.isArray(data?.items)?data.items:[];
    const total=Number(data?.expected_total||items.length||0);
    const complete=items.filter(row=>closed(row.item_status)).length;
    const open=items.filter(row=>!closed(row.item_status));
    const status_counts=open.reduce((out,row)=>{const key=String(row.item_status||'not_started').toLowerCase();out[key]=(out[key]||0)+1;return out;},{});
    return {total,complete,open_count:open.length,degraded:data?.degraded===true||items.length!==total,warning:data?.backend_warning||'',open,status_counts};
  }
  function summarizeExternal(data){
    const lanes=data?.lanes||{};
    const rows=laneOrder.map(key=>lanes[key]).filter(Boolean);
    const unresolved=rows.filter(row=>row.accepted!==true);
    return {rows,unresolved,summary:data?.summary||{},state:data?.state||'HOLD_EXTERNAL'};
  }
  function startupActions(startup){
    return startup.open.map((row)=>{
      const status=String(row.item_status||'not_started').toLowerCase();
      return {
        source:'startup',status,priority:startupPriority[status]??4,
        key:String(row.item_key||''),title:humanizeKey(row.item_key),
        owner:String(row.owner_name||'').trim()||'Owner unassigned',
        due:String(row.due_date||'').trim()||'No due date',
        due_sort:dueValue(row.due_date),
        detail:String(row.blocked_reason||'').trim()||`Startup Readiness is ${statusText(status)}. Complete or explicitly mark this item not applicable with evidence in the owning workspace.`,
        href:'/admin/startup-readiness/'
      };
    }).sort((a,b)=>a.priority-b.priority||a.due_sort-b.due_sort||a.title.localeCompare(b.title));
  }
  function externalActions(external){
    return external.unresolved.map((lane)=>{const next=lane?.next_action||{};return {source:'external',key:lane.key,label:lane.label||lane.key,state:lane.acceptance_state||'HOLD_EXTERNAL',detail:next.label||'Complete the next required external evidence step.',href:next.href||'/admin/release-control/external-acceptance/'};});
  }
  function statusSummary(startup){
    const order=['failed','blocked','needs_review','in_progress','not_started'];
    const parts=order.filter(key=>startup.status_counts[key]).map(key=>`${startup.status_counts[key]} ${statusText(key)}`);
    const known=order.reduce((sum,key)=>sum+Number(startup.status_counts[key]||0),0);
    if(startup.open_count>known)parts.push(`${startup.open_count-known} OTHER OPEN`);
    return parts.join(' • ')||'No unresolved Startup Readiness items';
  }
  function startupQueueHtml(startup){
    const actions=startupActions(startup);
    if(!actions.length)return '<p class="small"><strong>Startup Readiness:</strong> no unresolved action is currently reported.</p>';
    return `<p class="small"><strong>${actions.length} unresolved Startup Readiness action${actions.length===1?'':'s'}.</strong> ${esc(statusSummary(startup))}. Every open row is listed; none are hidden because they are merely Not Started, In Progress, or Needs Review.</p><ol>${actions.map(a=>`<li style="margin-bottom:10px"><strong>${esc(a.title)}</strong> ${pill(a.status)}<div class="small"><strong>Owner:</strong> ${esc(a.owner)} • <strong>Due:</strong> ${esc(a.due)}</div><div class="small">${esc(a.detail)} <a href="${esc(a.href)}">Open Startup Readiness →</a></div></li>`).join('')}</ol>`;
  }
  function externalQueueHtml(external){
    const actions=externalActions(external);
    if(!actions.length)return '<p class="small"><strong>External acceptance:</strong> all five required lanes are accepted by their owning evidence authorities.</p>';
    return `<p class="small"><strong>${actions.length} unresolved external acceptance lane${actions.length===1?'':'s'}.</strong> These remain separate from Startup Readiness ownership.</p><ol>${actions.map(a=>`<li style="margin-bottom:10px"><strong>${esc(a.label)}</strong> ${pill(a.state)}<div class="small">${esc(a.detail)} <a href="${esc(a.href)}">Open external evidence →</a></div></li>`).join('')}</ol>`;
  }
  function render(startupData,externalData){
    const mount=document.getElementById('prelaunchReadinessSummary');if(!mount)return;
    const startup=summarizeStartup(startupData),external=summarizeExternal(externalData);
    // Build 91 is immutable exact-SHA Development + Production GREEN predecessor evidence ingested by Build 92.
    const technicalGreen=true;
    const externalComplete=external.unresolved.length===0&&external.rows.length===laneOrder.length;
    const launchReady=technicalGreen&&!startup.degraded&&startup.open_count===0&&externalComplete;
    const decision=launchReady?'READY':'HOLD';
    mount.innerHTML=`
      <div class="prelaunch-summary-metrics">
        <article><span>Go-live decision</span><strong>${esc(decision)}</strong></article>
        <article><span>Technical release proof</span><strong>GREEN</strong><small>Build ${VERIFIED_BUILD}</small></article>
        <article><span>Startup readiness</span><strong>${startup.complete}/${startup.total}</strong><small>${startup.open_count} unresolved${startup.degraded?' • degraded':''}</small></article>
        <article><span>External acceptance</span><strong>${Number(external.summary.accepted_lane_count||0)}/${Number(external.summary.required_lane_count||laneOrder.length)}</strong><small>${external.unresolved.length} unresolved</small></article>
      </div>
      <div class="card" style="margin-top:14px"><h3>Decision boundary</h3><p class="small"><strong>${launchReady?'READY':'HOLD'}:</strong> a GREEN source/deployment is necessary but never sufficient for unrestricted launch. Startup Readiness must be complete and non-degraded, and every required external acceptance lane must be accepted.</p>${startup.warning?`<p class="small"><strong>Startup warning:</strong> ${esc(startup.warning)}</p>`:''}<p class="small">Verified Build ${VERIFIED_BUILD}: <code>${VERIFIED_SHA}</code> / tree <code>${VERIFIED_TREE}</code>. System ${VERIFIED_PROOFS.system} • Quality ${VERIFIED_PROOFS.quality} • I.T. ${VERIFIED_PROOFS.it} • Hygiene ${VERIFIED_PROOFS.hygiene} • Production ${VERIFIED_PROOFS.production_pages} • Live resources ${VERIFIED_PROOFS.live_resources}.</p></div>
      <div class="grid cols-2" style="gap:14px;margin-top:14px"><section class="card"><h3>External acceptance status</h3>${external.rows.map(lane=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${esc(lane.label||lane.key)}</strong> ${pill(lane.acceptance_state)}<div class="small">${Number(lane.accepted_check_count||0)}/${Number(lane.required_check_count||0)} required checks passed.</div><div class="small"><strong>Next:</strong> ${esc(lane.next_action?.label||'Review current evidence.')}${lane.next_action?.href?` <a href="${esc(lane.next_action.href)}">Open →</a>`:''}</div></div>`).join('')||'<p class="small">External acceptance data unavailable.</p>'}</section><section class="card"><h3>Commerce policy</h3><p class="small"><strong>Canada only:</strong> shipping country CA and currency CAD remain the active commerce boundary.</p><p class="small"><strong>U.S. sales/shipping:</strong> disabled. Build ${BUILD} does not re-enable U.S. checkout or shipping.</p><p class="small"><strong>Local pickup:</strong> remains supported under the existing Build 78 checkout boundary.</p><a class="btn secondary" href="/admin/release-control/external-acceptance/">Open External Acceptance</a></section></div>
      <section class="card" style="margin-top:14px"><h3>Startup Readiness action queue</h3>${startupQueueHtml(startup)}</section>
      <section class="card" style="margin-top:14px"><h3>External acceptance action queue</h3>${externalQueueHtml(external)}</section>
      <section class="card" style="margin-top:14px"><h3>Action queue truth</h3><p class="small">The launch decision and action queues now use the same unresolved Startup Readiness set. A Not Started, In Progress, Needs Review, Blocked, Failed, or other non-closed readiness row cannot hold launch while disappearing from the queue.</p><button class="btn" id="refreshPrelaunchDecision" type="button">Manual refresh current decision</button></section>`;
    document.getElementById('refreshPrelaunchDecision')?.addEventListener('click',load);
  }
  async function load(){
    const mount=document.getElementById('prelaunchReadinessSummary');if(!mount)return;
    mount.innerHTML='<p class="small">Loading Release 467 Build 92 prelaunch decision and complete action queues…</p>';
    try{
      const [startupResponse,externalResponse]=await Promise.all([
        apiFetch('/api/admin/startup-readiness',{method:'GET',cache:'no-store'}),
        apiFetch('/api/admin/current-external-acceptance-control-center',{method:'GET',cache:'no-store'})
      ]);
      const [startup,external]=await Promise.all([startupResponse.json().catch(()=>null),externalResponse.json().catch(()=>null)]);
      if(!startupResponse.ok||!startup?.ok)throw new Error(startup?.error||`Startup Readiness failed (${startupResponse.status}).`);
      if(!externalResponse.ok||!external?.ok)throw new Error(external?.error||`External Acceptance failed (${externalResponse.status}).`);
      render(startup,external);
    }catch(error){
      mount.innerHTML=`<div class="prelaunch-summary-unavailable"><strong>Go-live decision: HOLD</strong><p>${esc(error?.message||'Current launch evidence is unavailable.')} No launch readiness is inferred when an authority cannot be read.</p><button class="btn" id="retryPrelaunchDecision" type="button">Manual retry</button></div>`;
      document.getElementById('retryPrelaunchDecision')?.addEventListener('click',load);
    }
  }
  document.addEventListener('DOMContentLoaded',load);
})();
