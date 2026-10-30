// Build 405 — original Product and gallery drive independent, local-only Etsy/Marketplace intent.
(()=>{'use strict';
const el=id=>document.getElementById(id);
const area=el('productChannel405'),etsy=el('productChannel405Etsy'),facebook=el('productChannel405Facebook');
const status=el('productChannel405Status'),reload=el('productChannel405Reload'),save=el('productChannel405Save');
const consent=el('productChannel471Consent'),recovery=el('productChannel471Recovery'),restore=el('productChannel471Restore');
if(!area||!etsy||!facebook||!window.DDAuth?.apiFetch)return;
const params=new URLSearchParams(location.search);let productId=Number(params.get('product_id')||0),receipt=0,loaded=false,dirty=false,busy=false;
// Build 471 keeps the original source-of-truth switches in one visible Create Product flow.
el('productChannel471Mount')?.append(area);
const recoveryKey=id=>`dnd:channel-intent:471:${id}`;
function readPending(id){try{const p=JSON.parse(sessionStorage.getItem(recoveryKey(id))||'null');
 return p?.id===id&&Date.now()-p.at<60*60*1000&&typeof p.etsy==='boolean'&&typeof p.facebook==='boolean'?p:null;
 }catch{return null;}}
function clearPending(id){try{sessionStorage.removeItem(recoveryKey(id));}catch{}}
function writePending(id,choice){try{sessionStorage.setItem(recoveryKey(id),JSON.stringify({id,at:Date.now(),etsy:choice.etsy,facebook:choice.facebook}));}catch{}}
function say(s){status.textContent=s;}
function apply(){reload.disabled=busy||!productId;save.disabled=busy||!productId||!loaded||!dirty||!consent?.checked;etsy.disabled=busy||(!!productId&&!loaded);facebook.disabled=busy||(!!productId&&!loaded);
 area.dataset.dirty=dirty?'1':'0';}
const changes=()=>{if(productId&&!loaded)return;dirty=true;if(consent)consent.checked=false;apply();};
for(const x of [etsy,facebook])x.addEventListener('change',changes);
consent?.addEventListener('change',apply);
function captureForProductSave(){if(!dirty)return {changed:false};
 if(productId&&!loaded)throw Error('Load saved destination preferences before changing channels.');
 // Build 526: the selection itself explicitly authorizes a LOCAL preference.
 // Actual Etsy submission still requires its own confirmed draft-only action.
 return {changed:true,etsy:etsy.checked,facebook:facebook.checked,confirmed:true};
}
async function load(){if(busy||!productId)return;if(dirty&&!window.confirm('Discard unsaved destination changes and reload the saved choices?'))return;busy=true;apply();
 try{const r=await window.DDAuth.apiFetch('/api/admin/product-channel-intent?product_id='+encodeURIComponent(productId),{method:'GET',cache:'no-store'});
 const x=await r.json();if(!r.ok||!x?.ok)throw Error(x?.error||'Channel intent unavailable');
 etsy.checked=x.preferences.etsy;facebook.checked=x.preferences.facebook;
 receipt=Number(x.preferences.receipt||0);loaded=true;dirty=false;if(consent)consent.checked=false;
 const pending=readPending(productId);
 if(pending&&pending.etsy===etsy.checked&&pending.facebook===facebook.checked)clearPending(productId);
 if(recovery)recovery.hidden=!pending||(pending.etsy===etsy.checked&&pending.facebook===facebook.checked);
 if(recovery&&!recovery.hidden&&el('dd501ChannelRecovery'))el('dd501ChannelRecovery').open=true;
 say(params.get('destination_save')==='unconfirmed'?'Product was created, but destination saving was NOT confirmed. The displayed choices are the current saved state; review them before proceeding.':x.preferences.configured?'Saved destination preferences loaded. Use Review and send at the top for an owner-confirmed Etsy draft POST.':'No channel preference saved; channels remain OFF until you enable and save them.');}
 catch(e){say('Cannot verify saved channel choices: '+e.message+'. Change nothing until reloaded.');loaded=false;}
 finally{busy=false;apply();}}
async function saveFor(id,frozen){let choice;
 try{choice=frozen||captureForProductSave();}catch(e){say(e.message);return false;}
 if(!choice.changed)return true;
 if(productId&&!loaded){say('Load saved destination choices before saving. No destinations were changed.');return false;}
 if(busy||!id)return false;busy=true;apply();
 try{
 if(!globalThis.crypto?.randomUUID)throw Error('Secure one-time request key unavailable');
 const r=await window.DDAuth.apiFetch('/api/admin/product-channel-intent',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({product_id:id,etsy:choice.etsy,facebook:choice.facebook,request_key:globalThis.crypto.randomUUID(),
 expected_receipt:receipt,confirmed_no_provider_publication:true,intent_source_build:471,owner_confirmed_preparation:choice.confirmed,
 canada_only:true,us_shipping_disabled:true})});
 const x=await r.json().catch(()=>null);if(!r.ok||!x?.ok)throw Error(x?.error||'Intent not confirmed');
 productId=Number(id);receipt=Number(x.preferences.receipt||0);loaded=true;dirty=false;
 clearPending(productId);if(recovery)recovery.hidden=true;
 say('Saved destinations for Product #'+productId+'. Etsy: '+(choice.etsy?'ON — use Review and send for a separate acknowledged draft POST':'OFF')+', Facebook Marketplace: '+(choice.facebook?'manual preparation':'OFF')+'. No remote draft was created or updated by destination preference Save.');
 return true;
 }catch(e){writePending(Number(id),choice);if(el('dd501ChannelRecovery'))el('dd501ChannelRecovery').open=true;say('Product may have saved, but destinations were NOT confirmed: '+e.message+'. Reload the exact preferences and use Review unsaved choices; do not repeat Product creation.');return false;}
 finally{busy=false;apply();}}
reload.addEventListener('click',()=>void load());
save.addEventListener('click',()=>void saveFor(productId));
restore?.addEventListener('click',()=>{if(!loaded||!productId)return;const p=readPending(productId);if(!p)return;
 etsy.checked=p.etsy;facebook.checked=p.facebook;dirty=true;if(consent)consent.checked=false;if(recovery)recovery.hidden=true;
 say('Unsaved destination choices restored for review only. Read the owner consent and choose Save destination choices; Product itself is already saved.');apply();});
window.DDProductChannels405={afterProductSave:async(id,choice)=>saveFor(Number(id),choice),
 captureForProductSave,isDirty:()=>dirty,isLoaded:()=>loaded&&!busy,load};
apply();
// Existing products read one bounded destination receipt on startup to prevent blind overwrites.
if(productId)void load();
})();
