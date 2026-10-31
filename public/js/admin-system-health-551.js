/* Build 551: explicit, auditable owner comparison acknowledgement and read-only incident aging. */
(()=>{'use strict';const $=id=>document.getElementById(id);if(!$('dd551SaveReview'))return;
let matched=null,busy=false,savedEvidence=[];const attempts={exact:0,changed:0,missing:0};
const el=(tag,text,klass)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=String(text);if(klass)n.className=klass;return n;};
const nice=at=>{const time=Date.parse(at);return Number.isFinite(time)?new Date(time).toLocaleString():String(at||'Unknown date');};
const status=message=>{$('dd551ReviewStatus').textContent=message;};
function invalidate(){matched=null;$('dd551OwnerCheck').checked=false;$('dd551OwnerCheck').disabled=true;$('dd551SaveReview').disabled=true;}
function summary(){const total=attempts.exact+attempts.changed+attempts.missing;$('dd551ComparisonSummary').textContent=`This browser session: ${attempts.exact} exact match(es), ${attempts.changed} changed record(s), ${attempts.missing} missing record(s) across ${total} successful lookups. An API failure is not counted as a missing receipt.`;}
function reviews(rows){const root=$('dd551ReviewList');root.replaceChildren();const list=Array.isArray(rows)?rows.slice(0,12):[];savedEvidence=list;
  if($('dd552DownloadEvidence'))$('dd552DownloadEvidence').disabled=!list.length;
  $('dd551ReviewCount').textContent=`${list.length} owner-reported comparison acknowledgement(s) retained (maximum 12 per administrator).`;
  if(!list.length){root.append(el('p','No owner comparison acknowledgement saved.'));return;}
  for(const record of list){const receipt=record.receipt||{},item=el('li'),title=el('strong',receipt.kind==='view'?`View: ${receipt.label||'Unnamed view'}`:`Route: ${receipt.path||'Unknown route'}`),date=el('span',` · Owner-reported on ${nice(record.reviewed_at)}. Not independent device proof.`),button=el('button','Load receipt for recheck','btn secondary');
    button.type='button';button.addEventListener('click',()=>{const raw=JSON.stringify(receipt);if(raw.length>512||!['view','history'].includes(receipt.kind)){status('This saved evidence cannot be loaded as a valid short receipt. No record was changed.');return;}
      $('dd549ReceiptCode').value=raw;document.dispatchEvent(new CustomEvent('dd:health-receipt-changed-551'));$('dd549ReceiptStatus').textContent='Recovered an earlier owner-reported receipt. Verify the current saved source again; the original source may have changed or been evicted.';$('dd549Heading')?.scrollIntoView({behavior:'smooth',block:'start'});
    });item.append(title,date,button);root.append(item);
  }
  $('dd549OwnerReview').textContent=`${list.length} owner-reported comparison(s) saved. These are administrator attestations, not independent second-device telemetry.`;
}
function aging(data){const root=$('dd551Aging');root.replaceChildren();if(!data||data.window_days!==30){root.append(el('p','Current incident aging summary is unavailable. No review outcome is inferred.'));return;}
  const metrics=[['Open / reviewing',data.open],['Open 24+ hours',data.open_24h],['Open 7+ days',data.open_7d],['Open with no review date',data.open_without_review]];
  for(const [label,count] of metrics){const card=el('article',undefined,'dd551-age-card');card.append(el('strong',Number(count||0)),el('span',label));root.append(card);}
  $('dd551AgingContext').textContent=`Based on ${Number(data.total||0)} recorded incidents from the last 30 days. The age groups overlap; they are not separate totals. No incident is closed or escalated by this dashboard.`;
}
document.addEventListener('dd:health-receipt-verified-551',event=>{
  const {receipt,raw,comparison}=event.detail||{};if(!comparison)return;
  if(comparison.found)attempts.exact++;else if(comparison.changed)attempts.changed++;else attempts.missing++;summary();invalidate();
  if(!comparison.found){status(comparison.changed?'Saved receipt details changed; owner acknowledgement is blocked.':'Receipt not found; owner acknowledgement is blocked.');return;}
  const strict=(receipt?.kind==='history'&&typeof receipt.status==='string'&&Number.isInteger(receipt.ms))||(receipt?.kind==='view'&&typeof receipt.label==='string'&&typeof receipt.updated_at==='string');
  if(!strict){status('Legacy receipt matched, but it lacks exact saved details. Choose a retained receipt above and verify it again before owner acknowledgement.');return;}
  if($('dd549ReceiptCode').value.trim()!==raw){status('The receipt changed during verification. Verify the currently displayed receipt again.');return;}
  matched={raw,receipt};$('dd551OwnerCheck').disabled=false;status('Exact record confirmed. Save owner evidence only if we actually compared this receipt on another signed-in device.');
});
document.addEventListener('dd:health-receipt-changed-551',()=>{invalidate();status('Receipt changed. Run Verify receipt before recording owner evidence.');});
document.addEventListener('dd:health-receipt-549',()=>{invalidate();status('A new receipt was saved. Verify it before recording owner evidence.');});
document.addEventListener('dd:system-health-reconciled-549',event=>{reviews(event.detail?.ownerReviews);aging(event.detail?.followUp);});
document.addEventListener('dd:system-health-unavailable-550',()=>{invalidate();savedEvidence=[];if($('dd552DownloadEvidence'))$('dd552DownloadEvidence').disabled=true;$('dd551ReviewCount').textContent='Saved owner review evidence is unavailable. Reload after signing in.';aging(null);});
$('dd552DownloadEvidence')?.addEventListener('click',()=>{
  if(!savedEvidence.length)return;
  const payload={exported_at:new Date().toISOString(),source:'Devil n Dove owner-scoped monitoring review history',evidence_type:'owner_reported_not_independent_device_proof',reviews:savedEvidence};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`devilndove-owner-monitoring-evidence-${new Date().toISOString().slice(0,10)}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status('Evidence download requested. The saved source records were not changed or deleted.');
});
$('dd549ReceiptCode').addEventListener('input',()=>{invalidate();status('Receipt edited. Verify the current value again.');});
$('dd551OwnerCheck').addEventListener('change',()=>{$('dd551SaveReview').disabled=!matched||!$('dd551OwnerCheck').checked||busy;});
$('dd551SaveReview').addEventListener('click',async()=>{
  if(busy||!matched||!$('dd551OwnerCheck').checked||$('dd549ReceiptCode').value.trim()!==matched.raw)return;
  if(!window.DDAuth?.apiFetch){status('Sign in as an administrator before saving an owner acknowledgement.');return;}
  busy=true;$('dd551SaveReview').disabled=true;status('Saving the explicitly confirmed owner comparison and checking database readback…');
  try{const response=await window.DDAuth.apiFetch('/api/admin/system-health-547',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'owner_review_551',receipt:matched.receipt,second_device_compared:true})}),data=await response.json();
    if(!response.ok||!data.ok||data.readback_confirmed!==true)throw Error(data.error||`HTTP ${response.status}`);
    status(`${data.already_recorded?'Already recorded':'Saved and independently read back'}: owner-reported comparison at ${nice(data.review?.reviewed_at)}. This is not independent device proof.`);
    invalidate();$('dd547Reload')?.click();
  }catch(error){status('Owner review save was not confirmed: '+error.message+'. Reload shared monitoring before attempting another save.');invalidate();}
  finally{busy=false;}
});
})();
