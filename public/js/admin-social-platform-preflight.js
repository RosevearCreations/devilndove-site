// Build 675 — independently sourced engagement snapshots and evidence-labelled attribution.
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const append=(target,values)=>{const row=document.createElement('tr');for(const value of values){const cell=document.createElement('td');cell.textContent=String(value??'—');row.append(cell);}target.append(row);};
  const request=async body=>{if(!window.DDAuth?.apiFetch)throw Error('Admin authentication required');
    const res=await window.DDAuth.apiFetch('/api/admin/social-post-queue',body?{method:'POST',body:JSON.stringify(body)}:undefined);
    const data=await res.json();if(!res.ok||!data.ok)throw Error(data.error||'Evidence unavailable');return data;};
  async function load(){try{const data=await request(),funnel=$('dd675Funnel'),snap=$('dd675Snapshots');funnel.replaceChildren();snap.replaceChildren();
    const rollups=data.utm_rollups||[],evidence=data.engagement675?.snapshots||[];
    for(const row of rollups)append(funnel,[row.utm_campaign,row.utm_source+' / '+row.utm_medium,row.page_views,row.visitor_sessions||row.session_count,row.checkout_starts,row.custom_request_count]);
    for(const row of evidence)append(snap,[row.campaign+' / '+row.platform,row.provider_id,Object.entries(row.metrics||{}).map(([key,value])=>key+': '+value).join(' · '),row.observed_at]);
    if(!rollups.length)append(funnel,['No attributed campaign evidence','','','','','']);
    if(!evidence.length)append(snap,['No independently verified engagement snapshots','','','']);
    const selector=$('dd675Queue'),prior=selector.value;selector.replaceChildren(new Option('Choose a published item',''));
    for(const q of data.queue||[])if(q.post_status==='posted'||q.published_at)selector.add(new Option('#'+q.social_post_queue_id+' · '+(q.title||'Post').slice(0,55),q.social_post_queue_id));
    selector.value=prior; // Keep the owner's selected post if still present.
    $('dd675Roi').textContent='ROI: UNAVAILABLE · Confirmed attributed sales revenue and evidenced campaign spend are not both present. Visits, checkouts and enquiries are separate indicators, not financial return.';
  }catch(error){$('dd675Roi').textContent='HOLD · '+error.message;}}
  document.addEventListener('DOMContentLoaded',()=>{if(!$('dd675-roi'))return;$('dd675Refresh')?.addEventListener('click',load);
    $('dd675Verify').addEventListener('submit',async e=>{e.preventDefault();$('dd675Result').textContent='Requesting read-only provider evidence…';
      try{const data=await request({action:'verify_engagement_675',social_post_queue_id:Number($('dd675Queue').value),platform_key:$('dd675Platform').value});
        const result=data.result||{};$('dd675Result').textContent=result.verified?'Verified '+result.platform+' metrics from provider; snapshot recorded.':'HOLD · '+(result.status||'No verified metrics');await load();
      }catch(error){$('dd675Result').textContent='HOLD · '+error.message;}});
    void load();
  });
})();
// Build 674 — owner campaign calendar and source-grounded cross-channel command centre.
(() => {
  'use strict';
  const $=id=>document.getElementById(id),add=(row,values)=>{for(const v of values){const c=document.createElement('td');c.textContent=String(v??'—');row.append(c);}};
  let queue=[],receipts=[];
  const request=async body=>{const res=await window.DDAuth.apiFetch('/api/admin/social-post-queue',body?{method:'POST',body:JSON.stringify(body)}:undefined);const json=await res.json();if(!res.ok||!json.ok)throw Error(json.error||'Campaign data unavailable');return json;};
  function render(){
    const month=$('dd674Month').value,campaign=$('dd674Campaign').value,body=$('dd674Calendar');body.replaceChildren();
    const selected=queue.filter(q=>(!campaign||(q.utm_campaign||'')===campaign)&&String(q.scheduled_at||q.created_at||'').slice(0,7)===month);
    for(const q of selected){const row=document.createElement('tr');add(row,[String(q.scheduled_at||q.created_at||'').slice(0,16),q.utm_campaign||'Unattributed', (q.target_platforms||[]).join(', '),q.approval_status+' / '+q.post_status]);row.children[1].append(document.createTextNode(' · '+(q.title||'')));body.append(row);}
    if(!selected.length){const r=document.createElement('tr');add(r,['No matching scheduled or created drafts.','','','']);body.append(r);}
    const byChannel=new Map();
    for(const r of receipts){const name=r.platform_key||'unknown',s=byChannel.get(name)||{ack:0,verified:0,failed:0,hold:0};if(r.attempt_status==='api_posted')s.ack++;if(r.attempt_status==='receipt_verified')s.verified++;if(r.attempt_status==='api_failed')s.failed++;if(['blocked_account_unverified','recovery_requested'].includes(r.attempt_status))s.hold++;byChannel.set(name,s);}
    const channelBody=$('dd674Channels');channelBody.replaceChildren();for(const [name,s] of byChannel){const row=document.createElement('tr');add(row,[name,s.ack,s.verified,s.failed,s.hold]);channelBody.append(row);}
    $('dd674Summary').textContent=`${selected.length} visible posts · ${new Set(selected.map(q=>q.utm_campaign).filter(Boolean)).size} named campaigns · ${receipts.length} recent channel outcomes. Results are recorded evidence only; no inferred reach.`;
  }
  async function load(){try{const data=await request();queue=data.queue||[];receipts=data.receipts673?.channels||[];const campaigns=[...new Set(queue.map(q=>q.utm_campaign).filter(Boolean))].sort();const selector=$('dd674Campaign'),prior=selector.value;selector.replaceChildren(new Option('All campaigns',''));for(const c of campaigns)selector.add(new Option(c,c));selector.value=campaigns.includes(prior)?prior:'';const draft=$('dd674Queue');draft.replaceChildren(new Option('Choose a draft',''));for(const q of queue.filter(q=>q.post_status!=='posted'&&q.post_status!=='archived'))draft.add(new Option('#'+q.social_post_queue_id+' · '+(q.title||'Draft').slice(0,60),q.social_post_queue_id));render();}catch(e){$('dd674Message').textContent='HOLD · '+e.message;}}
  document.addEventListener('DOMContentLoaded',()=>{if(!$('dd674-marketing'))return;$('dd674Month').value=new Date().toISOString().slice(0,7);$('dd674Month').addEventListener('change',render);$('dd674Campaign').addEventListener('change',render);
    $('dd674Schedule').addEventListener('submit',async event=>{event.preventDefault();const id=Number($('dd674Queue').value),date=new Date($('dd674Date').value);if(!id||!Number.isFinite(date.getTime()))return;$('dd674Message').textContent='Saving owner-review schedule…';
      try{await request({action:'campaign_schedule_674',social_post_queue_id:id,campaign_name:$('dd674Name').value.trim(),scheduled_at:date.toISOString(),schedule_timezone:Intl.DateTimeFormat().resolvedOptions().timeZone});$('dd674Message').textContent='Campaign schedule saved as draft; approval reset to needs review. No post published.';await load();}catch(e){$('dd674Message').textContent='HOLD · '+e.message;}});
    void load();
  });
})();
// Build 673 — per-channel receipt status, independently checked evidence and one-channel recovery.
(() => {
  'use strict';
  const el=id=>document.getElementById(id);
  const call=async (action,values={})=>{
    if(!window.DDAuth?.apiFetch)throw Error('Authenticated admin session required.');
    const response=await window.DDAuth.apiFetch('/api/admin/social-post-queue',action
      ?{method:'POST',body:JSON.stringify({action,...values})}:undefined);
    const data=await response.json();
    if(!response.ok||!data.ok)throw Error(data.error||'Social evidence unavailable.');
    return data;
  };
  const cell=(row,value)=>{const td=document.createElement('td');td.textContent=String(value??'—');row.append(td);return td;};
  const load=async()=>{
    const area=el('dd673Rows');if(!area)return;
    try{
      const data=await call();const view=data.receipts673||{channels:[],totals:{}};
      const counts=view.totals;
      el('dd673Totals').textContent=`Provider acknowledged: ${counts.provider_acknowledged||0} · Independently verified: ${counts.independently_verified||0} · Failed: ${counts.failed||0} · HOLD: ${counts.on_hold||0} · Manual records: ${counts.manually_recorded||0}. Counts reflect the latest 150 recorded attempts, not audience reach.`;
      area.replaceChildren();
      for(const entry of view.channels){
        const row=document.createElement('tr');
        cell(row,`#${entry.social_post_queue_id} · ${entry.title||''}`);
        cell(row,entry.platform_key);cell(row,entry.attempt_status);
        const idCell=cell(row,entry.external_post_id||'Not recorded');
        if(entry.external_post_url?.startsWith('https://')){
          const link=document.createElement('a');link.href=entry.external_post_url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=' · Open provider link';idCell.append(link);
        }
        cell(row,entry.attempted_at);const actions=cell(row,'');
        if(['api_posted','receipt_verified'].includes(entry.attempt_status)){
          const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='Verify provider receipt';
          button.addEventListener('click',()=>run(button,'verify_publication_673',entry));actions.append(button);
        }else if(entry.attempt_status==='api_failed'){
          const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';
          label.append(check,document.createTextNode(' Checked provider: no duplicate'));
          const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='Retry failed channel';
          button.addEventListener('click',()=>{if(!check.checked){el('dd673Result').textContent='HOLD · Confirm the destination was checked for an existing post.';return;}
            run(button,'retry_failed_673',entry,{owner_checked_no_duplicate:true});});
          actions.append(label,button);
        }
        area.append(row);
      }
      if(!view.channels.length)area.append(Object.assign(document.createElement('tr'),{textContent:'No recorded deliveries yet.'}));
    }catch(error){el('dd673Totals').textContent='HOLD · '+error.message;}
  };
  async function run(button,action,entry,extra={}){
    button.disabled=true;el('dd673Result').textContent='Checking the selected channel…';
    try{const data=await call(action,{social_post_queue_id:entry.social_post_queue_id,platform_key:entry.platform_key,...extra});
      const result=data.result||{};
      el('dd673Result').textContent=result.verified?'VERIFIED · Provider confirms the same publication ID.':
        result.status&&!result.verified?`HOLD · ${result.status}; no new post created.`:
        'Recovery request completed. Inspect the latest channel status below; no other channels were retried.';
      await load();
    }catch(error){el('dd673Result').textContent='HOLD · '+error.message;}
    finally{button.disabled=false;}
  }
  document.addEventListener('DOMContentLoaded',()=>{if(!el('dd673-receipts'))return;el('dd673Refresh')?.addEventListener('click',load);void load();});
})();
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
