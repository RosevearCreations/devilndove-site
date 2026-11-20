/* Devil n Dove Build 742 — owner-supplied Dovlin handoff, strictly concept-only.
 * No D1, commerce, analytics, account, notification or auto-publication integration.
 */
(()=>{'use strict';
const prefix='/dovlin/';
const $=id=>document.getElementById(id);
const slides=[];
let activeSlide=-1;
let lastTrigger=null;
const dlg=$('dv-lightbox'),viewer=$('dv-lightbox-image'),caption=$('dv-lightbox-caption'),heading=$('dv-lightbox-title');
const text=(tag,value,cls)=>{const x=document.createElement(tag);if(cls)x.className=cls;x.textContent=String(value??'');return x};
const file=path=>{
 if(typeof path!=='string'||!/^(assets|thumbs)\/[A-Za-z0-9_.-]+\.webp$/.test(path))throw Error('Unexpected owner asset path');
 return prefix+path;
};
const addImg=(path,alt,thumb=false)=>{
 const img=document.createElement('img');
 img.src=file(path);img.alt=alt;img.decoding='async';img.loading='lazy';
 const dims=window.__dvDimensions?.[path];
 if(Array.isArray(dims)&&dims.length===2&&dims.every(n=>Number.isInteger(n)&&n>0)){img.width=dims[0];img.height=dims[1]}
 else {img.width=420;img.height=420}
 if(thumb)img.sizes='(max-width: 500px) 46vw, (max-width: 900px) 30vw, 23vw';
 return img;
};
const slide=(name,path,alt,note,button)=>{
 const i=slides.length;slides.push({name,path,alt,note});
 button.type='button';button.setAttribute('aria-label','Open full-size concept preview: '+name);
 button.addEventListener('click',()=>{activeSlide=i;lastTrigger=button;showSlide();if(!dlg.open)dlg.showModal()});
};
function showSlide(){
 if(!slides.length||activeSlide<0)return;
 const s=slides[activeSlide];viewer.src=file(s.path);viewer.alt=s.alt;
 const dims=window.__dvDimensions?.[s.path];if(dims){viewer.width=dims[0];viewer.height=dims[1]}
 heading.textContent=s.name;
 caption.textContent=s.note+' · Concept Preview / In Development · '+(activeSlide+1)+' of '+slides.length;
}
function moveSlide(diff){if(!slides.length)return;activeSlide=(activeSlide+diff+slides.length)%slides.length;showSlide()}
$('dv-lightbox-prev').addEventListener('click',()=>moveSlide(-1));
$('dv-lightbox-next').addEventListener('click',()=>moveSlide(1));
$('dv-lightbox-close').addEventListener('click',()=>dlg.close());
dlg.addEventListener('close',()=>lastTrigger?.focus());
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
dlg.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();moveSlide(1)}else if(e.key==='ArrowLeft'){e.preventDefault();moveSlide(-1)}});
function makeEdition(p){
 const card=text('article','','dv-card'),fig=document.createElement('figure');
 fig.append(addImg(p.art,p.name+' — supplied digital colourway concept illustration. Not a product photograph.'));
 const body=text('div','','dv-card-body');
 body.append(text('span','In Development','dv-badge'),text('h3',p.name),text('p',p.subtitle));
 body.append(text('p',p.color_notes),text('p',p.mini_story,'dv-microstory'));
 if(p.art_match){
  const nearest={'Burgundy Shadow':'Shadow Ruby','Ivory Dove':'Gold Edition','Silver Moon':'Moonstone'}[p.name]||'source art';
  body.append(text('span','Artwork review required · closest source study: '+nearest,'dv-review'));
 }
 const open=text('button','View concept artwork','dv-image-link');open.type='button';
 body.append(open);
 slide(p.name,p.art,p.name+' original Dovlin digital mascot study',p.art_match?'Visual is a provisional nearest source colour study awaiting owner approval':'Planned edition; not a finished physical plush',open);
 card.append(fig,body);return card;
}
function makeManifestCard(p){
 const card=text('article','','dv-maker-card'),button=document.createElement('button'),figure=document.createElement('figure');
 const alt=p.alt||p.description||p.title;
 figure.append(addImg(p.thumbnail,alt+' — digital mockup only',true));button.append(figure);
 const body=text('div','','dv-image-label');
 body.append(text('span','Concept Preview','dv-badge'),text('strong',p.title),text('small',p.category));
 button.append(body);card.append(button);
 slide(p.title,p.site_image,alt,p.manufacturing_note||'Original supplied study; manufacturing evidence pending',button);
 return card;
}
function makeColourCard(p){
 const figure=text('figure','','dv-colour-card');
 const button=document.createElement('button');button.append(addImg(p.thumb,p.name+' future Dovlin colour study, cropped from source sheet',true));
 button.append(text('figcaption',p.name));figure.append(button);
 slide(p.name,p.image,p.name+' planned study','Future inspiration only; not one of the ten approved retail editions',button);
 return figure;
}
function makeSheetCard(s){
 const figure=text('figure','','dv-sheet-card'),button=document.createElement('button');
 button.append(addImg(s.image,s.title+' — original five-character owner colourway sheet'));
 button.append(text('figcaption',s.title));figure.append(button);
 slide(s.title,s.image,s.title+' complete source sheet','Original multi-colour study; no added SKUs',button);
 return figure;
}
async function run(){
 try{
  const paths=['data/collection_seed.json','data/asset_manifest.json','data/image_dimensions.json'];
  const payload=await Promise.all(paths.map(async p=>{const resp=await fetch(prefix+p,{credentials:'same-origin',cache:'default'});if(!resp.ok)throw Error('Missing source: '+p);return resp.json()}));
  const [seed,manifest,dims]=payload;
  if(seed.featured_plush?.length!==10||seed.shop_concepts?.length!==38||seed.colour_lab?.length!==20||manifest.uploaded_assets?.length!==48||manifest.cropped_colourways?.length!==20)throw Error('Incomplete approved concept manifest');
  if(seed.featured_plush[0].name!=='Original Crimson')throw Error('Original Crimson source first edition missing');
  window.__dvDimensions=dims;
  const story=seed.canonical_story;
  if(typeof story!=='string'||story.length<1100)throw Error('Approved legend source missing');
  $('dv-story').textContent=story;
  $('dv-edition-grid').replaceChildren(...seed.featured_plush.map(makeEdition));
  $('dv-colour-grid').replaceChildren(...seed.colour_lab.map(makeColourCard));
  $('dv-sheet-grid').replaceChildren(...seed.original_colourway_sheets.map(makeSheetCard));
  const categories=['All',...new Set(manifest.uploaded_assets.map(a=>a.category))];
  const state={category:'All',search:''};const controls=$('dv-category-filters'),output=$('dv-manifest-gallery'),count=$('dv-workshop-count');
  function paint(){
   const visible=manifest.uploaded_assets.filter(a=>(state.category==='All'||a.category===state.category)&&
    [a.title,a.category,a.description,a.manufacturing_note].some(s=>String(s??'').toLowerCase().includes(state.search)));
   output.replaceChildren(...visible.map(makeManifestCard));
   count.textContent=visible.length+' of 48 original artwork concepts shown';
   if(!visible.length)output.append(text('p','No matching concepts. Try another search or select All.'));
  }
  categories.forEach(name=>{
   const btn=text('button',name);btn.type='button';btn.setAttribute('aria-pressed',String(name==='All'));
   btn.addEventListener('click',()=>{
    state.category=name;controls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));paint();
   });controls.append(btn);
  });
  $('dv-workshop-search').addEventListener('input',e=>{state.search=e.target.value.toLowerCase().trim();paint()});
  paint();
 }catch(e){
  $('dv-story').textContent='The approved story is temporarily unavailable. The original owner-approved source remains unchanged.';
  $('dv-workshop-count').textContent='HOLD — original Dovlin image and editorial assets are unavailable. No shopping or purchases are enabled.';
  console.error('Dovlin original source not accepted',e);
 }
}
run();
})();
