/* Devil n Dove Brand V3 — 246–255. Illustration-only hero additions.
 * No login/session/cart/customer/account/business data is read or mutated.
 * Probe before rendering so missing local images create no broken placeholders.
 * Existing owner imagery and Media Studio-managed slots remain unchanged. */
(()=>{
 "use strict";
 const pages={
    "/cart/": ["cart.hero.visual.246","246-cart-workshop-selection-banner.webp","Decorative Devil n Dove artisan cart artwork"],
    "/saved/": ["saved.hero.visual.247","247-saved-creations-banner.webp","Decorative Devil n Dove saved creations artwork"],
    "/login/": ["login.hero.visual.248","248-login-welcome-back-banner.webp","Decorative Devil n Dove workshop welcome artwork"],
    "/register/": ["register.hero.visual.249","249-register-join-workshop-banner.webp","Decorative Devil n Dove maker workshop artwork"],
    "/members/": ["members.hero.visual.250","250-members-creative-hub-banner.webp","Decorative Devil n Dove community artwork"],
    "/toolshed/": ["toolshed.hero.visual.251","251-toolshed-workshop-notes-banner.webp","Decorative artisan tools and workshop artwork"],
    "/supplies/health/": ["supplies-health.hero.visual.252","252-supplies-records-banner.webp","Decorative materials and supplies illustration"],
    "/tools/health/": ["tools-health.hero.visual.253","253-tools-records-banner.webp","Decorative workshop tools illustration"],
    "/movies/": ["movies.hero.visual.254","254-movie-collection-banner.webp","Decorative Devil n Dove movie collection header artwork"],
    "/social-connections/": ["social-connections.hero.visual.255","255-social-connections-banner.webp","Decorative Devil n Dove creative social channels artwork"]
 };
 function mount(){
   const route=location.pathname.replace(/\/index\.html$/,"/").replace(/\/+$/,"")+"/";
   const entry=pages[route];
   if(!entry)return;
   const [placement,filename,alt]=entry;
   if(document.querySelector('[data-brand-v3-placement="'+placement+'"]'))return;
   const anchor=document.querySelector(".container > .hero, main.hero, section.hero, .page-hero");
   if(!anchor)return;
   const source="/assets/images/brand-v3/"+filename;
   const probe=new Image();
   probe.onload=()=>{
     if(!probe.naturalWidth||document.querySelector('[data-brand-v3-placement="'+placement+'"]'))return;
     const figure=document.createElement("figure");
     figure.className="dd-brand-v3-account-banner";
     figure.dataset.brandV3Placement=placement;
     figure.dataset.mediaSlot=placement;
     const image=document.createElement("img");
     image.src=source;
     image.alt=alt;
     image.width=1712;
     image.height=324;
     image.loading="lazy";
     image.decoding="async";
     figure.appendChild(image);
     anchor.insertAdjacentElement("afterend",figure);
   };
   probe.src=source;
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});
 else mount();
})();
