// Release 467 Build 354 — Etsy main-site connection panel.
// DDWhenAdminReady remains a historical shared-admin signal; Build 352 requires server-verified auth before protected Etsy reads.
(function(){
'use strict';
const id=(x)=>document.getElementById(x);
const esc=(v)=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const apiFetch=(u,o={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(u,o):fetch(u,{credentials:'same-origin',...o});
let lastStatus=null,loading=false;

function loginRedirect(){
  const next='/admin/it-integrations/#etsy-oauth-acceptance';
  const url=new URL('/login/',location.origin);
  url.searchParams.set('next',next);
  location.href=url.toString();
}
function message(text){
  const el=id('etsyOauthAcceptanceMessage');
  if(el)el.textContent=text||'';
}
async function ensureVerifiedAdmin({redirect=false}={}){
  const ui=window.DDAuthUiState||{};
  if(ui.verified===true&&String(ui.user?.role||'').toLowerCase()==='admin')return true;
  try{
    if(!window.DDAuth?.me)throw new Error('Authentication verifier unavailable.');
    const data=await window.DDAuth.me();
    const user=data?.user||null;
    if(user&&String(user.role||'').toLowerCase()==='admin')return true;
  }catch{}
  if(redirect)loginRedirect();
  return false;
}
async function load(){
  const mount=id('etsyOauthAcceptanceMount'),btn=id('etsyOauthConnect');
  if(!mount||loading)return;
  loading=true;
  if(btn)btn.disabled=true;
  try{
    if(!(await ensureVerifiedAdmin({redirect:false}))){
      message('Administrator sign-in must be verified before Etsy connection status can load.');
      return;
    }
    const r=await apiFetch('/api/admin/etsy-oauth-acceptance',{method:'GET',cache:'no-store'});
    const d=await r.json().catch(()=>null);
    if(!r.ok||!d||d.ok===false)throw new Error(d?.error||('HTTP '+r.status));
    lastStatus=d;
    const c=d.configuration||{},s=d.shop||{},conn=d.connection||{},blockers=Array.isArray(d.connect_blockers)?d.connect_blockers:[];
    mount.innerHTML=`<div class="grid cols-3"><div><strong>Configuration</strong><div class="small">${c.api_keystring_present&&c.shared_secret_present&&c.redirect_uri_present?'3/3 Etsy references present':'Etsy references incomplete'}</div></div><div><strong>Connection</strong><div class="small">${esc(conn.status||'not_connected')}</div></div><div><strong>Shop</strong><div class="small">${s.shop_id?esc((s.shop_name||'Etsy shop')+' • ID '+s.shop_id):'Shop ID will be discovered automatically after OAuth'}</div></div></div><p class="small"><strong>Safety:</strong> Etsy stays in normal shop mode. Connecting does not create, edit, activate, deactivate or publish a listing. Provider draft writes remain locked.</p>${`<div class="small" style="margin-top:10px"><strong>Configured redirect:</strong> <code>${esc(c.redirect_uri||'not configured')}</code><br><strong>Expected main redirect:</strong> <code>${esc(c.expected_redirect_uri||'https://devilndove.com/api/social/oauth/etsy/callback')}</code></div>`}${blockers.length?`<div class="card" style="margin-top:10px"><strong>Connect prerequisites</strong><ul class="small">${blockers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}<p class="small">${esc(d.next_action||'')}</p>`;
    if(btn){btn.hidden=Boolean(conn.connected);btn.disabled=Boolean(conn.connected);}
    message(conn.connected?'Etsy main-site OAuth connection verified.':(d.connect_authorization_available?'Ready for the one-time Etsy OAuth connection.':'Etsy connection is not open yet. The required main-site prerequisite is shown below.'));
  }catch(e){
    lastStatus=null;
    message(e.message||String(e));
  }finally{
    loading=false;
    if(btn&&!btn.hidden)btn.disabled=false;
  }
}
async function connect(){
  const btn=id('etsyOauthConnect');
  if(btn)btn.disabled=true;
  try{
    if(!(await ensureVerifiedAdmin({redirect:true})))return;
    if(!lastStatus)await load();
    if(!lastStatus)return;
    if(!lastStatus.connect_authorization_available){
      const blockers=Array.isArray(lastStatus.connect_blockers)?lastStatus.connect_blockers:[];
      message(blockers.length?('Connect Etsy needs: '+blockers.join(' ')):'Etsy main-site OAuth prerequisites are not complete yet.');
      return;
    }
    location.assign('/api/admin/oauth-start?provider=etsy&return_to='+encodeURIComponent('/admin/it-integrations/#etsy-oauth-acceptance'));
  }finally{
    if(btn&&!btn.hidden)btn.disabled=false;
  }
}
function startProtectedLoad(){
  const btn=id('etsyOauthConnect');
  if(btn)btn.disabled=true;
  message('Verifying administrator session before loading Etsy connection status…');
  const ui=window.DDAuthUiState||{};
  if(ui.verified===true){void load();return;}
  document.addEventListener('dd:auth-verified',()=>void load(),{once:true});
  if(window.DDWhenAdminReady){
    window.DDWhenAdminReady((detail)=>{if(detail?.verified===true)void load();});
  }
  void ensureVerifiedAdmin({redirect:false}).then(ok=>{if(ok)void load();});
}
function init(){
  id('etsyOauthConnect')?.addEventListener('click',()=>void connect());
  id('etsyOauthRefresh')?.addEventListener('click',()=>void load());
  document.addEventListener('dd:admin-access-denied',()=>{lastStatus=null;message('Administrator sign-in required. Use Connect Etsy to return through the main-site login.');});
  document.addEventListener('dd:auth-rejected',()=>{lastStatus=null;message('Administrator session expired. Sign in again before connecting Etsy.');});
  startProtectedLoad();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
