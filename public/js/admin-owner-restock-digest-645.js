// Release 467 Build 645 — deliberate, browser-only private owner handoff.
// Consumes only Build 644's owner-verified, manually fetched review snapshot.
(() => {
  'use strict';
  const $=id=>document.getElementById(id),root=$('dd645Handoff');
  if(!root||!window.DD641OwnerPlans?.subscribe)return;
  const choices=$('dd645Choices'),status=$('dd645Status'),include=$('dd645IncludeNotes'),
    prepare=$('dd645Prepare'),copy=$('dd645Copy'),download=$('dd645Download'),
    clear=$('dd645Clear'),preview=$('dd645Preview'),planSelect=$('dd643Plan');
  const labels={needs_physical_count:'Physical count needed',needs_supplier_review:'Supplier review needed',
    needs_workshop_review:'Workshop review needed',follow_up_scheduled:'Owner follow-up scheduled',
    no_change_recommended:'No stock change recommended',separate_action_recommended:'Separate controlled action recommended'};
  const uuid=/^[0-9a-f-]{36}$/;
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const line=value=>String(value??'').replace(/[\u0000-\u001f\u007f]+/g,' ').trim();
  let owner=null,planVersion=0,plans=[],snapshot=null,signature='',selected=new Set(),prepared='';
  const say=message=>{status.textContent=message;};
  const enabled=()=>!!snapshot&&selected.size>0;
  const sync=()=>{prepare.disabled=!enabled();copy.disabled=!prepared;download.disabled=!prepared;
    include.disabled=!snapshot;clear.disabled=!snapshot&&!prepared;};
  const clearPreview=()=>{prepared='';preview.value='';sync();};
  function invalidate(){snapshot=null;signature='';selected.clear();include.checked=false;clearPreview();
    choices.textContent='No verified review entries available. Search saved reviews above.';
    say('The owner search or saved plan changed. Prepare a new digest after another explicit search.');sync();}
  function render(){
    if(!snapshot){invalidate();return;}
    choices.innerHTML=snapshot.events.length?snapshot.events.map(event=>`<label class="dd640-plan small">
      <input type="checkbox" data-dd645-event-id="${esc(event.event_id)}" ${selected.has(event.event_id)?'checked':''}>
      <strong>${esc(labels[event.outcome])}</strong> · ${esc(event.recorded_at)}
      <span class="small"> — ${esc(line(event.note).slice(0,65))}${event.note.length>65?'…':''}</span>
    </label>`).join(''):'<p class="small">No matching reviews. Clear filters or search another saved plan.</p>';
    say(`${selected.size} selected from ${snapshot.events.length} explicitly loaded match(es) (${snapshot.matched_total} total). `+
      (snapshot.complete?'All matching pages are loaded.':'Load next matching 10 above to select older reviews.')+
      ' A prepared digest is an advisory snapshot, not current stock evidence.');sync();
  }
  function receive(data){
    const events=data?.events;
    if(data?.ready!==true||data.private!==true||data.read_only!==true||
      data.owner_user_id!==owner||data.plan_version!==planVersion||
      !plans.some(p=>p.plan_id===data.plan_id)||planSelect?.value!==data.plan_id||
      !Number.isSafeInteger(data.timeline_version)||data.timeline_version<0||
      !Number.isSafeInteger(data.matched_total)||data.matched_total<0||data.matched_total>50||
      !Array.isArray(events)||events.length>50||events.length>data.matched_total||
      !events.every(e=>uuid.test(e?.event_id||'')&&typeof e.note==='string'&&
        e.note.length<=300&&typeof e.recorded_at==='string'&&Object.hasOwn(labels,e.outcome))||
      new Set(events.map(e=>e.event_id)).size!==events.length||
      data.summary?.advisory_only!==true||data.summary.inventory_mutation!==false||
      !Number.isSafeInteger(data.summary.review_count)||data.summary.review_count>50||
      !Object.keys(labels).every(k=>Number.isSafeInteger(data.summary.outcome_counts?.[k])&&
        data.summary.outcome_counts[k]>=0)){
      invalidate();return;
    }
    const nextSignature=JSON.stringify([data.owner_user_id,data.plan_id,data.plan_version,
      data.timeline_version,data.search?.q,data.search?.outcome]);
    if(signature!==nextSignature)selected.clear();
    signature=nextSignature;
    snapshot={...data,events:events.map(e=>({...e})),summary:{...data.summary}};
    selected=new Set([...selected].filter(id=>snapshot.events.some(e=>e.event_id===id)));
    clearPreview();render();
  }
  function receivePlans(data){
    if(data?.loaded!==true||!Number.isSafeInteger(data.owner_user_id)||
      !Number.isSafeInteger(data.version)||!Array.isArray(data.plans)){
      owner=null;planVersion=0;plans=[];invalidate();return;
    }
    const changed=owner!==data.owner_user_id||planVersion!==data.version;
    owner=data.owner_user_id;planVersion=data.version;
    plans=data.plans.filter(p=>typeof p?.plan_id==='string').map(p=>({plan_id:p.plan_id,title:String(p.title||'Untitled')}));
    if(changed)invalidate();
  }
  function compose(){
    const selectedEvents=snapshot.events.filter(e=>selected.has(e.event_id));
    const plan=plans.find(p=>p.plan_id===snapshot.plan_id);
    const counts=Object.entries(labels).map(([k,label])=>`${label}: ${snapshot.summary.outcome_counts[k]}`);
    const rows=selectedEvents.map((e,i)=>[`${i+1}. ${labels[e.outcome]}`,
      `Recorded: ${line(e.recorded_at)} | Saved plan version: ${Number(e.plan_version)||'unknown'}`,
      `At review: ${line(e.status_at_review||'unknown')} | Follow-up: ${line(e.follow_up_on_at_review||'none')}`,
      ...(include.checked?[`Private review note: ${line(e.note)}`]:['Private note withheld (opt in above to include it).'])].join('\n'));
    return ['DEVIL N DOVE — PRIVATE OWNER RESTOCK REVIEW HANDOFF',
      `Prepared: ${new Date().toISOString()}`,
      `Saved plan: ${line(plan?.title||'Untitled')} | Plan ID: ${snapshot.plan_id}`,
      `Verified review search: ${line(snapshot.verified_at)} | Plan version: ${snapshot.plan_version} | Timeline version: ${snapshot.timeline_version}`,
      `Search: ${line(snapshot.search?.q||'(all notes)')} | Outcome: ${labels[snapshot.search?.outcome]||'All'}`,
      `Selected: ${selectedEvents.length} | Loaded matches: ${snapshot.events.length} / ${snapshot.matched_total}`,
      `Saved plan status: ${line(snapshot.summary.plan_status||'unknown')} | Follow-up: ${line(snapshot.summary.plan_follow_up_on||'none')}`,
      `All dated reviews for plan: ${snapshot.summary.review_count}`,'Outcome counts from full bounded timeline:',...counts,
      'SELECTED DATED REVIEWS',...rows,
      'ADVISORY ONLY: This export is a dated private snapshot. No physical count, stock receipt, supplier order, commitment clearance, payment, manufacturing action, or publication is authorized. Recheck current inventory before acting.',
      'Sharing/copying/downloading is an explicit owner decision; the application does not send this document externally.'].join('\n\n');
  }
  choices.addEventListener('change',event=>{
    const input=event.target,id=input?.getAttribute?.('data-dd645-event-id');
    if(!snapshot||!uuid.test(id||'')||!snapshot.events.some(e=>e.event_id===id))return;
    input.checked?selected.add(id):selected.delete(id);clearPreview();render();
  });
  include.addEventListener('change',()=>{clearPreview();say('Note privacy choice changed. Prepare and review the digest again.');});
  prepare.addEventListener('click',()=>{
    if(!enabled())return;prepared=compose();preview.value=prepared;sync();
    say(`Prepared ${selected.size} selected owner review(s), ${include.checked?'including private notes':'without full private notes'}. Inspect before sharing.`);
  });
  copy.addEventListener('click',async()=>{
    if(!prepared)return;
    try{if(!window.navigator?.clipboard?.writeText)throw Error('Clipboard unavailable');
      await window.navigator.clipboard.writeText(prepared);
      say('Private digest copied after owner action. Choose carefully where to paste it.');
    }catch{say('Clipboard copy was blocked. Nothing was transmitted; the text remains available to select manually.');}
  });
  download.addEventListener('click',()=>{
    if(!prepared)return;
    try{const blob=new Blob([prepared],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;
      link.download=`devilndove-private-restock-review-${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
      say('Private text download requested. Protect the file before sharing it outside this owner session.');
    }catch{say('Download could not be prepared; no file or external action was confirmed.');}
  });
  clear.addEventListener('click',()=>{selected.clear();include.checked=false;clearPreview();render();});
  window.DD645RestockDigest=Object.freeze({receive,invalidate});
  window.DD641OwnerPlans.subscribe(receivePlans);sync();
})();
