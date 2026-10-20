/* Brand V3 customer editorial banners 228–235. Exact page and filename mapping.
 * Purely illustrative. Only insert after the file loads, and do not touch Media Studio,
 * customer-uploaded pictures, product photography, or other page content. */
(()=>{
  "use strict";
  const pages={
  "/capabilities/":["capabilities.overview.hero.visual.228","228-capabilities-overview-banner.webp","Illustrative artwork for Devil n Dove workshop capabilities"],
  "/case-studies/":["case-studies.hero.visual.229","229-case-studies-banner.webp","Illustrative artwork for workshop project stories"],
  "/collages/":["collages.hero.visual.230","230-creative-collages-banner.webp","Illustrative handmade creative collage artwork"],
  "/workshop-journal/polymer-clay-earring-care/":["journal.polymer-clay-care.hero.visual.231","231-polymer-clay-earring-care-banner.webp","Decorative workshop illustration for polymer clay care"],
  "/workshop-journal/handmade-vintage-sourced-guide/":["journal.handmade-vintage-guide.hero.visual.232","232-handmade-vintage-sourced-guide-banner.webp","Decorative handmade vintage and sourced guide banner"],
  "/workshop-journal/story/":["journal.story.hero.visual.233","233-workshop-journal-story-banner.webp","Decorative artwork for the Devil n Dove workshop story"],
  "/account-help/":["account-help.hero.visual.234","234-account-help-banner.webp","Illustrative artwork for account assistance"],
  "/socials/":["socials.community.hero.visual.235","235-social-hub-banner.webp","Decorative community and social hub artwork"]
  };
  function show(){
    let route=location.pathname.replace(/\/index\\.html$/,"/");
    if(!route.endsWith("/"))route+="/";
    const entry=pages[route];
    if(!entry)return;
    const [slot,file,alt]=entry;
    if(document.querySelector('[data-brand-v3-placement="'+slot+'"]'))return;
    const hero=document.querySelector(".container > section.hero, main > section.hero, section.hero");
    const heading=document.querySelector("h1");
    const anchor=hero||(heading&&(heading.closest("section,.card")||heading));
    if(!anchor)return;
    const src="/assets/images/brand-v3/"+file;
    const probe=new Image();
    probe.onload=()=>{
      if(!probe.naturalWidth||document.querySelector('[data-brand-v3-placement="'+slot+'"]'))return;
      const figure=document.createElement("figure");
      figure.className="dd-brand-v3-editorial-banner";
      figure.dataset.brandV3Placement=slot;
      figure.dataset.mediaSlot=slot;
      const img=document.createElement("img");
      img.src=src;
      img.alt=alt;
      img.width=1712;
      img.height=324;
      img.decoding="async";
      img.loading="lazy";
      figure.appendChild(img);
      anchor.insertAdjacentElement("afterend",figure);
    };
    probe.src=src;
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",show,{once:true});
  else show();
})();
