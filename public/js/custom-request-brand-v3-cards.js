/* Devil n Dove: upgrade Custom Request illustration only after owner uploads 191-195. */
(()=>{'use strict';
function render(){
 document.querySelectorAll('#build208CustomDiscovery img[data-dd-brand-v3-custom-upgrade]').forEach(img=>{
  const file=img.getAttribute('data-dd-brand-v3-custom-upgrade')||'';
  if(!/^19[1-5]-custom-request-[a-z-]+\.webp$/.test(file))return;
  const next=new Image();next.decoding='async';
  next.onload=()=>{
   if(!img.isConnected||!next.naturalWidth)return;
   img.src=next.src;img.setAttribute('data-brand-v3-photo','1');img.alt='';
  };
  next.onerror=()=>{/* fallback keeps old approved image */};
  next.src='/assets/images/brand-v3/'+file;
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});
else render();
})();