// Release 461 — reusable backend external-information help interface.
(function(){
  'use strict';
  const safe=(v)=>String(v==null?'':v).trim();
  const esc=(v)=>safe(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const CF='Cloudflare → Workers & Pages → devilndove-site-dev → Settings → Variables and Secrets.';
  const SECRET='Never save secret values, access/refresh tokens, passwords or private keys in D1, source, Markdown, screenshots or ordinary metadata fields. Store them only as approved Development secrets.';

  const PROVIDERS={
    STRIPE:{name:'Stripe',console:'Stripe Dashboard → Developers → API keys / Webhooks',docs:'https://docs.stripe.com/keys'},
    PAYPAL:{name:'PayPal',console:'PayPal Developer Dashboard → Apps & Credentials → Sandbox',docs:'https://developer.paypal.com/api/get-started/'},
    PINTEREST:{name:'Pinterest',console:'Pinterest Developers → My apps → Manage',docs:'https://developers.pinterest.com/docs/getting-started/connect-app/'},
    META:{name:'Meta / Facebook / Instagram',console:'Meta for Developers → My Apps → App settings / OAuth product settings',docs:'https://developers.facebook.com/apps/'},
    X:{name:'X',console:'X Developer Portal → Project/App → OAuth 2.0 settings',docs:'https://developer.x.com/'},
    TIKTOK:{name:'TikTok',console:'TikTok for Developers → Manage apps → selected app',docs:'https://developers.tiktok.com/doc/getting-started-create-an-app'},
    YOUTUBE:{name:'YouTube / Google',console:'Google Cloud Console → APIs & Services → Credentials',docs:'https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps'}
  };

  const ETSY={
    ETSY_API_KEYSTRING:{
      title:'How to obtain the Etsy API keystring',
      summary:'The Etsy API keystring identifies the approved Open API application used by Devil n Dove.',
      steps:[
        'Sign in to the Etsy account that owns the Devil n Dove shop and confirm the shop is active and in good standing.',
        'Open the Etsy Developer Portal. For an integration used only with your own shop, choose Create a seller app. Use a Personal App only when the application is intended for other Etsy users.',
        'Complete the application details and submit it. The API key is not active until Etsy approves the application.',
        'Open Manage Your Apps / Your Apps and select the approved application.',
        'Copy the Etsy App API Key keystring. Do not copy the shared secret into this value.',
        'Store it under the exact Development reference ETSY_API_KEYSTRING, then refresh the provider setup guide.'
      ],
      expected:'The Etsy App API Key keystring; not the shop name, listing ID, OAuth token or shared secret.',
      where:CF,
      safety:'Keep the keystring paired with the correct application. Etsy API v3 requests use the keystring together with its shared secret.',
      links:[['Register an Etsy app','https://www.etsy.com/developers/register'],['Etsy Open API','https://developers.etsy.com/'],['Etsy quick start','https://developers.etsy.com/documentation/tutorials/quickstart/']]
    },
    ETSY_SHARED_SECRET:{
      title:'How to obtain the Etsy shared secret',
      summary:'The shared secret is paired with the Etsy API keystring and is shown in the approved app record.',
      steps:['Open Etsy Developer → Manage Your Apps / Your Apps.','Open the approved Devil n Dove application.','Use the visibility control beside the shared secret to reveal it.','Copy it exactly and store it as the Cloudflare secret ETSY_SHARED_SECRET.','Return here and refresh the setup guide; do not paste the secret into D1 or registry metadata.'],
      expected:'The shared secret belonging to the same Etsy app as ETSY_API_KEYSTRING.',where:CF,safety:SECRET,
      links:[['Etsy authentication','https://developers.etsy.com/documentation/essentials/authentication/']]
    },
    ETSY_REDIRECT_URI:{
      title:'How to determine the Etsy redirect URI',
      summary:'This is the exact HTTPS callback in this application that receives the Etsy OAuth authorization response; Etsy does not issue it as a credential.',
      steps:['Use the callback displayed by this application once the Etsy provider-specific OAuth route is enabled. Do not invent a callback path.','The URI must use HTTPS.','Use the same redirect URI in the Etsy authorization request and token exchange when supplied.','Store the exact URL as ETSY_REDIRECT_URI.','If OAuth reports a redirect mismatch, compare scheme, host, path and trailing slash character-for-character.'],
      expected:'A complete HTTPS callback URL owned by the Development application.',where:CF,
      safety:'Changing redirect URIs can break OAuth or create an unsafe flow. Use only an application-owned callback.',
      links:[['Etsy OAuth authentication','https://developers.etsy.com/documentation/essentials/authentication/']]
    },
    ETSY_SHOP_ID:{
      title:'How to obtain the Etsy shop ID',
      summary:'Etsy uses a positive numeric shop_id in Open API resource paths. The shop ID is not the shop display name.',
      steps:['Complete Etsy app approval and authorize the intended shop.','Identify the authenticated Etsy user ID from the authorized account/token flow.','Call Etsy getShopByOwnerUserId (GET /v3/application/users/{user_id}/shops), or inspect another trusted Etsy Shop response.','Copy only the positive numeric shop_id returned for the Devil n Dove shop.','Store it as ETSY_SHOP_ID and refresh this page.'],
      expected:'A positive numeric Etsy shop_id; not the shop name or shop URL.',where:CF,
      safety:'Verify the ID belongs to the intended shop before any listing-write workflow is enabled.',
      links:[['Etsy API reference','https://developers.etsy.com/documentation/reference']]
    }
  };

  function objectHelp(title,summary,steps,extra={}){return {title,summary,steps,...extra};}
  function providerHelp(ref){
    if(ETSY[ref])return ETSY[ref];
    const prefix=Object.keys(PROVIDERS).find((key)=>ref.startsWith(key+'_'));
    if(!prefix)return null;
    const p=PROVIDERS[prefix], upper=ref.toUpperCase();
    let kind='configuration value', action='Find the provider-issued value in the selected application/account and copy it exactly.';
    let safety='Verify the value belongs to the Development/test/sandbox application before saving.';
    if(/SECRET|TOKEN/.test(upper)){kind='secret credential';action='Reveal the secret in the provider application credentials and copy it exactly.';safety=SECRET;}
    else if(/CLIENT_ID|APP_ID|CLIENT_KEY|PUBLISHABLE_KEY/.test(upper)){kind='application identifier';action='Open the application credentials and copy the Client ID, App ID, Client key or publishable key exactly as shown.';}
    else if(/REDIRECT_URI/.test(upper)){kind='OAuth redirect URI';action='Copy the exact Development callback shown by this application, register that URL in the provider OAuth settings, and use the identical URL here.';}
    else if(/WEBHOOK_ID/.test(upper)){kind='webhook identifier';action='Create/save the Development webhook in the provider app, then copy the provider-issued Webhook ID.';}
    else if(/WEBHOOK_SECRET/.test(upper)){kind='webhook signing secret';action='Open the saved Development webhook endpoint and reveal/copy its signing secret.';safety=SECRET;}
    return objectHelp(`How to obtain ${ref}`,`${ref} is a ${kind} for ${p.name}.`,[`Open ${p.console}.`,action,`Store the value under the exact Development reference ${ref}.`,'Return to the backend and refresh the provider readiness/setup guide to confirm the reference is present.'],{expected:`The ${p.name} value corresponding specifically to ${ref}.`,where:CF,safety,links:[[`${p.name} official developer documentation`,p.docs]]});
  }

  const GENERIC={
    IT_CREDENTIAL_REFERENCE:objectHelp('What belongs in a credential/binding reference field','This field stores the environment variable/secret name, not the secret value itself.',['Obtain the credential in the external provider console.','Create the required variable or secret under the Development Cloudflare project.','Enter only the reference name used by the application, for example PROVIDER_CLIENT_SECRET.','Use provider readiness to confirm the reference exists.'],{expected:'A stable configuration reference name, not an API key or token value.',where:CF,safety:SECRET}),
    OAUTH_SCOPES:objectHelp('How to choose OAuth scopes / permissions','Scopes come from the external provider and control what the connected account allows.',['Open the provider OAuth/API permission documentation.','Start with the smallest permissions required by implemented workflows.','Add write/publishing scopes only when those workflows exist and are deliberately accepted.','Copy provider scope identifiers exactly in the format requested by this field.'],{expected:'Provider-defined OAuth scope identifiers.',safety:'Do not request broad permissions simply because they are available.'}),
    CALLBACK_URL:objectHelp('How to determine a callback / redirect URL','The callback is an application-owned HTTPS route, not a value invented by the provider.',['Use the exact callback displayed by the backend/provider setup guide.','Register that exact URL in the external provider developer console.','Store the same URL in Development configuration.','For mismatch errors, compare the entire URL character-for-character.'],{expected:'A complete HTTPS callback URL on the Development application.'}),
    WEBHOOK_URL:objectHelp('How to configure a webhook URL','A webhook URL is the HTTPS endpoint where the provider sends events.',['Use the exact deployed webhook endpoint documented by this application.','Add it in the provider app/webhook settings.','Select only event types handled by this application.','Save the webhook and record any provider-issued ID/signing secret in its own protected configuration field.'],{expected:'A complete HTTPS endpoint owned by the application.'}),
    EXTERNAL_URL:objectHelp('How to obtain an external URL','Copy the canonical HTTPS URL from the external system that owns the resource.',['Open the exact external listing, source, provider record or account page requested.','Use its canonical/share URL when available.','Copy the full https:// URL without tracking parameters when possible.','Confirm it opens the intended resource before saving.'],{expected:'A complete https:// URL for the requested external resource.'}),
    EXTERNAL_ID:objectHelp('How to obtain an external identifier','Use the immutable identifier assigned by the external provider, not a display name.',['Open the provider/account/resource details.','Find the field labelled ID, Shop ID, Account ID, Listing ID, App ID or equivalent.','Copy the identifier exactly without labels or URL text.','Verify it belongs to the intended account/resource before saving.'],{expected:'The provider-issued identifier only.'})
  };

  const EXACT_IDS={itCredential:'IT_CREDENTIAL_REFERENCE',itScopes:'OAUTH_SCOPES',itCallback:'CALLBACK_URL',itWebhook:'WEBHOOK_URL'};
  function lookup(key){return ETSY[key]||providerHelp(key)||GENERIC[key]||null;}

  function ensureStyles(){
    if(document.getElementById('ddExternalHelpStyles'))return;
    const s=document.createElement('style');s.id='ddExternalHelpStyles';
    s.textContent='.dd-help-trigger{display:inline-grid;place-items:center;width:22px;height:22px;min-width:22px;margin-left:6px;padding:0;border:1px solid currentColor;border-radius:50%;background:transparent;color:inherit;font:700 13px/1 system-ui;cursor:pointer;vertical-align:middle}.dd-help-trigger:hover,.dd-help-trigger:focus-visible{outline:2px solid currentColor;outline-offset:2px}.dd-help-dialog[hidden]{display:none!important}.dd-help-dialog{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;background:rgba(2,6,23,.72)}.dd-help-panel{width:min(760px,100%);max-height:84vh;overflow:auto;background:var(--card,#111827);color:var(--text,#f8fafc);border:1px solid rgba(148,163,184,.4);border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.45);padding:20px}.dd-help-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.dd-help-head h2{margin:0;font-size:1.25rem}.dd-help-close{min-width:44px;min-height:44px}.dd-help-summary{margin:10px 0 14px}.dd-help-section{margin-top:14px;padding-top:12px;border-top:1px solid rgba(148,163,184,.24)}.dd-help-section h3{margin:0 0 7px;font-size:1rem}.dd-help-section ol{margin:6px 0 0;padding-left:22px}.dd-help-section li+li{margin-top:6px}.dd-help-links{display:flex;gap:8px;flex-wrap:wrap}.dd-help-links a{display:inline-flex;align-items:center;min-height:40px;padding:7px 10px;border:1px solid rgba(148,163,184,.38);border-radius:9px}.dd-help-safety{font-weight:650}@media(max-width:640px){.dd-help-dialog{padding:8px}.dd-help-panel{max-height:94vh;padding:15px}.dd-help-links a{width:100%}}';
    document.head.appendChild(s);
  }

  let lastFocus=null;
  function ensureDialog(){
    let root=document.getElementById('ddExternalHelpDialog');if(root)return root;
    root=document.createElement('div');root.id='ddExternalHelpDialog';root.className='dd-help-dialog';root.hidden=true;
    root.innerHTML='<section class="dd-help-panel" role="dialog" aria-modal="true" aria-labelledby="ddExternalHelpTitle"><div class="dd-help-head"><h2 id="ddExternalHelpTitle">Help</h2><button type="button" class="btn dd-help-close" aria-label="Close help">Close</button></div><div id="ddExternalHelpBody"></div></section>';
    document.body.appendChild(root);
    root.querySelector('.dd-help-close').addEventListener('click',close);
    root.addEventListener('click',(e)=>{if(e.target===root)close();});
    document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&!root.hidden)close();});
    return root;
  }

  function section(title,html){return html?`<section class="dd-help-section"><h3>${esc(title)}</h3>${html}</section>`:'';}
  function open(keyOrData,trigger){
    const data=typeof keyOrData==='string'?lookup(keyOrData):keyOrData;if(!data)return;
    const root=ensureDialog();lastFocus=trigger||document.activeElement;
    root.querySelector('#ddExternalHelpTitle').textContent=data.title||'Help';
    const steps=Array.isArray(data.steps)&&data.steps.length?`<ol>${data.steps.map((x)=>`<li>${esc(x)}</li>`).join('')}</ol>`:'';
    const links=Array.isArray(data.links)&&data.links.length?`<div class="dd-help-links">${data.links.map(([label,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join('')}</div>`:'';
    root.querySelector('#ddExternalHelpBody').innerHTML=`${data.summary?`<p class="dd-help-summary">${esc(data.summary)}</p>`:''}${section('How to get it',steps)}${section('Expected value',data.expected?`<p>${esc(data.expected)}</p>`:'')}${section('Where to put it',data.where?`<p>${esc(data.where)}</p>`:'')}${section('Safety / validation',data.safety?`<p class="dd-help-safety">${esc(data.safety)}</p>`:'')}${section('Official provider resources',links)}`;
    root.hidden=false;document.documentElement.style.overflow='hidden';root.querySelector('.dd-help-close').focus();
  }
  function close(){const root=document.getElementById('ddExternalHelpDialog');if(!root||root.hidden)return;root.hidden=true;document.documentElement.style.overflow='';lastFocus?.focus?.();lastFocus=null;}
  function makeTrigger(key,label){
    const b=document.createElement('button');b.type='button';b.className='dd-help-trigger';b.textContent='i';b.dataset.externalHelpKey=key;b.setAttribute('aria-label',`Help: ${label||key}`);
    b.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();open(key,b);});return b;
  }
  function labelFor(control){const id=safe(control.id),explicit=id?document.querySelector(`label[for="${CSS.escape(id)}"]`):null;return explicit||control.closest('label');}
  function labelText(control){return safe(labelFor(control)?.innerText).replace(/\bHelp:.*$/,'').trim();}
  function inferred(control){
    if(EXACT_IDS[control.id])return EXACT_IDS[control.id];
    const h=`${control.id||''} ${control.name||''} ${control.placeholder||''} ${labelText(control)}`.toLowerCase();
    if(/\b(scope|scopes|permission|permissions)\b/.test(h))return 'OAUTH_SCOPES';
    if(/\b(callback|redirect)\b/.test(h)&&/\b(url|uri|oauth|callback|redirect)\b/.test(h))return 'CALLBACK_URL';
    if(/\bwebhook\b/.test(h)&&/\b(url|uri|endpoint)\b/.test(h))return 'WEBHOOK_URL';
    if(/\b(external|source|listing|marketplace|provider)\b/.test(h)&&/\burl\b/.test(h))return 'EXTERNAL_URL';
    if(/\b(api key|keystring|shared secret|client id|client secret|app id|app secret|access token|refresh token|webhook secret|signing secret|credential)\b/.test(h))return 'IT_CREDENTIAL_REFERENCE';
    if(/\b(shop id|merchant id|provider id|external id|marketplace id|listing id|channel id|account id)\b/.test(h))return 'EXTERNAL_ID';
    return '';
  }
  function bindControl(control){
    if(!control||control.dataset.externalHelpBound==='1'||control.type==='hidden')return;
    const key=safe(control.dataset.externalHelpKey)||inferred(control);if(!key||!lookup(key))return;
    const label=labelFor(control);if(!label)return;const target=label.querySelector('.small')||label;
    if(target.querySelector?.(`.dd-help-trigger[data-external-help-key="${CSS.escape(key)}"]`)){control.dataset.externalHelpBound='1';return;}
    const b=makeTrigger(key,labelText(control)||key);if(target===label&&control.parentElement===label)label.insertBefore(b,control);else target.appendChild(b);control.dataset.externalHelpBound='1';
  }
  function bindProviderRows(root=document){
    root.querySelectorAll?.('.it-setup-field code').forEach((code)=>{const key=safe(code.textContent);if(!lookup(key)||code.parentElement?.querySelector(`.dd-help-trigger[data-external-help-key="${CSS.escape(key)}"]`))return;code.insertAdjacentElement('afterend',makeTrigger(key,key));});
  }
  function scan(root=document){ensureStyles();root.querySelectorAll?.('input:not([type="hidden"]),select,textarea').forEach(bindControl);bindProviderRows(root);}
  let queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan(document);});}
  function init(){ensureStyles();ensureDialog();scan(document);new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});}
  window.DDExternalHelp={open,close,scan,lookup};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
