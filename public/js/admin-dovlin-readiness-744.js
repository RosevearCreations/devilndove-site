// Build 744: private owner-attested source and physical-material evidence only.
// User-initiated POST; no inventory, Product, accounting, provider or public API actions.
(() => {
 'use strict';
 const API='/api/admin/dovlin-readiness-744';
 const $=id=>document.getElementById(id);
 const list=$('conceptId'),find=$('findConcept'),form=$('reviewForm');
 const status=$('listStatus'),saveStatus=$('saveStatus'),rows=$('bomRows');
 const fields={
  art_decision:'artDecision',original_png_ref:'originalPng',art_comparison_ref:'artComparison',
  geometry_note:'geometryNote',sample_observed:'sampleObserved',sample_ref:'sampleRef',
  height_mm:'heightMm',width_mm:'widthMm',depth_mm:'depthMm',
  bom_revision:'bomRevision',waste_percent:'wastePercent',labour_minutes:'labourMinutes',
  labour_rate_cents:'labourRate',safety_state:'safetyState',safety_evidence_ref:'safetyRef',
  age_basis:'ageBasis',care_note:'careNote',decision:'reviewDecision',
  note:'reviewNote',independent_review_ref:'independentRef'
 };
 let items=[],active=null,busy=false,pendingKey=null;
 const text=(node,value)=>{node.textContent=String(value??'');};
 const label=(node,value)=>text($(node),value);
 const cash=c=>typeof c==='number'&&Number.isFinite(c)?new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(c/100):'Not verified';
 const mk=(tag,cls,value)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(value!==undefined)el.textContent=String(value);
  return el;
 };
 function failMessage(error){return String(error?.message||'Source unavailable. No evidence was saved.').slice(0,300);}
 async function getJSON(path){
  const res=await fetch(path,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  const data=await res.json().catch(()=>({ok:false,error:'Unexpected server response'}));
  if(!res.ok||!data.ok)throw new Error(data.error||('HTTP '+res.status));
  return data;
 }
 async function postJSON(path,payload){
  const res=await fetch(path,{method:'POST',credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({ok:false,error:'Unexpected server response'}));
  if(!res.ok||!data.ok){
   const hold=Array.isArray(data.holds)?' '+data.holds.join('; '):'';
   const err=new Error((data.error||('HTTP '+res.status))+hold);
   err.status=res.status;err.code=data.code;
   throw err;
  }
  return data;
 }
 function filtered(){
  const q=find.value.trim().toLocaleLowerCase('en-CA');
  return items.filter(r=>[r.id,r.name,r.category,r.kind].join(' ').toLocaleLowerCase('en-CA').includes(q));
 }
 function drawList(){
  const original=list.value;
  list.replaceChildren();
  const select=mk('option','','Choose an original Dovlin item');
  select.value='';list.append(select);
  const counts={plush:0,workshop:0,colour:0,reviewed:0,ready:0};
  for(const r of items){
   if(r.kind==='plush_concept')counts.plush++;
   else if(r.kind==='workshop_concept')counts.workshop++;
   else if(r.kind==='colour_study')counts.colour++;
   if(r.version>0)counts.reviewed++;
   if(r.readiness?.stage==='OWNER_PACKET_READY_FOR_INDEPENDENT_REVIEW')counts.ready++;
  }
  const container=$('collectionCounts');container.replaceChildren();
  for(const [title,count] of [['Planned plush',counts.plush],['Workshop ideas',counts.workshop],['Colour studies',counts.colour],['Reviewed',counts.reviewed],['Ready for external review',counts.ready]]){
   container.append(mk('span','',title+': '+count));
  }
  for(const item of filtered()){
   const option=mk('option','',item.name+' — '+item.kind.replace(/_/g,' ')+(item.provisional_art_match?' (provisional art)':''));
   option.value=item.id;list.append(option);
  }
  if([...list.options].some(x=>x.value===original))list.value=original;
  text(status,items.length+' original concepts loaded. Private owner review; no sellable stock.');
 }
 function addComponent(c={}){
  if(rows.children.length>=16){text(saveStatus,'Limit: 16 component lines.');return;}
  const tr=mk('tr');
  const descriptors=[
   ['component','Component','Text',90],['material','Material','Text',130],
   ['supplier','Supplier','Text',120],['lot','Lot','Text',110],
   ['unit','Unit','Text',32],['quantity','Qty','number',undefined],
   ['unit_cost_cad','Unit CAD','number',undefined],['evidence_ref','Evidence reference','Text',220]
  ];
  // Visible table has six columns; combine related fields without hidden source facts.
  const cell=(children)=>{
   const td=mk('td');
   for(const el of children)td.append(el);
   tr.append(td);
  };
  const controls={};
  for(const [name,placeholder,type,max] of descriptors){
   const inp=mk('input');
   inp.type=type.toLowerCase()==='number'?'number':'text';
   inp.placeholder=placeholder;
   inp.setAttribute('aria-label',placeholder);
   inp.dataset.field=name;
   if(max)inp.maxLength=max;
   if(inp.type==='number'){inp.min='0';inp.step=name==='quantity'?'0.001':'0.01';}
   const value=name==='unit_cost_cad'?
    (Number.isInteger(c.unit_cost_cents)?(c.unit_cost_cents/100).toFixed(2):''):
    (c[name]??'');
   inp.value=String(value);
   controls[name]=inp;
  }
  cell([controls.component,controls.material]);
  cell([controls.supplier,controls.lot]);
  cell([controls.unit,controls.quantity]);
  cell([controls.unit_cost_cad]);
  cell([controls.evidence_ref]);
  const remove=mk('button','','Remove');remove.type='button';
  remove.setAttribute('aria-label','Remove this material component');
  remove.addEventListener('click',()=>tr.remove());
  cell([remove]);rows.append(tr);
 }
 function fill(e={}){
  form.reset();rows.replaceChildren();
  for(const [field,id] of Object.entries(fields)){
   const el=$(id);
   if(!el)continue;
   let value=e[field];
   if(field==='labour_rate_cents'){
    value=Number.isInteger(value)?(value/100).toFixed(2):'0';
   }
   if(el.type==='checkbox')el.checked=value===true;
   else if(el.tagName==='SELECT')el.value=value||el.options[0].value;
   else el.value=value??(['waste_percent','labour_minutes'].includes(field)?'0':'');
  }
  if(Array.isArray(e.components))for(const c of e.components)addComponent(c);
 }
 function renderHistory(){
  const history=$('receiptHistory');history.replaceChildren();
  const receipts=active?.history||[];
  if(!receipts.length){label('historyStatus','No evidence receipts recorded.');return;}
  label('historyStatus',receipts.length+' most recent private evidence receipts; the current source revision is retained.');
  for(const rec of receipts){
   const li=mk('li');
   li.append(mk('strong','',rec.stage||'HOLD'));
   li.append(mk('span','',' · '+(rec.recorded_at||'Unknown date')+' · version receipt '+rec.receipt_id));
   const holds=mk('p','muted',Array.isArray(rec.holds)&&rec.holds.length?rec.holds.join(' · '):'Awaiting independent reviewer');
   li.append(holds);history.append(li);
  }
 }
 function renderActive(){
  if(!active)return;
  const {readiness}=active;
  $('activeWorkspace').hidden=false;
  $('artImage').src='/dovlin/'+active.art;
  $('artImage').alt=active.name+' — concept artwork, not a finished product';
  label('artTitle',active.name);
  label('sourceKind',active.kind.replace(/_/g,' ')+' · '+active.category);
  label('originalFilename',active.original_filename||'Original source name not available');
  label('originalSha',active.source_sha);
  label('provisionalNote',active.provisional_art_match?
   'PROVISIONAL artwork association: original approved character match not verified. Independent review required.':
   'Source fingerprint recorded; character geometry has not been independently approved.');
  label('readinessStage',readiness?.stage||'HOLD');
  label('readinessHolds',readiness?.holds?.length?readiness.holds.join(' · '):
   'Owner evidence is ready for a separate independent review; no sale authorized.');
  label('currentVersion','Private review version '+active.version);
  label('planningCost','Estimated per-concept planning cost: '+cash(readiness?.planning_cost_cents)+' (not a financial posting)');
  fill(active.current?.evidence||{});
  renderHistory();
  label('saveStatus','No changes submitted.');
 }
 async function openSelected(){
  const id=list.value;
  if(!id){$('activeWorkspace').hidden=true;active=null;return;}
  $('activeWorkspace').hidden=true;active=null;
  text(status,'Loading private original evidence…');
  try{
   const d=await getJSON(API+'?id='+encodeURIComponent(id));
   active=d.record;pendingKey=null;
   renderActive();text(status,'Ready to review '+active.name+'. Only physical and documented observations may be saved.');
  }catch(e){text(status,failMessage(e));}
 }
 const str=id=>$(id).value.trim();
 const number=id=>str(id)===''?null:Number(str(id));
 function collect(){
  const components=[...rows.children].map(row=>{
   const field=name=>row.querySelector('[data-field="'+name+'"]')?.value.trim()||'';
   const cost=field('unit_cost_cad');
   return {component:field('component'),material:field('material'),supplier:field('supplier'),
    lot:field('lot'),unit:field('unit'),quantity:Number(field('quantity')||0),
    unit_cost_cents:cost===''?-1:Math.round(Number(cost)*100),
    evidence_ref:field('evidence_ref')};
  });
  return {art_decision:str('artDecision'),art_git_sha:active.source_sha,
   original_png_ref:str('originalPng'),art_comparison_ref:str('artComparison'),
   geometry_note:str('geometryNote'),
   sample_observed:$('sampleObserved').checked,sample_ref:str('sampleRef'),
   height_mm:number('heightMm'),width_mm:number('widthMm'),depth_mm:number('depthMm'),
   bom_revision:str('bomRevision'),components,
   waste_percent:number('wastePercent')??0,
   labour_minutes:number('labourMinutes')??0,
   labour_rate_cents:Math.round(Number(str('labourRate')||0)*100),
   safety_state:str('safetyState'),safety_evidence_ref:str('safetyRef'),
   age_basis:str('ageBasis'),care_note:str('careNote'),
   decision:str('reviewDecision'),note:str('reviewNote'),
   independent_review_ref:str('independentRef')};
 }
 function setBusy(value){busy=value;$('saveReview').disabled=value;$('reloadReview').disabled=value;
  $('addMaterial').disabled=value;list.disabled=value;find.disabled=value;}
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!active||busy)return;
  const id=active.id;const key=pendingKey||crypto.randomUUID();
  pendingKey=key;setBusy(true);
  text(saveStatus,'Saving one private review. No product or inventory action will occur.');
  try{
   const data=await postJSON(API,{id,expected_version:active.version,expected_source_sha:active.source_sha,
    request_key:key,evidence:collect()});
   pendingKey=null;
   text(saveStatus,data.replayed?'Existing matching evidence receipt confirmed.':
    'Private evidence saved (version '+data.version+'). This does not publish a product.');
   const source=await getJSON(API+'?id='+encodeURIComponent(id));
   active=source.record;
   renderActive();
   text(saveStatus,data.replayed?'Matching existing receipt confirmed.':
    'Saved version '+data.version+' · '+data.readiness.stage+'. No stock or Product was changed.');
   const summary=items.find(x=>x.id===id);
   if(summary){summary.version=data.version;summary.readiness=data.readiness;}
   drawList();list.value=id;
  }catch(error){
   text(saveStatus,'Review not confirmed: '+failMessage(error)+
    (error.status===409?' Reload latest review before submitting again.':' Check the original request before retrying.'));
   if(error.status===409)pendingKey=null;
  }finally{setBusy(false);}
 });
 $('addMaterial').addEventListener('click',()=>addComponent());
 $('reloadReview').addEventListener('click',()=>{pendingKey=null;openSelected()});
 find.addEventListener('input',drawList);
 list.addEventListener('change',openSelected);
 getJSON(API).then(data=>{items=data.records||[];drawList();}).catch(e=>{
  list.replaceChildren();text(status,failMessage(e)+' Sign in with an active Creator Admin session on the main site.');
 });
})();