// Build 652: owner-scoped session filter presets and explainable read-only queue priority.
(() => {
  'use strict';
  const by=id=>document.getElementById(`dd652${id}`);
  if(!by('Views')||!window.DD651Queue?.subscribe||!window.DD651Queue?.select)return;
  const ui=Object.fromEntries(['Name','Save','Saved','Apply','Delete','Status',
    'Priorities','Detail','Continue'].map(id=>[id,by(id)]));
  const filterEl=document.getElementById('dd651Filter');
  if(!filterEl)return;
  const filterValues=new Set(['all','attention','due','aging','unreviewed','recent']);
  const names=/^[a-z0-9][a-z0-9 _-]{1,29}$/i;
  const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state=null,views=[],ownerKey='',lastOwner=null;
  const report=message=>{ui.Status.textContent=message};
  const key=owner=>`dnd652.owner-filter-views.v1.${owner}`;
  function fromStorage(owner){
    try{
      const raw=window.sessionStorage?.getItem(key(owner));
      if(!raw)return [];
      const doc=JSON.parse(raw);
      if(doc?.version!==1||!Array.isArray(doc.views)||doc.views.length>5)return [];
      const seen=new Set();
      for(const item of doc.views){
        if(!names.test(item?.name||'')||!filterValues.has(item.filter)||
          seen.has(item.name.toLowerCase()))return [];
        seen.add(item.name.toLowerCase());
      }
      return doc.views.map(v=>({name:v.name,filter:v.filter}));
    }catch{return [];}
  }
  function saveStorage(){
    try{
      if(!window.sessionStorage)return false;
      window.sessionStorage.setItem(ownerKey,JSON.stringify({version:1,views}));
      return true;
    }catch{return false;}
  }
  function options(){
    ui.Saved.innerHTML='';
    const first=document.createElement('option');first.value='';first.textContent='Choose a saved filter';
    ui.Saved.appendChild(first);
    for(const view of views){const option=document.createElement('option');
      option.value=view.name;option.textContent=`${view.name} — ${view.filter}`;
      ui.Saved.appendChild(option);
    }
    ui.Saved.value='';ui.Saved.disabled=!views.length;
    ui.Apply.disabled=true;ui.Delete.disabled=true;
  }
  function selectedView(){return views.find(v=>v.name===ui.Saved.value)||null;}
  function priority(row){
    const day=new Date(row.checkedAt).toISOString().slice(0,10);
    const due=row.due?Math.round((Date.parse(`${row.due}T00:00:00Z`)-
      Date.parse(`${day}T00:00:00Z`))/86400000):null;
    const age=row.at?Math.max(0,Math.floor((row.checkedAt-Date.parse(row.at))/86400000)):null;
    const reasons=[];
    if(row.status==='blocked')reasons.push('Saved plan is blocked; review the actual blocker.');
    if(due!==null&&due<0)reasons.push(`Saved follow-up date is ${-due} day(s) overdue.`);
    if(due===0)reasons.push('Saved follow-up date is today.');
    if(row.latest==='needs_physical_count')reasons.push('Latest owner note recommends a separate physical stock check.');
    if(row.latest==='needs_supplier_review')reasons.push('Latest owner note recommends a separate supplier check.');
    if(row.latest==='needs_workshop_review')reasons.push('Latest owner note recommends checking workbench evidence.');
    if(row.latest==='separate_action_recommended')reasons.push('Latest owner note recommends a separately authorized action.');
    if(row.reviewCount===0)reasons.push('No dated owner decision was recorded.');
    if(age!==null&&age>7)reasons.push(`Latest recorded decision is ${age} day(s) old; recheck current facts.`);
    if(!reasons.length)reasons.push('No overdue, blocked or aging signal in the checked planning evidence.');
    const urgent=row.status==='blocked'||due!==null&&due<=0;
    const review=urgent||row.reviewCount===0||age!==null&&age>7||
      ['needs_physical_count','needs_supplier_review','needs_workshop_review',
        'separate_action_recommended'].includes(row.latest);
    return {rank:urgent?0:review?1:2,
      label:urgent?'Due / blocked review':review?'Evidence review suggested':'Routine owner review',
      reasons:reasons.join(' ')};
  }
  function render(){
    if(!state){
      ui.Priorities.textContent='No verified owner queue. Load saved plans and deliberately scan in Build 651.';
      ui.Detail.textContent='No verified owner follow-up selected.';
      ui.Continue.disabled=true;ui.Save.disabled=true;
      report('HOLD — verified owner queue unavailable. Session-saved filters do not establish source truth.');
      return;
    }
    const rows=state.checked.map(r=>({row:r,priority:priority(r)}))
      .sort((a,b)=>a.priority.rank-b.priority.rank||a.row.title.localeCompare(b.row.title)||
        a.row.id.localeCompare(b.row.id));
    ui.Priorities.innerHTML=rows.length?`<div class="dd640-scroll"><table><thead><tr>`+
      '<th>Checked owner plan</th><th>Why it appears here</th><th>Continue</th></tr></thead><tbody>'+
      rows.map(({row,priority:p})=>`<tr><td><strong>${html(row.title)}</strong>`+
        `<div class="small">${html(p.label)}</div></td><td>${html(p.reasons)}</td>`+
        `<td><button type="button" class="btn" data-dd652-plan="${html(row.id)}" `+
        `aria-label="Continue verified review of ${html(row.title)}">Continue</button></td></tr>`).join('')+
      '</tbody></table></div>':'<p class="small">No plans deliberately checked yet. Saved filters never load private data automatically.</p>';
    const active=rows.find(x=>x.row.id===state.selected);
    ui.Continue.disabled=!active||state.scanning;
    ui.Detail.textContent=active?`${active.row.title}: ${active.priority.label}. `+
      `${active.priority.reasons} Checked ${new Date(active.row.checkedAt).toLocaleString()} `+
      `against saved plan v${state.version} / timeline v${active.row.timeline}. `+
      'This priority is a planning explanation, not a completed action or verified stock fact.':
      'Select a checked plan in Build 651 to keep its source-linked follow-up in view.';
    ui.Save.disabled=state.scanning||!filterValues.has(filterEl.value);
    if(state.checked.length<state.total)report(`Only ${state.checked.length} of ${state.total} owner plans have been checked. `+
      'Priority labels do not cover unscanned plans; saved filters store no private decisions.');
    else report('All currently loaded owner plans were deliberately checked. Priorities remain dated advisory labels.');
  }
  ui.Save.addEventListener('click',()=>{
    if(!state||state.scanning)return;
    const name=String(ui.Name.value||'').trim(),filter=filterEl.value;
    if(!names.test(name)||!filterValues.has(filter)){
      report('Use a 2–30 character view name (letters, numbers, spaces, hyphen or underscore) and a valid filter.');return;
    }
    const old=views.findIndex(v=>v.name.toLowerCase()===name.toLowerCase());
    if(old<0&&views.length>=5){report('Five session-saved filters already exist. Delete one explicitly first.');return;}
    if(old<0)views.push({name,filter});else views[old]={name,filter};
    const stored=saveStorage();options();
    report(stored?'Saved the filter in this browser tab session. No plan IDs, note bodies or queue results were stored.':
      'Filter retained in this page only (session storage unavailable). No private records stored.');
  });
  ui.Saved.addEventListener('change',()=>{const found=!!selectedView();
    ui.Apply.disabled=!found||!state||state.scanning;
    ui.Delete.disabled=!found||!state;});
  ui.Apply.addEventListener('click',()=>{
    const view=selectedView();if(!view||!state||state.scanning)return;
    filterEl.value=view.filter;filterEl.dispatchEvent(new Event('change',{bubbles:true}));
    report(`Applied session-saved filter “${view.name}”. Scan more plans manually if coverage is incomplete.`);
  });
  ui.Delete.addEventListener('click',()=>{
    const view=selectedView();if(!view||!state)return;
    views=views.filter(x=>x.name!==view.name);
    const stored=saveStorage();options();
    report(stored?'Saved filter deleted from this browser session.':'Page-only filter deleted.');
  });
  ui.Priorities.addEventListener('click',e=>{
    const id=e.target.closest?.('[data-dd652-plan]')?.dataset.dd652Plan;
    if(!id||!state||state.scanning||!state.checked.some(x=>x.id===id))return;
    if(window.DD651Queue.select(id)!==true){report('Checked plan selection is stale. Rescan manually.');return;}
    report('Source-linked owner follow-up selected in Build 651. Review original evidence and use separate Save only if needed.');
  });
  ui.Continue.addEventListener('click',()=>{
    if(!state?.selected||state.scanning||!state.checked.some(x=>x.id===state.selected))return;
    if(window.DD651Queue.select(state.selected)===true)
      report('Continued the verified Build 651 owner selection. No status or stock change occurred.');
  });
  window.DD651Queue.subscribe(s=>{
    const newOwner=s?.owner??null;
    if(newOwner!==lastOwner){lastOwner=newOwner;ownerKey=newOwner?key(newOwner):'';
      views=newOwner?fromStorage(newOwner):[];options();
    }
    state=s;render();
  });
})();
