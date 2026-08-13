// Devil n Dove Build 256 — public Media & Content Studio runtime.
// Applies only explicit D1 assignments/published text overrides. With no assignment, authored page content is untouched.
(()=>{
  'use strict';
  function pagePath(){let p=location.pathname||'/';if(p.length>1&&p.endsWith('/'))p=p.slice(0,-1);return p||'/';}
  function safeSelector(selector){try{return document.querySelector(selector);}catch{return null;}}
  function clamp(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0.5;}
  function applyImage(item){const el=safeSelector(item.target_selector);if(!el||!item.public_url)return false;
    if(item.slot_type==='background'||item.target_attribute==='background-image'){
      el.style.backgroundImage=`url("${String(item.public_url).replace(/["\\]/g,'\\$&')}")`;
      el.style.backgroundPosition=`${Math.round(clamp(item.focal_x)*100)}% ${Math.round(clamp(item.focal_y)*100)}%`;
      return true;
    }
    if(el.tagName==='IMG'||item.target_attribute==='src'){
      el.setAttribute('src',String(item.public_url));
      if(el.tagName==='IMG'){
        el.alt=item.decorative?'':String(item.alt_text||el.alt||'');
        if(item.image_title)el.title=String(item.image_title);else el.removeAttribute('title');
        el.style.objectPosition=`${Math.round(clamp(item.focal_x)*100)}% ${Math.round(clamp(item.focal_y)*100)}%`;
      }
      return true;
    }
    return false;
  }
  function applyText(item){const el=safeSelector(item.target_selector);if(!el)return false;el.textContent=String(item.text??'');return true;}
  async function run(){
    try{
      const response=await fetch(`/api/public-media-content-manifest?path=${encodeURIComponent(pagePath())}`,{credentials:'same-origin',headers:{Accept:'application/json'}});
      if(!response.ok)return;const data=await response.json();if(!data?.ok)return;
      const images=Array.isArray(data.images)?data.images:[],content=Array.isArray(data.content)?data.content:[];
      if(!images.length&&!content.length)return;
      const applyAll=()=>{let unresolved=0;images.forEach((item)=>{if(!applyImage(item))unresolved++;});content.forEach((item)=>{if(!applyText(item))unresolved++;});return unresolved;};
      let unresolved=applyAll();document.documentElement.dataset.mediaContentStudio=unresolved?'partial':'applied';
      if(unresolved){const observer=new MutationObserver(()=>{unresolved=applyAll();document.documentElement.dataset.mediaContentStudio=unresolved?'partial':'applied';if(!unresolved)observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),8000);}
    }catch{}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
