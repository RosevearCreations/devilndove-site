/* Build 656: explicit owner-only evidence review. No background source reads,
   cross-app events, provider calls, or silent save retries. */
(()=>{'use strict';
const $=id=>document.getElementById(id),API='/api/admin/module-acceptance-656';
if(!$('dd656Form'))return;
let version=null,requirements=[],requestKey=null,busy=false,uncertain=false;
const status=(message,kind='')=>{const el=$('dd656Status');el.textContent=message;el.className=kind;};
function add(parent,tag,words){const el=document.createElement(tag);el.textContent=words;parent.appendChild(el);return el;}
function resetReceipt(){requestKey=null;uncertain=false;$('dd656CheckReceipt').disabled=true;}
async function call(url,options){const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
  const data=await response.json().catch(()=>({ok:false,error:'Private server response was not readable.'}));
  if(!response.ok||data.ok!==true)throw Object.assign(new Error(data.error||'Private source request failed.'),{code:data.code||'',status:response.status});
  return data;}
function show(data){
  version=data.version;requirements=Array.isArray(data.requirements)?data.requirements:[];
  const picker=$('dd656Requirement'),selected=picker.value;picker.replaceChildren();
  add(picker,'option','Select a source-owned requirement').value='';
  for(const req of requirements){const option=add(picker,'option',req.id+' — '+req.label);option.value=req.id;}
  if(requirements.some(r=>r.id===selected))picker.value=selected;
  $('dd656Save').disabled=false;
  const s=data.summary||{};
  $('dd656Summary').textContent=(s.owner_accepted??0)+' of '+(s.total_checkpoints??0)+
    ' proposed checkpoints have this owner’s latest local accepted review. Independently verified Master Shell completion: UNKNOWN / HOLD. No module percentage is certified.';
  const modules=$('dd656Modules');modules.replaceChildren();
  for(const group of s.modules||[]){add(modules,'li',group.module+': '+group.owner_attested+'/'+
    group.checkpoints+' locally accepted; '+group.held+' HOLD; '+group.rejected+' rejected; '+
    group.unreviewed+' unreviewed. Certified completion: UNKNOWN.');}
  const history=$('dd656History');history.replaceChildren();
  for(const rec of (data.receipts||[]).slice(0,60))add(history,'li',rec.requirement_id+
    ' — '+rec.decision.toUpperCase()+' — '+rec.recorded_at+' — '+
    (rec.evidence_reference||'No evidence reference')+' — '+rec.review_note);
}
$('dd656Load').addEventListener('click',async()=>{
  if(busy)return;busy=true;$('dd656Load').disabled=true;status('Reading this authenticated owner’s private evidence…');
  try{const data=await call(API);show(data);resetReceipt();status('Source reviews loaded. Local owner attestations are not independent completion proof.','success');}
  catch(e){version=null;requirements=[];$('dd656Save').disabled=true;
    $('dd656Requirement').replaceChildren();$('dd656Modules').replaceChildren();$('dd656History').replaceChildren();
    $('dd656Summary').textContent='Unable to verify current private owner records; completion remains UNKNOWN / HOLD.';
    status(e.message+' No stale owner state will be reused.','error');}
  finally{busy=false;$('dd656Load').disabled=false;}
});
$('dd656Form').addEventListener('input',()=>{
  if(!busy&&requestKey){uncertain=true;$('dd656Save').disabled=true;
    status('An original review may have reached storage. Check its request key and explicitly reload before making a changed submission.','hold');}
});
$('dd656Form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||uncertain||version===null||$('dd656Confirm').checked!==true)return;
  const req=requirements.find(r=>r.id===$('dd656Requirement').value);
  if(!req){status('Choose an actual source requirement.','error');return;}
  const observed=$('dd656Observed').value;
  let when='';if(observed){const parsed=new Date(observed);if(Number.isNaN(parsed.getTime())){status('Enter a real observation date/time.','error');return;}when=parsed.toISOString();}
  const body={action:'record_review',requirement_id:req.id,decision:$('dd656Decision').value,
    observed_at:when,device_description:$('dd656Device').value,
    evidence_reference:$('dd656Evidence').value.trim(),review_note:$('dd656Note').value.trim(),
    personally_observed:$('dd656Personal').checked,owner_confirmation:$('dd656Confirm').checked,
    expected_version:version,request_key:requestKey||crypto.randomUUID()};
  requestKey=body.request_key;busy=true;$('dd656Save').disabled=true;$('dd656Load').disabled=true;
  $('dd656CheckReceipt').disabled=false;status('Recording this exact owner review once…');
  try{const data=await call(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    status(data.warning||'Private owner review saved. No independent verification, Master Shell publication or original module write occurred.','success');
    $('dd656Note').value='';$('dd656Confirm').checked=false;$('dd656Personal').checked=false;resetReceipt();
    version=null;requirements=[];$('dd656Save').disabled=true;
    // Explicit reload is required to obtain the new source version; no background read.
  }catch(e){uncertain=true;status(e.message+' Check the original receipt key before any new attempt.','error');}
  finally{busy=false;$('dd656Load').disabled=false;$('dd656Save').disabled=uncertain||version===null;}
});
$('dd656CheckReceipt').addEventListener('click',async()=>{
  if(!requestKey||busy)return;busy=true;$('dd656CheckReceipt').disabled=true;
  try{const result=await call(API+'?request_key='+encodeURIComponent(requestKey));
    status(result.found?'Original receipt exists: '+result.receipt.receipt_id+'. Load the latest owner history to continue.':
      'No committed receipt was found for that key. Review source status before retrying the exact unchanged request.','hold');
  }catch(e){status(e.message+' Receipt state remains unknown.','error');}
  finally{busy=false;$('dd656CheckReceipt').disabled=!requestKey;}
});
})();
