// Release467 Build389 — explicit Product Video R2 attachments and review, separate from image gallery.
(()=>{'use strict';
const byId=id=>document.getElementById(id),root=byId('productVideo389'),file=byId('productVideo389File'),status=byId('productVideo389Status');
if(!root||!file||!window.DDAuth)return;
let productId=0,inFlight=false;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const request=(url,opts)=>window.DDAuth.apiFetch(url,opts);
const parse=async response=>{const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Request could not be confirmed');return data;};
function setStatus(message){status.textContent=message;}
async function load(id){
 if(inFlight)return;productId=Number(id)||0;root.hidden=!productId;
 if(!productId)return;
 setStatus('Loading this Product video attachments…');
 try{
  const response=await request('/api/admin/product-video-attachments?product_id='+encodeURIComponent(productId),{method:'GET',cache:'no-store'});
  const data=await parse(response),list=byId('productVideo389List');
  const videos=data.videos||[];
  list.innerHTML=videos.length?videos.map(v=>
   '<article class="card" style="margin:8px 0;padding:12px" data-video-id="'+Number(v.product_video_id)+'">'+
   '<strong>'+esc(v.original_filename)+'</strong> <span class="small">#'+Number(v.product_video_id)+' · '+esc(v.publication_status)+'</span>'+
   '<video controls preload="none" style="display:block;width:100%;max-width:480px;margin:8px 0"><source src="'+esc(v.video_url)+'" type="'+esc(v.mime_type)+'"></video>'+
   '<div class="dd-editor-grid cols-2">'+
   '<label>Video title<input class="input" data-video-title maxlength="160" value="'+esc(v.video_title)+'"></label>'+
   '<label>Approval<select class="input" data-video-approval><option value="internal_review">Internal review</option><option value="product_page_ok">Approved for Product page</option><option value="blocked">Blocked</option></select></label>'+
   '<label class="wide">Caption<textarea class="input" data-video-caption maxlength="1000">'+esc(v.caption)+'</textarea></label>'+
   '<label class="wide">Accessible description<input class="input" data-video-alt maxlength="500" value="'+esc(v.alt_description)+'"></label></div>'+
   '<button class="btn" type="button" data-save-video>Save video review</button></article>').join(''):'<p class="small">No video attached to this Product yet.</p>';
  for(const row of list.querySelectorAll('[data-video-id]')){
   const item=videos.find(x=>Number(x.product_video_id)===Number(row.dataset.videoId));
   if(item)row.querySelector('[data-video-approval]').value=item.publication_status;
  }
  const reviewCount=videos.filter(v=>v.publication_status==='internal_review').length;
  const approvedCount=videos.filter(v=>v.publication_status==='product_page_ok').length;
  const blockedCount=videos.filter(v=>v.publication_status==='blocked').length;
  setStatus('Video review: '+reviewCount+' internal, '+approvedCount+' approved for Product page, '+blockedCount+' blocked. Each change requires explicit Save.');
 }catch(e){setStatus('Video attachment review unavailable: '+e.message);}
}
root.addEventListener('click',async e=>{
 const btn=e.target.closest('[data-save-video]');if(!btn||inFlight||!productId)return;
 const row=btn.closest('[data-video-id]');if(!row)return;inFlight=true;btn.disabled=true;btn.textContent='Saving…';
 try{
  const response=await request('/api/admin/product-video-attachments',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({action:'review',product_id:productId,product_video_id:Number(row.dataset.videoId),
    video_title:row.querySelector('[data-video-title]').value,
    caption:row.querySelector('[data-video-caption]').value,
    alt_description:row.querySelector('[data-video-alt]').value,
    publication_status:row.querySelector('[data-video-approval]').value})});
  const data=await parse(response);btn.textContent='Saved ✓';setStatus('OK — video review saved: '+data.publication_status);
 }catch(e){btn.textContent='Retry video review';setStatus('Video review not confirmed: '+e.message);}
 finally{inFlight=false;btn.disabled=false;}
});
byId('productVideo389Upload')?.addEventListener('click',async()=>{
 if(inFlight||!productId)return;
 const f=file.files?.[0];if(!f)return setStatus('Choose an MP4, WebM or MOV video first.');
 if(!/\.(mp4|webm|mov)$/i.test(f.name)||f.size<=0||f.size>25*1024*1024)return setStatus('Select MP4, WebM or MOV no larger than 25 MB.');
 if(!confirm('Attach this video to Product #'+productId+' for internal review? It will NOT appear publicly until approved.'))return;
 inFlight=true;const btn=byId('productVideo389Upload');btn.disabled=true;btn.textContent='Uploading…';
 try{
  const body=new FormData();body.append('product_id',String(productId));body.append('file',f);
  body.append('video_title',byId('productVideo389Title').value);
  body.append('caption',byId('productVideo389Caption').value);
  body.append('alt_description',byId('productVideo389Alt').value);
  const response=await request('/api/admin/product-video-attachments',{method:'POST',body,headers:{}});
  const data=await parse(response);
  file.value='';setStatus('Saved ✓ video #'+data.product_video_id+' attached for internal review.');
 }catch(e){setStatus('Upload outcome unconfirmed. Check attachments before retry: '+e.message);}
 finally{inFlight=false;btn.disabled=false;btn.textContent='Attach video';}
 if(!file.value)await load(productId);
});
document.addEventListener('dd:media-selected-product',event=>load(Number(event.detail?.product_id||0)));
const initial=Number(new URLSearchParams(location.search).get('product_id')||0);
if(initial>0){root.hidden=false;setStatus('Select Product gallery or load Product first.');}
})();
