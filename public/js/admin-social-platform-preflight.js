// Build 672 — read-only account identity and exact public derivative owner approval.
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const text = value => String(value ?? '');
  const api = async (action, extras = {}) => {
    if (!window.DDAuth?.apiFetch) throw new Error('Admin authentication is unavailable.');
    const response = await window.DDAuth.apiFetch('/api/admin/social-post-queue', action
      ? { method: 'POST', body: JSON.stringify({ action, ...extras }) }
      : undefined);
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || result.message || 'Request failed.');
    return result;
  };
  const show = (id, message) => { const node = byId(id); if (node) node.textContent = message; };
  document.addEventListener('DOMContentLoaded', () => {
    if (!byId('dd672-owner-gate')) return;
    const verify = byId('dd672Verify');
    verify?.addEventListener('click', async () => {
      verify.disabled = true;
      show('dd672Accounts', 'Checking configured destinations with each provider…');
      try {
        const data = await api('verify_accounts_672');
        const lines = (data.accounts || []).map(account =>
          `${account.platform}: ${account.verified ? 'VERIFIED' : 'HOLD'} · ${account.verified ? (account.account_name || account.account_id || 'Identity confirmed') : account.status}`);
        show('dd672Accounts', lines.join(' | ') || 'No destinations available.');
      } catch (error) { show('dd672Accounts', 'HOLD · ' + error.message); }
      finally { verify.disabled = false; }
    });
    const load = async () => {
      const select = byId('dd672Queue');
      select.replaceChildren(new Option('Choose an unposted CAIP draft', ''));
      try {
        const data = await api();
        const queue = (data.queue || []).filter(item => item.source_type === 'caip_project' && item.post_status !== 'posted');
        for (const item of queue) {
          const id = item.social_post_queue_id;
          select.add(new Option(`#${id} · Project ${item.source_id} · ${text(item.caption || item.title).slice(0, 65)}`, id));
        }
        show('dd672Status', queue.length ? 'Select a draft, then approve its exact verified public derivative.' : 'HOLD · No unposted CAIP-linked drafts.');
      } catch (error) { show('dd672Status', 'HOLD · ' + error.message); }
    };
    byId('dd672LoadQueue')?.addEventListener('click', load);
    byId('dd672Derivative')?.addEventListener('submit', async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('[type="submit"]');
      button.disabled = true;
      show('dd672Status', 'Checking canonical CAIP rights, consent and exact URL…');
      try {
        const result = await api('approve_caip_derivative_672', {
          social_post_queue_id: Number(byId('dd672Queue').value),
          creative_asset_id: Number(byId('dd672Asset').value),
          public_url: byId('dd672Url').value.trim(),
          exact_media_reviewed: byId('dd672Reviewed').checked,
          owner_confirmed: byId('dd672Owner').checked
        });
        show('dd672Status', `Recorded approval for CAIP asset #${result.creative_asset_id}. Post remains a draft; no publication was performed.`);
        byId('dd672Reviewed').checked = false;
        byId('dd672Owner').checked = false;
      } catch (error) { show('dd672Status', 'HOLD · ' + error.message); }
      finally { button.disabled = false; }
    });
    void load();
  });
})();
// Build 211 — browser-only social post preview and platform media preflight.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const limits = {
    instagram: { caption: 2200, imageRequired: true, label: 'Instagram', formats: ['jpg','jpeg'], minWidth: 320, minRatio: 0.8, maxRatio: 1.91 },
    facebook: { caption: 63206, imageRequired: false, label: 'Facebook', formats: ['jpg','jpeg','png','webp'], minWidth: 500, minRatio: 0.4, maxRatio: 2.5 },
    pinterest: { caption: 500, imageRequired: true, label: 'Pinterest', formats: ['jpg','jpeg','png','webp'], minWidth: 600, minRatio: 0.4, maxRatio: 1.5 },
    x: { caption: 280, imageRequired: false, label: 'X', formats: ['jpg','jpeg','png','webp'], minWidth: 0, minRatio: 0.1, maxRatio: 10 }
  };
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function extension(url){try{const p=new URL(url).pathname.toLowerCase();return (p.match(/\.([a-z0-9]+)$/)||[])[1]||'';}catch{return '';}}
  function result(kind,title,detail){return `<li class="social-check ${kind}"><strong>${esc(title)}</strong><span>${esc(detail)}</span></li>`;}
  function loadImage(url){return new Promise((resolve)=>{if(!url)return resolve(null);const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight,ratio:img.naturalWidth/img.naturalHeight});img.onerror=()=>resolve({error:true});img.src=url;});}
  async function run(){
    const key=$('socialPreflightPlatform')?.value||'instagram'; const rule=limits[key];
    const caption=($('socialPreflightCaption')?.value||'').trim(); const link=($('socialPreflightLink')?.value||'').trim(); const image=($('socialPreflightImage')?.value||'').trim();
    const checks=[];
    checks.push(caption ? result(caption.length<=rule.caption?'pass':'fail','Caption length',`${caption.length} of ${rule.caption} characters used.`) : result('warn','Caption missing','Add final reviewed copy before publishing.'));
    let linkOk=false; try{const u=new URL(link); linkOk=u.protocol==='https:'; checks.push(result(linkOk?'pass':'fail','Destination link',linkOk?'Public HTTPS link format looks valid.':'Use a complete public HTTPS URL.'));}catch{checks.push(result('fail','Destination link','Enter a complete public HTTPS URL.'));}
    if(!image){checks.push(result(rule.imageRequired?'fail':'warn','Image URL',rule.imageRequired?'This platform workflow requires an image.':'No image supplied; a text/link post may still be possible.'));}
    else {
      let imageUrlOk=false; try{const u=new URL(image);imageUrlOk=u.protocol==='https:';}catch{}
      checks.push(result(imageUrlOk?'pass':'fail','Image URL',imageUrlOk?'Image uses HTTPS.':'Use a complete public HTTPS image URL.'));
      const ext=extension(image); checks.push(result(rule.formats.includes(ext)?'pass':'warn','Image format',ext?`${ext.toUpperCase()} detected. Expected: ${rule.formats.join(', ')}.`:`The URL does not expose a file extension. Confirm the server returns a supported image type.`));
      const meta=await loadImage(image);
      if(meta?.error) checks.push(result('fail','Image access','The browser could not load this image. Confirm it is public, permits hotlinking, and is not behind admin authentication.'));
      else if(meta){
        checks.push(result(meta.width>=rule.minWidth?'pass':'warn','Image dimensions',`${meta.width} × ${meta.height}px. Recommended minimum width for this check: ${rule.minWidth}px.`));
        checks.push(result(meta.ratio>=rule.minRatio&&meta.ratio<=rule.maxRatio?'pass':'warn','Aspect ratio',`${meta.ratio.toFixed(2)}:1. Expected range for this workflow: ${rule.minRatio}:1 to ${rule.maxRatio}:1.`));
      }
    }
    const results=$('socialPreflightResults'); if(results) results.innerHTML=`<h3>${esc(rule.label)} preflight</h3><ul class="social-check-list">${checks.join('')}</ul><p class="small">Passing this check does not publish anything and does not prove media consent, copyright, product availability, or platform approval.</p>`;
    const preview=$('socialPreflightPreview'); if(preview){preview.hidden=false;$('socialPreviewPlatform').textContent=rule.label;$('socialPreviewCaption').textContent=caption||'Caption preview';const a=$('socialPreviewLink');a.href=linkOk?link:'#';a.textContent=linkOk?link:'Destination link not ready';const img=$('socialPreviewImage');if(image){img.src=image;img.hidden=false;}else{img.removeAttribute('src');img.hidden=true;}}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    $('socialPreflightRun')?.addEventListener('click',run);
    $('socialPreflightClear')?.addEventListener('click',()=>{['socialPreflightCaption','socialPreflightLink','socialPreflightImage'].forEach(id=>{if($(id))$(id).value='';});if($('socialPreflightResults'))$('socialPreflightResults').innerHTML='<p class="small">Preflight cleared. Nothing was saved or published.</p>';if($('socialPreflightPreview'))$('socialPreflightPreview').hidden=true;});
  });
})();
