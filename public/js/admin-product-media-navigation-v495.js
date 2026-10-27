/* Build 495: Etsy/photo links stay within the Product Editor. */
(()=>{'use strict';
 const ids=['dd488MediaLink','dd491MediaScoreLink','dd443EtsyImagesEdit'];
 for(const id of ids){
  const link=document.getElementById(id);if(!link)continue;
  link.addEventListener('click',event=>{
   event.preventDefault();
   document.querySelector('[data-editor-tab="media"]')?.click();
   document.getElementById('productDistribution406')?.scrollIntoView({block:'start',behavior:'smooth'});
  });
 }
})();
