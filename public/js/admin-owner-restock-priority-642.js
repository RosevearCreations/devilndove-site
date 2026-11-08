// Release 467 Build 642 — a local, read-only priority projection of the
// explicitly loaded Build 641 private owner plans. No second database read.
(() => {
  'use strict';
  const $=id=>document.getElementById(id),root=$('dd642PriorityPanel');
  if(!root||!window.DD641OwnerPlans)return;
  const status=$('dd642Status'),counts=$('dd642Counts'),rows=$('dd642Rows'),
    buttons=[...root.querySelectorAll('[data-dd642-filter]')];
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const TYPES=new Set(['draft','follow_up','blocked','completed']);
  const FILTERS=new Set(['all','overdue','week','blocked','undated','completed']);
  const DAY=/^\d{4}-\d{2}-\d{2}$/;
  let loaded=false,plans=[],filter='all';
  const say=(message,tone='')=>{status.textContent=message;status.dataset.tone=tone;};
  function calendar(){
    const now=new Date(),year=now.getFullYear(),month=now.getMonth(),day=now.getDate();
    const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return {today:key(new Date(year,month,day)),weekEnd:key(new Date(year,month,day+7))};
  }
  function classify(plan,dates){
    if(plan.status==='completed')return {bucket:'completed',label:'Review completed',rank:6};
    const due=plan.follow_up_on||'';
    if(due&&due<dates.today)return {bucket:'overdue',label:'Overdue follow-up',rank:0};
    if(due===dates.today)return {bucket:'today',label:'Due today',rank:1};
    if(plan.status==='blocked')return {bucket:'blocked',label:'Blocked — needs owner action',rank:2};
    if(due&&due<=dates.weekEnd)return {bucket:'week',label:'Due within 7 days',rank:3};
    if(due)return {bucket:'later',label:'Scheduled later',rank:4};
    return {bucket:'undated',label:'Needs follow-up date',rank:5};
  }
  function view(){
    const dates=calendar();
    const evaluated=plans.map(plan=>({...plan,priority:classify(plan,dates)}));
    const active=evaluated.filter(p=>p.status!=='completed');
    const numbers={overdue:active.filter(p=>p.follow_up_on&&p.follow_up_on<dates.today).length,
      week:active.filter(p=>p.follow_up_on&&p.follow_up_on>=dates.today&&p.follow_up_on<=dates.weekEnd).length,
      blocked:active.filter(p=>p.status==='blocked').length,
      undated:active.filter(p=>!p.follow_up_on).length,
      completed:evaluated.length-active.length};
    buttons.forEach(button=>{button.disabled=!loaded;button.setAttribute('aria-pressed',String(button.dataset.dd642Filter===filter));
      const base={all:'All plans',overdue:'Overdue',week:'Due within 7 days',blocked:'Blocked',undated:'Needs a date',completed:'Completed review'}[button.dataset.dd642Filter];
      if(base)button.textContent=`${base} (${button.dataset.dd642Filter==='all'?evaluated.length:numbers[button.dataset.dd642Filter]})`;});
    if(!loaded){counts.textContent='No current owner plan evidence.';rows.textContent='Select Load my saved plans in the section below. No background request is made.';return;}
    counts.textContent=`As of ${dates.today} (device local date): ${numbers.overdue} overdue · ${numbers.week} due within 7 days (including today) · ${numbers.blocked} blocked · ${numbers.undated} active without dates · ${numbers.completed} completed reviews. Status and due-date counts can overlap.`;
    const filtered=evaluated.filter(p=>filter==='all'||
      (filter==='overdue'&&p.status!=='completed'&&p.follow_up_on&&p.follow_up_on<dates.today)||
      (filter==='week'&&p.status!=='completed'&&p.follow_up_on&&p.follow_up_on>=dates.today&&p.follow_up_on<=dates.weekEnd)||
      (filter==='blocked'&&p.status==='blocked')||
      (filter==='undated'&&p.status!=='completed'&&!p.follow_up_on)||
      (filter==='completed'&&p.status==='completed'))
      .sort((a,b)=>a.priority.rank-b.priority.rank||
        String(a.follow_up_on||'9999-99-99').localeCompare(String(b.follow_up_on||'9999-99-99'))||
        String(b.updated_at||'').localeCompare(String(a.updated_at||''))||String(a.plan_id).localeCompare(String(b.plan_id)));
    if(!filtered.length){rows.innerHTML='<p class="small">No owner plans match this review filter. This does not verify the physical stock or other channels.</p>';return;}
    rows.innerHTML=`<div class="dd640-scroll"><table><thead><tr><th>Priority</th><th>Owner plan</th><th>Follow-up / status</th><th>Shortcut</th></tr></thead><tbody>${filtered.map(plan=>
      `<tr><td><strong>${esc(plan.priority.label)}</strong></td><td><strong>${esc(plan.title)}</strong><div class="small">${plan.items.length} Product snapshot(s) · ${esc(plan.owner_note.slice(0,100))}</div></td>`+
      `<td>${esc(plan.follow_up_on||'No date')} · ${esc(plan.status.replaceAll('_',' '))}</td><td><button class="btn" type="button" data-dd642-review="${esc(plan.plan_id)}">Review plan</button></td></tr>`).join('')}</tbody></table></div>`;
    rows.querySelectorAll('[data-dd642-review]').forEach(button=>button.addEventListener('click',()=>{
      if(!loaded||window.DD641OwnerPlans.reopen(button.dataset.dd642Review)!==true)
        say('Owner plan could not be reopened. Reload saved plans before reviewing.','warn');
      else say('Opened the selected private owner plan below for deliberate follow-up editing. No stock has changed.','ok');
    }));
  }
  function receive(snapshot){
    if(snapshot?.loaded!==true){loaded=false;plans=[];filter='all';say('Waiting for an explicit, verified owner plan load.');view();return;}
    if(!Number.isSafeInteger(snapshot.owner_user_id)||snapshot.owner_user_id<1||
      !Number.isSafeInteger(snapshot.version)||snapshot.version<0||!Array.isArray(snapshot.plans)||snapshot.plans.length>20||
      snapshot.plans.some(p=>!p||typeof p.plan_id!=='string'||!TYPES.has(p.status)||typeof p.title!=='string'||
        typeof p.owner_note!=='string'||!Array.isArray(p.items)||p.items.length>8||
        (p.follow_up_on!==''&&(typeof p.follow_up_on!=='string'||!DAY.test(p.follow_up_on))))){
      loaded=false;plans=[];filter='all';say('HOLD — owner plan evidence is malformed. Reload and review; no guessed priorities.','error');view();return;}
    loaded=true;plans=snapshot.plans;view();say(`Priority board refreshed from ${plans.length} verified owner plan(s). Choose a filter or Review plan.`, 'ok');
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{
    const next=button.dataset.dd642Filter;if(!loaded||!FILTERS.has(next))return;
    filter=next;view();say(`Showing ${button.textContent}. Review plan opens the original owner draft.`, 'ok');
  }));
  window.DD641OwnerPlans.subscribe(receive);
})();
