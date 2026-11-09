// Build 653: owner bookmarks and filter recovery.
(()=>{'use strict';
  const el=n=>document.getElementById('dd653'+n);
  if(!el('Bookmarks')||!window.DD651Queue?.subscribe||!window.DD651Queue?.select)return;
  const ui=Object.fromEntries(['Save','Saved','Remove','Clear','Trace','Continue','History',
    'Recover','Forget','Recovery','Status'].map(n=>[n,el(n)]));
  const filter=document.getElementById('dd651Filter'),history=document.getElementById('dd651History');
  if(!filter||!history)return;
  const filters=new Set(['all','attention','due','aging','unreviewed','recent']);
  let state=null,owner=null,bookmarks=[],remembered=null;
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
    renderRecovery();
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
  window.DD651Queue.subscribe(next=>{
    if(next?.owner!==owner){owner=next?.owner??null;bookmarks=[];
      remembered=owner?recall(owner):null;
    }else if(next&&state&&next.version!==state.version){bookmarks=[];}
    state=next;render();
  });
})();
