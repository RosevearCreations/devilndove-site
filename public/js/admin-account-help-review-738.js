// Build 738: manual, verified-Admin-only, non-sending staff intake review.
(()=>{'use strict';
const $=id=>document.getElementById(id),list=$('dd738List'),detail=$('dd738Detail'),
 status=$('dd738Status'),refresh=$('dd738Refresh'),counts=$('dd738Counts'),
 reason=$('dd738Reason'),confirm=$('dd738Confirm'),review=$('dd738MarkReviewed'),
 close=$('dd738Close'),message=$('dd738Message');
if(!list||!window.DDAuth?.apiFetch)return;
const api='/api/admin/account-help-review-738';
let selected=null;
function state(text){message.textContent=text;}
function controls(){
 review.disabled=!selected||selected.status!=='open'||!confirm.checked;
 close.disabled=!selected||selected.status!=='reviewed'||!confirm.checked;
}
function addRow(row){
 const button=document.createElement('button');
 button.type='button';button.className='btn';button.style.textAlign='left';
 button.textContent='#'+row.id+' · '+row.type+' · '+row.contact_masked+' · '+row.created_at;
 button.addEventListener('click',()=>loadCase(row.id));
 list.appendChild(button);
}
async function request(url,init){
 const res=await window.DDAuth.apiFetch(url,{cache:'no-store',...init});
 const data=await res.json().catch(()=>null);
 if(!res.ok||!data?.ok)throw Error(data?.code||'Private queue unavailable');
 return data;
}
async function loadQueue(){
 refresh.disabled=true;list.replaceChildren();selected=null;detail.textContent='Select a case above.';
 controls();state('Loading original staff cases…');
 try{
  const data=await request(api+'?status='+encodeURIComponent(status.value)+'&limit=20');
  counts.textContent='Recorded queue totals: '+Object.entries(data.counts||{})
   .map(([k,v])=>k+' '+v).join(' · ');
  (data.cases||[]).forEach(addRow);
  if(!data.cases?.length)list.textContent='No cases in this status.';
  state('Private queue loaded. No account identities were matched or emails sent.');
 }catch(e){state('HOLD — '+e.message);}
 finally{refresh.disabled=false;}
}
async function loadCase(id){
 state('Reading selected private case…');
 try{
  const data=await request(api+'?id='+encodeURIComponent(id));
  selected=data.case;confirm.checked=false;
  detail.textContent=['Case #'+selected.id,'Type: '+selected.type,
   'Submitted contact: '+selected.contact_email,
   'Possible registered email (unverified): '+selected.possible_email,
   'Display name (unverified): '+selected.display_name,
   'Submitted note: '+selected.note,'Status: '+selected.status,
   'Submitted: '+selected.created_at,'Updated: '+selected.updated_at].join('\n');
  controls();state('Case loaded. An account match or identity verification is NOT established.');
 }catch(e){selected=null;controls();state('HOLD — '+e.message);}
}
async function decide(action){
 if(!selected||!confirm.checked||!window.confirm('Record staff triage only? No account identity will be verified and no email will be sent.'))return;
 const code=reason.value.trim().toUpperCase();
 if(!/^[A-Z][A-Z0-9_]{3,39}$/.test(code)){state('Enter a 4–40 character non-personal reason code.');return;}
 review.disabled=close.disabled=true;
 try{
  await request(api,{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({action,case_id:selected.id,reason_code:code,
    owner_review_confirmed:true})});
  state('Original staff review and audit recorded; identity remains unverified.');
  await loadQueue();
 }catch(e){state('HOLD — '+e.message);controls();}
}
refresh.addEventListener('click',loadQueue);
status.addEventListener('change',loadQueue);
confirm.addEventListener('change',controls);
review.addEventListener('click',()=>decide('mark_reviewed'));
close.addEventListener('click',()=>decide('close_request'));
loadQueue();
})();