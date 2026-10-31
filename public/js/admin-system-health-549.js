/* Build 549: cross-device owner receipt recheck and read-only incident milestones. */
(()=>{'use strict';const $=id=>document.getElementById(id);if(!$('dd549ReceiptCode'))return;
const routePaths=new Set(['/','/shop/','/admin/','/admin/product-editor/?product_id=54','/admin/system-operations/']);
let busy=false;
const make=(tag,text,klass)=>{const el=document.createElement(tag);if(text!=null)el.textContent=String(text);if(klass)el.className=klass;return el;};
const status=text=>{$('dd549ReceiptStatus').textContent=text;};
function receiptQuery(raw){if(typeof raw!=='string'||raw.length>512)throw Error('Receipt must be short JSON.');let item;try{item=JSON.parse(raw);}catch{throw Error('Paste a valid JSON monitoring receipt.');}
  if(item?.kind==='history'&&routePaths.has(item.path)&&Number.isFinite(Date.parse(item.at))){return new URLSearchParams({receipt_path:item.path,receipt_at:new Date(item.at).toISOString()});}
  if(item?.kind==='view'&&/^system-health-preset-\d+-[a-z0-9-]{1,45}$/.test(String(item.key||''))){return new URLSearchParams({receipt_view:item.key});}
  throw Error('Receipt must contain a recognized saved route/time or saved-view key.');
}
async function verify(){if(busy)return;let query;try{query=receiptQuery($('dd549ReceiptCode').value.trim());}catch(error){status(error.message);return;}
  if(!window.DDAuth?.apiFetch){status('Please sign in as an administrator to verify this receipt.');return;}
  busy=true;$('dd549Verify').disabled=true;status('Reading the exact receipt in the signed-in administrator account…');
  try{const response=await window.DDAuth.apiFetch('/api/admin/system-health-547?'+query.toString(),{cache:'no-store'}),data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||`HTTP ${response.status}`);
    if(!data.receipt_check?.found){status('NOT FOUND in this administrator account. The original save or account identity is not confirmed; do not assume the data transferred.');return;}
    status(`FOUND — ${data.receipt_check.kind==='view'?'saved view':'history sample'} verified in this signed-in account. Compare the same receipt on the other device. No incident or Product record was changed.`);
  }catch(error){status('Receipt verification unavailable: '+error.message+'. Do not assume the saved record is missing.');}
  finally{busy=false;$('dd549Verify').disabled=false;}
}
function timeline(rows){const root=$('dd549Timeline');root.replaceChildren();if(!Array.isArray(rows)||!rows.length){root.append(make('p','No incident milestones returned for the last 30 days. This does not prove that no outage occurred.'));return;}
  for(const incident of rows.slice(0,25)){
    const article=make('article',null,'dd549-event'),title=make('strong',`${incident.severity||'warning'} · ${incident.code||incident.scope||'Runtime incident'} #${incident.id||'?'}`),path=make('p',incident.path||'No route recorded'),created=make('p',`Created: ${incident.created_at||'Unknown time'}`),reviewed=make('p',incident.reviewed_at?`Latest recorded review: ${incident.reviewed_at} · ${incident.review_status||'unknown'}`:`No recorded review · ${incident.review_status||'open'}`);
    article.dataset.review=incident.review_status||'open';article.append(title,path,created,reviewed);root.append(article);
  }
}
document.addEventListener('dd:health-receipt-549',event=>{const receipt=event.detail;if(!receipt||!['view','history'].includes(receipt.kind))return;$('dd549ReceiptCode').value=JSON.stringify(receipt);status('New saved receipt ready to copy. Paste it on the second device, then choose Verify receipt.');});
document.addEventListener('dd:system-health-reconciled-549',event=>timeline(event.detail?.timeline));
$('dd549Verify').addEventListener('click',()=>void verify());
$('dd549Copy').addEventListener('click',async()=>{const value=$('dd549ReceiptCode').value.trim();try{receiptQuery(value);if(!navigator.clipboard?.writeText)throw Error('Clipboard access unavailable.');await navigator.clipboard.writeText(value);status('Receipt copied. Open System Operations on the other signed-in device and paste it into this box.');}catch(error){status(error.message+' You can also select the receipt text and copy it manually.');}});
})();
