// Release 467 Build 350 — Etsy Development connection panel.
(function(){
'use strict';
const id=(x)=>document.getElementById(x),esc=(v)=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const apiFetch=(u,o={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(u,o):fetch(u,{credentials:'same-origin',...o});
async function load(){
 const mount=id('etsyOauthAcceptanceMount'),msg=id('etsyOauthAcceptanceMessage'),btn=id('etsyOauthConnect');
 if(!mount)return;
 try{
  const r=await apiFetch('/api/admin/etsy-oauth-acceptance',{method:'GET',cache:'no-store'}),d=await r.json();
  if(!r.ok||d.ok===false)throw new Error(d.error||('HTTP '+r.status));
  const c=d.configuration||{},s=d.shop||{},conn=d.connection||{};
  mount.innerHTML=`<div class="grid cols-3"><div><strong>Configuration</strong><div class="small">${c.api_keystring_present&&c.shared_secret_present&&c.redirect_uri_present?'3/3 Etsy references present':'Etsy references incomplete'}</div></div><div><strong>Connection</strong><div class="small">${esc(conn.status||'not_connected')}</div></div><div><strong>Shop</strong><div class="small">${s.shop_id?esc((s.shop_name||'Etsy shop')+' • ID '+s.shop_id):'Shop ID will be discovered automatically after OAuth'}</div></div></div><p class="small"><strong>Safety:</strong> Etsy stays in normal shop mode. Connecting does not create, edit, activate, deactivate or publish a listing. Provider draft writes remain locked.</p><p class="small">${esc(d.next_action||'')}</p>`;
  if(btn){btn.hidden=Boolean(conn.connected);btn.disabled=!d.connect_authorization_available;}
  if(msg)msg.textContent=conn.connected?'Etsy Development OAuth connection verified.':'Ready for the one-time Etsy OAuth connection when the button is enabled.';
 }catch(e){if(msg)msg.textContent=e.message||String(e);if(btn)btn.disabled=true;}
}
function loginRedirect(){const next='/admin/it-integrations/#etsy-oauth-acceptance';const url=new URL('/login/',location.origin);url.searchParams.set('next',next);location.href=url.toString();}
function startProtectedLoad(){const btn=id('etsyOauthConnect');if(btn)btn.disabled=true;if(window.DDWhenAdminReady){window.DDWhenAdminReady(()=>{if(btn)btn.disabled=false;load()});return}if(window.DDAdminAccessState?.granted){if(btn)btn.disabled=false;load();return}const msg=id('etsyOauthAcceptanceMessage');if(msg)msg.textContent='Administrator sign-in required. You will return here after Development login.'}
function init(){id('etsyOauthConnect')?.addEventListener('click',()=>{if(!window.DDAdminAccessState?.granted){loginRedirect();return}location.href='/api/admin/oauth-start?provider=etsy&return_to='+encodeURIComponent('/admin/it-integrations/#etsy-oauth-acceptance')});id('etsyOauthRefresh')?.addEventListener('click',()=>{if(window.DDAdminAccessState?.granted)load();else loginRedirect()});document.addEventListener('dd:admin-access-denied',()=>{const msg=id('etsyOauthAcceptanceMessage');if(msg)msg.textContent='Administrator sign-in required. Redirecting to Development login…';const btn=id('etsyOauthConnect');if(btn)btn.disabled=true},{once:true});startProtectedLoad();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
