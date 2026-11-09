// Build 653: owner bookmarks and filter recovery.
(()=>{'use strict';
  const el=n=>document.getElementById('dd653'+n);
  if(!el('Bookmarks')||!window.DD651Queue?.subscribe||!window.DD651Queue?.select)return;
  const ui=Object.fromEntries(['Save','Saved','Remove','Clear','Trace','Continue','History',
    'Recover','Forget','Recovery','Status'].map(n=>[n,el(n)]));
  const compare=Object.fromEntries(['Comparison','Freshness','Prepare','Copy','Preview','History']
    .map(n=>[n,document.getElementById('dd654'+n)]));
  const filter=document.getElementById('dd651Filter'),history=document.getElementById('dd651History');
  if(!filter||!history)return;
  const filters=new Set(['all','attention','due','aging','unreviewed','recent']);
  let state=null,owner=null,bookmarks=[],remembered=null,prepared='';
  const key=id=>`dnd653.owner-filter-recovery.v1.${id}`;
  const status=s=>{ui.Status.textContent=s;};
  const selected=()=>state?.checked.find(x=>x.id===state.selected)||null;
  function verified(mark){
    if(!mark||!state||state.owner!==owner||state.version!==mark.version||state.scanning)return null;
    const row=state.checked.find(x=>x.id===mark.id);
    return row&&row.timeline===mark.timeline&&row.reviewCount===mark.reviewCount&&
      row.latest===mark.latest&&row.status===mark.status&&row.due===mark.due?row:null;
  }
  function recall(id){
    try{const raw=window.sessionStorage?.getItem(key(id)),doc=raw?JSON.parse(raw):null;
      return doc?.version===1&&filters.has(doc.filter)?doc.filter:null;
    }catch{return null;}
  }
  function remember(value){
    if(!state||!owner||!filters.has(value))return;
    remembered=value;
    try{window.sessionStorage?.setItem(key(owner),JSON.stringify({version:1,filter:value}));}catch{}
    renderRecovery();
  }
  function renderRecovery(){
    const available=!!state&&!state.scanning&&filters.has(remembered);
    ui.Recover.disabled=!available||filter.value===remembered;
    ui.Forget.disabled=!available;
    ui.Recovery.textContent=!state?'No verified owner filter source.':
      !remembered?'No prior filter preference remembered for this owner.':
      `Previous owner filter: ${remembered}. Recover explicitly; no private plans or decisions are loaded.`;
  }
  function render(){
    const current=selected();ui.Save.disabled=!current||state.scanning||
      (!bookmarks.some(b=>b.id===current.id)&&bookmarks.length>=5);
    const keep=ui.Saved.value;
    ui.Saved.innerHTML='';
    const first=document.createElement('option');first.value='';first.textContent='Choose a bookmark';
    ui.Saved.appendChild(first);
    for(const [i,b] of bookmarks.entries()){
      const row=verified(b),opt=document.createElement('option');opt.value=b.id;
      opt.textContent=row?`${row.title} — source checked`:`Bookmark ${i+1} — recheck needed`;
      ui.Saved.appendChild(opt);
    }
    ui.Saved.value=bookmarks.some(b=>b.id===keep)?keep:'';
    ui.Saved.disabled=!state||!bookmarks.length;
    const mark=bookmarks.find(b=>b.id===ui.Saved.value),row=verified(mark);
    ui.Remove.disabled=!mark||!state;ui.Clear.disabled=!bookmarks.length||!state;
    ui.Continue.disabled=!row;ui.History.disabled=!row;
    ui.Trace.textContent=!state?'HOLD — owner source unavailable; page-only bookmarks were cleared.':
      !mark?'Choose a page-only bookmark to examine its source trace.':
      !row?'HOLD — source not currently verified or the decision changed. Manually rescan the queue and bookmark the checked plan again.':
      `${row.title} · saved plan v${state.version} · dated-decision timeline v${row.timeline} · `+
      `${row.reviewCount} recorded decision(s) · latest ${row.latest||'none'} `+
      `at ${row.at||'no recorded review'} · checked ${new Date(row.checkedAt).toISOString()}. `+
      'This is a dated planning pointer, not a signed audit receipt, current stock proof or completed job.';
    renderRecovery();renderComparison();
  }
  ui.Save.addEventListener('click',()=>{
    const r=selected();if(!r||state.scanning)return;
    const mark={id:r.id,version:state.version,timeline:r.timeline,
      reviewCount:r.reviewCount,latest:r.latest,status:r.status,due:r.due};
    const index=bookmarks.findIndex(b=>b.id===r.id);
    if(index<0&&bookmarks.length>=5){status('Five page-only bookmarks already exist. Remove one first.');return;}
    if(index<0)bookmarks.push(mark);else bookmarks[index]=mark;
    render();ui.Saved.value=r.id;render();
    status('Bookmarked this deliberately checked owner plan in page memory only. Nothing was saved to browser storage or the server.');
  });
  ui.Saved.addEventListener('change',()=>{render();});
  ui.Remove.addEventListener('click',()=>{
    const id=ui.Saved.value;if(!id)return;
    bookmarks=bookmarks.filter(b=>b.id!==id);render();status('Removed page-only bookmark.');
  });
  ui.Clear.addEventListener('click',()=>{bookmarks=[];render();status('Cleared all private page-only bookmarks.');});
  function open(){
    const row=verified(bookmarks.find(b=>b.id===ui.Saved.value));
    if(!row||window.DD651Queue.select(row.id)!==true){
      status('HOLD — bookmarked source changed; manually rescan and bookmark again.');return false;
    }
    return true;
  }
  ui.Continue.addEventListener('click',()=>{
    if(open())status('Verified owner plan selected in Build 651. No private history read or change occurred.');
  });
  ui.History.addEventListener('click',()=>{
    if(!open())return;
    history.click();
    status('Selected verified owner plan in the original history workflow when available. Click Load saved decision history there for a fresh authenticated read; no automatic request occurred.');
  });
  filter.addEventListener('change',()=>remember(filter.value));
  ui.Recover.addEventListener('click',()=>{
    if(!state||state.scanning||!filters.has(remembered))return;
    filter.value=remembered;filter.dispatchEvent(new Event('change',{bubbles:true}));
    status('Recovered the previous owner filter only. Explicit manual queue scans are still required.');
  });
  ui.Forget.addEventListener('click',()=>{
    if(!state)return;
    try{window.sessionStorage?.removeItem(key(owner));}catch{}
    remembered=null;renderRecovery();status('Forgot the previous filter preference for this owner.');
  });
  function evidence(mark,row){
    return `plan v${mark.version}, timeline v${row?row.timeline:mark.timeline}, `+
      `${row?row.reviewCount:mark.reviewCount} reviews, ${row?row.latest:mark.latest||'none'}, `+
      `${row?row.status:mark.status}, due ${row?row.due:mark.due||'undated'}`;
  }
  function comparison(){
    const mark=bookmarks.find(b=>b.id===ui.Saved.value);
    if(!mark||!state)return {mark:null,row:null,reasons:['Select a verified bookmark.']};
    const row=state.checked.find(r=>r.id===mark.id),reasons=[];
    if(!row)reasons.push('Plan not in current scan.');
    if(state.version!==mark.version)reasons.push('Plan revision changed.');
    if(row&&row.timeline!==mark.timeline)reasons.push('Decision timeline changed.');
    if(row&&row.reviewCount!==mark.reviewCount)reasons.push('Review count changed.');
    if(row&&row.latest!==mark.latest)reasons.push('Latest outcome changed.');
    if(row&&(row.status!==mark.status||row.due!==mark.due))reasons.push('Status/date changed.');
    if(state.scanning)reasons.push('Scan in progress.');
    if(row&&(row.checkedAt>Date.now()+300000||Date.now()-row.checkedAt>7*86400000))
      reasons.push('Checked source older than seven days or future-dated.');
    return {mark,row,reasons};
  }
  function renderComparison(){
    if(!compare.Comparison)return;
    const {mark,row,reasons}=comparison();
    compare.Comparison.textContent=!mark||!row?'No current source comparison.':
      `Bookmark: ${evidence(mark,null)}. Checked: ${evidence(mark,row)}, ${new Date(row.checkedAt).toISOString()}.`;
    compare.Freshness.textContent=reasons.length?`HOLD — ${reasons.join(' ')} Rescan and rebookmark changed facts.`:
      'MATCH — dated planning evidence only; not physical proof or a signed receipt.';
    const valid=!!mark&&!!row&&!reasons.length;
    compare.Prepare.disabled=!valid;compare.History.disabled=!valid;
    if(prepared){prepared='';compare.Preview.value='';}
    compare.Copy.disabled=true;
  }
  if(compare.Comparison){
    compare.Prepare.addEventListener('click',()=>{
      const {mark,row,reasons}=comparison();if(!mark||!row||reasons.length)return;
      prepared=['DEVIL N DOVE — UNSIGNED MANUAL OWNER REVIEW HANDOFF',
        `Shell: devilndove | Plan: ${row.title} | ID: ${row.id}`,
        `Bookmark: ${evidence(mark,null)}`,
        `Checked source: ${evidence(mark,row)}`,
        `Checked at: ${new Date(row.checkedAt).toISOString()}`,
        'Next: open original history; explicitly Load latest decisions.',
        'Unsigned planning only; no stock, message, purchase or status Save.'
      ].join('\n');
      compare.Preview.value=prepared;compare.Copy.disabled=false;
      compare.Freshness.textContent='Unsigned handoff prepared locally. Review before copying.';
    });
    compare.Copy.addEventListener('click',async()=>{
      if(!prepared||compare.Preview.value!==prepared||comparison().reasons.length)return;
      try{await window.navigator.clipboard.writeText(prepared);
        if(compare.Preview.value===prepared)compare.Freshness.textContent='Copied unsigned handoff. Original history and Save remain separate.';
      }catch{compare.Freshness.textContent='Clipboard blocked. Nothing sent or saved.';}
    });
    compare.History.addEventListener('click',()=>{
      if(comparison().reasons.length)return;
      ui.History.click();
      compare.Freshness.textContent='Click Load in history for a fresh GET.';
    });
  }
  window.DD651Queue.subscribe(next=>{
    if(next?.owner!==owner){owner=next?.owner??null;bookmarks=[];
      remembered=owner?recall(owner):null;
    }else if(next&&state&&next.version!==state.version){bookmarks=[];
    }
    state=next;render();
  });
})();
