// Release 467 Build 254 — Operator Journey Friction Review.
// Uses only the browser-local, pathname-only Build 249 measurement. It never records
// remotely, rewrites navigation automatically, or treats insufficient evidence as friction.
(() => {
  'use strict';
  if (!window.location.pathname.startsWith('/admin/')) return;
  if (window.DDOperatorJourneyFrictionV254) return;

  const BUILD=254;
  const VERSION='467b254-operator-journey-friction-v1';
  const REPEATED_TRANSITION_THRESHOLD=2;
  const REPEATED_ROUTE_THRESHOLD=3;

  const safeCount=(value)=>Math.max(0,Math.trunc(Number(value)||0));
  const copyCounts=(value)=>{
    const out={};
    if (!value || typeof value!=='object') return out;
    for (const [key,count] of Object.entries(value)) {
      if (typeof key!=='string' || !key.startsWith('/admin/')) continue;
      out[key]=safeCount(count);
    }
    return out;
  };
  const copyTransitions=(value)=>{
    const out={};
    if (!value || typeof value!=='object') return out;
    for (const [key,count] of Object.entries(value)) {
      if (typeof key!=='string' || !key.includes(' -> ')) continue;
      const [from,to]=key.split(' -> ');
      if (!from?.startsWith('/admin/') || !to?.startsWith('/admin/')) continue;
      out[from+' -> '+to]=safeCount(count);
    }
    return out;
  };

  function evaluate(rawEvidence){
    const evidence=rawEvidence || window.DDRefinementRuntimeV249?.routeEvidence?.() || {};
    const visits=copyCounts(evidence.route_visits || evidence.visits);
    const transitions=copyTransitions(evidence.transitions || evidence.route_transitions);
    const repeatedTransitions=Object.entries(transitions)
      .filter(([,count])=>count>=REPEATED_TRANSITION_THRESHOLD)
      .map(([transition,count])=>({kind:'repeated_navigation',transition,count}))
      .sort((a,b)=>b.count-a.count || a.transition.localeCompare(b.transition));
    const repeatedRoutes=Object.entries(visits)
      .filter(([,count])=>count>=REPEATED_ROUTE_THRESHOLD)
      .map(([route,count])=>({kind:'repeated_route',route,count}))
      .sort((a,b)=>b.count-a.count || a.route.localeCompare(b.route));

    const candidate=repeatedTransitions[0] || repeatedRoutes[0] || null;
    const observedTransitions=Object.values(transitions).reduce((n,v)=>n+v,0);
    const observedVisits=Object.values(visits).reduce((n,v)=>n+v,0);
    let state='INSUFFICIENT_ROUTE_EVIDENCE';
    let summary='Needs more real route evidence';
    if (candidate) {
      state='EVIDENCE_BACKED_REVIEW_CANDIDATE';
      summary=candidate.kind==='repeated_navigation'
        ? 'Repeated navigation: '+candidate.transition+' (×'+candidate.count+')'
        : 'Repeated route: '+candidate.route+' (×'+candidate.count+')';
    } else if (observedTransitions>0 || observedVisits>1) {
      state='NO_EVIDENCE_BACKED_FRICTION';
      summary='No repeated-navigation friction detected';
    }
    return Object.freeze({
      build:BUILD,
      version:VERSION,
      state,
      summary,
      observed_route_visits:observedVisits,
      observed_route_transitions:observedTransitions,
      repeated_transition_candidates:repeatedTransitions,
      repeated_route_candidates:repeatedRoutes,
      dead_end_claimed:false,
      recovery_friction_claimed:false,
      automatic_navigation_change:false,
      remote_recording:false,
      source:'DDRefinementRuntimeV249.routeEvidence'
    });
  }

  function render(){
    const result=evaluate();
    const state=document.getElementById('build254JourneyReviewState');
    const candidate=document.getElementById('build254JourneyCandidate');
    if (state) state.textContent=result.state==='INSUFFICIENT_ROUTE_EVIDENCE'
      ? 'Needs more real route evidence'
      : result.state==='NO_EVIDENCE_BACKED_FRICTION'
        ? 'No evidence-backed friction'
        : 'Review candidate found';
    if (candidate) candidate.textContent=result.summary;
    return result;
  }

  document.addEventListener('DOMContentLoaded',render,{once:true});
  window.addEventListener('pageshow',render);
  setTimeout(render,1600);
  setTimeout(render,15150);

  window.DDOperatorJourneyFrictionV254=Object.freeze({
    build:BUILD,
    version:VERSION,
    evaluate,
    render,
    repeated_transition_threshold:REPEATED_TRANSITION_THRESHOLD,
    repeated_route_threshold:REPEATED_ROUTE_THRESHOLD,
    remote_recording:false,
    automatic_navigation_change:false
  });
})();