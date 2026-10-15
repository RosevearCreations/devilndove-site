// Build 405 — original Product and gallery drive independent, local-only Etsy/Marketplace intent.
(()=>{'use strict';
const el=id=>document.getElementById(id);
const area=el('productChannel405'),etsy=el('productChannel405Etsy'),facebook=el('productChannel405Facebook');
const status=el('productChannel405Status'),reload=el('productChannel405Reload'),save=el('productChannel405Save');
if(!area||!etsy||!facebook||!window.DDAuth?.apiFetch)return;
const params=new URLSearchParams(location.search);let productId=Number(params.get('product_id')||0),receipt=0,loaded=false,dirty=false,busy=false;
function say(s){status.textContent=s;}
function apply(){reload.disabled=busy||!productId;save.disabled=busy||!productId||!dirty;
 area.dataset.dirty=dirty?'1':'0';}
const changes=()=>{dirty=true;apply();};
for(const x of [etsy,facebook])x.addEventListener('change',changes);
async function load(){if(busy||!productId)return;busy=true;apply();
 try{const r=await window.DDAuth.apiFetch('/api/admin/product-channel-intent?product_id='+encodeURIComponent(productId),{method:'GET',cache:'no-store'});
 const x=await r.json();if(!r.ok||!x?.ok)throw Error(x?.error||'Channel intent unavailable');
 etsy.checked=x.preferences.etsy;facebook.checked=x.preferences.facebook;
 receipt=Number(x.preferences.receipt||0);loaded=true;dirty=false;
 say(x.preferences.configured?'Saved destination preferences loaded; these switches do not publish.':'No channel preference saved; channels remain OFF until you enable and save them.');}
 catch(e){say('Cannot verify saved channel choices: '+e.message+'. Change nothing until reloaded.');loaded=false;}
 finally{busy=false;apply();}}
async function saveFor(id){if(!dirty)return true;
 if(busy||!id)return false;busy=true;apply();
 try{
 if(!globalThis.crypto?.randomUUID)throw Error('Secure one-time request key unavailable');
 const r=await window.DDAuth.apiFetch('/api/admin/product-channel-intent',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({product_id:id,etsy:etsy.checked,facebook:facebook.checked,request_key:globalThis.crypto.randomUUID(),
 expected_receipt:receipt,confirmed_no_provider_publication:true})});
 const x=await r.json().catch(()=>null);if(!r.ok||!x?.ok)throw Error(x?.error||'Intent not confirmed');
 productId=Number(id);receipt=Number(x.preferences.receipt||0);loaded=true;dirty=false;
 say('Saved destination intent for Product #'+productId+'. Etsy: '+(etsy.checked?'ON':'OFF')+', Facebook Marketplace: '+(facebook.checked?'ON':'OFF')+'. No listings published.');
 return true;
 }catch(e){say('Product may have saved, but destinations were NOT confirmed: '+e.message+'. Load exact choices before another attempt.');return false;}
 finally{busy=false;apply();}}
reload.addEventListener('click',()=>void load());
save.addEventListener('click',()=>void saveFor(productId));
window.DDProductChannels405={afterProductSave:async id=>saveFor(Number(id)),
 isDirty:()=>dirty};
apply();
// No automatic network on new product. Existing Product fetch is explicit, preserving editor low-read startup.
})();
