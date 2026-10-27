/* Build 498 — one canonical tag source, independently saved local advanced
 * profiles, and a persistent SKU/slug/Etsy listing receipt view. No remote
 * provider POST/PATCH is initiated by any control in this module. */
import { channelTags498 } from './product-semantic-tags-v498.mjs';

const form = document.getElementById('productEditorForm');
const identity = document.getElementById('dd498Identity');
const productId = Number(new URLSearchParams(location.search).get('product_id') || 0);
if (form && identity && window.DDAuth?.apiFetch) {
  const field = name => form.elements.namedItem(name);
  const saved = () => productId > 0 && form.dataset.productAuthority === 'ready' && form.dataset.productDirty !== '1';
  const normal = value => String(value ?? '').trim();
  const split = value => normal(value).split(',').map(item => item.trim()).filter(Boolean);
  const parseList = value => { try { const result = JSON.parse(value || '[]'); return Array.isArray(result) ? result : []; } catch { return []; } };
  const canonical = () => channelTags498(field('keywords')?.value || '');
  async function api(path, body) {
    const response = await window.DDAuth.apiFetch(path, body ? {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body), cache:'no-store',
    } : {method:'GET', cache:'no-store'});
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw Error(data?.error || `HTTP ${response.status}`);
    return data;
  }

  function renderTagLibrary() {
    const data = canonical(), root = document.getElementById('dd498TagsByChannel');
    if (!root) return;
    root.replaceChildren();
    const variants = [
      ['Our store','canonical','Searchable catalog phrases saved in Product SEO.'],
      ['Etsy','etsy','Up to 13 tags, 20 characters each. Remote update needs separate approval.'],
      ['Marketplace','facebook','Manual listing search phrases, not an automatic Facebook upload.'],
      ['Google','google','Use naturally in product title/content. Google ignores meta keywords.'],
      ['Instagram','instagram','Hashtags prepared for copying only.'],
      ['TikTok','tiktok','Hashtags prepared for copying only.'],
      ['Pinterest','pinterest','Pin description/search terms; no provider transfer.'],
      ['YouTube','youtube','Video description hashtag suggestions; no provider transfer.'],
    ];
    for (const [label, key, hint] of variants) {
      const card = document.createElement('section'); card.className = 'dd498-tag-channel';
      const h = document.createElement('h4'); h.textContent = label;
      const terms = document.createElement('p'); terms.textContent = data[key].join(key === 'instagram' || key === 'tiktok' || key === 'youtube' ? ' ' : ', ') || 'No phrases yet';
      const explain = document.createElement('p'); explain.className = 'small'; explain.textContent = hint;
      const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'btn'; copy.textContent = `Copy ${label} terms`; copy.disabled = data[key].length === 0;
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(terms.textContent);
          copy.textContent = 'Copied ✓'; setTimeout(() => {copy.textContent = `Copy ${label} terms`;}, 1500);
        } catch { copy.textContent = 'Copy blocked — select the text above'; }
      });
      card.append(h, terms, explain, copy); root.append(card);
    }
    const warning = document.getElementById('dd498TagWarnings');
    warning.textContent = data.warnings.length ? `Review before Etsy transfer: ${data.warnings.join(' ')}` :
      data.canonical.length ? `${data.canonical.length} unique phrases. ${saved() ? 'The displayed phrases match the saved Product.' : 'Preview only: save Product to persist the new phrases.'}` :
      'Add comma-separated Product search phrases above. No channel posting occurs here.';
  }

  let identityBusy = false;
  async function refreshIdentity() {
    if (identityBusy) return;
    if (!productId || form.dataset.productAuthority !== 'ready') {
      identity.textContent = productId ? 'Waiting for the saved Product to load.' : 'Save Product once to create its permanent ID, SKU, slug and optional Etsy link.';
      return;
    }
    identityBusy = true;
    const refresh = document.getElementById('dd498IdentityRefresh'); if (refresh) refresh.disabled = true;
    identity.textContent = 'Reading the saved Product and local Etsy draft receipt (no Etsy call)…';
    try {
      const data = await api(`/api/admin/product-etsy-existing-draft?product_id=${productId}`);
      if (Number(data.product_id) !== productId) throw Error('Saved Product identity mismatch.');
      identity.replaceChildren();
      const values = document.createElement('span');
      values.textContent = `Product #${productId} · SKU: ${data.product_sku || 'not set'} · Slug: ${data.product_slug || 'not set'} · `;
      identity.append(values);
      const listing = normal(data.linked_listing_id);
      const result = document.createElement('strong');
      result.textContent = listing ? `Etsy draft ID #${listing}` : 'Etsy draft ID: not linked';
      identity.append(result);
      if (listing) {
        const space = document.createTextNode(' · '), link = document.createElement('a');
        link.href = 'https://www.etsy.com/your/shops/me/listings/drafts';
        link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Find this draft in Etsy';
        const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'btn'; copy.textContent = 'Copy Etsy ID';
        copy.addEventListener('click', async () => {try {await navigator.clipboard.writeText(listing);copy.textContent='Copied ✓';}catch{copy.textContent='Copy blocked';}});
        identity.append(space, link, document.createTextNode(' '), copy);
      }
      const note = document.getElementById('dd498IdentityNote');
      if (note) note.textContent = listing ?
        `The Etsy ID is saved against Product #${productId} in D1, independent of SKU and slug. This is a local link receipt, not fresh verification that Etsy is unpublished or that photos/tags transferred.` :
        'No verified local Etsy listing receipt is attached to this Product. If Etsy already contains an original draft, use Verify + Link existing draft in the Etsy tab; do not create a duplicate.';
    } catch (error) {
      identity.textContent = `HOLD — Product/Etsy identity read failed: ${error.message}. Do not create another draft to fix a missing ID.`;
    } finally {identityBusy=false;if(refresh)refresh.disabled=false;}
  }

  const acceptanceButton = document.getElementById('dd498OwnerAcceptanceRun');
  const acceptanceResult = document.getElementById('dd498OwnerAcceptanceResult');
  const acceptanceNote = text => {
    if (!acceptanceResult) return;
    const line = document.createElement('li');line.textContent = text;acceptanceResult.append(line);
  };
  async function verifyProduct53() {
    if(!acceptanceButton||!acceptanceResult||!saved()||productId!==53)return;
    acceptanceButton.disabled=true;
    acceptanceResult.replaceChildren();acceptanceNote('Checking Etsy draft identity, approved originals, live photo receipts and native tags. Read only…');
    try {
      const [link,gallery,images,tags] = await Promise.all([
        api('/api/admin/product-etsy-existing-draft?product_id=53'),
        api('/api/admin/product-distribution-406?product_id=53&channel=etsy'),
        api('/api/admin/product-etsy-images?product_id=53&reconcile=1'),
        api('/api/admin/product-etsy-tags?product_id=53&reconcile=1'),
      ]);
      acceptanceResult.replaceChildren();
      if([link.product_id,gallery.product_id,images.product_id,tags.product_id].some(id=>Number(id)!==53))throw Error('Product identity changed between checks.');
      const listed=normal(link.linked_listing_id),isExpected=listed==='4603838854';
      const sameDraft=listed&&String(images.listing_id||'')===listed&&String(tags.listing_id||'')===listed;
      acceptanceNote(`${isExpected&&sameDraft?'Verified':'HOLD'} — Product #53 saved Etsy link: ${listed||'missing'}; expected example #4603838854. ${sameDraft?'All receipt references agree.':'Image/tag receipts do not agree.'}`);
      const originals=gallery.gallery||[],eligible=originals.filter(row=>row.approved_for_distribution);
      const receipts=images.images||[],transferred=receipts.filter(row=>row.transferred);
      const gap=images.photo_gap_492,photoMatched=images.remote_reconciliation?.ready===true&&gap?.state==='matched';
      acceptanceNote(`${photoMatched?'Verified':'HOLD'} — ${originals.length} original Product photo(s); ${eligible.length} externally approved; ${transferred.length} local Etsy image receipt(s); ${images.hold_unconfirmed_claims||0} unresolved claim(s). Live Etsy: ${gap?.reason||images.remote_reconciliation?.reason||'verification not returned'}.`);
      acceptanceNote(`${tags.matching_tags===true&&tags.ready&&!tags.unresolved_attempt?'Verified':'HOLD'} — ${tags.local_tags?.length||0} saved native search tag(s), ${tags.remote_tags?.length??'unverified'} live Etsy tags. ${tags.matching_tags?'Tags match.':'Review the difference before an explicitly approved update.'}`);
      const complete=isExpected&&sameDraft&&originals.length>0&&eligible.length===originals.length&&
        receipts.length===eligible.length&&transferred.length===eligible.length&&
        Number(images.hold_unconfirmed_claims||0)===0&&photoMatched&&tags.matching_tags===true&&tags.ready===true&&
        !tags.unresolved_attempt&&tags.verified_canada_only===true;
      acceptanceNote(complete?'VERIFIED — Owner-initiated live checks confirm Product #53 draft #4603838854 photos and search tags. Etsy remains unpublished.':
        'HOLD — Owner acceptance is incomplete. Reconcile only the identified exception using the controls above; do not automatically retry or duplicate photos.');
    } catch(error) {
      acceptanceResult.replaceChildren();acceptanceNote('HOLD — '+error.message+' No Etsy changes or retries were attempted.');
    } finally {acceptanceButton.disabled=!saved()||productId!==53;}
  }
  acceptanceButton?.addEventListener('click',()=>void verifyProduct53());
  if(acceptanceButton&&productId!==53){acceptanceButton.disabled=true;acceptanceResult.replaceChildren();acceptanceNote('Open saved Product #53 to run this specific owner acceptance check.');}

  const whoOptions = [['','Choose only after verifying…'],['i_did','We made it'],['someone_else','Someone else made it'],['collective','A group made it']];
  const eraOptions = [['','Choose only after verifying…'],['made_to_order','Made to order'],['2020_2026','2020–2026'],['2010_2019','2010–2019'],['2007_2009','2007–2009'],['2000_2006','2000–2006'],['before_2007','Before 2007'],...['1990s','1980s','1970s','1960s','1950s','1940s','1930s','1920s','1910s','1900s','1800s','1700s','before_1700'].map(x=>[x,x])];
  const specs = [
    ['title_override','Optional channel title',140],
    ['description_override','Optional channel description',12000,'textarea'],
    ['materials','Materials, comma-separated',1200,'textarea'],
    ['styles','Style terms, comma-separated (max 2)',200],
    ['quantity_override','Optional channel quantity (leave blank to use Product stock)',9,'number'],
    ['review_notes','Owner review notes (local only)',2000,'textarea'],
  ];
  const etsySpecs = [
    ['who_made','Who made this?',40,'select',whoOptions],
    ['when_made','When was it made?',40,'select',eraOptions],
    ['taxonomy_id','Etsy category / taxonomy ID (verified)',80],
    ['shipping_profile_reference','Canada-only shipping profile reference (verified)',160],
    ['readiness_state_reference','Processing/readiness profile reference (verified)',160],
    ['production_partner_refs','Production partner references, comma-separated (if any)',1200,'textarea'],
  ];
  const state = new Map();

  function buildAdvanced(node, channel) {
    const fields = new Map(), container = node.querySelector('.dd498-advanced-fields');
    for (const [key, label, max, type='text', choices] of [...specs,...(channel==='etsy'?etsySpecs:[])]) {
      const wrapper = document.createElement('label');
      if (type==='textarea') wrapper.classList.add('dd498-wide');
      const heading = document.createElement('span'); heading.className='small';heading.textContent=label;
      let input;
      if (type==='textarea') {input=document.createElement('textarea');input.rows=3;input.maxLength=max;}
      else if(type==='select') {input=document.createElement('select');for(const [value,text] of choices){input.add(new Option(text,value));}}
      else {input=document.createElement('input');input.type=type;input.maxLength=max;if(type==='number'){input.min='1';input.max='999999';input.step='1';}}
      input.className='input'; input.dataset.dd498Field=key;
      wrapper.append(heading,input);container.append(wrapper);fields.set(key,input);
    }
    const status=node.querySelector('[data-dd498-status]');
    const record={node,channel,fields,status,profile:null,loading:false,ready:false,uncertain:false};state.set(channel,record);
    const say=(message,tone='')=>{status.textContent=message;status.dataset.tone=tone;};
    function controls(){const locked=record.loading||!saved();for(const key of ['load','suggest','save']){node.querySelector(`[data-dd498-${key}]`).disabled=locked||(key!=='load'&&!record.ready)||((key==='save')&&record.uncertain);}}
    function fillProfile(profile) {
      record.profile=profile;record.ready=true;record.uncertain=false;
      for(const [key,element] of fields){
        const raw=key==='materials'?parseList(profile.materials_json).join(', '):
          key==='styles'?parseList(profile.style_terms_json).join(', '):
          key==='production_partner_refs'?parseList(profile.production_partner_refs_json).join(', '):profile[key];
        element.value=raw==null?'':String(raw);
      }
    }
    async function load() {
      if(record.loading||!saved())return;
      record.loading=true;controls();say('Loading this channel’s saved local profile. No provider call…');
      try {
        const response=await api(`/api/admin/marketplace-listing-profile?channel=${channel}&product_id=${productId}`);
        if(Number(response.product?.product_id)!==productId||normal(response.profile?.channel_key)!==channel)throw Error('Channel or Product mismatch.');
        fillProfile(response.profile);
        say(`Saved ${channel==='etsy'?'Etsy':'Marketplace'} advanced profile loaded. ${response.validation?.blocker_count||0} listing-preparation blocker(s); these are separate from provider readiness.`, '');
      } catch(error) {record.ready=false;say('HOLD — '+error.message,'hold');}
      finally {record.loading=false;controls();}
    }
    function suggest() {
      if(!record.ready||!saved())return;
      const defaults={title_override:normal(field('name')?.value),
        description_override:normal(field('description')?.value)||normal(field('short_description')?.value),
        quantity_override:normal(field('inventory_quantity')?.value)};
      for(const [key,value] of Object.entries(defaults)){const element=fields.get(key);if(element&&!element.value.trim()&&value)element.value=value;}
      say('Filled missing text and quantity from saved Product. We did not guess the Etsy maker, era, category or shipping profile. Review fields, then press Save advanced locally.');
    }
    async function saveProfile(){
      if(record.loading||!record.ready||!saved()||record.uncertain)return;
      const tags=canonical();if(channel==='etsy'&&tags.canonical.length&&!tags.etsyReady){say(`HOLD — fix Product SEO tags and Save Product before preparing Etsy: ${tags.warnings.join(' ')}`,'hold');return;}
      const value=key=>normal(fields.get(key)?.value);
      if(value('styles')&&split(value('styles')).length>2){say('HOLD — Etsy/local profile supports up to two style terms.','hold');return;}
      const quantity=value('quantity_override');
      if(quantity&&(!/^[1-9]\d{0,5}$/.test(quantity))){say('HOLD — optional quantity must be a whole number from 1 to 999999.','hold');return;}
      const original=record.profile;
      const body={channel,product_id:productId,title_override:value('title_override'),description_override:value('description_override'),
        tags:channel==='etsy'?tags.etsy:tags.facebook,materials:split(value('materials')),styles:split(value('styles')),
        quantity_override:quantity?Number(quantity):null,review_notes:value('review_notes'),
        taxonomy_id:channel==='etsy'?value('taxonomy_id'):normal(original.taxonomy_id),
        shipping_profile_reference:channel==='etsy'?value('shipping_profile_reference'):normal(original.shipping_profile_reference),
        readiness_state_reference:channel==='etsy'?value('readiness_state_reference'):normal(original.readiness_state_reference),
        who_made:channel==='etsy'?value('who_made'):normal(original.who_made),
        when_made:channel==='etsy'?value('when_made'):normal(original.when_made),
        production_partner_refs:channel==='etsy'?split(value('production_partner_refs')):parseList(original.production_partner_refs_json),
        return_policy_reference:normal(original.return_policy_reference),is_supply:Number(original.is_supply||0)===1,
        listing_type:normal(original.listing_type)||'physical',listing_state:normal(original.listing_state)||'draft',
        personalization_questions:parseList(original.personalization_questions_json),
        variation_properties:parseList(original.variation_properties_json),
      };
      record.loading=true;controls();say(`Saving ${channel} advanced metadata only; no provider upload or listing publish…`);
      try {
        const response=await api('/api/admin/marketplace-listing-profile',body);
        const profile=response.profile||{};
        const matches=Number(profile.product_id)===productId&&normal(profile.channel_key)===channel&&
          normal(profile.title_override)===body.title_override&&normal(profile.description_override)===body.description_override&&
          JSON.stringify(parseList(profile.tags_json))===JSON.stringify(body.tags)&&
          JSON.stringify(parseList(profile.materials_json))===JSON.stringify(body.materials)&&
          JSON.stringify(parseList(profile.style_terms_json))===JSON.stringify(body.styles);
        if(!matches)throw Error('Saved advanced profile readback did not match the requested Product/channel metadata.');
        fillProfile(profile);
        say(`Saved ✓ ${channel==='etsy'?'Etsy':'Marketplace'} advanced fields and ${body.tags.length} shared search phrase(s) in our local profile. ${response.validation?.blocker_count||0} listing-readiness blocker(s) remain. Nothing sent to Etsy, Meta, or another provider.`);
      }catch(error){record.uncertain=true;say(`HOLD — ${error.message} Outcome may be uncertain; use Load saved advanced to reconcile before another write.`,'hold');}
      finally{record.loading=false;controls();}
    }
    node.querySelector('[data-dd498-load]').addEventListener('click',()=>void load());
    node.querySelector('[data-dd498-suggest]').addEventListener('click',suggest);
    node.querySelector('[data-dd498-save]').addEventListener('click',()=>void saveProfile());
    node.addEventListener('toggle',()=>{if(node.open&&!record.ready&&!record.loading&&saved())void load();});
    document.addEventListener('dd:product-loaded',controls);
    document.addEventListener('dd:save-succeeded',()=>{record.ready=false;record.uncertain=false;say('Product saved. Reload advanced metadata to compare with the new saved Product.');controls();});
    form.addEventListener('input',controls);form.addEventListener('change',controls);
    controls();
  }

  for(const node of document.querySelectorAll('[data-dd498-channel]'))buildAdvanced(node,node.dataset.dd498Channel);
  document.getElementById('dd498IdentityRefresh')?.addEventListener('click',()=>void refreshIdentity());
  field('keywords')?.addEventListener('input',renderTagLibrary);
  for(const event of ['dd:etsy-draft-created','dd:etsy-existing-draft-linked','dd:etsy-existing-draft-updated'])
    document.addEventListener(event,()=>void refreshIdentity());
  document.addEventListener('dd:product-loaded',()=>{renderTagLibrary();void refreshIdentity();});
  document.addEventListener('dd:save-succeeded',()=>{renderTagLibrary();void refreshIdentity();});
  form.addEventListener('input',renderTagLibrary);
  for(const event of ['dd:save-succeeded','dd:media-inline-updated','dd:etsy-draft-created','dd:etsy-existing-draft-linked','dd:etsy-native-tags-verified','dd:etsy-photo-verified'])
    document.addEventListener(event,()=>{if(acceptanceResult&&productId===53){acceptanceResult.replaceChildren();acceptanceNote('Source evidence changed. Run the read-only owner acceptance check again before relying on old results.');}});
  form.addEventListener('input',()=>{if(acceptanceButton)acceptanceButton.disabled=!saved()||productId!==53;});
  document.addEventListener('dd:product-loaded',()=>{if(acceptanceButton)acceptanceButton.disabled=!saved()||productId!==53;});
  renderTagLibrary();if(form.dataset.productAuthority==='ready')void refreshIdentity();
}
