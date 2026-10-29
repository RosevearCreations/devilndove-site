/* Build 525 — real owner, fresh Product only. All Etsy reads are GETs;
 * accepting a photo comparison writes just one LOCAL Admin audit receipt. */
const root=document.getElementById('dd525OwnerTrial');
if(root&&window.DDAuth?.apiFetch){
 const $=id=>document.getElementById(id),id=Number(new URLSearchParams(location.search).get('product_id')||0);
 const readButton=$('dd525Read'),saveButton=$('dd525Accept'),status=$('dd525Status'),pairs=$('dd525PhotoPairs');
 const owner=$('dd525OwnerStatement');let current=null,busy=false;
 const say=(message,tone='')=>{status.textContent=message;status.dataset.tone=tone;};
 function render(){const boxes=[...pairs.querySelectorAll('input[data-dd525-pair]')];
  const ready=!!current?.trial?.ready_for_owner_visual_review;
  saveButton.disabled=busy||!ready||!owner.checked||boxes.length===0||boxes.some(x=>!x.checked);
  readButton.disabled=busy||!Number.isSafeInteger(id)||id<1||[48,53].includes(id);
 }
 function clear(){current=null;pairs.replaceChildren();owner.checked=false;say('Run a fresh read-only Etsy comparison after saving this Product and creating its unpublished draft.');render();}
 async function api(path,options={method:'GET'}){const response=await window.DDAuth.apiFetch(path,{cache:'no-store',...options});
  if(window.DDAuth.readApiJson)return window.DDAuth.readApiJson(response,{fallbackMessage:'The live Etsy readback is unavailable.'});
  const body=await response.json().catch(()=>null);if(!response.ok||body?.ok!==true)throw Error(body?.error||'Live verification failed.');return body;}
 const makeLink=(url,caption)=>{const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=caption;return a;};
 function showEvidence(result){pairs.replaceChildren();
  const trial=result.trial;if(!trial?.ready_for_owner_visual_review){
   say('HOLD — '+(trial?.issues||['Live Etsy evidence was not complete.']).join(' '),'error');render();return;}
  for(const photo of trial.photos){const row=document.createElement('li');row.className='dd525-pair';
   const title=document.createElement('strong');title.textContent=`Original #${photo.product_image_id} ↔ Etsy photo #${photo.etsy_image_id}`;
   const thumbs=document.createElement('div');thumbs.className='dd525-thumbs';
   for(const [url,caption] of [[photo.original_url,'Saved original'],[photo.etsy_url,'Actual Etsy photo']]){
    const wrapper=document.createElement('div'),img=document.createElement('img');img.src=url;img.alt=`${caption} for original #${photo.product_image_id}`;
    img.loading='lazy';wrapper.append(img,makeLink(url,caption));thumbs.append(wrapper);}
   const label=document.createElement('label');const box=document.createElement('input');box.type='checkbox';box.dataset.dd525Pair='1';
   box.dataset.sourceId=photo.product_image_id;box.dataset.etsyId=photo.etsy_image_id;
   label.append(box,document.createTextNode(` I personally compared original #${photo.product_image_id} with actual Etsy #${photo.etsy_image_id}; it is the same product photo.`));
   box.addEventListener('change',render);row.append(title,thumbs,label);pairs.append(row);
  }
  say(`Live draft #${trial.listing_id} and all ${trial.original_count} original → Etsy image receipts were read and matched. Open both images and check EACH pair yourself; no approval was recorded yet.`,'ok');
  render();
 }
 async function read(){if(busy||readButton.disabled)return;busy=true;current=null;owner.checked=false;pairs.replaceChildren();render();
  say('Reading primary D1 original receipts and the ACTUAL Etsy draft/images. No provider write…');
  try{current=await api(`/api/admin/product-etsy-owner-trial-525?product_id=${id}`);
   if(!current?.evidence_fingerprint)throw Error('The source evidence fingerprint was missing.');showEvidence(current);
  }catch(error){say(`HOLD — ${error.message}. Check saved Product and Etsy; no new draft or photo transfer was attempted.`,'error');}
  finally{busy=false;render();}}
 async function accept(){if(busy||saveButton.disabled||!current)return;
  if(!window.confirm(`Record LOCAL owner visual-acceptance evidence for Product #${id} and Etsy #${current.trial.listing_id}? This does NOT publish or alter Etsy.`))return;
  const confirmed_pairs=[...pairs.querySelectorAll('input[data-dd525-pair]')].map(x=>({product_image_id:Number(x.dataset.sourceId),etsy_image_id:x.dataset.etsyId}));
  busy=true;render();say('Re-reading the current live source before saving your one local owner statement…');
  try{const response=await api('/api/admin/product-etsy-owner-trial-525',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({product_id:id,expected_fingerprint:current.evidence_fingerprint,request_key:crypto.randomUUID(),
    confirmed_pairs,owner_compared_every_image:true,confirm_unpublished_only:true,confirm_local_receipt_only:true})});
   current=null;owner.checked=false;pairs.replaceChildren();
   say(`Owner statement saved to primary D1 audit receipt #${response.owner_receipt_id}: Product #${id} ↔ Etsy draft #${response.listing_id}, ${response.confirmed_photo_count} photos. Etsy remains unpublished. This is owner acceptance, not independent pixel proof.`,'ok');
  }catch(error){current=null;owner.checked=false;pairs.replaceChildren();
   say(`HOLD — ${error.message}. The local audit result may be uncertain. Inspect the original evidence and audit record before another acceptance attempt.`,'error');}
  finally{busy=false;render();}}
 readButton.addEventListener('click',()=>void read());saveButton.addEventListener('click',()=>void accept());owner.addEventListener('change',render);
 for(const name of ['dd:product-loaded','dd:save-succeeded','dd:media-inline-updated','dd:etsy-draft-flow-523-complete'])
  document.addEventListener(name,clear);
 if([48,53].includes(id))say(`Product #${id} is one of the two owner-managed earlier drafts; the fresh-product acceptance trial does not touch it.`,'warn');
 render();
}
