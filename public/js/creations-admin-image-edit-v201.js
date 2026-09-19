// Release 467 Build 201 — admin-only inline Creation Image Editor links.
(()=>{
  'use strict';
  function editModeOn(){return document.documentElement.classList.contains('media-page-edit-mode');}
  function adminToolbarReady(){return Boolean(document.getElementById('mediaPageEditToolbar'));}
  function hrefFor(img){
    const p=new URLSearchParams(),id=String(img.dataset.creationCatalogId||'').trim(),key=String(img.dataset.creationImageKey||'').trim();
    if(id)p.set('creation_id',id);if(key)p.set('creation_key',key);
    return '/admin/creation-media/?'+p.toString();
  }
  function sync(){
    if(!adminToolbarReady()||!editModeOn())return;
    document.querySelectorAll('img[data-creation-image-key]').forEach(img=>{
      const host=img.parentElement;if(!host)return;
      const key=String(img.dataset.creationImageKey||'').trim();if(!key)return;
      if(host.querySelector('.creation-inline-image-edit[data-creation-key="'+CSS.escape(key)+'"]'))return;
      const link=document.createElement('a');
      link.className='media-inline-admin-edit media-inline-image-edit creation-inline-image-edit';
      link.dataset.creationKey=key;
      link.href=hrefFor(img);
      link.textContent='Edit image';
      link.title='Edit creation image — '+String(img.dataset.creationImageLabel||key);
      host.classList.add('media-inline-edit-host');
      img.insertAdjacentElement('afterend',link);
    });
  }
  document.addEventListener('dd:creations-rendered',()=>setTimeout(sync,0));
  document.addEventListener('dd:admin-ready',()=>setTimeout(sync,0));
  document.addEventListener('click',event=>{if(event.target.closest('[data-media-page-edit-toggle]'))setTimeout(sync,0);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,0),{once:true});else setTimeout(sync,0);
})();
