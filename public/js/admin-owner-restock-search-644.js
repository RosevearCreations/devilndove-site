// Build 644 — deliberate, owner-scoped read-only review search and decision summary.
(() => {
  'use strict';
  const $=id=>document.getElementById(id),root=$('dd644ReviewSearch');
  if(!root||!window.DDAuth?.apiFetch||!window.DD641OwnerPlans)return;
  const plan=$('dd643Plan'),query=$('dd644Query'),outcome=$('dd644Outcome'),
    search=$('dd644Search'),clear=$('dd644Clear'),more=$('dd644More'),
    status=$('dd644Status'),summary=$('dd644Summary'),results=$('dd644Results');
  const labels={needs_physical_count:'Physical count needed',needs_supplier_review:'Supplier review needed',
    needs_workshop_review:'Workshop review needed',follow_up_scheduled:'Owner follow-up scheduled',
    no_change_recommended:'No stock change recommended',separate_action_recommended:'Separate controlled action recommended'};
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let owner=null,planVersion=null,plans=[],loaded=false,events=[],cursor=null,
    timelineVersion=0,activePlan='',activeQuery='',activeOutcome='',busy=false,revision=0;
  const say=(message,tone='')=>{status.textContent=message;status.dataset.tone=tone;};
  const selected=()=>String(plan.value||'');
  const maySearch=()=>owner!==null&&plans.includes(selected());
  const sync=()=>{search.disabled=busy||!maySearch();more.disabled=busy||!loaded||!cursor;clear.disabled=busy;};
  function invalidate(message='Choose Search saved reviews to refresh this owner-only view.'){
    revision++;loaded=false;events=[];cursor=null;timelineVersion=0;activePlan='';activeQuery='';activeOutcome='';
    window.DD645RestockDigest?.invalidate?.();
    summary.textContent='No current owner decision summary has been verified for this selection.';
    results.textContent='No matching review notes loaded; no background request was made.';
    say(message);sync();
  }
  function receive(source){
    if(source?.loaded!==true||!Number.isSafeInteger(source.owner_user_id)||
      !Number.isSafeInteger(source.version)||!Array.isArray(source.plans)){
      owner=null;planVersion=null;plans=[];invalidate('Load the private owner plans above before searching reviews.');return;}
    const changed=source.owner_user_id!==owner||source.version!==planVersion;
    owner=source.owner_user_id;planVersion=source.version;
    plans=source.plans.filter(p=>typeof p?.plan_id==='string').map(p=>p.plan_id);
    if(changed)invalidate('Owner plans refreshed. Select a saved plan and search its private review history.');
    sync();
  }
  function valid(data,id,q,filter){
    return data?.ok===true&&data.private===true&&data.read_only===true&&
      data.owner_user_id===owner&&data.plan_id===id&&data.plan_version===planVersion&&
      Number.isSafeInteger(data.timeline_version)&&data.timeline_version>=0&&
      data.search?.q===q&&data.search?.outcome===filter&&
      Number.isSafeInteger(data.matched_total)&&data.matched_total>=0&&data.matched_total<=50&&
      Array.isArray(data.events)&&data.events.length<=10&&data.events.every(x=>
        typeof x?.event_id==='string'&&typeof x?.recorded_at==='string'&&typeof x?.note==='string'&&
        Object.hasOwn(labels,x.outcome))&&
      (data.next_cursor===null||typeof data.next_cursor==='string')&&
      data.summary?.advisory_only===true&&data.summary?.inventory_mutation===false&&
      Number.isSafeInteger(data.summary.review_count)&&data.summary.review_count<=50&&
      data.summary.outcome_counts&&Object.keys(labels).every(key=>
        Number.isSafeInteger(data.summary.outcome_counts[key])&&data.summary.outcome_counts[key]>=0);
  }
  function displaySummary(info,matched){
    const counts=Object.entries(labels).filter(([key])=>info.outcome_counts[key]>0)
      .map(([key,label])=>`<li>${esc(label)}: <strong>${info.outcome_counts[key]}</strong></li>`).join('');
    summary.innerHTML=`<div class="dd640-plan"><strong>Owner decision summary</strong>
      <p class="small">${info.review_count} dated review(s) recorded; ${matched} matching the current filters.</p>
      <p class="small">Most recent review outcome: ${esc(labels[info.latest_outcome]||'No outcome recorded')} · ${esc(info.latest_review_at||'No review date')}</p>
      <p class="small">Saved plan status: ${esc(info.plan_status)} · follow-up: ${esc(info.plan_follow_up_on||'None scheduled')}</p>
      ${counts?`<ul>${counts}</ul>`:'<p class="small">There are no prior review outcomes to summarize.</p>'}
      <p class="small">Advisory history only. A review outcome is not a Product count, purchase receipt, order change or go-live approval.</p></div>`;
  }
  function displayEvents(matched){
    results.innerHTML=events.length?`<ol>${events.map(event=>`<li class="dd640-plan">
      <strong>${esc(labels[event.outcome])}</strong><div class="small">${esc(event.recorded_at)} · saved plan version ${Number(event.plan_version)}</div>
      <p>${esc(event.note)}</p><div class="small">At review: ${esc(event.status_at_review||'unknown')} · follow-up ${esc(event.follow_up_on_at_review||'none')}</div>
      </li>`).join('')}</ol>`:'<p class="small">No private review notes match these filters.</p>';
    say(`Showing ${events.length} of ${matched} matching review(s). ${cursor?'Load next matching 10 for an older page.':'All matching reviews are displayed.'}`,'ok');
  }
  async function read(next=false){
    if(busy||!maySearch()||(next&&(!loaded||!cursor)))return;
    const id=selected(),q=next?activeQuery:query.value.trim().toLowerCase(),filter=next?activeOutcome:outcome.value;
    if(q.length===1||q.length>80||(filter&&!Object.hasOwn(labels,filter))){
      say('Use a blank query or 2–80 characters, and choose a valid outcome. No request made.','warn');return;}
    const token=++revision;
    busy=true;sync();say(next?'Loading one earlier matching page…':'Searching up to 50 private review entries for the selected owner plan…');
    try{
      const url='/api/admin/owner-restock-review-notes?plan_id='+encodeURIComponent(id)+
        '&q='+encodeURIComponent(q)+'&outcome='+encodeURIComponent(filter)+
        (next?'&before='+encodeURIComponent(cursor):'');
      const response=await window.DDAuth.apiFetch(url,{method:'GET',cache:'no-store'});
      const data=await response.json().catch(()=>null);
      if(token!==revision||selected()!==id)throw Error('Owner plan selection changed. Search again.');
      if(!response.ok||!valid(data,id,q,filter))throw Error(data?.error||'Private history summary is incomplete.');
      if(next&&data.timeline_version!==timelineVersion)throw Error('A newer review changed the timeline. Search again.');
      if(!next){events=[];activePlan=id;activeQuery=q;activeOutcome=filter;timelineVersion=data.timeline_version;}
      const seen=new Set(events.map(event=>event.event_id));
      for(const event of data.events)if(!seen.has(event.event_id)){events.push(event);seen.add(event.event_id);}
      cursor=data.next_cursor;loaded=true;displaySummary(data.summary,data.matched_total);displayEvents(data.matched_total);
      window.DD645RestockDigest?.receive?.({ready:true,private:true,read_only:true,
        owner_user_id:data.owner_user_id,plan_id:id,plan_version:data.plan_version,
        timeline_version:data.timeline_version,search:{q, outcome:filter},
        matched_total:data.matched_total,summary:data.summary,events:[...events],
        complete:cursor===null,verified_at:new Date().toISOString()});
    }catch(error){invalidate(`HOLD — ${error.message||'Unable to verify private reviews.'} No automatic retry.`);}
    finally{busy=false;sync();}
  }
  plan.addEventListener('change',()=>invalidate('Owner plan changed. Choose Search saved reviews; prior results have been cleared.'));
  query.addEventListener('input',()=>invalidate('Search terms changed. Choose Search saved reviews to refresh; old results were cleared.'));
  outcome.addEventListener('change',()=>invalidate('Outcome filter changed. Search again to verify new results.'));
  search.addEventListener('click',()=>void read());more.addEventListener('click',()=>void read(true));
  clear.addEventListener('click',()=>{query.value='';outcome.value='';invalidate('Filters cleared. Choose Search saved reviews to display all recorded reviews.');});
  window.DD641OwnerPlans.subscribe(receive);sync();
})();
