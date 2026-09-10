// Release 467 Build 91 — read-only Prelaunch Authority & Go-Live Decision Convergence.
// Combines current Startup Readiness and current External Acceptance evidence without mutation, polling or provider execution.
(() => {
  const BUILD=91;
  const VERIFIED_BUILD=90;
  const VERIFIED_SHA='ab23457370ced9224facc2a09c1cca7b1ff20968';
  const VERIFIED_TREE='54f069f37e09e6f48e035f98656423ed28aa85f4';
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const apiFetch=(...args)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...args):fetch(...args);
  const closed=(status)=>['passed','not_applicable'].includes(String(status||'').toLowerCase());
  const statusText=(value)=>String(value||'unknown').replaceAll('_',' ').replaceAll('-',' ').toUpperCase();
  const stateClass=(value)=>String(value||'review').toLowerCase().replaceAll('_','-');
  const pill=(value)=>`<span class="badge ${esc(stateClass(value))}">${esc(statusText(value))}</span>`;
  const laneOrder=['stripe_development','paypal_sandbox','social_oauth','caip_private_media','cloudflare_access_service_token'];

  function summarizeStartup(data){
    const items=Array.isArray(data?.items)?data.items:[];
    const total=Number(data?.expected_total||items.length||0);
    const complete=items.filter(row=>closed(row.item_status)).length;
    const open=items.filter(row=>!closed(row.item_status));
    const blocked=open.filter(row=>['blocked','failed'].includes(String(row.item_status||'').toLowerCase()));
    return {total,complete,open_count:open.length,blocked_count:blocked.length,degraded:data?.degraded===true||items.length!==total,warning:data?.backend_warning||'',open,blocked};
  }

  function summarizeExternal(data){
    const lanes=data?.lanes||{};
    const rows=laneOrder.map(key=>lanes[key]).filter(Boolean);
    const unresolved=rows.filter(row=>row.accepted!==true);
    return {rows,unresolved,summary:data?.summary||{},state:data?.state||'HOLD_EXTERNAL'};
  }

  function nextActions(startup,external){
    const actions=[];
    for(const row of startup.blocked.slice(0,4))actions.push({owner:row.owner_name||'Startup Readiness',label:row.blocked_reason||`${row.item_key} is ${row.item_status}.`,href:'/admin/startup-readiness/'});
    for(const lane of external.unresolved){const next=lane?.next_action||{};actions.push({owner:lane.label||lane.key,label:next.label||'Complete the next required external evidence step.',href:next.href||'/admin/release-control/external-acceptance/'});}
    return actions.slice(0,8);
  }

  function render(startupData,externalData){
    const mount=document.getElementById('prelaunchReadinessSummary');if(!mount)return;
    const startup=summarizeStartup(startupData),external=summarizeExternal(externalData);
    const technicalGreen=externalData?.verified_development?.build===VERIFIED_BUILD&&externalData?.production?.build===VERIFIED_BUILD;
    const externalComplete=external.unresolved.length===0&&external.rows.length===laneOrder.length;
    const launchReady=technicalGreen&&!startup.degraded&&startup.open_count===0&&externalComplete;
    const decision=launchReady?'READY':'HOLD';
    const actions=nextActions(startup,external);
    mount.innerHTML=`
      <div class="prelaunch-summary-metrics">
        <article><span>Go-live decision</span><strong>${esc(decision)}</strong></article>
        <article><span>Technical release proof</span><strong>${technicalGreen?'GREEN':'REVIEW'}</strong><small>Build ${VERIFIED_BUILD}</small></article>
        <article><span>Startup readiness</span><strong>${startup.complete}/${startup.total}</strong><small>${startup.open_count} open${startup.degraded?' • degraded':''}</small></article>
        <article><span>External acceptance</span><strong>${Number(external.summary.accepted_lane_count||0)}/${Number(external.summary.required_lane_count||laneOrder.length)}</strong><small>${external.unresolved.length} unresolved</small></article>
      </div>
      <div class="card" style="margin-top:14px"><h3>Decision boundary</h3><p class="small"><strong>${launchReady?'READY':'HOLD'}:</strong> a GREEN source/deployment is necessary but never sufficient for unrestricted launch. Startup Readiness must be complete and non-degraded, and every required external acceptance lane must be accepted.</p>${startup.warning?`<p class="small"><strong>Startup warning:</strong> ${esc(startup.warning)}</p>`:''}<p class="small">Verified Build ${VERIFIED_BUILD}: <code>${VERIFIED_SHA}</code> / tree <code>${VERIFIED_TREE}</code>.</p></div>
      <div class="grid cols-2" style="gap:14px;margin-top:14px"><section class="card"><h3>External acceptance</h3>${external.rows.map(lane=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${esc(lane.label||lane.key)}</strong> ${pill(lane.acceptance_state)}<div class="small">${Number(lane.accepted_check_count||0)}/${Number(lane.required_check_count||0)} required checks passed.</div><div class="small"><strong>Next:</strong> ${esc(lane.next_action?.label||'Review current evidence.')}${lane.next_action?.href?` <a href="${esc(lane.next_action.href)}">Open →</a>`:''}</div></div>`).join('')||'<p class="small">External acceptance data unavailable.</p>'}</section><section class="card"><h3>Commerce policy</h3><p class="small"><strong>Canada only:</strong> shipping country CA and currency CAD remain the active commerce boundary.</p><p class="small"><strong>U.S. sales/shipping:</strong> disabled. Build 91 does not re-enable U.S. checkout or shipping.</p><p class="small"><strong>Local pickup:</strong> remains supported under the existing Build 78 checkout boundary.</p><a class="btn secondary" href="/admin/release-control/external-acceptance/">Open External Acceptance</a></section></div>
      <section class="card" style="margin-top:14px"><h3>Next blocking actions</h3>${actions.length?`<ol>${actions.map(a=>`<li><strong>${esc(a.owner)}:</strong> ${esc(a.label)} <a href="${esc(a.href)}">Open →</a></li>`).join('')}</ol>`:'<p class="small">No blocking action is currently reported by the two current authorities.</p>'}<button class="btn" id="refreshPrelaunchDecision" type="button">Refresh current decision</button></section>`;
    document.getElementById('refreshPrelaunchDecision')?.addEventListener('click',load);
  }

  async function load(){
    const mount=document.getElementById('prelaunchReadinessSummary');if(!mount)return;
    mount.innerHTML='<p class="small">Loading Release 467 Build 91 prelaunch decision evidence…</p>';
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
      mount.innerHTML=`<div class="prelaunch-summary-unavailable"><strong>Go-live decision: HOLD</strong><p>${esc(error?.message||'Current launch evidence is unavailable.')} No launch readiness is inferred when an authority cannot be read.</p><button class="btn" id="retryPrelaunchDecision" type="button">Retry</button></div>`;
      document.getElementById('retryPrelaunchDecision')?.addEventListener('click',load);
    }
  }
  document.addEventListener('DOMContentLoaded',load);
})();
