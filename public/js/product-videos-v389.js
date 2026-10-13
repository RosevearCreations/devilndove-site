// Release 467 Build389: optional lazy public Product video attachment; no automatic playback.
(()=>{'use strict';
const card=document.getElementById('productVideoCard'),mount=document.getElementById('productVideoMount');
const slug=new URL(location.href).searchParams.get('slug');
if(!card||!mount||!slug)return;
const sanitize=value=>String(value??'').trim();
const safeUrl=raw=>{try{const u=new URL(raw,location.origin);return u.protocol==='https:'?u.href:'';}catch{return '';}};
(async()=>{try{
 const r=await fetch('/api/product-videos?slug='+encodeURIComponent(slug),{cache:'no-store'});
 if(!r.ok)return;const data=await r.json();if(!data.ok||!Array.isArray(data.videos)||!data.videos.length)return;
 const videos=data.videos.slice(0,3).filter(row=>safeUrl(row.video_url));
 if(!videos.length)return;
 mount.replaceChildren();
 for(const item of videos){
  const figure=document.createElement('figure'),video=document.createElement('video'),caption=document.createElement('figcaption');
  video.controls=true;video.preload='none';video.playsInline=true;video.style.cssText='width:100%;max-width:640px;border-radius:10px';
  video.setAttribute('aria-label',sanitize(item.alt_description)||sanitize(item.video_title)||'Product video');
  const source=document.createElement('source');source.src=safeUrl(item.video_url);source.type=sanitize(item.mime_type)||'video/mp4';video.append(source);
  caption.textContent=[sanitize(item.video_title),sanitize(item.caption)].filter(Boolean).join(' — ');
  figure.append(video,caption);mount.append(figure);
 }
 card.style.display='block';
}catch{/* Optional videos never block product browsing. */}})();
})();
