// Build 651 — manual, bounded private owner follow-up scan. No automatic writes.
(() => {
  'use strict';
  const el=id=>document.getElementById(`dd651${id}`);
  if(!el('Queue')||!window.DDAuth?.apiFetch||!window.DD641OwnerPlans?.subscribe||
     !window.DD641OwnerPlans?.snapshot||!window.DD641OwnerPlans?.reopen)return;
  const ui=Object.fromEntries(['Scan','Restart','Clear','Filter','Status','Coverage','Rows',
    'Selection','History','Reopen','Prepare','Preview','Copy'].map(id=>[id,el(id)]));
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const outcomes={
    needs_physical_count:['Physical count needed','Check physical Product counts and current commitments separately.'],
    needs_supplier_review:['Supplier review needed','Verify supplier response and purchasing permissions separately.'],
    needs_workshop_review:['Workshop review needed','Inspect the actual bench/workshop records before choosing a status.'],
    follow_up_scheduled:['Follow-up scheduled','Check the date in the saved owner plan and decide if an update is needed.'],
    no_change_recommended:['No stock change recommended','Treat this as a dated recommendation, not a verified count.'],
    separate_action_recommended:['Separate action recommended','Use the separately authorized workflow for any proposed action.']
  };
  const statuses=new Set(['draft','follow_up','blocked','completed']);
  const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const integer=n=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0;
  const dateOK=s=>typeof s==='string'&&(!s||(/^20\d{2}-\d{2}-\d{2}$/.test(s)&&
    !Number.isNaN(Date.parse(`${s}T00:00:00Z`))&&
    new Date(`${s}T00:00:00Z`).toISOString().slice(0,10)===s));
  const dayKey=ms=>new Date(ms).toISOString().slice(0,10);
  const dayDelta=(due,now)=>due?Math.round((Date.parse(`${due}T00:00:00Z`)-
    Date.parse(`${dayKey(now)}T00:00:00Z`))/86400000):null;
  let source=null,rows=[],selected='',draft='',scanning=false,epoch=0;
  const listeners=new Set();
  const status=text=>{ui.Status.textContent=text};
  function normalize(s){
    if(s?.loaded!==true||!integer(s.owner_user_id)||s.owner_user_id<1||
       !integer(s.version)||!Array.isArray(s.plans)||s.plans.length>20)return null;
    const seen=new Set(),plans=[];
    for(const p of s.plans){
      if(!uuid.test(p?.plan_id||'')||seen.has(p.plan_id)||
        typeof p.title!=='string'||p.title.length<4||p.title.length>100||
        !statuses.has(p.status)||!dateOK(p.follow_up_on))return null;
      seen.add(p.plan_id);
      plans.push({id:p.plan_id,title:p.title,status:p.status,due:p.follow_up_on});
    }
    // The queue order is based on the verified saved plan, not unseen timeline results.
    plans.sort((a,b)=>Number(b.status==='blocked')-Number(a.status==='blocked')||
      Number(!a.due)-Number(!b.due)||(a.due||'').localeCompare(b.due||'')||
      a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
    return {owner:s.owner_user_id,version:s.version,plans};
  }
  const current=()=>!!source&&JSON.stringify(source)===
    JSON.stringify(normalize(window.DD641OwnerPlans.snapshot()));
  function snapshot(){
    if(!current())return null;
    return {owner:source.owner,version:source.version,total:source.plans.length,
      selected,scanning,checked:rows.map(({id,title,status,due,reviewCount,timeline,latest,at,checkedAt})=>
        ({id,title,status,due,reviewCount,timeline,latest,at,checkedAt}))};
  }
  function publish(){
    const view=snapshot();
    for(const fn of listeners)try{fn(view);}catch{}
  }
  const chosen=()=>rows.find(x=>x.id===selected)||null;
  function resetDraft(){draft='';ui.Preview.value='';ui.Copy.disabled=true;
    ui.Prepare.disabled=!chosen();}
  function reset(message='Private queue cleared; no saved plans or decisions changed.'){
    epoch++;rows=[];selected='';scanning=false;resetDraft();
    ui.Rows.textContent='No private decisions checked. Start a deliberate five-plan scan.';
    ui.Coverage.textContent=`0 of ${source?.plans.length||0} saved owner plans checked. This is not a complete queue.`;
    ui.Selection.textContent='Select a verified scanned plan for manual follow-up.';
    ui.Scan.disabled=!source?.plans.length;ui.Restart.disabled=!source?.plans.length;
    ui.Clear.disabled=!source;ui.History.disabled=true;ui.Reopen.disabled=true;
    ui.Filter.value='all';ui.Filter.disabled=true;status(message);
    publish();
  }
  function check(data,plan,now){
    const s=data?.summary,events=data?.events;
    if(data?.build!==643||data.ok!==true||data.private!==true||data.read_only!==true||
      data.automatic!==false||data.inventory_mutation!==false||
      data.owner_user_id!==source.owner||data.plan_id!==plan.id||
      data.plan_version!==source.version||!integer(data.timeline_version)||
      !integer(data.matched_total)||data.matched_total>50||
      data.search?.q!==''||data.search?.outcome!==''||
      !s||!integer(s.review_count)||s.review_count>50||
      s.review_count!==data.matched_total||s.plan_status!==plan.status||
      s.plan_follow_up_on!==plan.due||s.advisory_only!==true||
      s.inventory_mutation!==false||s.order_mutation!==false||
      !s.outcome_counts||Object.keys(s.outcome_counts).length!==6||
      Object.keys(outcomes).some(k=>!integer(s.outcome_counts[k])||s.outcome_counts[k]>50)||
      Object.values(s.outcome_counts).reduce((a,b)=>a+b,0)!==s.review_count||
      !Array.isArray(events)||events.length!==Math.min(10,s.review_count)||
      (data.next_cursor!==null&&
        (s.review_count<=10||data.next_cursor!==events.at(-1)?.event_id))||
      (data.next_cursor===null&&s.review_count>10)||
      s.latest_outcome!==(events[0]?.outcome||null)||
      s.latest_review_at!==(events[0]?.recorded_at||null)||
      (s.review_count===0&&data.timeline_version!==0))return null;
    let previous=Infinity;const seen=new Set();
    for(const e of events){const t=Date.parse(e?.recorded_at);
      if(!uuid.test(e?.event_id||'')||seen.has(e.event_id)||
        !Object.hasOwn(outcomes,e.outcome)||typeof e.note!=='string'||
        e.note.trim().length<8||e.note.length>300||
        typeof e.recorded_at!=='string'||!Number.isFinite(t)||
        t>now+600000||t>previous||!integer(e.plan_version)||
        e.plan_version<1||e.plan_version>source.version||
        !statuses.has(e.status_at_review)||!dateOK(e.follow_up_on_at_review))return null;
      previous=t;seen.add(e.event_id);
    }
    return {...plan,reviewCount:s.review_count,timeline:data.timeline_version,
      latest:events[0]?.outcome||null,at:events[0]?.recorded_at||null,
      checkedAt:now,olderAvailable:s.review_count>10};
  }
  function matches(row,filter){
    const due=dayDelta(row.due,row.checkedAt);
    const age=row.at?Math.max(0,Math.floor((row.checkedAt-Date.parse(row.at))/86400000)):null;
    if(filter==='due')return due!==null&&due<=0;
    if(filter==='aging')return age!==null&&age>7;
    if(filter==='unreviewed')return row.reviewCount===0;
    if(filter==='recent')return age!==null&&age<=7;
    if(filter==='attention')return row.status==='blocked'||due!==null&&due<=0||
      ['needs_physical_count','needs_supplier_review','needs_workshop_review',
        'separate_action_recommended'].includes(row.latest);
    return true;
  }
  function render(){
    if(!current()){reset('HOLD — saved owner plan source changed. Reload private plans.');return;}
    const total=source.plans.length,filter=ui.Filter.value;
    const visible=rows.filter(r=>matches(r,filter));
    ui.Coverage.textContent=`${rows.length} of ${total} saved owner plans checked. `+
      `${visible.length} of ${rows.length} checked plans match the selected filter. `+
      (rows.length<total?'Unscanned plans may also match; this is not a complete queue.':
        'All currently loaded owner plans were explicitly checked.')+
      ' This is dated planning evidence, not live stock or verified work completion.';
    ui.Rows.innerHTML=visible.length?`<div class="dd640-scroll"><table><thead><tr>`+
      '<th>Saved plan</th><th>Follow-up</th><th>Last owner decision</th><th>Review</th></tr></thead><tbody>'+
      visible.map(r=>{const delta=dayDelta(r.due,r.checkedAt),
        due=delta===null?'No saved date':delta<0?`${-delta} day(s) overdue`:
          delta===0?'Due today':`Due in ${delta} day(s)`,
        age=r.at?`${Math.max(0,Math.floor((r.checkedAt-Date.parse(r.at))/86400000))} day(s) old`:
          'No dated review',latest=r.latest?outcomes[r.latest][0]:'No saved decision';
        return `<tr><td><strong>${clean(r.title)}</strong><div class="small">${clean(r.status.replaceAll('_',' '))}</div></td>`+
          `<td>${clean(due)}</td><td>${clean(latest)}<div class="small">${clean(age)} · `+
          `${r.reviewCount} total recorded</div></td><td><button type="button" class="btn" `+
          `data-dd651-plan="${clean(r.id)}" aria-label="Review owner follow-up for ${clean(r.title)}">Review</button></td></tr>`;
      }).join('')+'</tbody></table></div>':
      '<p class="small">No scanned plans match this filter. Unscanned plans are not classified.</p>';
    ui.Scan.disabled=scanning||rows.length>=total;ui.Restart.disabled=scanning||!total;
    ui.Clear.disabled=scanning||!source;ui.Filter.disabled=!rows.length;
    const focus=chosen();ui.History.disabled=!focus;ui.Reopen.disabled=!focus;
    ui.Prepare.disabled=!focus;
    if(focus){const age=focus.at?Math.max(0,Math.floor((focus.checkedAt-Date.parse(focus.at))/86400000)):null;
      ui.Selection.textContent=`${focus.title} · plan v${source.version} · dated-review timeline v${focus.timeline}. `+
        `${focus.reviewCount} saved decision(s), latest ${focus.latest?outcomes[focus.latest][0]:'none'} `+
        `(${age===null?'no review date':`${age} day(s) old`}). `+
        `Checked ${new Date(focus.checkedAt).toLocaleString()}. `+
        `${focus.latest?outcomes[focus.latest][1]:'Use the original dated-review editor to record a factual decision.'} `+
        'No inventory or plan status change has been made.';
    }else ui.Selection.textContent='Select a verified scanned plan for manual follow-up.';
    publish();
  }
  async function scan(restart=false){
    if(scanning||!current()||!source?.plans.length)return;
    if(restart)reset('Previous private queue cleared for a deliberate fresh scan.');
    const ticket=++epoch,version=source.version,owner=source.owner;
    const group=source.plans.slice(rows.length,rows.length+5),batch=[];
    if(!group.length)return;
    scanning=true;ui.Scan.disabled=true;ui.Restart.disabled=true;ui.Clear.disabled=true;
    ui.History.disabled=true;ui.Reopen.disabled=true;resetDraft();ui.Prepare.disabled=true;
    publish();
    status(`Checking ${group.length} saved plan(s) with one authenticated GET per plan, sequentially…`);
    try{
      for(const p of group){
        const response=await window.DDAuth.apiFetch(
          `/api/admin/owner-restock-review-notes?plan_id=${encodeURIComponent(p.id)}`,
          {method:'GET',cache:'no-store'});
        const body=await response.json().catch(()=>null);
        if(ticket!==epoch||!current()||source.owner!==owner||source.version!==version)return;
        if(!response.ok)throw Error('Private owner review read unavailable.');
        const checked=check(body,p,Date.now());
        if(!checked)throw Error('Private plan or dated-review source could not be verified.');
        batch.push(checked);
      }
      rows.push(...batch);render();
      status(`Verified ${rows.length} of ${source.plans.length} plans. `+
        (rows.length<source.plans.length?'Click again to check the next five.':
          'All current saved plans were checked.')+
        ' Results can age; no automatic refresh or saved change occurred.');
    }catch(error){
      if(ticket===epoch)reset(`HOLD — ${error.message} No partial decisions retained. Reload owner plans and start over; no automatic retry.`);
    }finally{if(ticket===epoch){scanning=false;ui.Scan.disabled=rows.length>=source.plans.length;
      ui.Restart.disabled=!source.plans.length;ui.Clear.disabled=false;publish();}}
  }
  ui.Scan.addEventListener('click',()=>void scan());
  ui.Restart.addEventListener('click',()=>void scan(true));
  ui.Clear.addEventListener('click',()=>reset());
  ui.Filter.addEventListener('change',()=>{resetDraft();render();});
  ui.Rows.addEventListener('click',e=>{
    const id=e.target.closest?.('[data-dd651-plan]')?.dataset.dd651Plan;
    if(!id||!rows.some(r=>r.id===id)||!current())return;
    selected=id;resetDraft();render();status('Verified plan selected. Owner handoff actions require separate deliberate clicks.');
  });
  ui.History.addEventListener('click',()=>{
    const p=chosen(),control=document.getElementById('dd649Plan');
    if(!p||!current()||!control||!Array.from(control.options||[]).some(x=>x.value===p.id)){
      status('Load matching private owner plans in Build 649 history before opening this review.');return;
    }
    control.value=p.id;control.dispatchEvent(new Event('change',{bubbles:true}));
    const details=document.getElementById('dd649History');
    if(details)details.open=true;
    status('Private history plan selected. Click Load saved decision history there; no automatic history request occurred.');
  });
  ui.Reopen.addEventListener('click',()=>{
    const p=chosen();if(!p||!current())return;
    if(window.DD641OwnerPlans.reopen(p.id)!==true){status('HOLD — original plan editor could not be reopened.');return;}
    status('Original saved plan reopened. Review factual sources and separately Save any deliberate change.');
  });
  ui.Prepare.addEventListener('click',()=>{
    const p=chosen();if(!p||!current()||scanning)return;
    const followup=p.due||'undated';
    draft=[
      'DEVIL N DOVE — PRIVATE OWNER FOLLOW-UP HANDOFF (UNSIGNED)',
      `Owner: ${source.owner} | Plan: ${p.title} | ID: ${p.id}`,
      `Saved plan version: ${source.version} | Dated-review timeline version: ${p.timeline}`,
      `Checked: ${new Date(p.checkedAt).toISOString()} | Follow-up: ${followup} | Status: ${p.status}`,
      `Saved reviews: ${p.reviewCount} | Latest recommendation: ${p.latest?outcomes[p.latest][0]:'none recorded'}`,
      `Next manual check: ${p.latest?outcomes[p.latest][1]:'Review actual records and consider a factual dated owner note.'}`,
      'OWNER PLANNING ONLY — no physical count, supplier purchase, stock action, status Save or publication approval.'
    ].join('\n');
    ui.Preview.value=draft;ui.Copy.disabled=false;
    status('Unsigned private handoff prepared locally. Review before explicitly copying; nothing was saved or sent.');
  });
  ui.Copy.addEventListener('click',async()=>{
    if(!draft||ui.Preview.value!==draft||!chosen()||!current()||scanning)return;
    try{
      if(!window.navigator?.clipboard?.writeText)throw Error('Clipboard unavailable');
      await window.navigator.clipboard.writeText(draft);
      if(ui.Preview.value===draft&&current())status('Copied private unsigned handoff. Any actual action still needs its own verified editor/approval.');
    }catch{status('Clipboard blocked. Select draft text manually; nothing was saved or sent.');}
  });
  window.DD651Queue={snapshot,subscribe(fn){if(typeof fn!=='function')return()=>{};
    listeners.add(fn);try{fn(snapshot());}catch{}return()=>listeners.delete(fn);},
    select(id){if(!current()||!rows.some(r=>r.id===id)||scanning)return false;
      selected=id;resetDraft();render();return true;}};
  window.DD641OwnerPlans.subscribe(s=>{
    const next=normalize(s),changed=JSON.stringify(next)!==JSON.stringify(source);
    source=next;
    if(changed)reset(source?'Saved owner plans verified. Explicitly scan five at a time.':
      'HOLD — authenticated saved owner plans unavailable. No private queue shown.');
  });
})();
