// Build 262 - Active Material Library templates, source-derived ingredient dropdowns, printer profiles/sheet packing, and refined soap reference geometry.
(() => {
  const STORAGE_KEY = 'dd_packaging_studio_local_draft_v5';
  const PRINTER_PROFILE_KEY = 'dd_packaging_printer_profiles_v1';
  const state = { projects: [], templates: [], products: [], inventory: [], printers: [], referenceSources: [], formulaLibrary: [], contentLibrary: [], sourceMaterialLibrary: [], librarySchemaReady: true, sourceMaterialSchemaReady: true, sourceMaterialMetadataReady: true, detail: null, loading: false, activeTab: 'product', activeSourceMaterialId: 0, activeContentLibraryId: 0 };
  const id = (name) => document.getElementById(name);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const xml = (value) => String(value ?? '').replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]));
  const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const bool = (value) => value === true || value === 'true' || Number(value) === 1;
  const LETTER_MM = { width: 215.9, height: 279.4 };
  function loadPrinterProfiles(){
    try{const rows=JSON.parse(localStorage.getItem(PRINTER_PROFILE_KEY)||'[]');return Array.isArray(rows)?rows:[];}catch{return[];}
  }
  function savePrinterProfiles(rows){try{localStorage.setItem(PRINTER_PROFILE_KEY,JSON.stringify(Array.isArray(rows)?rows:[]));}catch{}}
  function normalizedPrinterProfiles(){
    const saved=loadPrinterProfiles();const seen=new Set();const out=[];
    for(const row of saved){const name=String(row?.name||'').trim();if(!name||seen.has(name.toLowerCase()))continue;seen.add(name.toLowerCase());out.push({...row,name});}
    for(const row of state.printers||[]){const name=String(row?.item_name||'').trim();if(!name||seen.has(name.toLowerCase()))continue;seen.add(name.toLowerCase());out.push({name,inventory_id:Number(row.site_item_inventory_id||0),paper:'Letter 8.5 × 11 in',margin_mm:0,gap_mm:0,scale_percent:100,auto_rotate:true,source:'inventory'});}
    for(const row of state.detail?.print_tests||[]){const name=String(row?.printer_name||'').trim();if(!name||seen.has(name.toLowerCase()))continue;seen.add(name.toLowerCase());out.push({name,paper:row.paper_stock||'Letter 8.5 × 11 in',margin_mm:0,gap_mm:2,scale_percent:num(row.scale_percent,100),auto_rotate:true,source:'history'});}
    return out;
  }
  function printerProfileOptions(selected=''){
    const rows=normalizedPrinterProfiles();return `<option value="">Choose a saved / inventory printer…</option>${rows.map((row)=>`<option value="${esc(row.name)}" ${String(selected)===String(row.name)?'selected':''}>${esc(row.name)}${row.inventory_id?' · Inventory':''}</option>`).join('')}<option value="__manual__">+ Enter / save another printer profile</option>`;
  }
  function getPrinterProfile(name=''){return normalizedPrinterProfiles().find((row)=>String(row.name)===String(name))||null;}
  function sheetPlan(template,profile={}){
    const scale=Math.max(.5,Math.min(1.5,num(profile.scale_percent,100)/100));const lw=Math.max(1,num(template.page_width_mm,50.8))*scale;const lh=Math.max(1,num(template.page_height_mm,25.4))*scale;const margin=Math.max(0,num(profile.margin_mm,0));const gap=Math.max(0,num(profile.gap_mm,0));
    const candidates=[];
    for(const orientation of ['portrait','landscape']){const pageW=orientation==='portrait'?LETTER_MM.width:LETTER_MM.height;const pageH=orientation==='portrait'?LETTER_MM.height:LETTER_MM.width;for(const rotated of [false,true]){if(rotated&&profile.auto_rotate===false)continue;const w=rotated?lh:lw;const h=rotated?lw:lh;const usableW=Math.max(0,pageW-margin*2);const usableH=Math.max(0,pageH-margin*2);const cols=w>0?Math.floor((usableW+gap)/(w+gap)):0;const rows=h>0?Math.floor((usableH+gap)/(h+gap)):0;candidates.push({orientation,rotated,pageW,pageH,w,h,cols,rows,count:Math.max(0,cols*rows),margin,gap,scale});}}
    candidates.sort((a,b)=>b.count-a.count||Number(a.rotated)-Number(b.rotated)||(a.orientation==='landscape'?-1:1));return candidates[0]||{orientation:'portrait',rotated:false,count:0,cols:0,rows:0,pageW:LETTER_MM.width,pageH:LETTER_MM.height,w:lw,h:lh,margin,gap,scale};
  }

  const ROSE_PRESETS = [
    ['rose-purple-v1','Purple','Purple botanical rose','#8E61AA','purple'],
    ['rose-lavender-v1','Lavender','Lavender botanical rose','#A57BCB','lavender'],
    ['rose-red-v1','Red','Natural red botanical rose','#B23A48','red'],
    ['rose-pink-v1','Pink','Natural pink botanical rose','#D77CA8','pink'],
    ['rose-white-v1','White','White botanical rose','#F7F4EC','white'],
    ['rose-off-white-v1','Off-white','Off-white botanical rose','#E8DDC8','off-white'],
    ['rose-yellow-v1','Yellow','Yellow botanical rose','#D9BD43','yellow'],
    ['rose-coral-v1','Coral','Coral botanical rose','#E2766A','coral'],
    ['rose-orange-v1','Orange','Orange botanical rose','#D97932','orange'],
    ['rose-peach-v1','Peach','Peach botanical rose','#E9AB83','peach'],
    ['rose-green-v1','Green','Earthy green botanical rose','#6D8757','green'],
    ['rose-blue-v1','Blue','Ocean-blue botanical rose','#4E82B5','blue'],
    ['rose-blue-green-v1','Blue-green','Sea-breeze blue-green botanical rose','#4F9599','blue-green'],
    ['rose-brown-v1','Brown','Brown botanical rose','#76513E','brown'],
    ['rose-black-v1','Black','Black botanical rose','#252525','black'],
    ['rose-grey-v1','Grey','Grey botanical rose','#777777','grey'],
    ['rose-charcoal-v1','Charcoal','Charcoal-grey botanical rose','#4A4A4A','charcoal'],
    ['rose-silver-v1','Silver','Silver botanical rose','#BFC3C8','silver'],
    ['rose-gold-v1','Gold','Gold botanical rose','#B58B38','gold'],
    ['rose-honey-v1','Honey gold','Warm amber / honey-gold botanical rose','#C28A2E','honey'],
    ['rose-copper-v1','Copper','Copper botanical rose','#A86142','copper'],
    ['rose-bronze-v1','Bronze','Bronze botanical rose','#8B6B3E','bronze'],
    ['rose-oatmeal-v1','Oatmeal / cream','Oatmeal, cream and beige botanical rose','#C9B18A','oatmeal'],
    ['rose-custom-v1','Custom colour','Custom colour generated rose',null,null]
  ].map(([id,key,label,colour,file]) => ({ id,key,label,colour,path:file ? `/assets/packaging/soap/roses/botanical/${file}-rose-v1.webp` : '' }));
  const PRODUCT_ROSE_PRESETS = [
    ['glacial-purple','Glacial Purple','rose-lavender-v1'],
    ['earth-shea-pumice','Earth Shea & Pumice','rose-green-v1'],
    ['health-oatmeal-goat-milk','Health Oatmeal & Goat Milk','rose-oatmeal-v1'],
    ['sea-breeze','Sea Breeze','rose-blue-green-v1'],
    ['charcoal','Charcoal','rose-charcoal-v1'],
    ['honey','Honey','rose-honey-v1'],
    ['rose','Rose','rose-red-v1']
  ];
  function rosePresetById(value) { return ROSE_PRESETS.find((row) => row.id === String(value || '')) || ROSE_PRESETS[0]; }
  function roseOptions(value) { const selected=String(value||'rose-purple-v1'); return ROSE_PRESETS.map((row)=>`<option value="${esc(row.id)}" ${selected===row.id?'selected':''}>${esc(row.label)}</option>`).join(''); }
  function roseAssetPath(value) { return rosePresetById(value)?.path || ''; }
  function productRoseOptions(value='') { return `<option value="">Choose product rose direction…</option>${PRODUCT_ROSE_PRESETS.map(([key,label])=>`<option value="${esc(key)}" ${String(value)===key?'selected':''}>${esc(label)}</option>`).join('')}`; }

  function message(text = '', kind = '') {
    const node = id('packagingStudioMessage');
    if (!node) return;
    node.hidden = !text;
    node.textContent = text;
    node.className = `card small ${kind === 'error' ? 'is-error' : kind === 'success' ? 'is-success' : ''}`;
  }

  async function api(body = null, projectId = 0) {
    const url = `/api/admin/packaging-studio${projectId ? `?packaging_project_id=${encodeURIComponent(projectId)}` : ''}`;
    const response = await DDAuth.apiFetch(url, body ? { method: 'POST', body: JSON.stringify(body) } : undefined);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Packaging Studio request failed.');
    return data;
  }

  function options(rows, value, label) {
    return rows.map((row) => {
      const optionId = Number(row.packaging_template_id || row.product_id || 0);
      return `<option value="${optionId}" ${Number(value) === optionId ? 'selected' : ''}>${esc(label(row))}</option>`;
    }).join('');
  }

  function currentTemplate() {
    const selectedId = Number(id('packagingTemplateId')?.value || state.detail?.project?.packaging_template_id || 0);
    const selected = state.templates.find((row) => Number(row.packaging_template_id) === selectedId) || state.detail?.template || state.templates[0] || {};
    const readDimension = (field, fallback) => {
      const node = id(field);
      if (!node) return num(fallback);
      return Math.max(0, num(node.value, fallback));
    };
    const layout = { ...(selected.layout || {}) };
    if (id('packagingTemplateShape')) layout.shape = id('packagingTemplateShape').value || layout.shape || 'rectangle';
    if (id('packagingDesignProfile')) layout.design_profile = id('packagingDesignProfile').value || layout.design_profile || 'general_rectangle';
    if (String(selected.package_type || '') === 'soap_ribbon') layout.design_profile = 'soap_reference_v3';
    if (id('packagingBleedMm')) layout.bleed_mm = Math.max(0, num(id('packagingBleedMm').value, layout.bleed_mm));
    if (id('packagingSafeMarginMm')) layout.safe_margin_mm = Math.max(0, num(id('packagingSafeMarginMm').value, layout.safe_margin_mm));
    return {
      ...selected,
      package_type: String(selected.package_type || 'product_label'),
      page_width_mm: readDimension('packagingTemplateWidth', selected.page_width_mm),
      page_height_mm: readDimension('packagingTemplateHeight', selected.page_height_mm),
      front_width_mm: readDimension('packagingTemplateFrontWidth', selected.front_width_mm),
      front_height_mm: readDimension('packagingTemplateFrontHeight', selected.front_height_mm),
      rear_width_mm: readDimension('packagingTemplateRearWidth', selected.rear_width_mm),
      rear_height_mm: readDimension('packagingTemplateRearHeight', selected.rear_height_mm),
      layout
    };
  }

  function projectMatches(row) {
    const query = String(id('packagingProjectSearch')?.value || '').trim().toLowerCase();
    if (!query) return true;
    return [row.project_key, row.project_name, row.product_name, row.collection_name, row.project_status, row.sku]
      .map((value) => String(value || '').toLowerCase()).join(' ').includes(query);
  }

  function renderProjects() {
    const mount = id('packagingProjectList');
    if (!mount) return;
    const rows = state.projects.filter(projectMatches);
    mount.innerHTML = rows.length ? rows.map((row) => `
      <button class="packaging-project-row ${Number(state.detail?.project?.packaging_project_id || 0) === Number(row.packaging_project_id) ? 'is-active' : ''}" type="button" data-open-packaging="${Number(row.packaging_project_id || 0)}">
        <span><strong>${esc(row.project_name || row.product_name || 'Untitled packaging')}</strong><small>${esc(row.project_key || '')} · ${esc(row.project_status || 'draft')} · ${esc(row.compliance_status || 'needs_review')}</small></span>
        <span class="status-pill">${esc(row.soap_print_status || row.package_type || 'packaging')}</span>
      </button>`).join('') : '<p class="small">No matching packaging projects.</p>';
  }

  function ingredientRowsFromDom() {
    return [...document.querySelectorAll('[data-soap-ingredient-row]')].map((row, index) => ({
      sort_order: index + 1,
      inci_name: row.querySelector('[data-field="inci_name"]')?.value || '',
      display_name_en: row.querySelector('[data-field="display_name_en"]')?.value || '',
      display_name_fr: row.querySelector('[data-field="display_name_fr"]')?.value || '',
      organic_flag: row.querySelector('[data-field="organic_flag"]')?.checked ? 1 : 0,
      allergen_note: row.querySelector('[data-field="allergen_note"]')?.value || '',
      required_on_label: row.querySelector('[data-field="required_on_label"]')?.checked ? 1 : 0
    })).filter((row) => row.inci_name || row.display_name_en || row.display_name_fr);
  }

  function claimRowsFromDom() {
    return [...document.querySelectorAll('[data-soap-claim-row]')].map((row, index) => ({
      sort_order: index + 1,
      claim_en: row.querySelector('[data-field="claim_en"]')?.value || '',
      claim_fr: row.querySelector('[data-field="claim_fr"]')?.value || '',
      icon_name: row.querySelector('[data-field="icon_name"]')?.value || '',
      is_approved: row.querySelector('[data-field="is_approved"]')?.checked ? 1 : 0,
      compliance_note: row.querySelector('[data-field="compliance_note"]')?.value || ''
    })).filter((row) => row.claim_en || row.claim_fr);
  }

  function componentRowsFromDom() {
    return [...document.querySelectorAll('[data-packaging-component-row]')].map((row) => ({
      site_item_inventory_id: Number(row.querySelector('[data-field="site_item_inventory_id"]')?.value || 0) || null,
      component_type: row.querySelector('[data-field="component_type"]')?.value || 'label',
      component_name: row.querySelector('[data-field="component_name"]')?.value || '',
      sku_reference: row.querySelector('[data-field="sku_reference"]')?.value || '',
      quantity_per_finished_unit: Number(row.querySelector('[data-field="quantity_per_finished_unit"]')?.value || 1),
      wastage_percent: Number(row.querySelector('[data-field="wastage_percent"]')?.value || 0),
      unit_cost_cents: Number(row.querySelector('[data-field="unit_cost_cents"]')?.value || 0),
      lot_tracking_required: row.querySelector('[data-field="lot_tracking_required"]')?.checked ? 1 : 0,
      supplier_name: row.querySelector('[data-field="supplier_name"]')?.value || '',
      notes: row.querySelector('[data-field="notes"]')?.value || ''
    })).filter((row) => row.component_name);
  }

  function snapshot() {
    const value = (name) => id(name)?.value ?? '';
    const theme = {
      rose_colour: value('packagingRoseColour') || '#7B4DA6',
      theme_colour: value('packagingThemeColour') || '#FBF5E8',
      border_colour: value('packagingBorderColour') || '#32105E',
      accent_gold: value('packagingAccentGold') || '#B88A2F',
      secondary_colour: value('packagingSecondaryColour') || '#5A2A86'
    };
    const artwork = {
      rose_asset_id: value('packagingRoseAsset') || 'rose-purple-v1',
      rose_style: value('packagingRoseStyle') || 'full_rose',
      badge_shape: value('packagingBadgeShape') || 'oval',
      top_arc_text: value('packagingTopArcText'),
      bottom_arc_text: value('packagingBottomArcText'),
      centre_mark: value('packagingCentreMark') || '♥',
      candle_primary_text: value('packagingCandlePrimaryText'),
      candle_date_line_1: value('packagingCandleDateLine1'),
      candle_event_line: value('packagingCandleEventLine'),
      candle_date_line_2: value('packagingCandleDateLine2'),
      artwork_asset: value('packagingArtworkAsset'),
      show_guides: id('packagingShowGuides')?.checked ? 1 : 0,
      show_bleed: id('packagingShowBleed')?.checked ? 1 : 0,
      show_safe_area: id('packagingShowSafeArea')?.checked ? 1 : 0,
      show_fold_guides: id('packagingShowFoldGuides')?.checked ? 1 : 0,
      show_glue_zone: id('packagingShowGlueZone')?.checked ? 1 : 0
    };
    return {
      packagingProjectId: value('packagingProjectId'), packagingTemplateId: value('packagingTemplateId'), packagingProductId: value('packagingProductId'),
      packagingProjectName: value('packagingProjectName'), packagingType: value('packagingType'), packagingStatus: value('packagingStatus'), packagingCompliance: value('packagingCompliance'),
      packagingCollection: value('packagingCollection'), packagingProductName: value('packagingProductName'), packagingSubtitle: value('packagingSubtitle'),
      packagingIdentityEn: value('packagingIdentityEn'), packagingIdentityFr: value('packagingIdentityFr'), packagingInci: value('packagingInci'),
      packagingIngredientsEn: value('packagingIngredientsEn'), packagingIngredientsFr: value('packagingIngredientsFr'), packagingNetQuantity: value('packagingNetQuantity'),
      packagingNetWeightOz: value('packagingNetWeightOz'), packagingNetWeightG: value('packagingNetWeightG'), packagingWebsite: value('packagingWebsite'),
      packagingDealerName: value('packagingDealerName'), packagingDealerAddress: value('packagingDealerAddress'), packagingContact: value('packagingContact'),
      packagingMadeInCanada: value('packagingMadeInCanada'), packagingWarningsEn: value('packagingWarningsEn'), packagingWarningsFr: value('packagingWarningsFr'),
      packagingPrintNotes: value('packagingPrintNotes'), claims: claimRowsFromDom().map((row) => row.claim_en), icons: claimRowsFromDom().map((row) => row.icon_name).filter(Boolean),
      structured_ingredients: ingredientRowsFromDom(), structured_claims: claimRowsFromDom(), theme, artwork, saved_at: new Date().toISOString()
    };
  }

  function projectPayload() {
    const data = snapshot(); const template = currentTemplate();
    return {
      action: 'save_project', packaging_project_id: Number(data.packagingProjectId || 0), packaging_template_id: Number(data.packagingTemplateId || 0),
      product_id: Number(data.packagingProductId || 0) || null, project_name: data.packagingProjectName, package_type: template.package_type,
      project_status: data.packagingStatus, compliance_status: data.packagingCompliance, collection_name: data.packagingCollection, product_name: data.packagingProductName,
      product_subtitle: data.packagingSubtitle, product_identity_en: data.packagingIdentityEn, product_identity_fr: data.packagingIdentityFr,
      ingredients_inci: data.packagingInci, ingredients_en: data.packagingIngredientsEn, ingredients_fr: data.packagingIngredientsFr,
      net_quantity_text: data.packagingNetQuantity, net_weight_oz: Number(data.packagingNetWeightOz || 0) || null, net_weight_g: Number(data.packagingNetWeightG || 0) || null,
      website_text: data.packagingWebsite, dealer_name: data.packagingDealerName, dealer_address: data.packagingDealerAddress, contact_text: data.packagingContact,
      made_in_canada_text: data.packagingMadeInCanada, claims: data.claims, warnings_en: data.packagingWarningsEn, warnings_fr: data.packagingWarningsFr,
      icons: data.icons, theme: data.theme, artwork: data.artwork, rose_asset_id: data.artwork.rose_asset_id, print_notes: data.packagingPrintNotes,
      structured_ingredients: data.structured_ingredients, structured_claims: data.structured_claims
    };
  }

  function fontSize(textValue, maxLength, base, min) {
    const length = String(textValue || '').length;
    return length <= maxLength ? base : Math.max(min, Math.round((base * maxLength / length) * 10) / 10);
  }

  function wrapLines(value, maxChars = 32, maxLines = 6) {
    const segments = String(value || '').split(/(?:\r?\n|•)+/).map((part) => part.trim()).filter(Boolean);
    const output = [];
    for (const segment of segments) {
      const words = segment.split(/\s+/).filter(Boolean); let current = ''; let first = true;
      for (const word of words) {
        const prefix = first ? '• ' : '  ';
        const next = current ? `${current} ${word}` : `${prefix}${word}`;
        if (next.length > maxChars && current) { output.push(current); current = `  ${word}`; first = false; }
        else current = next;
        if (output.length >= maxLines) break;
      }
      if (output.length < maxLines && current) output.push(current);
      if (output.length >= maxLines) break;
    }
    if (segments.length && output.length >= maxLines) {
      const last = output[maxLines - 1] || '';
      output[maxLines - 1] = `${last.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
    }
    return output.slice(0, maxLines);
  }

  function textBlock(value, x, y, lineHeight, maxChars, maxLines, size, anchor = 'start', className = 'pkg-copy') {
    return wrapLines(value, maxChars, maxLines).map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" font-size="${size}" class="${className}">${xml(line)}</text>`).join('');
  }

  function wrapPlainLines(value, maxChars = 24, maxLines = 2) {
    const words=String(value||'').trim().split(/\s+/).filter(Boolean);const lines=[];let current='';
    for(const word of words){const next=current?`${current} ${word}`:word;if(next.length>maxChars&&current){lines.push(current);current=word;}else current=next;if(lines.length>=maxLines)break;}
    if(lines.length<maxLines&&current)lines.push(current);if(words.length&&lines.length>=maxLines){const consumed=lines.join(' ').split(/\s+/).length;if(consumed<words.length)lines[maxLines-1]=`${lines[maxLines-1].slice(0,Math.max(1,maxChars-1)).trimEnd()}…`;}
    return lines.slice(0,maxLines);
  }

  function ingredientDisplay(language) {
    const rows = ingredientRowsFromDom();
    if (rows.length) return rows.filter((row) => row.required_on_label !== 0).map((row) => {
      const display = language === 'fr' ? row.display_name_fr : row.display_name_en;
      return display || row.inci_name || '';
    }).filter(Boolean).map((row) => `• ${row}`).join('\n');
    return language === 'fr' ? (id('packagingIngredientsFr')?.value || id('packagingInci')?.value || '') : (id('packagingIngredientsEn')?.value || id('packagingInci')?.value || '');
  }

  function curatedFrenchDraft(value = '') {
    const source = String(value || '').trim();
    if (!source) return '';
    const exact = new Map([
      ['made in canada','Fabriqué au Canada'],['hand made in canada','Fait à la main au Canada'],['handmade in canada','Fait à la main au Canada'],
      ['natural ingredients','Ingrédients naturels'],['handmade with care','Fait à la main avec soin'],['gentle & moisturizing','Doux et hydratant'],
      ['gentle and moisturizing','Doux et hydratant'],['please recycle','Veuillez recycler'],['for external use only','Pour usage externe seulement'],
      ['avoid contact with eyes','Éviter tout contact avec les yeux'],['keep out of reach of children','Garder hors de la portée des enfants']
    ]);
    const matched = exact.get(source.toLowerCase());
    if (matched) return matched;
    const replacements = [
      [/\bShea Butter\b/gi,'Beurre de karité'],[/\bPeppermint\b/gi,'Menthe poivrée'],[/\bUnscented\b/gi,'Sans parfum'],
      [/\bLavender\b/gi,'Lavande'],[/\bOatmeal\b/gi,'Avoine'],[/\bCharcoal\b/gi,'Charbon'],[/\bCoconut\b/gi,'Noix de coco'],
      [/\bVanilla\b/gi,'Vanille'],[/\bLemon\b/gi,'Citron'],[/\bHoney\b/gi,'Miel'],[/\bAloe\b/gi,'Aloès'],[/\bSoap\b/gi,'Savon']
    ];
    return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), source);
  }

  async function generateFrenchDraft() {
    const projectId = Number(id('packagingProjectId')?.value || state.detail?.project?.packaging_project_id || 0);
    const drafts = [];
    const identityEn = String(id('packagingIdentityEn')?.value || '').trim();
    const identityFr = curatedFrenchDraft(identityEn);
    if (identityEn && identityFr) { id('packagingIdentityFr').value = identityFr; drafts.push({ field_key: 'product_identity_fr', source_text: identityEn, generated_text: identityFr }); }
    const warningEn = String(id('packagingWarningsEn')?.value || '').trim();
    const warningFr = curatedFrenchDraft(warningEn);
    if (warningEn && warningFr) { id('packagingWarningsFr').value = warningFr; drafts.push({ field_key: 'warnings_fr', source_text: warningEn, generated_text: warningFr }); }
    document.querySelectorAll('[data-soap-ingredient-row]').forEach((row, index) => {
      const inci = String(row.querySelector('[data-field="inci_name"]')?.value || '').trim();
      const en = String(row.querySelector('[data-field="display_name_en"]')?.value || '').trim();
      const frField = row.querySelector('[data-field="display_name_fr"]');
      const fr = en ? curatedFrenchDraft(en) : inci;
      if (frField && fr) { frField.value = fr; drafts.push({ field_key: `ingredient_${index + 1}_fr`, source_text: en || inci, generated_text: fr }); }
    });
    document.querySelectorAll('[data-soap-claim-row]').forEach((row, index) => {
      const en = String(row.querySelector('[data-field="claim_en"]')?.value || '').trim();
      const frField = row.querySelector('[data-field="claim_fr"]');
      const fr = curatedFrenchDraft(en);
      if (frField && en && fr) { frField.value = fr; drafts.push({ field_key: `claim_${index + 1}_fr`, source_text: en, generated_text: fr }); }
    });
    const ingredientFr = ingredientDisplay('fr');
    if (id('packagingIngredientsFr') && ingredientFr) id('packagingIngredientsFr').value = ingredientFr;
    renderPreview();
    if (projectId && drafts.length) {
      try { await api({ action: 'record_translation_draft', packaging_project_id: projectId, drafts }); } catch (error) { message(`French draft generated, but its review provenance could not be recorded: ${error.message}`, 'error'); return; }
    }
    message('French draft generated from the curated packaging vocabulary. Review all French wording before approval; INCI ingredient names remain the ingredient-list authority.', 'success');
  }

  function mixHex(base, target = '#FFFFFF', amount = .5) {
    const parse = (value) => { const clean = String(value || '').replace('#',''); const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6,'0').slice(0,6); return [0,2,4].map((offset) => parseInt(full.slice(offset,offset + 2),16) || 0); };
    const a = parse(base), b = parse(target), ratio = Math.max(0,Math.min(1,Number(amount) || 0));
    return `#${a.map((value,index) => Math.round(value + (b[index] - value) * ratio).toString(16).padStart(2,'0')).join('')}`;
  }

  function scallopedOvalPath(cx, cy, rx, ry, points = 44) {
    const coords = [];
    for (let index = 0; index < points * 2; index += 1) {
      const angle = Math.PI * 2 * index / (points * 2); const wave = index % 2 === 0 ? 1 : .965;
      coords.push(`${index ? 'L' : 'M'}${(cx + Math.cos(angle) * rx * wave).toFixed(2)} ${(cy + Math.sin(angle) * ry * wave).toFixed(2)}`);
    }
    return `${coords.join(' ')} Z`;
  }

  function roseVector(cx, cy, scale, colour) {
    const dark = id('packagingBorderColour')?.value || '#32105E'; const mid = mixHex(colour,'#FFFFFF',.34); const light = mixHex(colour,'#FFFFFF',.58);
    return `<g transform="translate(${cx} ${cy}) scale(${scale})" stroke="${dark}" stroke-width="2.2" stroke-linejoin="round">
      <path fill="#536B35" d="M-14 35C-50 36-66 64-60 88c29 2 53-10 70-37z"/><path fill="#657C3C" d="M66 37c35 4 53 27 49 50-29 3-53-8-72-34z"/>
      <path fill="${colour}" d="M26-79C1-66-17-46-18-21c-1 31 17 65 44 86 27-21 45-55 44-86-1-25-19-45-44-58z" opacity=".86"/>
      <path fill="${colour}" d="M-26-35c-14 26-12 55 6 77 17 20 43 29 46 28-6-19-14-39-22-58-8-18-18-34-30-47z" opacity=".72"/>
      <path fill="${colour}" d="M78-35c14 26 12 55-6 77-17 20-43 29-46 28 6-19 14-39 22-58 8-18 18-34 30-47z" opacity=".72"/>
      <path fill="${mid}" d="M-3-45c-9 31 1 61 29 87 28-26 38-56 29-87-11 5-21 15-29 28-8-13-18-23-29-28z"/><path fill="${light}" d="M12-31c-7 23-2 43 14 60 16-17 21-37 14-60-5 4-10 10-14 18-4-8-9-14-14-18z"/>
    </g>`;
  }

  function iconSvg(icon, x, y, colour) {
    const key = String(icon || 'leaf').toLowerCase();
    if(key==='none')return'';
    if (key.includes('recycle')) return `<g transform="translate(${x} ${y}) scale(.42)" fill="none" stroke="${colour}" stroke-width="2.4"><circle r="13"/><path d="M-7 4l5-9 4 7M7-4l-5 9-4-7"/></g>`;
    if (key.includes('hand') || key.includes('care')) return `<g transform="translate(${x} ${y}) scale(.42)" fill="none" stroke="${colour}" stroke-width="2.4"><circle r="13"/><path d="M-7 2c5-8 8-8 12 0M-8 4c4 7 12 7 16 0M0-5v11"/></g>`;
    if(key.includes('heart'))return `<g transform="translate(${x} ${y}) scale(.42)" fill="none" stroke="${colour}" stroke-width="2.4"><circle r="13"/><path d="M0 8C-10 1-9-7-3-8 0-8 2-6 3-4 4-6 6-8 9-8 15-7 16 1 6 8L3 10Z" transform="translate(-3 0) scale(.82)"/></g>`;
    return `<g transform="translate(${x} ${y}) scale(.42)" fill="none" stroke="${colour}" stroke-width="2.4"><circle r="13"/><path d="M-6 6C-8-3-1-9 7-9 8-1 3 7-6 6ZM-5 5 5-6"/></g>`;
  }

  function guideSvg(height, artwork = {}) {
    let output = '';
    if (artwork.show_bleed) output += `<rect x="12.5" y="12.5" width="1075" height="${height - 25}" fill="none" stroke="#d12424" stroke-width="1" stroke-dasharray="5 4"/>`;
    if (artwork.show_safe_area) output += `<rect x="6.25" y="${height / 2 - 31.25}" width="1087.5" height="62.5" fill="none" stroke="#14843a" stroke-width="1" stroke-dasharray="4 4"/>`;
    if (artwork.show_fold_guides || artwork.show_guides) output += `<g stroke="#2680c2" stroke-width="1" stroke-dasharray="3 3"><line x1="210" y1="0" x2="210" y2="${height}"/><line x1="490" y1="0" x2="490" y2="${height}"/><line x1="720" y1="0" x2="720" y2="${height}"/><line x1="900" y1="0" x2="900" y2="${height}"/></g>`;
    if (artwork.show_glue_zone || artwork.show_guides) output += `<rect x="1050" y="${height / 2 - 37.5}" width="50" height="75" fill="rgba(239,185,43,.18)" stroke="#b58000" stroke-width="1"/><text x="1075" y="${height / 2}" text-anchor="middle" font-size="7" transform="rotate(-90 1075 ${height / 2})" class="pkg-copy">OVERLAP / GLUE</text>`;
    return output;
  }

  function glacialRibbonSvg(data, template) {
    const theme=data.theme||{};const artwork=data.artwork||{};const layout=template.layout||{};
    const widthMm=num(template.page_width_mm,279.4);const heightMm=num(template.page_height_mm,38.1);const height=Math.round(heightMm/25.4*100);
    const centreY=height/2;const bandHeight=Math.min(75,Math.max(58,height-16));const bandY=centreY-bandHeight/2;
    const rose=theme.rose_colour||'#7B4DA6';const border=theme.border_colour||'#32105E';const gold=theme.accent_gold||'#B88A2F';const background=theme.theme_colour||'#FBF5E8';const secondary=theme.secondary_colour||'#5A2A86';
    const family=data.packagingCollection||'Glacial Purple';const typeEn=data.packagingIdentityEn||data.packagingProductName||'PRODUCT IDENTITY REQUIRED';
    const structuredIngredients=Array.isArray(data.structured_ingredients)?data.structured_ingredients:[];
    const requiredIngredients=structuredIngredients.filter((row)=>Number(row.required_on_label)!==0);
    const enFromRows=requiredIngredients.map((row)=>row.display_name_en||row.inci_name).filter(Boolean).map((row)=>`• ${row}`).join('\n');
    const frFromRows=requiredIngredients.map((row)=>row.display_name_fr||row.inci_name).filter(Boolean).map((row)=>`• ${row}`).join('\n');
    const missingIngredientDraft='INCI INGREDIENTS REQUIRED — DRAFT NOT FOR PRINT';
    const en=enFromRows||ingredientDisplay('en')||missingIngredientDraft;const fr=frFromRows||ingredientDisplay('fr')||missingIngredientDraft;
    const claims=Array.isArray(data.structured_claims)&&data.structured_claims.length?data.structured_claims:(claimRowsFromDom().length?claimRowsFromDom():[]);
    const topLabel=artwork.top_arc_text||'Rosevear Creations';const bottomLabel=artwork.bottom_arc_text||'MADE IN CANADA';const centreMark=artwork.centre_mark||'♥';
    const rosePreset=rosePresetById(artwork.rose_asset_id);const roseAsset=rosePreset?.path||'';
    // Fixed reference zones keep ingredients, front badge, French panel, rear seal and claims from drifting into one another.
    const zones={fr:{x:20,w:146},front:{cx:365,rx:190},en:{x:570,w:142},rear:{cx:792,r:61},claims:{x:875,w:205}};
    const frontRy=Math.min(72,centreY-3);
    const roseArtwork=roseAsset?`<image href="${xml(roseAsset)}" x="210" y="${centreY-60}" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>`:roseVector(270,centreY,.60,rose);
    const frontOuter=artwork.badge_shape==='scalloped'?`<path d="${scallopedOvalPath(zones.front.cx,centreY,zones.front.rx,frontRy)}" fill="${background}" stroke="${gold}" stroke-width="4"/>`:`<ellipse cx="${zones.front.cx}" cy="${centreY}" rx="${zones.front.rx}" ry="${frontRy}" fill="${background}" stroke="${gold}" stroke-width="4"/>`;
    const damaskId='soap-reference-damask-v3';
    const claimMarkup=claims.slice(0,4).map((claim,index)=>{const y=bandY+14+index*10.2;const enText=String(claim.claim_en||'');const frText=String(claim.claim_fr||'');const enSize=fontSize(enText,28,4.45,3.35);const frSize=fontSize(frText,32,3.85,3.0);return `${iconSvg(claim.icon_name,zones.claims.x+7,y+1.2,secondary)}<text x="${zones.claims.x+18}" y="${y}" font-size="${enSize}" font-weight="700" class="pkg-copy">${xml(enText)}</text><text x="${zones.claims.x+18}" y="${y+4.35}" font-size="${frSize}" class="pkg-copy">${xml(frText)}</text>`;}).join('');
    const frontTextX=428;const familyLines=wrapPlainLines(family,18,2);const familyStart=centreY+(familyLines.length>1?-8:-3);const familyMarkup=familyLines.map((line,index)=>`<text x="${frontTextX}" y="${familyStart+index*8.4}" text-anchor="middle" font-size="${fontSize(line,18,10.1,7.8)}" class="pkg-script">${xml(line)}</text>`).join('');const typeLines=wrapPlainLines(typeEn,22,2);const typeStart=centreY+17-(typeLines.length-1)*4;const typeMarkup=typeLines.map((line,index)=>`<text x="${frontTextX}" y="${typeStart+index*8.5}" text-anchor="middle" font-size="${fontSize(line,22,10.2,7.1)}" class="pkg-serif">${xml(line)}</text>`).join('');
    const website=String(data.packagingWebsite||'devilndove.com');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 1100 ${height}" role="img" aria-label="${xml(family)} ${xml(typeEn)} continuous soap ribbon label" data-soap-layout="reference-v3">
      <defs>
        <pattern id="${damaskId}" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M15 2C10 8 10 12 15 15C20 12 20 8 15 2ZM15 28C10 22 10 18 15 15C20 18 20 22 15 28ZM2 15C8 10 12 10 15 15C12 20 8 20 2 15ZM28 15C22 10 18 10 15 15C18 20 22 20 28 15Z" fill="none" stroke="${gold}" stroke-width=".65" opacity=".13"/></pattern>
        <clipPath id="soap-en-ingredients"><rect x="${zones.en.x}" y="${bandY+18}" width="${zones.en.w-4}" height="${bandHeight-38}"/></clipPath>
        <clipPath id="soap-fr-ingredients"><rect x="${zones.fr.x}" y="${bandY+18}" width="${zones.fr.w-4}" height="${bandHeight-38}"/></clipPath>
        <clipPath id="soap-claims"><rect x="${zones.claims.x}" y="${bandY+8}" width="${zones.claims.w}" height="${bandHeight-27}"/></clipPath>
      </defs>
      <style>
        .pkg-copy{font-family:Arial,Helvetica,sans-serif;fill:${border}}.pkg-serif{font-family:Georgia,'Times New Roman',serif;fill:${border}}.pkg-script{font-family:'Brush Script MT','Segoe Script',cursive;fill:${secondary}}
        .pkg-zone-line{stroke:${secondary};stroke-opacity:.22;stroke-width:1.2}
      </style>
      <rect width="1100" height="${height}" fill="#fff"/>
      <rect x="0" y="${bandY}" width="1100" height="${bandHeight}" rx="4" fill="${background}"/><rect x="0" y="${bandY}" width="1100" height="${bandHeight}" fill="url(#${damaskId})"/>
      <rect x="2" y="${bandY+2}" width="1096" height="${bandHeight-4}" rx="4" fill="none" stroke="${border}" stroke-width="3"/>
      <line x1="2" y1="${bandY+8}" x2="1098" y2="${bandY+8}" stroke="${gold}" stroke-width="1.7"/><line x1="2" y1="${bandY+bandHeight-8}" x2="1098" y2="${bandY+bandHeight-8}" stroke="${gold}" stroke-width="1.7"/>
      <g class="pkg-zone-line"><line x1="174" y1="${bandY+12}" x2="174" y2="${bandY+bandHeight-12}"/><line x1="558" y1="${bandY+12}" x2="558" y2="${bandY+bandHeight-12}"/><line x1="722" y1="${bandY+12}" x2="722" y2="${bandY+bandHeight-12}"/><line x1="862" y1="${bandY+12}" x2="862" y2="${bandY+bandHeight-12}"/></g>
      <text x="${zones.en.x}" y="${bandY+15}" font-size="6.4" font-weight="700" class="pkg-copy">INGREDIENTS:</text><g clip-path="url(#soap-en-ingredients)">${textBlock(en,zones.en.x,bandY+23,4.7,30,8,3.85,'start')}</g>
      <g>
        ${frontOuter}<ellipse cx="${zones.front.cx}" cy="${centreY}" rx="${zones.front.rx-7}" ry="${frontRy-6}" fill="none" stroke="${border}" stroke-width="1.7"/><ellipse cx="${zones.front.cx}" cy="${centreY}" rx="${zones.front.rx-12}" ry="${frontRy-11}" fill="none" stroke="${gold}" stroke-width="1" stroke-dasharray="2 4"/>
        ${roseArtwork}
        <text x="${frontTextX}" y="${centreY-43}" text-anchor="middle" font-size="9.8" class="pkg-script">${xml(topLabel)}</text><text x="${frontTextX}" y="${centreY-31}" text-anchor="middle" font-size="7.1" class="pkg-script">- Devil n Dove -</text>
        <line x1="392" y1="${centreY-23}" x2="464" y2="${centreY-23}" stroke="${gold}" stroke-width="1"/><text x="${frontTextX}" y="${centreY-20}" text-anchor="middle" font-size="5.6" fill="${gold}">${xml(centreMark)}</text>
        ${familyMarkup}
        ${typeMarkup}
        <text x="${frontTextX}" y="${centreY+39}" text-anchor="middle" font-size="${fontSize(data.packagingSubtitle||'',28,6.9,5.2)}" class="pkg-script">${xml(data.packagingSubtitle||'')}</text>
        <text x="${frontTextX}" y="${centreY+53}" text-anchor="middle" font-size="5.9" font-weight="700" class="pkg-copy">${xml(bottomLabel)}</text>
        <circle cx="510" cy="${centreY-5}" r="28" fill="${background}" stroke="${border}" stroke-width="1.7"/><circle cx="510" cy="${centreY-5}" r="22" fill="none" stroke="${gold}" stroke-width="1"/>
        <text x="510" y="${centreY-13}" text-anchor="middle" font-size="3.55" font-weight="700" class="pkg-copy">DEVILNDOVE.COM</text><path d="M502 ${centreY-2}q8-9 16 0q-8 9-16 0z" fill="none" stroke="${border}" stroke-width="1"/><text x="510" y="${centreY+12}" text-anchor="middle" font-size="3.65" class="pkg-copy">HANDMADE</text>
      </g>
      <text x="${zones.fr.x}" y="${bandY+15}" font-size="6.4" font-weight="700" class="pkg-copy">INGRÉDIENTS :</text><g clip-path="url(#soap-fr-ingredients)">${textBlock(fr,zones.fr.x,bandY+23,4.7,28,8,3.7,'start')}</g>
      <g><circle cx="${zones.rear.cx}" cy="${centreY}" r="${zones.rear.r}" fill="${background}" stroke="${secondary}" stroke-width="3.2"/><circle cx="${zones.rear.cx}" cy="${centreY}" r="${zones.rear.r-5}" fill="none" stroke="${gold}" stroke-width="1.6"/>
        <text x="${zones.rear.cx}" y="${centreY-25}" text-anchor="middle" font-size="9.2" class="pkg-script">Rosevear Creations</text><text x="${zones.rear.cx}" y="${centreY-12}" text-anchor="middle" font-size="7.2" class="pkg-script">- Devil n Dove -</text>
        <line x1="${zones.rear.cx-28}" y1="${centreY-4}" x2="${zones.rear.cx+28}" y2="${centreY-4}" stroke="${gold}" stroke-width=".8"/><text x="${zones.rear.cx}" y="${centreY-1}" text-anchor="middle" font-size="5.4" fill="${gold}">${xml(centreMark)}</text>
        <text x="${zones.rear.cx}" y="${centreY+12}" text-anchor="middle" font-size="5.7" class="pkg-copy">Handmade in Small Batches</text><text x="${zones.rear.cx}" y="${centreY+29}" text-anchor="middle" font-size="${fontSize(website,20,8.5,6.4)}" font-weight="700" fill="${secondary}" class="pkg-copy">${xml(website)}</text><text x="${zones.rear.cx}" y="${centreY+42}" text-anchor="middle" font-size="6" font-weight="700" class="pkg-copy">MADE IN CANADA</text>
      </g>
      <g clip-path="url(#soap-claims)">${claimMarkup}</g>
      <line x1="${zones.claims.x+3}" y1="${bandY+58}" x2="1085" y2="${bandY+58}" stroke="${gold}" stroke-width="1"/>
      <text x="${zones.claims.x+5}" y="${bandY+65}" font-size="${fontSize(data.packagingNetQuantity||'',45,4.6,3.6)}" font-weight="700" class="pkg-copy">${xml(data.packagingNetQuantity||'VERIFIED NET QUANTITY REQUIRED — DRAFT NOT FOR PRINT')}</text>
      ${guideSvg(height,artwork)}
    </svg>`;
  }

  function genericPackageSvg(data, template) {
    const widthMm = Math.max(25, num(template.page_width_mm, 88.9)); const heightMm = Math.max(25, num(template.page_height_mm, 50.8));
    const ratio = widthMm / heightMm; const width = 1000; const height = Math.max(400, Math.round(width / ratio));
    const theme = data.theme || {}; const background = theme.theme_colour || '#FBF5E8'; const border = theme.border_colour || '#32105E'; const gold = theme.accent_gold || '#B88A2F'; const accent = theme.secondary_colour || '#5A2A86';
    const identityEn = data.packagingIdentityEn || data.packagingProductName || 'Product identity'; const identityFr = data.packagingIdentityFr || 'Identité du produit';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 ${width} ${height}" role="img" aria-label="${xml(data.packagingCollection || data.packagingProductName || 'Devil n Dove')} ${xml(identityEn)} packaging layout">
      <style>.copy{font-family:Arial,Helvetica,sans-serif;fill:${border}}.serif{font-family:Georgia,'Times New Roman',serif;fill:${border}}</style>
      <rect width="${width}" height="${height}" fill="${background}"/><rect x="18" y="18" width="${width-36}" height="${height-36}" rx="22" fill="none" stroke="${border}" stroke-width="8"/><rect x="32" y="32" width="${width-64}" height="${height-64}" rx="16" fill="none" stroke="${gold}" stroke-width="3"/>
      <text x="${width/2}" y="${height*.15}" text-anchor="middle" font-size="${Math.max(24,height*.05)}" class="serif">Rosevear Creations · Devil n Dove</text>
      <text x="${width/2}" y="${height*.34}" text-anchor="middle" font-size="${Math.max(42,height*.09)}" font-weight="700" fill="${accent}" class="serif">${xml(data.packagingCollection || data.packagingProductName || 'Product')}</text>
      <text x="${width/2}" y="${height*.46}" text-anchor="middle" font-size="${Math.max(30,height*.065)}" class="copy">${xml(identityEn)}</text><text x="${width/2}" y="${height*.54}" text-anchor="middle" font-size="${Math.max(24,height*.05)}" class="copy">${xml(identityFr)}</text>
      <line x1="${width*.14}" y1="${height*.62}" x2="${width*.86}" y2="${height*.62}" stroke="${gold}" stroke-width="3"/>
      <text x="${width/2}" y="${height*.70}" text-anchor="middle" font-size="${Math.max(21,height*.043)}" class="copy">${xml(data.packagingNetQuantity || 'Verified net quantity')}</text>
      <text x="${width/2}" y="${height*.79}" text-anchor="middle" font-size="${Math.max(18,height*.035)}" class="copy">${xml(data.packagingDealerName || 'Rosevear Creations - Devil n Dove')}</text>
      <text x="${width/2}" y="${height*.86}" text-anchor="middle" font-size="${Math.max(16,height*.03)}" class="copy">${xml(data.packagingWebsite || 'devilndove.com')} · ${xml(data.packagingContact || 'devilndove.com/contact')}</text>
      <rect x="${width-130}" y="${height-130}" width="82" height="82" fill="#fff" stroke="${border}" stroke-width="3"/><path d="M${width-118} ${height-118}h22v22h-22zm48 0h22v22h-22zm-48 48h22v22h-22zm32-12h10v10h-10zm16 16h10v10h-10z" fill="${border}"/><text x="${width-89}" y="${height-32}" text-anchor="middle" font-size="12" class="copy">QR PLACEHOLDER</text>
    </svg>`;
  }

  function candleTopSvg(data, template) {
    const widthMm = Math.max(20, num(template.page_width_mm, 101.6)); const heightMm = Math.max(20, num(template.page_height_mm, widthMm));
    const layout = template.layout || {}; const artwork = data.artwork || {}; const theme = data.theme || {};
    const background = theme.theme_colour || '#FFFFFF'; const ink = theme.border_colour || '#000000'; const profile = String(layout.design_profile || 'candle_top_centered');
    const topArc = artwork.top_arc_text || layout.default_top_arc_text || 'devilndove.com'; const bottomArc = artwork.bottom_arc_text || layout.default_bottom_arc_text || 'Hand Made in Canada';
    const primary = artwork.candle_primary_text || layout.default_primary_text || data.packagingCollection || data.packagingProductName || 'Special Occasion';
    const date1 = artwork.candle_date_line_1 || layout.default_date_line_1 || ''; const eventLine = artwork.candle_event_line || layout.default_event_line || '';
    const date2 = artwork.candle_date_line_2 || layout.default_date_line_2 || ''; const asset = artwork.artwork_asset || layout.artwork_asset || '';
    const isWedding = profile === 'candle_top_wedding'; const primaryY = isWedding ? 590 : 455; const primarySize = fontSize(primary, 22, isWedding ? 62 : 78, 38);
    const safe = Math.max(0, num(layout.safe_margin_mm, 5)); const safeRadius = 470 - (safe / Math.max(widthMm, heightMm) * 1000);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 1000 1000" role="img" aria-label="${xml(primary)} round candle-top layout">
      <defs><path id="candle-top-upper-arc" d="M135 320 A385 385 0 0 1 865 320"/><path id="candle-top-lower-arc" d="M135 725 A385 385 0 0 0 865 725"/></defs>
      <style>.round-copy{font-family:Georgia,'Times New Roman',serif;fill:${ink}}.round-script{font-family:'Brush Script MT','Segoe Script',cursive;fill:${ink}}</style>
      <rect width="1000" height="1000" fill="${background}"/><circle cx="500" cy="500" r="486" fill="${background}" stroke="${ink}" stroke-width="7"/><circle cx="500" cy="500" r="472" fill="none" stroke="${ink}" stroke-width="3"/>
      <text class="round-copy" font-size="52" letter-spacing="1"><textPath href="#candle-top-upper-arc" startOffset="50%" text-anchor="middle">${xml(topArc)}</textPath></text>
      ${isWedding && asset ? `<image href="${xml(asset)}" x="215" y="150" width="570" height="410" preserveAspectRatio="xMidYMid meet"/>` : `<g fill="none" stroke="${ink}" stroke-width="5"><path d="M430 290q70-85 140 0q-70 100-140 0z"/><path d="M500 230v150M455 305h90"/></g>`}
      <text x="500" y="${primaryY}" text-anchor="middle" font-size="${primarySize}" class="round-script">${xml(primary)}</text>
      ${date1 ? `<text x="500" y="${primaryY + 70}" text-anchor="middle" font-size="38" class="round-copy">${xml(date1)}</text>` : ''}
      ${eventLine ? `<line x1="235" y1="${primaryY + 110}" x2="765" y2="${primaryY + 110}" stroke="${ink}" stroke-width="2"/><text x="500" y="${primaryY + 165}" text-anchor="middle" font-size="45" class="round-copy">${xml(eventLine)}</text>` : ''}
      ${date2 ? `<text x="500" y="${primaryY + 220}" text-anchor="middle" font-size="38" class="round-copy">${xml(date2)}</text>` : ''}
      <text class="round-copy" font-size="46" letter-spacing="1"><textPath href="#candle-top-lower-arc" startOffset="50%" text-anchor="middle">${xml(bottomArc)}</textPath></text>
      ${artwork.show_bleed ? '<circle cx="500" cy="500" r="495" fill="none" stroke="#d12424" stroke-width="2" stroke-dasharray="9 7"/>' : ''}
      ${artwork.show_safe_area ? `<circle cx="500" cy="500" r="${safeRadius.toFixed(1)}" fill="none" stroke="#14843a" stroke-width="2" stroke-dasharray="8 7"/>` : ''}
    </svg>`;
  }

  function svgMarkup() {
    const data = snapshot(); const template = currentTemplate(); const packageType = String(template.package_type || 'product_label'); const profile = String(template.layout?.design_profile || '');
    if (packageType === 'soap_ribbon' || profile === 'soap_reference_v2' || profile === 'soap_reference_v3') return glacialRibbonSvg(data, template);
    if (packageType === 'candle_top' || packageType === 'engraved_round' || profile.startsWith('candle_top') || profile === 'round_maker_mark') return candleTopSvg(data, template);
    return genericPackageSvg(data, template);
  }

  function compliance(payload) {
    const ingredients = payload.structured_ingredients || []; const claims = payload.structured_claims || []; const template = currentTemplate(); const layout = template.layout || {};
    const packageType = String(template.package_type || payload.package_type || ''); const isSoap = packageType === 'soap_ribbon'; const isRound = packageType === 'candle_top' || packageType === 'engraved_round';
    const checks = isRound ? [
      ['Reusable template', template.packaging_template_id], ['Physical width', num(template.page_width_mm) >= 20], ['Physical height', num(template.page_height_mm) >= 20],
      ['Centred primary wording', payload.artwork?.candle_primary_text || template.layout?.default_primary_text], ['Upper brand arc', payload.artwork?.top_arc_text || template.layout?.default_top_arc_text], ['Lower origin arc', payload.artwork?.bottom_arc_text || template.layout?.default_bottom_arc_text]
    ] : [
      ['English identity', payload.product_identity_en], ['French identity', payload.product_identity_fr], ['Metric net quantity', payload.net_quantity_text],
      ['Dealer / business', payload.dealer_name], ['Principal address', payload.dealer_address], ['Consumer contact', payload.contact_text], ['Website', payload.website_text],
      ['Bilingual claims', claims.length > 0 && claims.every((row) => row.claim_en && row.claim_fr)]
    ];
    if (isSoap) checks.push(['INCI list', payload.ingredients_inci], ['Made in Canada', payload.made_in_canada_text], ['Rose asset', payload.rose_asset_id], ['Structured ingredients', ingredients.length], ['Bilingual ingredient rows', ingredients.length && ingredients.every((row) => row.inci_name && row.display_name_en && row.display_name_fr)]);
    const missing = checks.filter(([, value]) => !value); const warnings = [];
    if (isSoap && Math.abs(num(template.page_width_mm) - 279.4) > .2) missing.push(['11-inch artboard', false]);
    if (isSoap && Math.abs(num(layout.band_height_mm) - 19.05) > .1) missing.push(['0.75-inch band', false]);
    if (isSoap && (Math.abs(num(template.front_width_mm) - 50.8) > .1 || Math.abs(num(template.front_height_mm) - 38.1) > .1)) missing.push(['2 × 1.5-inch front oval', false]);
    if (isSoap && Math.abs(num(template.page_height_mm) - 38.1) > .1) warnings.push('This 50 mm rear-seal profile expands the artboard beyond 1.50 inches.');
    if (isSoap && Math.abs(num(template.rear_width_mm) - 50) > .1) warnings.push('Photo-fit profile uses a 38.1 mm rear seal because 50 mm cannot fit inside a 38.1 mm-high artboard.');
    if (isSoap && ingredients.some((row) => row.allergen_note)) warnings.push('At least one ingredient includes an allergen note; verify current Health Canada fragrance-allergen requirements.');
    if (claims.some((row) => !row.is_approved)) warnings.push('One or more claims are not marked approved.');
    if (isSoap && (wrapLines(ingredients.map((row) => `• ${row.display_name_en || ''}`).join('\n'),27,99).length > 8 || wrapLines(ingredients.map((row) => `• ${row.display_name_fr || ''}`).join('\n'),26,99).length > 8)) warnings.push('Ingredient copy exceeds the eight-line narrow-band preview; shorten display wording or use a physically tested larger label profile without reducing below the chosen minimum print size.');
    if (isSoap && claims.length > 4) warnings.push('Only the first four claim rows fit the standard claims panel; remove, combine or move additional claims after review.');
    if (isRound) warnings.push('Round laser/print preview: confirm the measured lid or blank diameter, safe margin, material settings and a physical proof before production.');
    else if (!isSoap) warnings.push('General packaging preview: verify category-specific legal fields, physical dieline, barcode/QR destination and material fit before approval.');
    return { checks, missing, warnings, ready: missing.length === 0 };
  }

  function renderPreview() {
    const mount = id('packagingSvgPreview'); const template = currentTemplate(); if (mount) { mount.innerHTML = svgMarkup(); mount.dataset.previewShape = String(template.layout?.shape || 'rectangle'); }
    const payload = projectPayload(); const result = compliance(payload); const target = id('packagingComplianceResults');
    const isRound = ['candle_top','engraved_round'].includes(String(template.package_type));
    const readyNote = isRound ? 'Text and primary dimensions are ready for a review version. A measured blank, safe-area check, material settings and physical laser/print proof still apply.' : 'Data and primary dimensions are ready for a review version. Final formula, bilingual, claim and physical print review still apply.';
    if (target) target.innerHTML = `<div class="packaging-compliance-grid">${result.checks.map(([label, value]) => `<span class="${value ? 'ok' : 'missing'}">${value ? '✓' : '!'} ${esc(label)}</span>`).join('')}</div>
      ${result.warnings.length ? `<div class="packaging-warning-list"><strong>Physical/design decisions:</strong><ul>${result.warnings.map((warning) => `<li>${esc(warning)}</li>`).join('')}</ul></div>` : ''}
      <p class="small">${result.ready ? readyNote : `${result.missing.length} required check(s) remain incomplete.`}</p>`;
    const size = id('packagingPreviewSize');
    if (size) size.textContent = `Canvas ${num(template.page_width_mm,279.4)} × ${num(template.page_height_mm,38.1)} mm • band ${num(template.layout?.band_height_mm,19.05)} mm • front ${num(template.front_width_mm,50.8)} × ${num(template.front_height_mm,38.1)} mm • rear ${['candle_top','engraved_round'].includes(String(template.package_type))?Math.min(num(template.page_width_mm),num(template.page_height_mm)):num(template.rear_width_mm,38.1)} mm.`;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot())); } catch {}
  }

  function ingredientRow(row = {}, index = 0) {
    return `<tr data-soap-ingredient-row><td class="row-order">${index + 1}</td><td><input class="input" data-field="inci_name" value="${esc(row.inci_name || '')}" placeholder="INCI name"/></td><td><input class="input" data-field="display_name_en" value="${esc(row.display_name_en || '')}" placeholder="English"/></td><td><input class="input" data-field="display_name_fr" value="${esc(row.display_name_fr || '')}" placeholder="Français"/></td><td><label class="compact-check"><input type="checkbox" data-field="organic_flag" ${Number(row.organic_flag) === 1 ? 'checked' : ''}/> Organic</label></td><td><input class="input" data-field="allergen_note" value="${esc(row.allergen_note || '')}" placeholder="Allergen / review note"/></td><td><label class="compact-check"><input type="checkbox" data-field="required_on_label" ${Number(row.required_on_label) !== 0 ? 'checked' : ''}/> Required</label></td><td><button class="btn danger" type="button" data-remove-ingredient>Remove</button></td></tr>`;
  }

  function inventoryChoiceLabel(item = {}) {
    const idValue=Number(item.site_item_inventory_id||0);const stock=`${Number(item.on_hand_quantity||0)} ${item.stock_unit_label||'unit'}`;const sku=item.supplier_sku?` · ${item.supplier_sku}`:'';
    return `${item.item_name||'Inventory item'}${sku} · ${stock} · #${idValue}`;
  }
  function inventoryByChoice(value='') {
    const clean=String(value||'').trim();if(!clean)return null;
    const idMatch=clean.match(/#(\d+)\s*$/);if(idMatch){const match=state.inventory.find((item)=>Number(item.site_item_inventory_id)===Number(idMatch[1]));if(match)return match;}
    return state.inventory.find((item)=>inventoryChoiceLabel(item)===clean)||state.inventory.find((item)=>String(item.item_name||'').toLowerCase()===clean.toLowerCase())||null;
  }
  function inventoryDatalist(idValue) {
    return `<datalist id="${esc(idValue)}">${state.inventory.map((item)=>`<option value="${esc(inventoryChoiceLabel(item))}"></option>`).join('')}</datalist>`;
  }
  function claimIconUi(icon='leaf') {
    return `<span class="packaging-claim-icon" title="${esc(icon)}"><svg viewBox="0 0 36 36" aria-hidden="true">${iconSvg(icon,18,18,'currentColor')}</svg></span>`;
  }

  function claimRow(row = {}, index = 0) {
    const icon=row.icon_name||'leaf';
    return `<article data-soap-claim-row class="packaging-claim-editor-row"><div class="row-order">${index + 1}</div><div class="packaging-claim-editor-icon">${claimIconUi(icon)}</div><div class="packaging-claim-editor-grid"><label><span class="small">English claim</span><input class="input" data-field="claim_en" value="${esc(row.claim_en || '')}" placeholder="English claim"/></label><label><span class="small">French claim</span><input class="input" data-field="claim_fr" value="${esc(row.claim_fr || '')}" placeholder="French claim"/></label><label><span class="small">Icon</span><select class="input" data-field="icon_name">${['leaf','hands','recycle','heart','none'].map((name) => `<option value="${name}" ${String(icon) === name ? 'selected' : ''}>${name}</option>`).join('')}</select></label><label class="packaging-claim-approved"><span class="small">Review</span><span class="compact-check"><input type="checkbox" data-field="is_approved" ${Number(row.is_approved) === 1 ? 'checked' : ''}/> Approved internally</span></label><label class="packaging-claim-note"><span class="small">Review note</span><input class="input" data-field="compliance_note" value="${esc(row.compliance_note || '')}" placeholder="Compliance / review note"/></label></div><button class="btn danger" type="button" data-remove-claim>Remove</button></article>`;
  }

  function componentRow(row = {}, index = 0) {
    const selected=state.inventory.find((item)=>Number(item.site_item_inventory_id)===Number(row.site_item_inventory_id||0));
    const searchValue=selected?inventoryChoiceLabel(selected):(row.inventory_item_name?`${row.inventory_item_name} · #${Number(row.site_item_inventory_id||0)}`:'');
    const stock=selected?`${Number(selected.on_hand_quantity||0)} ${selected.stock_unit_label||'unit'} on hand${Number(selected.reserved_quantity||0)?` · ${Number(selected.reserved_quantity)} reserved`:''}`:(row.site_item_inventory_id?'Linked inventory item':'Choose an inventory item first; fields below can still be entered manually.');
    return `<article data-packaging-component-row class="packaging-component-card"><div class="packaging-component-card-top"><span class="row-order">${index + 1}</span><strong>${esc(row.component_name||selected?.item_name||'Packaging component')}</strong><button class="btn danger" type="button" data-remove-component>Remove</button></div><div class="packaging-component-card-grid"><label class="packaging-component-inventory"><span class="small">Inventory item — type to search</span><input class="input" type="search" list="packagingComponentInventoryOptions" data-field="inventory_search" value="${esc(searchValue)}" placeholder="Start typing an inventory item name…" autocomplete="off"/><input type="hidden" data-field="site_item_inventory_id" value="${Number(row.site_item_inventory_id||0)||''}"/><small data-inventory-stock>${esc(stock)}</small></label><label><span class="small">Component type</span><select class="input" data-field="component_type">${['label','container','closure','box','wrap','tissue','insert','seal','barcode','shipping','other'].map((value) => `<option value="${value}" ${String(row.component_type || 'label') === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label><span class="small">Component name</span><input class="input" data-field="component_name" value="${esc(row.component_name || selected?.item_name || '')}" placeholder="Bottle, label stock, insert…"/></label><label><span class="small">SKU / supplier ref</span><input class="input" data-field="sku_reference" value="${esc(row.sku_reference || selected?.supplier_sku || '')}" placeholder="SKU / supplier ref"/></label><label><span class="small">Quantity per finished unit</span><input class="input" data-field="quantity_per_finished_unit" type="number" min="0.0001" step="0.0001" value="${esc(row.quantity_per_finished_unit ?? 1)}"/></label><label><span class="small">Waste %</span><input class="input" data-field="wastage_percent" type="number" min="0" step="0.1" value="${esc(row.wastage_percent || 0)}"/></label><label><span class="small">Unit cost ¢</span><input class="input" data-field="unit_cost_cents" type="number" min="0" step="1" value="${esc(row.unit_cost_cents || selected?.unit_cost_cents || 0)}"/></label><label><span class="small">Supplier</span><input class="input" data-field="supplier_name" value="${esc(row.supplier_name || selected?.supplier_name || '')}" placeholder="Supplier"/></label><label class="packaging-component-lot"><span class="small">Traceability</span><span class="compact-check"><input type="checkbox" data-field="lot_tracking_required" ${Number(row.lot_tracking_required) === 1 ? 'checked' : ''}/> Lot tracking</span></label><label class="packaging-component-notes"><span class="small">Notes</span><input class="input" data-field="notes" value="${esc(row.notes || '')}" placeholder="Finish, size, reorder note"/></label></div></article>`;
  }


  function sourceInciRow(row = {}, index = 0) {
    return `<tr data-source-inci-row><td class="row-order">${index + 1}</td><td><input class="input" data-field="inci_name" value="${esc(row.inci_name || '')}" placeholder="Supplier INCI / ingredient"/></td><td><input class="input" data-field="display_name_en" value="${esc(row.display_name_en || '')}" placeholder="English/common name"/></td><td><input class="input" data-field="display_name_fr" value="${esc(row.display_name_fr || '')}" placeholder="French/common name"/></td><td><label class="compact-check"><input type="checkbox" data-field="organic_flag" ${Number(row.organic_flag) === 1 ? 'checked' : ''}/> Organic</label></td><td><input class="input" data-field="allergen_note" value="${esc(row.allergen_note || '')}" placeholder="Supplier / allergen note"/></td><td><label class="compact-check"><input type="checkbox" data-field="required_on_label" ${Number(row.required_on_label) !== 0 ? 'checked' : ''}/> Label</label></td><td><button class="btn danger" type="button" data-remove-source-inci>Remove</button></td></tr>`;
  }

  function sourceInciRowsFromDom() {
    return [...document.querySelectorAll('[data-source-inci-row]')].map((row,index)=>({
      sort_order:index+1,
      inci_name:row.querySelector('[data-field="inci_name"]')?.value||'',
      display_name_en:row.querySelector('[data-field="display_name_en"]')?.value||'',
      display_name_fr:row.querySelector('[data-field="display_name_fr"]')?.value||'',
      organic_flag:row.querySelector('[data-field="organic_flag"]')?.checked?1:0,
      allergen_note:row.querySelector('[data-field="allergen_note"]')?.value||'',
      required_on_label:row.querySelector('[data-field="required_on_label"]')?.checked?1:0
    })).filter((row)=>row.inci_name||row.display_name_en||row.display_name_fr);
  }

  function setSourceInciRows(rows = []) {
    const mount=id('packagingSourceInciRows');if(!mount)return;
    const safeRows=Array.isArray(rows)&&rows.length?rows:[{}];mount.innerHTML=safeRows.map(sourceInciRow).join('');bindSourceInciRows();
  }
  function bindSourceInciRows(){document.querySelectorAll('[data-remove-source-inci]').forEach((button)=>{button.onclick=()=>{button.closest('[data-source-inci-row]')?.remove();updateRowNumbers('[data-source-inci-row]');if(!document.querySelector('[data-source-inci-row]'))setSourceInciRows([{}]);};});}
  function addSourceInciRow(row={}){id('packagingSourceInciRows')?.insertAdjacentHTML('beforeend',sourceInciRow(row,document.querySelectorAll('[data-source-inci-row]').length));bindSourceInciRows();}
  function importSourceIngredientText(){
    const raw=String(id('packagingSourceIngredientRaw')?.value||'').replace(/^ingredients?\s*:\s*/i,'').trim();if(!raw){message('Paste the supplier ingredient declaration first.','error');return;}
    const parts=raw.split(/[,;\n]+/).map((value)=>value.replace(/^[-•\d.)\s]+/,'').trim()).filter(Boolean);
    if(!parts.length){message('No ingredient names could be found in the supplier text.','error');return;}
    setSourceInciRows(parts.map((name,index)=>({sort_order:index+1,inci_name:name,display_name_en:name,display_name_fr:name,required_on_label:1,verification_status:'needs_review'})));
    message(`${parts.length} draft source ingredient row${parts.length===1?'':'s'} created. Verify the supplier INCI names before marking the source verified.`,'success');
  }

  function materialSubtypeLabel(row={}){return String(row.material_subtype||row.material_type||'material').replaceAll('_',' ');}
  function sourceFamilyLabel(value='general'){const labels={soap:'Soap',candle:'Candles',bath_body:'Bath & body',home_fragrance:'Home fragrance',cosmetic:'Cosmetic / body',general:'General',other:'Other'};return labels[String(value||'general')]||String(value||'general').replaceAll('_',' ');}
  function sourceMaterialCoreType(subtype='other'){const value=String(subtype||'other');if(value==='soap_base')return'soap_base';if(['fragrance_oil','essential_oil_blend'].includes(value))return'fragrance_oil';if(['colourant','dye','mica','pigment'].includes(value))return'colourant';return'additive';}
  function sourceMaterialDefaultRole(subtype='other'){const value=String(subtype||'other');if(['soap_base','candle_wax','cosmetic_base','carrier_base'].includes(value))return'base';if(['fragrance_oil','essential_oil_blend'].includes(value))return'fragrance';if(['colourant','dye','mica','pigment'].includes(value))return'colourant';return'additive';}

  function formulaLibraryOptions(value = '') {
    return `<option value="">Choose a saved finished formula…</option>${state.formulaLibrary.map((row)=>`<option value="${Number(row.packaging_formula_library_id||0)}" ${Number(value)===Number(row.packaging_formula_library_id)?'selected':''}>${esc(row.formula_name)}${Number(row.is_system)===1?' · built-in':' · custom'}</option>`).join('')}`;
  }

  function sourceMaterialOptions(value = '') {
    return `<option value="">Choose a purchased/source material…</option>${state.sourceMaterialLibrary.map((row)=>`<option value="${Number(row.packaging_source_material_template_id||0)}" ${Number(value)===Number(row.packaging_source_material_template_id)?'selected':''}>${esc(row.material_name)} · ${esc(sourceFamilyLabel(row.product_family))} / ${esc(materialSubtypeLabel(row))}${row.supplier_name?` · ${esc(row.supplier_name)}`:''}</option>`).join('')}`;
  }

  function sourceMaterialCard(row, attachedIds = new Set(), allowAttach = true) {
    const sourceId=Number(row.packaging_source_material_template_id||0);const attached=attachedIds.has(sourceId);const ingredientCount=Array.isArray(row.master_inci)?row.master_inci.length:0;const benefitCount=Array.isArray(row.benefits)?row.benefits.length:0;
    const fragrance=String(row.material_type)==='fragrance_oil'?` · allergen review ${row.fragrance_allergen_review_status||'needs_supplier_data'}`:'';const swatch=row.colour_hex?`<span class="packaging-colour-swatch" style="--swatch:${esc(row.colour_hex)}" title="${esc(row.colour_hex)}"></span>`:'';
    return `<article class="packaging-library-card packaging-source-card ${attached?'is-attached':''}"><img class="packaging-source-thumb" src="${esc(row.source_image_url||'/assets/packaging/placeholders/soap-base-source-template.svg')}" alt="${esc(row.material_name||'Source material')} source material"/><div class="packaging-source-card-body"><div class="packaging-card-badges"><span class="status-pill">${esc(sourceFamilyLabel(row.product_family))}</span><span class="status-pill">${esc(materialSubtypeLabel(row))}</span><span class="status-pill">${esc(row.verification_status||'needs_review')}</span>${swatch}${attached?'<span class="status-pill">attached</span>':''}</div><strong>${esc(row.material_name||'Source material')}</strong><small>${esc(row.supplier_name||'Supplier not recorded')}${row.supplier_sku?` · ${esc(row.supplier_sku)}`:''} · ${ingredientCount} source ingredient row(s) · ${benefitCount} benefit(s)${esc(fragrance)}</small>${row.allergen_statement?`<p class="small"><strong>${['supplier_verified','owner_verified'].includes(String(row.verification_status||''))?'Reviewed supplier allergen statement':'Unverified supplier allergen statement'}:</strong> ${esc(row.allergen_statement)}</p>`:''}${row.compliance_notes?`<p class="small"><strong>Review note:</strong> ${esc(row.compliance_notes)}</p>`:''}</div><div class="packaging-library-card-actions">${allowAttach?`<button class="btn primary" type="button" data-use-source-material="${sourceId}">${attached?'Reapply':'Use template'}</button>`:''}<button class="btn" type="button" data-load-source-material="${sourceId}">Edit/view</button>${attached?`<button class="btn" type="button" data-detach-source-material="${sourceId}">Detach</button>`:''}${Number(row.is_system)===1?'':`<button class="btn danger" type="button" data-delete-source-material="${sourceId}">Delete</button>`}</div></article>`;
  }

  function sourceMaterialManagerMarkup({attachedIds=new Set(),sourceMaterials=[],allowAttach=true,standalone=false}={}) {
    const rows=state.sourceMaterialLibrary;
    const attachedBase=sourceMaterials.find((row)=>String(row.material_role)==='base');
    const selectedId=Number(state.activeSourceMaterialId||attachedBase?.packaging_source_material_template_id||rows[0]?.packaging_source_material_template_id||0);
    const activeRow=sourceMaterialById(selectedId)||rows[0]||null;
    if(activeRow)state.activeSourceMaterialId=Number(activeRow.packaging_source_material_template_id||0);
    return `<section class="packaging-library-section packaging-material-library-hub"><div class="section-heading-row packaging-library-heading"><div><p class="eyebrow">Material Library</p><h4>${standalone?'Manage purchased materials before creating a label':'Purchased/source material templates'}</h4><p class="small">Choose one template from the dropdown. Only that active template is shown and edited below. Soap bases, waxes, fragrance/essential-oil blends, colours and additives keep their supplier ingredient/INCI evidence here.</p></div><span class="status-pill">${rows.length} template${rows.length===1?'':'s'}</span></div>
      ${!state.sourceMaterialMetadataReady?`<div class="packaging-warning-list"><strong>Build 255 database migration required</strong><p class="small">The product-family/source-category metadata needs <code>database_build255_packaging_material_library_hub.sql</code>.</p></div>`:''}
      <div class="grid cols-2 packaging-source-picker"><label><span class="small">Active source-material template</span><select class="input" id="packagingSourceMaterialTemplateId">${sourceMaterialOptions(activeRow?.packaging_source_material_template_id||'')}</select></label><label><span class="small">Attached sources on this label</span><input class="input" readonly value="${esc(sourceMaterials.length?sourceMaterials.map((row)=>`${row.material_role}: ${row.material_name}`).join(' · '):'None yet')}"/></label></div>
      <div id="packagingSourceActiveCard" class="packaging-source-active-card">${activeRow?sourceMaterialCard(activeRow,attachedIds,allowAttach):'<p class="small">No purchased/source material templates are available yet. Use the editor below to create the first one.</p>'}</div>
      <details class="packaging-source-editor" open><summary>Add or edit the active purchased/source material template</summary><div class="packaging-source-editor-body"><input type="hidden" id="packagingSourceMaterialEditId"/><input type="hidden" id="packagingSourceInventoryId"/>
        <div class="packaging-inventory-material-import"><div><strong>Start with information already in Devil n Dove Inventory</strong><span class="small">This remains the normal first choice. If the item already has a linked Material Library template, that template opens instead of creating a duplicate.</span></div><div class="packaging-amazon-material-row"><input class="input" id="packagingSourceInventorySearch" type="search" list="packagingSourceInventoryOptions" placeholder="Type soap base, wax, essential oil, mica, colour…" autocomplete="off"/><button class="btn primary" id="loadPackagingSourceInventory" type="button">Use inventory information</button></div><div class="small" id="packagingSourceInventoryStatus">Choose the actual purchased inventory item first.</div>${inventoryDatalist('packagingSourceInventoryOptions')}</div>
        <details class="packaging-amazon-material-import"><summary>Amazon fallback — only when Inventory/source evidence is incomplete</summary><div><span class="small">Use the exact Amazon.ca product page only for missing source information. Supplier/manufacturer INCI, SDS and allergen documents remain the authority.</span></div><div class="packaging-amazon-material-row"><input class="input" id="packagingSourceAmazonUrl" type="url" placeholder="https://www.amazon.ca/dp/…"/><button class="btn" id="previewPackagingSourceAmazon" type="button">Create draft from Amazon link</button></div><div class="small" id="packagingSourceAmazonStatus">Nothing is saved until we review the fields below and press <b>Save material template</b>.</div></details>
        <div class="packaging-source-editor-intro"><strong>1. Identify what we bought</strong><span class="small">Choose the product area and exact source category.</span></div>
        <div class="grid cols-4"><label><span class="small">Product area</span><select class="input" id="packagingSourceProductFamily"><option value="soap">Soap</option><option value="candle">Candles</option><option value="bath_body">Bath & body</option><option value="home_fragrance">Home fragrance</option><option value="cosmetic">Cosmetic / body</option><option value="general">General</option><option value="other">Other</option></select></label><label><span class="small">Source category</span><select class="input" id="packagingSourceMaterialSubtype"><option value="soap_base">Soap base</option><option value="candle_wax">Candle wax / wax blend</option><option value="cosmetic_base">Cosmetic / body base</option><option value="fragrance_oil">Fragrance oil / blend</option><option value="essential_oil_blend">Essential-oil blend</option><option value="colourant">Colourant / dye</option><option value="mica">Mica / pigment</option><option value="carrier_oil_butter">Carrier oil / butter</option><option value="botanical">Botanical / extract</option><option value="additive">Other additive</option><option value="other">Other source material</option></select></label><label><span class="small">Template name</span><input class="input" id="packagingSourceMaterialName" placeholder="Example: Goat’s Milk Melt & Pour 10 lb"/></label><label><span class="small">Colour swatch (optional)</span><input class="input packaging-source-colour" id="packagingSourceColourHex" type="color" value="#C9B18A"/></label></div>
        <div class="grid cols-3"><label><span class="small">Supplier product name</span><input class="input" id="packagingSourceSupplierProductName"/></label><label><span class="small">Supplier</span><input class="input" id="packagingSourceSupplierName"/></label><label><span class="small">Supplier SKU</span><input class="input" id="packagingSourceSupplierSku"/></label></div>
        <div class="grid cols-2"><label><span class="small">Supplier/source URL</span><input class="input" id="packagingSourceUrl" type="url"/></label><label><span class="small">Supplier INCI/SDS/document URL</span><input class="input" id="packagingSourceDocumentUrl" type="url"/></label></div><div class="grid cols-3"><label><span class="small">Supplier/source image URL</span><input class="input" id="packagingSourceImageUrl" type="url"/></label><label><span class="small">Intended cosmetic use</span><select class="input" id="packagingSourceIntendedUse"><option value="rinse_off">Rinse-off</option><option value="leave_on">Leave-on</option><option value="both">Both</option><option value="not_applicable">Not applicable</option></select></label><label><span class="small">Verification</span><select class="input" id="packagingSourceVerification"><option value="needs_review">Needs review</option><option value="supplier_verified">Supplier verified</option><option value="owner_verified">Owner verified</option><option value="blocked">Blocked</option></select></label></div>
        <div class="packaging-source-editor-intro"><strong>2. Supplier ingredient declaration / Master INCI</strong><span class="small">When this template is saved, its ingredient rows are also added to the reusable Individual Ingredients dropdown. Fragrance/essential-oil blends and colourants are added to their matching reusable dropdown automatically.</span></div>
        <label><span class="small">Raw supplier ingredient declaration</span><textarea class="input" id="packagingSourceIngredientRaw" rows="4"></textarea></label><div class="packaging-save-actions"><button class="btn" id="importPackagingSourceIngredients" type="button">Create draft rows from supplier text</button><button class="btn" id="addPackagingSourceInci" type="button">Add ingredient row</button></div><div class="admin-table-wrap packaging-source-inci-table"><table><thead><tr><th>#</th><th>Supplier INCI</th><th>English/common</th><th>French/common</th><th>Organic</th><th>Allergen/source note</th><th>Label?</th><th></th></tr></thead><tbody id="packagingSourceInciRows"></tbody></table></div>
        <div class="packaging-source-editor-intro"><strong>3. Supplier evidence and reusable characteristics</strong><span class="small">Benefits and supplier claims remain source evidence until deliberately reviewed.</span></div>
        <label><span class="small">Supplier allergen statement / characteristics</span><textarea class="input" id="packagingSourceAllergenStatement" rows="3"></textarea></label><label><span class="small">Supplier benefits / characteristics — separate entries with a blank line; use “Title: details”</span><textarea class="input" id="packagingSourceBenefits" rows="7"></textarea></label><label><span class="small">Supplier claim suggestions — one per line; never auto-approved</span><textarea class="input" id="packagingSourceClaims" rows="4"></textarea></label><label><span class="small">Fragrance allergens — one per line as INCI | concentration % | required | notes</span><textarea class="input" id="packagingSourceFragranceAllergens" rows="4"></textarea></label><div class="grid cols-2"><label><span class="small">Usage / process notes</span><textarea class="input" id="packagingSourceUsageNotes" rows="3"></textarea></label><label><span class="small">Compliance / review notes</span><textarea class="input" id="packagingSourceComplianceNotes" rows="3"></textarea></label></div>
        <div class="grid cols-2"><label><span class="small">Fragrance-allergen review</span><select class="input" id="packagingSourceFragranceReview"><option value="not_applicable">Not applicable</option><option value="needs_supplier_data">Needs supplier data</option><option value="needs_review">Needs review</option><option value="reviewed">Reviewed</option></select></label></div><div class="packaging-save-actions"><button class="btn primary" id="savePackagingSourceMaterial" type="button">Save material template</button><button class="btn" id="clearPackagingSourceMaterialEditor" type="button">Clear editor for new template</button></div>
      </div></details></section>`;
  }

  function sourceBenefitMarkup(row) {
    const benefits=Array.isArray(row?.benefits)?row.benefits:[];if(!benefits.length)return '<p class="small">No supplier benefits/characteristics stored for this source.</p>';
    return `<div class="packaging-source-benefits">${benefits.map((benefit,index)=>`<article><strong>${esc(benefit.title||`Benefit ${index+1}`)}</strong><p class="small">${esc(benefit.body||'')}</p><button class="btn" type="button" data-add-source-benefit-claim="${Number(row.packaging_source_material_template_id||0)}" data-benefit-index="${index}">Add title as draft claim</button></article>`).join('')}</div>`;
  }

  function parseBenefitsText(value='') {
    return String(value||'').split(/\n\s*\n/).map((block)=>block.trim()).filter(Boolean).map((block)=>{const lines=block.split(/\r?\n/).map((line)=>line.trim()).filter(Boolean);const first=lines.shift()||'';const split=first.match(/^([^:]{2,100}):\s*(.*)$/);return split?{title:split[1],body:[split[2],...lines].filter(Boolean).join(' '),label_candidate:0}:{title:first,body:lines.join(' '),label_candidate:0};});
  }
  function parseClaimLines(value='') {return String(value||'').split(/\r?\n/).map((line)=>line.trim()).filter(Boolean).map((claim_en)=>({claim_en,claim_fr:'',icon_name:'leaf',label_candidate:0,compliance_note:'Supplier/source claim. Human compliance and French review required before label approval.'}));}
  function parseFragranceAllergenLines(value='') {return String(value||'').split(/\r?\n/).map((line)=>line.trim()).filter(Boolean).map((line)=>{const parts=line.split('|').map((v)=>v.trim());const concentration=Number(parts[1]);return{inci_name:parts[0],concentration_percent:Number.isFinite(concentration)?concentration:null,disclosure_required:String(parts[2]||'').toLowerCase()==='required'?1:0,notes:parts.slice(3).join(' | ')};});}

  function libraryContentCard(row) {
    const type=String(row.content_type||'ingredient'); const addLabel=type==='claim'?'Add to label':'Add ingredient row';
    const detail=type==='claim'?`${row.text_en||''}${row.text_fr?` / ${row.text_fr}`:''}`:`${row.inci_name||row.text_en||''}${row.text_fr&&row.text_fr!==row.inci_name?` / ${row.text_fr}`:''}`;
    return `<article class="packaging-library-card ${type==='claim'?'packaging-claim-library-card':''}">${type==='claim'?claimIconUi(row.icon_name||'leaf'):''}<div><span class="status-pill">${esc(type.replaceAll('_',' '))}</span><strong>${esc(row.item_name||'Library item')}</strong><small>${esc(detail)}</small></div><div class="packaging-library-card-actions"><button class="btn" type="button" data-add-library-content="${Number(row.packaging_content_library_id||0)}">${addLabel}</button>${Number(row.is_system)===1?'':`<button class="btn danger" type="button" data-delete-library-content="${Number(row.packaging_content_library_id||0)}">Delete</button>`}</div></article>`;
  }

  function reusableContentOptions(selectedId=0){
    const rows=state.contentLibrary.filter((row)=>['ingredient','fragrance_oil','colourant'].includes(String(row.content_type||'')));
    const groups=[['ingredient','Individual ingredients'],['fragrance_oil','Fragrance / essential-oil blends'],['colourant','Colourants / micas / pigments']];
    return `<option value="">Choose a reusable ingredient / blend / colourant…</option>${groups.map(([type,label])=>{const items=rows.filter((row)=>row.content_type===type);return items.length?`<optgroup label="${esc(label)}">${items.map((row)=>`<option value="${Number(row.packaging_content_library_id||0)}" ${Number(selectedId)===Number(row.packaging_content_library_id)?'selected':''}>${esc(row.item_name||'Library item')}${row.inci_name?` · ${esc(row.inci_name)}`:''}</option>`).join('')}</optgroup>`:'';}).join('')}`;
  }
  function activeReusableContentMarkup(contentId=0){
    const row=state.contentLibrary.find((item)=>Number(item.packaging_content_library_id)===Number(contentId));
    if(!row)return '<p class="small">Choose an ingredient, fragrance/essential-oil blend or colourant from the dropdown to see it here.</p>';
    const notes=row.metadata?.notes||row.metadata?.source_material_name||'';
    return `<article class="packaging-library-card packaging-active-library-card"><div><span class="status-pill">${esc(String(row.content_type||'ingredient').replaceAll('_',' '))}</span><strong>${esc(row.item_name||'Library item')}</strong><small>${esc(row.inci_name||row.text_en||'')}${row.text_fr?` / ${esc(row.text_fr)}`:''}</small>${notes?`<p class="small">${esc(notes)}</p>`:''}</div><div class="packaging-library-card-actions"><button class="btn primary" type="button" data-add-library-content="${Number(row.packaging_content_library_id||0)}">Add to current label</button>${Number(row.is_system)===1||Number(row.metadata?.auto_generated)===1?'':`<button class="btn danger" type="button" data-delete-library-content="${Number(row.packaging_content_library_id||0)}">Delete</button>`}</div></article>`;
  }

  function templateCard(row, selectedId = 0) {
    const layout=row.layout||{}; const active=Number(selectedId)===Number(row.packaging_template_id);
    return `<article class="packaging-template-card ${active?'is-active':''}"><div><span class="status-pill">${Number(row.is_system)===1?'Built-in':'Custom'}</span><strong>${esc(row.template_name||'Template')}</strong><small>${esc(row.package_type||'packaging')} · ${num(row.page_width_mm)} × ${num(row.page_height_mm)} mm · ${esc(layout.shape||'rectangle')}</small><p class="small">${esc(row.description||'')}</p></div><button class="btn ${active?'primary':''}" type="button" data-use-packaging-template="${Number(row.packaging_template_id||0)}">${active?'Current template':'Use template'}</button></article>`;
  }

  function inferProductRoseKey(value='') {
    const source=String(value||'').toLowerCase();
    if(source.includes('glacial'))return'glacial-purple';if(source.includes('shea')||source.includes('pumice'))return'earth-shea-pumice';if(source.includes('oatmeal')||source.includes('goat'))return'health-oatmeal-goat-milk';if(source.includes('sea breeze'))return'sea-breeze';if(source.includes('charcoal'))return'charcoal';if(source.includes('honey'))return'honey';if(source.includes('rose'))return'rose';return'';
  }
  function selectedProductRoseKey(productName='', roseId='') {
    const inferred=inferProductRoseKey(productName); const match=PRODUCT_ROSE_PRESETS.find((row)=>row[0]===inferred); return match&&match[2]===String(roseId||'')?inferred:'';
  }

  function updateRoseAssetPath() {
    const field=id('packagingRoseAssetPath'); if(!field)return;
    field.value=roseAssetPath(id('packagingRoseAsset')?.value||'');
    field.placeholder=field.value?'':'Generated from custom rose colour';
  }

  function applyRoseAssetPreset(assetId, render=true) {
    const preset=rosePresetById(assetId); const select=id('packagingRoseAsset'); if(select)select.value=preset.id;
    if(preset.colour){if(id('packagingRoseColour'))id('packagingRoseColour').value=preset.colour;if(id('packagingSecondaryColour'))id('packagingSecondaryColour').value=mixHex(preset.colour,'#000000',.28);}
    updateRoseAssetPath(); if(render)renderPreview();
  }

  function applyProductRosePreset(key) {
    const match=PRODUCT_ROSE_PRESETS.find((row)=>row[0]===String(key||'')); if(!match)return;
    applyRoseAssetPreset(match[2]);
  }

  function tabButton(key, label) { return `<button class="packaging-tab ${state.activeTab === key ? 'is-active' : ''}" type="button" data-packaging-tab="${key}">${label}</button>`; }
  function tabPanel(key, content) { return `<section class="packaging-tab-panel ${state.activeTab === key ? 'is-active' : ''}" data-packaging-panel="${key}">${content}</section>`; }

  function detailMarkup() {
    const project = state.detail?.project || {}; const template = state.detail?.template || {}; const theme = project.theme || template.theme || {};
    const artwork = project.artwork || {}; const ingredients = state.detail?.ingredients || []; const claims = state.detail?.structured_claims || []; const sourceMaterials = state.detail?.source_materials || []; const components = state.detail?.components || []; const componentSummary = state.detail?.component_summary || {};
    const versions = state.detail?.versions || []; const exports = state.detail?.soap_exports?.length ? state.detail.soap_exports : (state.detail?.exports || []); const printTests = state.detail?.print_tests || [];
    const newestVersion = versions[0]?.packaging_project_version_id || ''; const attachedSourceIds=new Set(sourceMaterials.map((row)=>Number(row.packaging_source_material_template_id||0))); const attachedBase=sourceMaterials.find((row)=>String(row.material_role)==='base')||null;
    return `<section class="card packaging-editor-card"><div class="section-heading-row"><div><p class="eyebrow">${esc(project.project_key || 'New packaging system')}</p><h2 style="margin:0">${esc(project.project_name || project.product_name || 'Labeling and packaging project')}</h2></div><div class="packaging-project-actions"><button class="btn" id="duplicatePackagingProject" type="button">Duplicate</button><button class="btn" id="archivePackagingProject" type="button">Archive</button><button class="btn danger" id="deletePackagingProject" type="button">Delete label</button></div></div>
      <input type="hidden" id="packagingProjectId" value="${Number(project.packaging_project_id || 0)}"/>
      <div class="packaging-tab-list" role="tablist" aria-label="Labeling and packaging editor sections">${tabButton('product','1. Product')}${tabButton('components','2. Components & Cost')}${tabButton('library','3. Material Library')}${tabButton('ingredients','4. Ingredients')}${tabButton('french','5. French')}${tabButton('rose','6. Artwork & Colours')}${tabButton('claims','7. Claims')}${tabButton('layout','8. Layouts & Templates')}${tabButton('preview','9. Preview')}${tabButton('print','10. Print Test')}${tabButton('versions','11. Versions')}</div>
      ${tabPanel('product',`<h3>Product and project</h3><div class="grid cols-3"><label><span class="small">Project name</span><input class="input" id="packagingProjectName" value="${esc(project.project_name || '')}"/></label><label><span class="small">Template — controls the renderer and saved package type</span><select class="input" id="packagingTemplateId">${options(state.templates,project.packaging_template_id,(row)=>`${row.template_name} · ${num(row.page_width_mm)}×${num(row.page_height_mm)} mm${Number(row.is_system)===1?'':' · custom'}`)}</select></label><label><span class="small">Linked store product</span><select class="input" id="packagingProductId"><option value="">No product link</option>${options(state.products,project.product_id,(row)=>`${row.name} · ${row.sku || `#${row.product_id}`}`)}</select></label></div>
        <div class="grid cols-3"><label><span class="small">Package type (set by template)</span><select class="input" id="packagingType" disabled>${[['soap_ribbon','Soap ribbon'],['candle_top','Candle top / lid'],['engraved_round','Engraved round / coaster'],['product_label','General product label'],['candle_label','Candle label'],['jewelry_card','Jewelry card'],['package_insert','Package insert / care card'],['shipping_label','Shipping label'],['gift_set','Gift set packaging']].map(([value,label])=>`<option value="${value}" ${String(template.package_type||project.package_type||'soap_ribbon')===value?'selected':''}>${label}</option>`).join('')}</select></label><label><span class="small">Project status</span><select class="input" id="packagingStatus">${['draft','review','approved','archived'].map((value)=>`<option ${project.project_status===value?'selected':''}>${value}</option>`).join('')}</select></label><label><span class="small">Compliance status</span><select class="input" id="packagingCompliance">${['needs_review','ready_for_review','approved','blocked'].map((value)=>`<option ${project.compliance_status===value?'selected':''}>${value}</option>`).join('')}</select></label></div>
        <div class="grid cols-3"><label><span class="small">Product family / main name</span><input class="input" id="packagingCollection" value="${esc(project.collection_name || '')}" placeholder="Glacial Purple"/></label><label><span class="small">Product / variant</span><input class="input" id="packagingProductName" value="${esc(project.product_name || '')}" placeholder="Aloe Soap, candle, jewelry…"/></label><label><span class="small">Front tagline</span><input class="input" id="packagingSubtitle" value="${esc(project.product_subtitle || '')}"/></label></div>
        <div class="grid cols-2"><label><span class="small">Product identity — English</span><input class="input" id="packagingIdentityEn" value="${esc(project.product_identity_en || project.product_name || '')}"/></label><label><span class="small">Product identity — French</span><input class="input" id="packagingIdentityFr" value="${esc(project.product_identity_fr || '')}"/></label></div>
        <label><span class="small">Master INCI list</span><textarea class="input" id="packagingInci" rows="4">${esc(project.ingredients_inci || '')}</textarea></label>
        <div class="grid cols-4"><label><span class="small">Net weight wording</span><input class="input" id="packagingNetQuantity" value="${esc(project.net_quantity_text || '')}" placeholder="NET WT. APPROX. 4.5 OZ / 127 G"/></label><label><span class="small">Ounces</span><input class="input" id="packagingNetWeightOz" type="number" step="0.01" value="${esc(project.net_weight_oz || '')}"/></label><label><span class="small">Grams</span><input class="input" id="packagingNetWeightG" type="number" step="0.1" value="${esc(project.net_weight_g || project.weight_grams || '')}"/></label><label><span class="small">Website</span><input class="input" id="packagingWebsite" value="${esc(project.website_text || 'devilndove.com')}"/></label></div>
        <div class="grid cols-3"><label><span class="small">Dealer / business</span><input class="input" id="packagingDealerName" value="${esc(project.dealer_name || 'Rosevear Creations - Devil n Dove')}"/></label><label><span class="small">Principal business address</span><input class="input" id="packagingDealerAddress" value="${esc(project.dealer_address || '')}"/></label><label><span class="small">Consumer contact</span><input class="input" id="packagingContact" value="${esc(project.contact_text || 'devilndove.com/contact')}"/></label></div><label><span class="small">Made in Canada wording</span><input class="input" id="packagingMadeInCanada" value="${esc(project.made_in_canada_text || 'Made in Canada / Fabriqué au Canada')}"/></label>`)}
      ${tabPanel('components',`<div class="section-heading-row"><div><h3>Packaging components, inventory and cost</h3><p class="small"><strong>Choose the actual inventory item first.</strong> Start typing its name; supplier, SKU and unit cost are reused from Inventory when available. Add only packaging consumed by the finished item—labels, jars, lids, boxes, inserts, seals and similar materials. Saving this BOM does not consume stock.</p></div><button class="btn" id="addPackagingComponent" type="button">Add component</button></div><div class="packaging-cost-summary"><strong>${Number(componentSummary.active_count||0)} component(s)</strong><span>Estimated packaging cost per finished unit: ${new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(componentSummary.estimated_unit_cost_cents||0)/100)}</span><span>${Number(componentSummary.lot_tracked_count||0)} lot-tracked</span></div>${inventoryDatalist('packagingComponentInventoryOptions')}<div id="packagingComponentRows" class="packaging-component-list">${(components.length?components:[{}]).map(componentRow).join('')}</div><div class="packaging-save-actions"><button class="btn primary" id="savePackagingComponents" type="button">Save packaging BOM</button><a class="btn" href="/admin/inventory-operations/">Open inventory operations</a></div><p class="small">Cost estimate = component unit cost × quantity per finished unit × (1 + waste %). The value is an estimate; confirmed lot/purchase cost remains the accounting authority.</p>`)}
      ${tabPanel('library',`<h3>Material Library — purchased sources, finished formulas and reusable label content</h3>
        ${state.librarySchemaReady?'':`<div class="packaging-warning-list"><strong>Build 247 database migration required</strong><p class="small">Core formula/content library controls require <code>database_build247_packaging_library_truth_layout_rose_palette.sql</code>.</p></div>`}
        ${state.sourceMaterialSchemaReady?'':`<div class="packaging-warning-list"><strong>Build 248 database migration required</strong><p class="small">Purchased soap-base/fragrance/colourant templates require <code>database_build248_packaging_source_material_templates_compliance.sql</code>.</p></div>`}
        <div class="packaging-compliance-callout"><strong>Canada fragrance-allergen review</strong><p class="small">For new cosmetics sold in Canada from August 1, 2026, the expanded fragrance-allergen list applies above 0.01% in rinse-off products and 0.001% in leave-on products. Store supplier fragrance-allergen evidence with each fragrance oil; an unreviewed attached fragrance source blocks print-ready status.</p><a href="https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/labelling-cosmetics.html" target="_blank" rel="noopener">Health Canada cosmetic labelling guide</a></div>
        ${sourceMaterialManagerMarkup({attachedIds:attachedSourceIds,sourceMaterials,allowAttach:true,standalone:false})}
        <section class="packaging-library-section"><div class="section-heading-row"><div><h4>Finished formula / recipe library</h4><p class="small">A finished formula is what we actually make. Soap can inherit a soap base; candles can inherit a wax/base source; then fragrance, colourant and other additions remain separate. Saving a formula records the currently selected base source when one is selected.</p></div></div><div class="grid cols-3"><label><span class="small">Saved formula</span><select class="input" id="packagingFormulaLibraryId">${formulaLibraryOptions()}</select></label><label><span class="small">New/custom formula name</span><input class="input" id="packagingFormulaLibraryName" placeholder="Example: Honey Goat Milk Soap or Sea Breeze Soy Candle"/></label><label><span class="small">Formula notes</span><input class="input" id="packagingFormulaLibraryNotes" placeholder="Finished-formula/source/lot/review notes…"/></label></div><div class="packaging-save-actions"><button class="btn primary" id="applyPackagingFormulaLibrary" type="button">Apply selected finished formula</button><button class="btn" id="savePackagingFormulaLibrary" type="button">Save current ingredients as finished formula</button><button class="btn danger" id="deletePackagingFormulaLibrary" type="button">Delete selected custom formula</button></div></section>
        <section class="packaging-library-section"><h4>Reusable claims</h4><div class="packaging-library-grid">${state.contentLibrary.filter((row)=>row.content_type==='claim').map(libraryContentCard).join('')||'<p class="small">No claim presets are available yet.</p>'}</div></section>
        <section class="packaging-library-section"><div class="section-heading-row"><div><h4>Individual ingredients, fragrance / essential-oil blends and colourants</h4><p class="small">Choose from the dropdown rather than scrolling through every record. Saving a source-material template automatically adds its Master INCI ingredients here; saved fragrance/essential-oil blends and colourants are also added as reusable choices.</p></div><span class="status-pill">${state.contentLibrary.filter((row)=>['ingredient','fragrance_oil','colourant'].includes(row.content_type)).length} reusable item(s)</span></div><label><span class="small">Reusable ingredient / blend / colourant</span><select class="input" id="packagingReusableContentSelect">${reusableContentOptions(state.activeContentLibraryId)}</select></label><div id="packagingReusableContentActive" class="packaging-source-active-card">${activeReusableContentMarkup(state.activeContentLibraryId)}</div><details class="packaging-library-entry-form"><summary>Add a manual reusable ingredient, blend or colourant</summary><div class="grid cols-3"><label><span class="small">Library type</span><select class="input" id="packagingLibraryContentType"><option value="ingredient">Ingredient</option><option value="fragrance_oil">Fragrance / essential-oil blend</option><option value="colourant">Colourant</option></select></label><label><span class="small">Library name</span><input class="input" id="packagingLibraryItemName" placeholder="Supplier/product or ingredient name"/></label><label><span class="small">INCI (ingredient/additive)</span><input class="input" id="packagingLibraryInci" placeholder="Supplier-verified INCI"/></label></div><div class="grid cols-2"><label><span class="small">English/common name</span><input class="input" id="packagingLibraryTextEn"/></label><label><span class="small">French/common name</span><input class="input" id="packagingLibraryTextFr"/></label></div><label><span class="small">Supplier / allergen / usage notes</span><input class="input" id="packagingLibraryNotes"/></label><button class="btn" id="savePackagingLibraryContent" type="button">Save library item</button></details></section>`)}
      ${tabPanel('ingredients',`<div class="section-heading-row"><div><h3>Structured ingredient rows</h3><p class="small">One D1 row per ingredient preserves order, INCI, bilingual display wording, organic status and allergen review evidence.</p></div><button class="btn" id="addSoapIngredient" type="button">Add ingredient</button></div><div class="admin-table-wrap packaging-row-editor"><table><thead><tr><th>#</th><th>INCI</th><th>English</th><th>French</th><th>Organic</th><th>Allergen note</th><th>Label</th><th></th></tr></thead><tbody id="soapIngredientRows">${(ingredients.length?ingredients:[{}]).map(ingredientRow).join('')}</tbody></table></div><label><span class="small">English panel fallback / supporting copy</span><textarea class="input" id="packagingIngredientsEn" rows="5">${esc(project.ingredients_en || '')}</textarea></label>`)}
      ${tabPanel('french',`<h3>French content review</h3><p class="small">Use the curated draft helper for common Devil n Dove packaging wording, then review it before approval. Cosmetic ingredient declarations use INCI names; they are not replaced by invented marketing copy.</p><div class="packaging-translation-actions"><button class="btn primary" id="generatePackagingFrenchDraft" type="button">Generate French draft</button><span class="small">Draft only — human review required.</span></div><label><span class="small">French supporting copy</span><textarea class="input" id="packagingIngredientsFr" rows="6">${esc(project.ingredients_fr || '')}</textarea></label><div class="grid cols-2"><label><span class="small">Warnings — English</span><textarea class="input" id="packagingWarningsEn" rows="4">${esc(project.warnings_en || '')}</textarea></label><label><span class="small">Warnings — French</span><textarea class="input" id="packagingWarningsFr" rows="4">${esc(project.warnings_fr || '')}</textarea></label></div>`)}
      ${tabPanel('rose',`<h3>Artwork, wording and colours</h3><div class="packaging-reference-pair"><div class="packaging-reference-note"><img src="/assets/packaging/soap/reference/glacial-purple-aloe-soap-approved-reference.png" alt="Approved Glacial Purple Aloe Soap continuous ribbon reference"/><div><strong>Approved soap-label reference</strong><p class="small">The soap renderer now preserves the permanent brand marks, botanical rose, centred hierarchy, bilingual panels, rear seal, claims and net weight.</p><button class="btn" id="applyGlacialPurpleReference" type="button">Apply Glacial Purple example</button></div></div><div class="packaging-reference-note"><img src="/assets/packaging/reference/wedding-candle-top-john-laurie-approved-reference.png" alt="Approved round wedding and anniversary candle-top reference"/><div><strong>Candle-top direction</strong><p class="small">Choose a candle-top template, then replace the names, dates and occasion below. Curved brand and origin text remain centred on the circular paths.</p></div></div></div><div class="grid cols-4"><label><span class="small">Product rose direction</span><select class="input" id="packagingProductRosePreset">${productRoseOptions(selectedProductRoseKey(project.collection_name||project.product_name,project.rose_asset_id||artwork.rose_asset_id))}</select></label><label><span class="small">Rose asset / colour preset</span><select class="input" id="packagingRoseAsset">${roseOptions(project.rose_asset_id||artwork.rose_asset_id||'rose-purple-v1')}</select></label><label><span class="small">Rose style</span><select class="input" id="packagingRoseStyle"><option value="full_rose" ${String(artwork.rose_style||'full_rose')==='full_rose'?'selected':''}>Full botanical rose</option><option value="minimal" ${String(artwork.rose_style)==='minimal'?'selected':''}>Minimal rose mark</option></select></label><label><span class="small">Badge shape</span><select class="input" id="packagingBadgeShape"><option value="oval" ${String(artwork.badge_shape||'oval')==='oval'?'selected':''}>Front oval</option><option value="scalloped" ${String(artwork.badge_shape)==='scalloped'?'selected':''}>Scalloped edge</option></select></label></div><div class="grid cols-5"><label><span class="small">Rose colour</span><input class="input" id="packagingRoseColour" type="color" value="${esc(theme.rose_colour||'#7B4DA6')}"/></label><label><span class="small">Background</span><input class="input" id="packagingThemeColour" type="color" value="${esc(theme.theme_colour||'#FBF5E8')}"/></label><label><span class="small">Dark border / engraving ink</span><input class="input" id="packagingBorderColour" type="color" value="${esc(theme.border_colour||'#32105E')}"/></label><label><span class="small">Gold trim</span><input class="input" id="packagingAccentGold" type="color" value="${esc(theme.accent_gold||'#B88A2F')}"/></label><label><span class="small">Accent purple</span><input class="input" id="packagingSecondaryColour" type="color" value="${esc(theme.secondary_colour||'#5A2A86')}"/></label></div><div class="grid cols-3"><label><span class="small">Upper arc wording</span><input class="input" id="packagingTopArcText" value="${esc(artwork.top_arc_text||template.layout?.default_top_arc_text||'')}"/></label><label><span class="small">Lower arc wording</span><input class="input" id="packagingBottomArcText" value="${esc(artwork.bottom_arc_text||template.layout?.default_bottom_arc_text||'')}"/></label><label><span class="small">Centre mark</span><input class="input" id="packagingCentreMark" value="${esc(artwork.centre_mark||'♥')}" maxlength="8"/></label></div><h4>Candle-top / round-template wording</h4><div class="grid cols-4"><label><span class="small">Names or main wording</span><input class="input" id="packagingCandlePrimaryText" value="${esc(artwork.candle_primary_text||template.layout?.default_primary_text||'')}" placeholder="John and Laurie"/></label><label><span class="small">First date</span><input class="input" id="packagingCandleDateLine1" value="${esc(artwork.candle_date_line_1||template.layout?.default_date_line_1||'')}" placeholder="March 3rd 1990"/></label><label><span class="small">Occasion</span><input class="input" id="packagingCandleEventLine" value="${esc(artwork.candle_event_line||template.layout?.default_event_line||'')}" placeholder="35 Year Anniversary"/></label><label><span class="small">Celebration date</span><input class="input" id="packagingCandleDateLine2" value="${esc(artwork.candle_date_line_2||template.layout?.default_date_line_2||'')}" placeholder="March 3rd 2025"/></label></div><div class="grid cols-2"><label><span class="small">Selected rose artwork path (automatic)</span><input class="input" id="packagingRoseAssetPath" value="${esc(roseAssetPath(project.rose_asset_id||artwork.rose_asset_id||'rose-purple-v1'))}" readonly placeholder="Generated from custom rose colour"/></label><label><span class="small">Artwork asset path (advanced; non-rose artwork only)</span><input class="input" id="packagingArtworkAsset" value="${esc(String(template.package_type)==='soap_ribbon' && String(artwork.artwork_asset||template.layout?.artwork_asset||'').includes('soap-botanical-purple-rose') ? '' : (artwork.artwork_asset||(String(template.package_type)==='soap_ribbon'?'':template.layout?.artwork_asset)||''))}" placeholder="Optional non-rose artwork asset"/></label></div><p class="small">Soap botanical artwork is controlled by the rose preset above. Choosing Custom colour uses the colour picker instead of a fixed rose image, so any rose colour can be used.</p>`)}
      ${tabPanel('claims',`<div class="section-heading-row"><div><h3>Claims library and label claims</h3><p class="small">Choose reusable claims from the database below, including their saved icon. Adding a claim creates a review copy on this label; it is not automatically approved.</p></div><button class="btn" id="addSoapClaim" type="button">Add blank claim</button></div><section class="packaging-claim-library"><h4>Available reusable claims</h4><div class="packaging-library-grid">${state.contentLibrary.filter((row)=>row.content_type==='claim').map(libraryContentCard).join('')||'<p class="small">No reusable claims are available yet.</p>'}</div><details class="packaging-claim-library-editor"><summary>Add a reusable claim to the database</summary><div class="grid cols-2"><label><span class="small">Library name</span><input class="input" id="claimLibraryName" placeholder="Example: Handmade with Care"/></label><label><span class="small">Icon</span><select class="input" id="claimLibraryIcon">${['leaf','hands','recycle','heart','none'].map((name)=>`<option value="${name}">${name}</option>`).join('')}</select></label><label><span class="small">English</span><input class="input" id="claimLibraryTextEn"/></label><label><span class="small">French</span><input class="input" id="claimLibraryTextFr"/></label></div><label><span class="small">Review / source note</span><input class="input" id="claimLibraryNotes" placeholder="Why this claim is appropriate / evidence source"/></label><button class="btn" id="saveClaimLibraryItem" type="button">Save reusable claim</button></details></section><h4>Claims currently on this label</h4><div id="soapClaimRows" class="packaging-claim-editor-list">${(claims.length?claims:[{}]).map(claimRow).join('')}</div><p class="small">For the standard soap ribbon, keep the final printed panel to four concise claims. Longer wording is automatically reduced in the SVG preview, but concise claims remain more readable.</p>`)}
      ${tabPanel('layout',`<h3>Physical size, layout and reusable templates</h3><div class="packaging-dimension-summary"><strong>${esc(template.template_name||'Template')} ${Number(template.is_system)===1?'· system template':'· custom template'}</strong><p class="small">${esc(template.description||'')}</p></div><h4>Available layout templates</h4><p class="small">Choose a built-in or saved template here; the same choice remains available from the Product tab.</p><div class="packaging-template-grid">${state.templates.map((row)=>templateCard(row,project.packaging_template_id)).join('')}</div><div class="grid cols-4"><label><span class="small">Canvas width mm</span><input class="input" id="packagingTemplateWidth" type="number" min="20" max="1200" step="0.1" value="${num(template.page_width_mm,279.4)}"/></label><label><span class="small">Canvas height mm</span><input class="input" id="packagingTemplateHeight" type="number" min="20" max="1200" step="0.1" value="${num(template.page_height_mm,38.1)}"/></label><label><span class="small">Front width mm</span><input class="input" id="packagingTemplateFrontWidth" type="number" min="0" max="1200" step="0.1" value="${num(template.front_width_mm,0)}"/></label><label><span class="small">Front height mm</span><input class="input" id="packagingTemplateFrontHeight" type="number" min="0" max="1200" step="0.1" value="${num(template.front_height_mm,0)}"/></label><label><span class="small">Rear width mm</span><input class="input" id="packagingTemplateRearWidth" type="number" min="0" max="1200" step="0.1" value="${num(template.rear_width_mm,0)}"/></label><label><span class="small">Rear height mm</span><input class="input" id="packagingTemplateRearHeight" type="number" min="0" max="1200" step="0.1" value="${num(template.rear_height_mm,0)}"/></label><label><span class="small">Shape</span><select class="input" id="packagingTemplateShape">${['rectangle','oval','round','soap_wrap'].map((value)=>`<option value="${value}" ${String(template.layout?.shape||'rectangle')===value?'selected':''}>${value.replace('_',' ')}</option>`).join('')}</select></label><label><span class="small">Design profile</span><select class="input" id="packagingDesignProfile" ${String(template.package_type)==='soap_ribbon'?'disabled aria-describedby="soapApprovedProfileNote"':''}>${['soap_reference_v3','candle_top_wedding','candle_top_centered','round_maker_mark','general_centered','general_rectangle'].map((value)=>`<option value="${value}" ${(String(template.package_type)==='soap_ribbon'?'soap_reference_v3':String(template.layout?.design_profile||'general_rectangle'))===value?'selected':''}>${value.replaceAll('_',' ')}</option>`).join('')}</select>${String(template.package_type)==='soap_ribbon'?'<span id="soapApprovedProfileNote" class="small">Soap projects are locked to the corrected soap_reference_v3 renderer with bounded ingredient, title and claim zones.</span>':''}</label><label><span class="small">Bleed mm</span><input class="input" id="packagingBleedMm" type="number" min="0" max="25" step="0.1" value="${num(template.layout?.bleed_mm,template.layout?.bleed_in?num(template.layout.bleed_in)*25.4:0)}"/></label><label><span class="small">Safe margin mm</span><input class="input" id="packagingSafeMarginMm" type="number" min="0" max="100" step="0.1" value="${num(template.layout?.safe_margin_mm,template.layout?.safe_margin_in?num(template.layout.safe_margin_in)*25.4:3)}"/></label></div><div class="grid cols-2"><label><span class="small">New reusable template name</span><input class="input" id="packagingCustomTemplateName" placeholder="Example: 3.75-inch wedding candle top"/></label><label><span class="small">Template description</span><input class="input" id="packagingCustomTemplateDescription" placeholder="Material, printer/laser, product family and fit notes"/></label></div><button class="btn" id="savePackagingTemplate" type="button">Save these dimensions and features as a reusable template</button><div class="grid cols-5 packaging-guide-controls"><label><input type="checkbox" id="packagingShowGuides" ${Number(artwork.show_guides)===1?'checked':''}/> All guides</label><label><input type="checkbox" id="packagingShowBleed" ${Number(artwork.show_bleed)===1?'checked':''}/> Bleed</label><label><input type="checkbox" id="packagingShowSafeArea" ${Number(artwork.show_safe_area)===1?'checked':''}/> Safe area</label><label><input type="checkbox" id="packagingShowFoldGuides" ${Number(artwork.show_fold_guides)===1?'checked':''}/> Folds</label><label><input type="checkbox" id="packagingShowGlueZone" ${Number(artwork.show_glue_zone)===1?'checked':''}/> Glue zone</label></div>${String(template.package_type)==='soap_ribbon'?'<div class="packaging-warning-list"><strong>Dimensional conflict preserved for review</strong><p class="small">The supplied specification requires a 38.1 mm-high artboard and a 50 mm rear circle. Those cannot physically fit together. Use the photo-fit profile for a 38.1 mm rear seal, or the 50 mm profile with a taller artboard.</p></div>':''}<label><span class="small">Print and finishing notes</span><textarea class="input" id="packagingPrintNotes" rows="4">${esc(project.print_notes||'')}</textarea></label>`)}
      ${tabPanel('preview',`<div class="section-heading-row"><div><h3>Live exact-size SVG preview</h3><p class="small" id="packagingPreviewSize">Loading dimensions…</p></div><span class="status-pill">SVG master</span></div><div class="packaging-soap-layout-guide"><strong>Soap ribbon alignment guide</strong><span>For soap labels the preview is locked into five non-overlapping print zones: French ingredients → front product oval/artwork → English ingredients → rear Devil n Dove seal → claims &amp; net weight. Long ingredient text clips inside its own panel instead of crossing into the oval.</span><a href="/assets/packaging/soap/reference/glacial-purple-aloe-soap-approved-reference.png" target="_blank" rel="noopener">Open the approved reference image</a></div><div id="packagingSvgPreview" class="packaging-svg-preview"></div><div id="packagingComplianceResults"></div><div class="packaging-export-actions"><button class="btn primary" data-packaging-export="svg">Export SVG</button><button class="btn" data-packaging-export="png">Export PNG</button><button class="btn" data-packaging-export="webp">Export WebP</button><button class="btn" data-packaging-export="jpg">Export JPG</button><button class="btn" data-packaging-export="pdf_print">Print / Save PDF</button></div>`)}
      ${tabPanel('print',`<div class="section-heading-row"><div><h3>100% physical print test & Letter sheet planner</h3><p class="small">Choose a Devil n Dove printer profile, then let the sheet planner place the maximum number of exact-size labels on 8.5 × 11 inch paper. The browser still opens the normal system print dialog; choose the same physical printer there.</p></div><span class="status-pill">8.5 × 11 Letter</span></div><div class="packaging-printer-callout"><strong>Printer profiles</strong><span class="small">For security, a normal website cannot enumerate or silently select Windows printers. This dropdown is built from printers recorded in Devil n Dove Inventory plus profiles we save here. The system print dialog remains the final printer selector.</span></div><div class="grid cols-3"><label><span class="small">Version tested</span><select class="input" id="printTestVersion"><option value="">Project draft</option>${versions.map((version)=>`<option value="${version.packaging_project_version_id}" ${Number(newestVersion)===Number(version.packaging_project_version_id)?'selected':''}>Version ${version.version_number} — ${esc(version.version_label||'')}</option>`).join('')}</select></label><label><span class="small">Result</span><select class="input" id="printTestStatus"><option value="needs_test">Needs test</option><option value="passed">Passed</option><option value="failed">Failed</option></select></label><label><span class="small">Printed date/time</span><input class="input" id="printTestDate" type="datetime-local"/></label></div><div class="grid cols-2"><label><span class="small">Saved / inventory printer profile</span><select class="input" id="printTestPrinterProfile">${printerProfileOptions('')}</select></label><label><span class="small">Printer/profile name</span><input class="input" id="printTestPrinterName" placeholder="Example: Epson ET-2800 — labels"/></label></div><div class="grid cols-5"><label><span class="small">Paper / stock</span><input class="input" id="printTestPaper" value="Letter 8.5 × 11 in"/></label><label><span class="small">Scale %</span><input class="input" id="printTestScale" type="number" value="100" step="0.1" min="1" max="150"/></label><label><span class="small">Printer margin mm</span><input class="input" id="printProfileMargin" type="number" value="0" min="0" step="0.1"/></label><label><span class="small">Gap between labels mm</span><input class="input" id="printProfileGap" type="number" value="0" min="0" step="0.1"/></label><label class="compact-check"><span class="small">Packing</span><span><input type="checkbox" id="printProfileAutoRotate" checked/> Allow 90° rotation for best yield</span></label></div><label><span class="small">Saved driver/settings note</span><input class="input" id="printProfileSettingsNote" placeholder="Example: Actual Size, High Quality, borderless/none margins, rear tray"/></label><div class="packaging-save-actions"><button class="btn" id="savePrinterProfile" type="button">Save / update printer profile</button><button class="btn primary" id="printOptimizedSheet" type="button">Print optimized 8.5 × 11 sheet</button></div><div id="printSheetPlan" class="packaging-sheet-plan"></div><div class="grid cols-5"><label><span class="small">Strip width in</span><input class="input" id="printTestStripWidth" type="number" step="0.001" value="11"/></label><label><span class="small">Band height in</span><input class="input" id="printTestBandHeight" type="number" step="0.001" value="0.75"/></label><label><span class="small">Front width in</span><input class="input" id="printTestFrontWidth" type="number" step="0.001" value="2"/></label><label><span class="small">Front height in</span><input class="input" id="printTestFrontHeight" type="number" step="0.001" value="1.5"/></label><label><span class="small">Round / rear diameter mm</span><input class="input" id="printTestRearCircle" type="number" step="0.1" value="${['candle_top','engraved_round'].includes(String(template.package_type))?Math.min(num(template.page_width_mm),num(template.page_height_mm)):num(template.rear_width_mm,38.1)}"/></label></div><div class="grid cols-3"><label><span class="small">Wrap fit</span><select class="input" id="printTestWrap"><option>not_checked</option><option>passed</option><option>failed</option></select></label><label><span class="small">Legibility</span><select class="input" id="printTestLegibility"><option>not_checked</option><option>passed</option><option>failed</option></select></label><label><span class="small">Overlap / folds</span><select class="input" id="printTestOverlap"><option>not_checked</option><option>passed</option><option>failed</option></select></label></div><label><span class="small">Proof image URL</span><input class="input" id="printTestProofUrl" type="url" placeholder="R2 or approved media URL"/></label><label><span class="small">Print-test notes</span><textarea class="input" id="printTestNotes" rows="4"></textarea></label><button class="btn primary" id="savePrintTest" type="button">Save print-test evidence</button><h4>Print-test history</h4><div class="admin-table-wrap"><table><thead><tr><th>Status</th><th>Version</th><th>Printer</th><th>Scale</th><th>Measurements</th><th>Physical checks</th><th>Date</th></tr></thead><tbody>${printTests.length?printTests.map((test)=>`<tr><td>${esc(test.test_status)}</td><td>${esc(test.packaging_project_version_id||'draft')}</td><td>${esc(test.printer_name||'—')}</td><td>${esc(test.scale_percent)}%</td><td>${esc(test.measured_strip_width_in||'—')} in × ${esc(test.measured_band_height_in||'—')} in; front ${esc(test.measured_front_width_in||'—')} × ${esc(test.measured_front_height_in||'—')}</td><td>${esc(test.wrap_fit_status)} / ${esc(test.legibility_status)} / ${esc(test.overlap_status)}</td><td>${esc(test.created_at||'')}</td></tr>`).join(''):'<tr><td colspan="7">No physical print tests recorded.</td></tr>'}</tbody></table></div>`)}
      ${tabPanel('versions',`<h3>Review versions and exports</h3><div class="admin-table-wrap"><table><thead><tr><th>Version</th><th>Label</th><th>Review</th><th>Created</th><th>Action</th></tr></thead><tbody>${versions.length?versions.map((version)=>`<tr><td>${version.version_number}</td><td>${esc(version.version_label||'')}</td><td><select class="input" data-version-status="${version.packaging_project_version_id}">${['needs_review','approved','changes_requested','blocked'].map((status)=>`<option ${version.review_status===status?'selected':''}>${status}</option>`).join('')}</select></td><td>${esc(version.created_at||'')}</td><td><button class="btn" data-review-version="${version.packaging_project_version_id}">Save review</button></td></tr>`).join(''):'<tr><td colspan="5">No review versions saved.</td></tr>'}</tbody></table></div><h4>Export history</h4><div class="packaging-export-history">${exports.length?exports.map((entry)=>`<span>${esc(entry.export_format)} · ${esc(entry.file_name||'prepared file')} · ${esc(entry.checksum?String(entry.checksum).slice(0,12):'no checksum')} · ${esc(entry.generated_at||entry.created_at||'')}</span>`).join(''):'<span class="small">No exports recorded.</span>'}</div>`)}
      <div class="packaging-save-actions packaging-sticky-actions"><button class="btn primary" id="savePackagingProject" type="button">Save project</button><button class="btn" id="savePackagingVersion" type="button">Save review version</button></div></section>`;
  }

  function activateTab(key) {
    state.activeTab = key;
    document.querySelectorAll('[data-packaging-tab]').forEach((node) => node.classList.toggle('is-active', node.dataset.packagingTab === key));
    document.querySelectorAll('[data-packaging-panel]').forEach((node) => node.classList.toggle('is-active', node.dataset.packagingPanel === key));
    if (key === 'preview') renderPreview(); if (key === 'print') updatePrintSheetPlan();
  }

  function updateRowNumbers(selector) { document.querySelectorAll(selector).forEach((row, index) => { const cell = row.querySelector('.row-order'); if (cell) cell.textContent = String(index + 1); }); }
  function addIngredient(row = {}) { id('soapIngredientRows')?.insertAdjacentHTML('beforeend', ingredientRow(row, document.querySelectorAll('[data-soap-ingredient-row]').length)); bindDynamicRows(); renderPreview(); }
  function addClaim(row = {}) { id('soapClaimRows')?.insertAdjacentHTML('beforeend', claimRow(row, document.querySelectorAll('[data-soap-claim-row]').length)); bindDynamicRows(); renderPreview(); }
  function addComponent(row = {}) { id('packagingComponentRows')?.insertAdjacentHTML('beforeend', componentRow(row, document.querySelectorAll('[data-packaging-component-row]').length)); bindDynamicRows(); }

  function applyInventoryToComponentRow(row, inventory) {
    if(!row)return;const hidden=row.querySelector('[data-field="site_item_inventory_id"]');const search=row.querySelector('[data-field="inventory_search"]');const stock=row.querySelector('[data-inventory-stock]');
    if(!inventory){if(hidden)hidden.value='';if(stock)stock.textContent='No exact inventory match selected. Keep typing or choose a suggestion.';return;}
    if(hidden)hidden.value=String(Number(inventory.site_item_inventory_id||0));if(search)search.value=inventoryChoiceLabel(inventory);if(stock)stock.textContent=`${Number(inventory.on_hand_quantity||0)} ${inventory.stock_unit_label||'unit'} on hand${Number(inventory.reserved_quantity||0)?` · ${Number(inventory.reserved_quantity)} reserved`:''}`;
    const name=row.querySelector('[data-field="component_name"]');const sku=row.querySelector('[data-field="sku_reference"]');const cost=row.querySelector('[data-field="unit_cost_cents"]');const supplier=row.querySelector('[data-field="supplier_name"]');
    if(name&&!name.value)name.value=inventory.item_name||'';if(sku&&!sku.value)sku.value=inventory.supplier_sku||inventory.external_key||'';if(cost&&!Number(cost.value||0))cost.value=Number(inventory.unit_cost_cents||0);if(supplier&&!supplier.value)supplier.value=inventory.supplier_name||'';
    const title=row.querySelector('.packaging-component-card-top strong');if(title)title.textContent=name?.value||inventory.item_name||'Packaging component';
  }

  function bindDynamicRows() {
    document.querySelectorAll('[data-remove-ingredient]').forEach((button) => { button.onclick = () => { button.closest('[data-soap-ingredient-row]')?.remove(); updateRowNumbers('[data-soap-ingredient-row]'); renderPreview(); }; });
    document.querySelectorAll('[data-remove-claim]').forEach((button) => { button.onclick = () => { button.closest('[data-soap-claim-row]')?.remove(); updateRowNumbers('[data-soap-claim-row]'); renderPreview(); }; });
    document.querySelectorAll('[data-remove-component]').forEach((button) => { button.onclick = () => { button.closest('[data-packaging-component-row]')?.remove(); updateRowNumbers('[data-packaging-component-row]'); }; });
    document.querySelectorAll('[data-packaging-component-row] [data-field="inventory_search"]').forEach((input) => {
      const resolve=()=>applyInventoryToComponentRow(input.closest('[data-packaging-component-row]'),inventoryByChoice(input.value));input.onchange=resolve;input.onblur=resolve;
    });
    document.querySelectorAll('[data-soap-ingredient-row] input,[data-soap-claim-row] input,[data-soap-claim-row] select').forEach((node) => { node.oninput = renderPreview; node.onchange = () => { if(node.matches('[data-field="icon_name"]')){const row=node.closest('[data-soap-claim-row]');const mount=row?.querySelector('.packaging-claim-editor-icon');if(mount)mount.innerHTML=claimIconUi(node.value);} renderPreview(); }; });
  }


  function renderMain() {
    const main = id('packagingStudioMain'); if (!main) return;
    if (!state.detail?.project) { main.innerHTML = `<section class="card packaging-studio-welcome"><h2>Choose or create a labeling and packaging project</h2><p>Use one project for the editable label, packaging component bill of materials, cost estimate, versions, print tests and approval evidence.</p><p><strong>You do not need a project to build the Material Library.</strong> Enter purchased soap bases, candle waxes, oils, colours and their supplier ingredients below first; they can then be reused by any label.</p></section>${sourceMaterialManagerMarkup({allowAttach:false,standalone:true})}`; bindSourceLibraryControls(); return; }
    main.innerHTML = detailMarkup(); bindDetail();
  }

  async function load(projectId = 0) {
    try { state.loading = true; message('Loading Labeling & Packaging System…'); const data = await api(null, projectId); state.projects = data.projects || []; state.templates = data.templates || []; state.products = data.products || []; state.inventory = data.inventory || []; state.printers = data.printers || []; state.referenceSources = data.reference_sources || []; state.formulaLibrary = data.formula_library || []; state.contentLibrary = data.content_library || []; state.sourceMaterialLibrary = data.source_material_library || []; state.librarySchemaReady = data.library_schema_ready !== false; state.sourceMaterialSchemaReady = data.source_material_schema_ready !== false; state.sourceMaterialMetadataReady = data.source_material_metadata_ready !== false; state.detail = data.detail || null; renderProjects(); renderMain(); message(`Labeling & Packaging System loaded with ${state.referenceSources.length} adopted source reference${state.referenceSources.length===1?'':'s'}.`, 'success'); }
    catch (error) { message(error.message, 'error'); restoreLocal(false); }
    finally { state.loading = false; }
  }

  function applySelectedTemplate() {
    const selectedId = Number(id('packagingTemplateId')?.value || 0); const template = state.templates.find((row) => Number(row.packaging_template_id) === selectedId);
    if (!template) return;
    const layout = template.layout || {}; const theme = template.theme || {};
    const values = {
      packagingType: template.package_type || 'product_label', packagingTemplateWidth: template.page_width_mm, packagingTemplateHeight: template.page_height_mm,
      packagingTemplateFrontWidth: template.front_width_mm, packagingTemplateFrontHeight: template.front_height_mm, packagingTemplateRearWidth: template.rear_width_mm,
      packagingTemplateRearHeight: template.rear_height_mm, packagingTemplateShape: layout.shape || 'rectangle', packagingDesignProfile: String(template.package_type) === 'soap_ribbon' ? 'soap_reference_v3' : (layout.design_profile || 'general_rectangle'),
      packagingBleedMm: layout.bleed_mm ?? (num(layout.bleed_in) * 25.4), packagingSafeMarginMm: layout.safe_margin_mm ?? (num(layout.safe_margin_in) * 25.4),
      packagingTopArcText: layout.default_top_arc_text || (template.package_type === 'soap_ribbon' ? 'Rosevear Creations' : ''), packagingBottomArcText: layout.default_bottom_arc_text || (template.package_type === 'soap_ribbon' ? 'MADE IN CANADA' : ''),
      packagingCandlePrimaryText: layout.default_primary_text || '', packagingCandleDateLine1: layout.default_date_line_1 || '', packagingCandleEventLine: layout.default_event_line || '',
      packagingCandleDateLine2: layout.default_date_line_2 || '', packagingArtworkAsset: String(template.package_type)==='soap_ribbon' ? '' : (layout.artwork_asset || '')
    };
    Object.entries(values).forEach(([field, value]) => { const node = id(field); if (node) node.value = value ?? ''; });
    Object.entries({ rose_colour: 'packagingRoseColour', theme_colour: 'packagingThemeColour', border_colour: 'packagingBorderColour', accent_gold: 'packagingAccentGold', secondary_colour: 'packagingSecondaryColour' }).forEach(([key, field]) => { if (id(field) && theme[key]) id(field).value = theme[key]; });
    renderPreview(); message(`Template “${template.template_name}” applied to this draft. Save the project to make it authoritative.`, 'success');
  }

  async function saveAsTemplate() {
    const name = String(id('packagingCustomTemplateName')?.value || '').trim(); if (!name) { message('Enter a reusable template name first.', 'error'); id('packagingCustomTemplateName')?.focus(); return; }
    const data = snapshot(); const template = currentTemplate();
    try {
      message('Saving reusable dimensions, renderer profile, artwork defaults and colours…');
      const result = await api({
        action: 'save_as_template', packaging_project_id: Number(data.packagingProjectId || 0), template_name: name,
        description: id('packagingCustomTemplateDescription')?.value || '', package_type: template.package_type,
        page_width_mm: template.page_width_mm, page_height_mm: template.page_height_mm, front_width_mm: template.front_width_mm,
        front_height_mm: template.front_height_mm, rear_width_mm: template.rear_width_mm, rear_height_mm: template.rear_height_mm,
        shape: template.layout?.shape, design_profile: template.layout?.design_profile, bleed_mm: template.layout?.bleed_mm, safe_margin_mm: template.layout?.safe_margin_mm,
        layout: { ...template.layout, default_top_arc_text: data.artwork.top_arc_text, default_bottom_arc_text: data.artwork.bottom_arc_text, default_primary_text: data.artwork.candle_primary_text, default_date_line_1: data.artwork.candle_date_line_1, default_event_line: data.artwork.candle_event_line, default_date_line_2: data.artwork.candle_date_line_2, artwork_asset: String(template.package_type)==='soap_ribbon' ? '' : data.artwork.artwork_asset }, theme: data.theme
      });
      state.templates = result.templates || state.templates; state.projects = result.projects || state.projects; state.detail = result.detail; state.activeTab = 'layout'; renderProjects(); renderMain(); message(result.message, 'success');
    } catch (error) { message(error.message || 'Reusable template could not be saved.', 'error'); }
  }

  async function createProject() {
    const productOptions = state.products.slice(0, 100).map((product) => `${product.product_id}: ${product.name}`).join('\n');
    const productId = Number(prompt(`Optional store-product row ID. Leave blank for packaging not yet linked to a product.\n\nExamples:\n${productOptions.slice(0,1000)}`) || 0) || null;
    const product = state.products.find((row) => Number(row.product_id) === productId); const productName = product?.name || prompt('Product, collection or packaging project name:'); if (!productName) return;
    const requestedType = String(prompt('Packaging type: soap_ribbon, candle_top, engraved_round, product_label, candle_label, jewelry_card, or package_insert', product?.product_category?.toLowerCase().includes('soap') ? 'soap_ribbon' : product?.product_category?.toLowerCase().includes('candle') ? 'candle_top' : 'product_label') || 'product_label').trim().toLowerCase();
    try { const preferred = state.templates.find((row) => row.package_type === requestedType) || state.templates.find((row) => row.template_key === 'product-label-rectangle-v1') || state.templates[0]; const data = await api({ action: 'create_project', product_id: productId, packaging_template_id: Number(preferred?.packaging_template_id || 0), project_name: `${productName} labeling and packaging`, product_name: productName, collection_name: productName }); state.projects = data.projects || []; state.inventory = data.inventory || state.inventory; state.detail = data.detail; state.activeTab = 'product'; renderProjects(); renderMain(); message(data.message, 'success'); }
    catch (error) { message(error.message, 'error'); }
  }

  async function saveProject() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot())); message('Saving template-controlled packaging data…'); const data = await api(projectPayload()); state.projects = data.projects || []; state.templates = data.templates || state.templates; state.detail = data.detail; renderProjects(); renderMain(); message(data.message, 'success'); return true; }
    catch (error) { message(`${error.message} Browser draft retained locally.`, 'error'); return false; }
  }

  async function saveComponents() {
    try { message('Saving packaging components and costs…'); const data = await api({ action: 'save_components', packaging_project_id: Number(id('packagingProjectId')?.value || 0), components: componentRowsFromDom() }); state.projects = data.projects || []; state.inventory = data.inventory || state.inventory; state.detail = data.detail; state.activeTab = 'components'; renderProjects(); renderMain(); message(data.message, 'success'); }
    catch (error) { message(error.message || 'Could not save packaging components.', 'error'); }
  }

  async function sha256(value) {
    if (!crypto?.subtle) return '';
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async function saveVersion() {
    try { if (!(await saveProject())) return; const svg = svgMarkup(); const checksum = await sha256(svg); const data = await api({ action: 'save_version', packaging_project_id: Number(id('packagingProjectId')?.value || 0), version_label: prompt('Version label:', `Review ${new Date().toLocaleDateString('en-CA')}`) || '', snapshot: projectPayload(), svg_markup: svg, checksum }); state.projects = data.projects || []; state.detail = data.detail; state.activeTab = 'versions'; renderProjects(); renderMain(); message(data.message, 'success'); }
    catch (error) { message(error.message, 'error'); }
  }

  async function duplicateProject() { if (!confirm('Duplicate this packaging project as a new draft?')) return; try { const data = await api({ action: 'duplicate_project', packaging_project_id: Number(id('packagingProjectId')?.value || 0) }); state.projects = data.projects || []; state.detail = data.detail; renderProjects(); renderMain(); message(data.message, 'success'); } catch (error) { message(error.message, 'error'); } }
  async function archiveProject() { if (!confirm('Archive this packaging project? Versions, exports and print evidence will remain.')) return; try { const data = await api({ action: 'archive_project', packaging_project_id: Number(id('packagingProjectId')?.value || 0) }); state.projects = data.projects || []; state.detail = data.detail; renderProjects(); renderMain(); message(data.message, 'success'); } catch (error) { message(error.message, 'error'); } }


  async function deleteProject() {
    const project=state.detail?.project||{}; const projectId=Number(project.packaging_project_id||id('packagingProjectId')?.value||0); const key=String(project.project_key||'').trim();
    if(!projectId||!key){message('This packaging project cannot be deleted because its project key is unavailable.','error');return;}
    const typed=prompt(`Permanently delete this label/project and its packaging-specific versions, exports, print tests and soap rows?\n\nThis cannot be undone. Type the project key exactly:\n${key}`,'');
    if(typed===null)return; if(String(typed).trim()!==key){message('Deletion cancelled: the project key did not match.','error');return;}
    try{message('Deleting the selected label/project…');const data=await api({action:'delete_project',packaging_project_id:projectId,confirm_project_key:key});state.projects=data.projects||[];state.templates=data.templates||state.templates;state.formulaLibrary=data.formula_library||state.formulaLibrary;state.contentLibrary=data.content_library||state.contentLibrary;state.sourceMaterialLibrary=data.source_material_library||state.sourceMaterialLibrary;state.detail=null;state.activeTab='product';try{localStorage.removeItem(STORAGE_KEY);}catch{}renderProjects();renderMain();message(data.message,'success');}
    catch(error){message(error.message||'The packaging project could not be deleted.','error');}
  }

  function refreshLibraryState(data) {
    state.projects=data.projects||state.projects; state.templates=data.templates||state.templates; state.printers=data.printers||state.printers; state.formulaLibrary=data.formula_library||[]; state.contentLibrary=data.content_library||[]; state.sourceMaterialLibrary=data.source_material_library||[]; state.librarySchemaReady=data.library_schema_ready!==false; state.sourceMaterialSchemaReady=data.source_material_schema_ready!==false; state.sourceMaterialMetadataReady=data.source_material_metadata_ready!==false; if(data.detail!==undefined)state.detail=data.detail;
  }

  function sourceMaterialById(value){return state.sourceMaterialLibrary.find((row)=>Number(row.packaging_source_material_template_id)===Number(value||0));}

  async function previewAmazonSourceMaterial(){
    const amazonUrl=String(id('packagingSourceAmazonUrl')?.value||'').trim();
    if(!amazonUrl){message('Paste the exact Amazon product link first.','error');id('packagingSourceAmazonUrl')?.focus();return;}
    const status=id('packagingSourceAmazonStatus');
    try{
      if(status)status.textContent='Reading Amazon product metadata…';
      message('Creating a review-first source-material draft from the Amazon link…');
      const response=await DDAuth.apiFetch('/api/admin/amazon-link-preview',{method:'POST',body:JSON.stringify({amazon_url:amazonUrl,preview_context:'packaging_source_material'})});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw new Error(data?.error||'Amazon preview failed.');
      const row=data.packaging_source_draft||{};
      const set=(field,value)=>{const node=id(field);if(node&&value!==undefined&&value!==null)node.value=String(value);};
      set('packagingSourceMaterialName',row.material_name||data.draft?.item_name||'');
      set('packagingSourceSupplierProductName',row.supplier_product_name||data.draft?.item_name||'');
      set('packagingSourceSupplierName',row.supplier_name||data.draft?.supplier_name||'Amazon.ca');
      set('packagingSourceSupplierSku',row.supplier_sku||data.draft?.supplier_sku||data.asin||'');
      set('packagingSourceUrl',row.source_url||data.canonical_url||amazonUrl);
      set('packagingSourceImageUrl',row.source_image_url||data.draft?.image_url||'');
      set('packagingSourceProductFamily',row.product_family||'general');
      set('packagingSourceMaterialSubtype',row.material_subtype||'other');
      set('packagingSourceIntendedUse',row.intended_use||'not_applicable');
      set('packagingSourceColourHex',row.colour_hex||'#C9B18A');
      set('packagingSourceIngredientRaw',row.ingredient_declaration_raw||'');
      set('packagingSourceAllergenStatement',row.allergen_statement||'');
      set('packagingSourceBenefits',(Array.isArray(row.benefits)?row.benefits:[]).map((b)=>`${b.title||'Supplier detail'}: ${b.body||''}`).join('\n\n'));
      set('packagingSourceClaims',(Array.isArray(row.supplier_claims)?row.supplier_claims:[]).map((c)=>c.claim_en||'').filter(Boolean).join('\n'));
      set('packagingSourceUsageNotes',row.usage_notes||data.draft?.item_description||'');
      set('packagingSourceComplianceNotes',row.compliance_notes||'Amazon-assisted draft. Verify supplier/manufacturer documentation before label approval.');
      set('packagingSourceVerification','needs_review');
      set('packagingSourceFragranceReview',row.fragrance_allergen_review_status||(['fragrance_oil','essential_oil_blend'].includes(row.material_subtype)?'needs_supplier_data':'not_applicable'));
      if(Array.isArray(row.master_inci)&&row.master_inci.length)setSourceInciRows(row.master_inci);else setSourceInciRows([{}]);
      const warnings=Array.isArray(data.warnings)?data.warnings:[];
      if(status)status.innerHTML=`<strong>Amazon draft loaded.</strong> ${esc(warnings.join(' '))} Review every field below, especially ingredient/INCI rows, then save the material template.`;
      bindSourceInciRows();
      message(`Amazon draft loaded for “${row.material_name||data.draft?.item_name||'source material'}”. Nothing has been saved yet; review supplier data and press Save material template.`,'success');
    }catch(error){
      if(status)status.textContent=error.message||'Amazon preview failed.';
      message(`${error.message||'Amazon preview failed.'} The material can still be entered manually below.`,'error');
    }
  }
  function inferSourceCategoryFromInventory(item={}){
    const value=`${item.item_name||''} ${item.category||''} ${item.item_description||''}`.toLowerCase();
    if(value.includes('soap base')||value.includes('melt and pour')||value.includes('melt & pour'))return{family:'soap',subtype:'soap_base'};
    if(value.includes('wax'))return{family:'candle',subtype:'candle_wax'};
    if(value.includes('essential oil'))return{family:'general',subtype:'essential_oil_blend'};
    if(value.includes('fragrance')||value.includes('scent oil'))return{family:'general',subtype:'fragrance_oil'};
    if(value.includes('mica')||value.includes('pigment'))return{family:'general',subtype:'mica'};
    if(value.includes('colour')||value.includes('color')||value.includes('dye'))return{family:'general',subtype:'colourant'};
    if(value.includes('butter')||value.includes('carrier oil'))return{family:'bath_body',subtype:'carrier_oil_butter'};
    return{family:'general',subtype:'additive'};
  }

  function useInventoryForSourceMaterial(){
    const input=id('packagingSourceInventorySearch');const item=inventoryByChoice(input?.value||'');const status=id('packagingSourceInventoryStatus');
    if(!item){if(status)status.textContent='Choose an exact inventory suggestion first.';message('Choose an existing inventory item from the search suggestions.','error');return;}
    if(id('packagingSourceInventoryId'))id('packagingSourceInventoryId').value=String(item.site_item_inventory_id||'');if(input)input.value=inventoryChoiceLabel(item);
    const linkedId=Number(item.packaging_source_material_template_id||0);const linked=linkedId?sourceMaterialById(linkedId):null;
    if(linked){loadSourceMaterialEditor(linkedId);if(id('packagingSourceInventoryId'))id('packagingSourceInventoryId').value=String(item.site_item_inventory_id||'');if(input)input.value=inventoryChoiceLabel(item);if(status)status.textContent=`Inventory already links to “${linked.material_name}”. That existing source template has been loaded; no Amazon re-import is needed.`;message(`Loaded the existing source template linked to ${item.item_name}.`,'success');return;}
    const inferred=inferSourceCategoryFromInventory(item);const set=(field,value)=>{if(id(field)&&value!==undefined&&value!==null)id(field).value=String(value);};
    set('packagingSourceProductFamily',inferred.family);set('packagingSourceMaterialSubtype',inferred.subtype);set('packagingSourceMaterialName',item.item_name||'');set('packagingSourceSupplierProductName',item.item_name||'');set('packagingSourceSupplierName',item.supplier_name||'');set('packagingSourceSupplierSku',item.supplier_sku||item.external_key||'');set('packagingSourceUrl',item.source_url||item.amazon_url||'');set('packagingSourceAmazonUrl',item.amazon_url||'');set('packagingSourceImageUrl',item.image_url||'');
    if(item.captured_ingredients)set('packagingSourceIngredientRaw',item.captured_ingredients);if(item.captured_allergens)set('packagingSourceAllergenStatement',item.captured_allergens);if(item.captured_benefits)set('packagingSourceBenefits',item.captured_benefits);if(item.captured_claims)set('packagingSourceClaims',item.captured_claims);
    if(item.captured_ingredients)importSourceIngredientText();else setSourceInciRows([{}]);
    if(id('packagingSourceFragranceReview'))id('packagingSourceFragranceReview').value=['fragrance_oil','essential_oil_blend'].includes(inferred.subtype)?'needs_supplier_data':'not_applicable';
    if(status)status.textContent=`Reused Inventory #${item.site_item_inventory_id}: name, supplier/SKU, existing source/Amazon URL, image and any captured source composition were copied. Review missing INCI/allergen evidence before saving.`;
    message(`Inventory information for ${item.item_name} loaded. Amazon is only a fallback for fields Inventory does not already contain.`,'success');
  }

  function clearSourceMaterialEditor(){['packagingSourceAmazonUrl','packagingSourceInventorySearch','packagingSourceInventoryId','packagingSourceMaterialEditId','packagingSourceMaterialName','packagingSourceSupplierProductName','packagingSourceSupplierName','packagingSourceSupplierSku','packagingSourceUrl','packagingSourceImageUrl','packagingSourceDocumentUrl','packagingSourceIngredientRaw','packagingSourceAllergenStatement','packagingSourceBenefits','packagingSourceClaims','packagingSourceFragranceAllergens','packagingSourceUsageNotes','packagingSourceComplianceNotes'].forEach((field)=>{if(id(field))id(field).value='';});if(id('packagingSourceProductFamily'))id('packagingSourceProductFamily').value='soap';if(id('packagingSourceMaterialSubtype'))id('packagingSourceMaterialSubtype').value='soap_base';if(id('packagingSourceColourHex'))id('packagingSourceColourHex').value='#C9B18A';if(id('packagingSourceIntendedUse'))id('packagingSourceIntendedUse').value='rinse_off';if(id('packagingSourceVerification'))id('packagingSourceVerification').value='needs_review';if(id('packagingSourceFragranceReview'))id('packagingSourceFragranceReview').value='not_applicable';setSourceInciRows([{}]);}
  function loadSourceMaterialEditor(sourceId){const row=sourceMaterialById(sourceId);if(!row)return;if(Number(row.is_system)===1)message('Built-in source templates are protected. You can review/apply them or save your own custom copy.','');if(id('packagingSourceMaterialTemplateId'))id('packagingSourceMaterialTemplateId').value=String(sourceId);if(id('packagingSourceMaterialEditId'))id('packagingSourceMaterialEditId').value=Number(row.is_system)===1?'':String(sourceId);if(id('packagingSourceProductFamily'))id('packagingSourceProductFamily').value=row.product_family||'general';if(id('packagingSourceMaterialSubtype'))id('packagingSourceMaterialSubtype').value=row.material_subtype||row.material_type||'other';if(id('packagingSourceColourHex'))id('packagingSourceColourHex').value=row.colour_hex||'#C9B18A';if(id('packagingSourceMaterialName'))id('packagingSourceMaterialName').value=Number(row.is_system)===1?`${row.material_name} copy`:row.material_name||'';if(id('packagingSourceSupplierProductName'))id('packagingSourceSupplierProductName').value=row.supplier_product_name||'';if(id('packagingSourceSupplierName'))id('packagingSourceSupplierName').value=row.supplier_name||'';if(id('packagingSourceSupplierSku'))id('packagingSourceSupplierSku').value=row.supplier_sku||'';if(id('packagingSourceUrl'))id('packagingSourceUrl').value=row.source_url||'';if(id('packagingSourceImageUrl'))id('packagingSourceImageUrl').value=row.source_image_url||'';if(id('packagingSourceDocumentUrl'))id('packagingSourceDocumentUrl').value=row.supplier_document_url||'';if(id('packagingSourceIntendedUse'))id('packagingSourceIntendedUse').value=row.intended_use||'not_applicable';if(id('packagingSourceVerification'))id('packagingSourceVerification').value=Number(row.is_system)===1?'needs_review':(row.verification_status||'needs_review');if(id('packagingSourceFragranceReview'))id('packagingSourceFragranceReview').value=row.fragrance_allergen_review_status||'not_applicable';if(id('packagingSourceIngredientRaw'))id('packagingSourceIngredientRaw').value=row.ingredient_declaration_raw||'';setSourceInciRows(row.master_inci||[]);if(id('packagingSourceAllergenStatement'))id('packagingSourceAllergenStatement').value=row.allergen_statement||'';if(id('packagingSourceBenefits'))id('packagingSourceBenefits').value=(row.benefits||[]).map((b)=>`${b.title||'Benefit'}: ${b.body||''}`).join('\n\n');if(id('packagingSourceClaims'))id('packagingSourceClaims').value=(row.supplier_claims||[]).map((c)=>c.claim_en||'').filter(Boolean).join('\n');if(id('packagingSourceFragranceAllergens'))id('packagingSourceFragranceAllergens').value=(row.fragrance_allergens||[]).map((a)=>`${a.inci_name||''} | ${a.concentration_percent??''} | ${Number(a.disclosure_required)===1?'required':''} | ${a.notes||''}`.trim()).join('\n');if(id('packagingSourceUsageNotes'))id('packagingSourceUsageNotes').value=row.usage_notes||'';if(id('packagingSourceComplianceNotes'))id('packagingSourceComplianceNotes').value=row.compliance_notes||'';const linkedInventory=(state.inventory||[]).find((item)=>Number(item.packaging_source_material_template_id||0)===Number(sourceId));if(id('packagingSourceInventoryId'))id('packagingSourceInventoryId').value=linkedInventory?String(linkedInventory.site_item_inventory_id):'';if(id('packagingSourceInventorySearch'))id('packagingSourceInventorySearch').value=linkedInventory?inventoryChoiceLabel(linkedInventory):'';const details=id('packagingSourceMaterialName')?.closest('details');if(details)details.open=true;}

  function applySourceMaterialRows(row){const rows=Array.isArray(row.master_inci)?row.master_inci:[];if(sourceMaterialDefaultRole(row.material_subtype||row.material_type)==='base'){if(id('soapIngredientRows'))id('soapIngredientRows').innerHTML=rows.map(ingredientRow).join('');}else{for(const item of rows)addIngredient(item);}if(id('packagingInci'))id('packagingInci').value=ingredientRowsFromDom().map((item)=>item.inci_name).filter(Boolean).join(', ');for(const claim of (row.supplier_claims||[])){if(!claim.claim_en&&!claim.claim_fr)continue;addClaim({claim_en:claim.claim_en||'',claim_fr:claim.claim_fr||'',icon_name:claim.icon_name||'leaf',is_approved:0,compliance_note:claim.compliance_note||`Inherited from supplier/source template “${row.material_name}”; review before approval.`});}bindDynamicRows();renderPreview();}
  async function applySourceMaterialTemplate(sourceIdValue=0){const sourceId=Number(sourceIdValue||id('packagingSourceMaterialTemplateId')?.value||0);const row=sourceMaterialById(sourceId);if(!row){message('Choose a purchased/source material template first.','error');return;}const projectId=Number(id('packagingProjectId')?.value||0);try{if(projectId){message(`Attaching ${row.material_name} and loading its source evidence…`);const data=await api({action:'apply_source_material_template',packaging_project_id:projectId,packaging_source_material_template_id:sourceId});refreshLibraryState(data);state.activeTab='library';renderProjects();renderMain();}if(id('packagingSourceMaterialTemplateId'))id('packagingSourceMaterialTemplateId').value=String(sourceId);applySourceMaterialRows(row);message(`${row.material_name} applied. ${sourceMaterialDefaultRole(row.material_subtype||row.material_type)==='base'?'Its source ingredient rows replaced the current base ingredient rows.':'Its source ingredient rows were added.'} Supplier benefits and allergen evidence remain source records; supplier claim suggestions were added only as unapproved drafts.`,'success');}catch(error){message(error.message||'Source-material template could not be applied.','error');}}
  async function saveSourceMaterialTemplate(){const materialName=String(id('packagingSourceMaterialName')?.value||'').trim();if(!materialName){message('Enter a source-material template name first.','error');return;}const masterInci=sourceInciRowsFromDom();if(!masterInci.length){message('Add at least one supplier ingredient / Master INCI row to this purchased material first.','error');return;}const subtype=id('packagingSourceMaterialSubtype')?.value||'other';const materialType=sourceMaterialCoreType(subtype);const defaultRole=sourceMaterialDefaultRole(subtype);try{const data=await api({action:'save_source_material_template',packaging_project_id:Number(id('packagingProjectId')?.value||0),packaging_source_material_template_id:Number(id('packagingSourceMaterialEditId')?.value||0)||null,site_item_inventory_id:Number(id('packagingSourceInventoryId')?.value||0)||null,material_type:materialType,product_family:id('packagingSourceProductFamily')?.value||'general',material_subtype:subtype,default_role:defaultRole,colour_hex:id('packagingSourceColourHex')?.value||'',material_name:materialName,supplier_product_name:id('packagingSourceSupplierProductName')?.value||'',supplier_name:id('packagingSourceSupplierName')?.value||'',supplier_sku:id('packagingSourceSupplierSku')?.value||'',source_url:id('packagingSourceUrl')?.value||'',source_image_url:id('packagingSourceImageUrl')?.value||'',supplier_document_url:id('packagingSourceDocumentUrl')?.value||'',source_reference:'Packaging Studio Material Library',intended_use:id('packagingSourceIntendedUse')?.value||'not_applicable',ingredient_declaration_raw:id('packagingSourceIngredientRaw')?.value||'',master_inci:masterInci.map((row)=>({...row,verification_status:['supplier_verified','owner_verified'].includes(id('packagingSourceVerification')?.value)?id('packagingSourceVerification').value:'needs_review'})),allergen_statement:id('packagingSourceAllergenStatement')?.value||'',fragrance_allergens:parseFragranceAllergenLines(id('packagingSourceFragranceAllergens')?.value||''),fragrance_allergen_review_status:id('packagingSourceFragranceReview')?.value||'not_applicable',benefits:parseBenefitsText(id('packagingSourceBenefits')?.value||''),supplier_claims:parseClaimLines(id('packagingSourceClaims')?.value||''),usage_notes:id('packagingSourceUsageNotes')?.value||'',compliance_notes:id('packagingSourceComplianceNotes')?.value||'',verification_status:id('packagingSourceVerification')?.value||'needs_review'});refreshLibraryState(data);const saved=state.sourceMaterialLibrary.find((row)=>String(row.material_name||'')===materialName);if(saved)state.activeSourceMaterialId=Number(saved.packaging_source_material_template_id||0);state.activeTab='library';renderProjects();renderMain();message(`${data.message} Reusable ingredient/blend/colourant dropdowns were refreshed from this template.`,'success');}catch(error){message(error.message||'Source-material template could not be saved.','error');}}

  async function deleteSourceMaterialTemplate(sourceId){const row=sourceMaterialById(sourceId);if(!row)return;if(Number(row.is_system)===1){message('Built-in source-material templates are protected.','error');return;}if(!confirm(`Remove “${row.material_name}” from the active source-material library? Existing project/formula evidence will be preserved.`))return;try{const data=await api({action:'delete_source_material_template',packaging_project_id:Number(id('packagingProjectId')?.value||0),packaging_source_material_template_id:Number(sourceId)});refreshLibraryState(data);state.activeTab='library';renderProjects();renderMain();message(data.message,'success');}catch(error){message(error.message,'error');}}
  async function detachSourceMaterialTemplate(sourceId){try{const current=snapshot();const data=await api({action:'detach_source_material_template',packaging_project_id:Number(id('packagingProjectId')?.value||0),packaging_source_material_template_id:Number(sourceId)});refreshLibraryState(data);state.activeTab='library';renderProjects();renderMain();if(Array.isArray(current.structured_ingredients)&&id('soapIngredientRows'))id('soapIngredientRows').innerHTML=current.structured_ingredients.map(ingredientRow).join('');if(Array.isArray(current.structured_claims)&&id('soapClaimRows'))id('soapClaimRows').innerHTML=current.structured_claims.map(claimRow).join('');bindDynamicRows();renderPreview();message(data.message,'success');}catch(error){message(error.message,'error');}}
  function addSourceBenefitAsClaim(sourceId,index){const row=sourceMaterialById(sourceId);const benefit=row?.benefits?.[Number(index)];if(!benefit)return;addClaim({claim_en:benefit.title||'',claim_fr:'',icon_name:'leaf',is_approved:0,compliance_note:`Supplier benefit from ${row.material_name}: ${benefit.body||''} Review claim classification and French wording before approval.`});state.activeTab='claims';activateTab('claims');message('Supplier benefit title added as an unapproved draft claim.','success');}

  async function applyFormulaLibrary() {
    const formulaId=Number(id('packagingFormulaLibraryId')?.value||0); const formula=state.formulaLibrary.find((row)=>Number(row.packaging_formula_library_id)===formulaId);
    if(!formula){message('Choose a saved finished formula first.','error');return;}
    if(!confirm(`Replace the current structured ingredient rows with “${formula.formula_name}”?`))return;
    try {
      const projectId=Number(id('packagingProjectId')?.value||0);
      if(formula.source_material_template_id&&projectId){
        const data=await api({action:'apply_source_material_template',packaging_project_id:projectId,packaging_source_material_template_id:Number(formula.source_material_template_id)});
        refreshLibraryState(data); state.activeTab='library'; renderProjects(); renderMain();
      }
      if(id('packagingCollection')&&formula.product_family)id('packagingCollection').value=formula.product_family;
      if(id('packagingIdentityEn')&&formula.product_identity_en)id('packagingIdentityEn').value=formula.product_identity_en;
      if(id('packagingIdentityFr')&&formula.product_identity_fr)id('packagingIdentityFr').value=formula.product_identity_fr;
      if(formula.source_material_template_id&&id('packagingSourceMaterialTemplateId'))id('packagingSourceMaterialTemplateId').value=String(formula.source_material_template_id);
      const rows=Array.isArray(formula.ingredients)?formula.ingredients:[]; if(id('soapIngredientRows'))id('soapIngredientRows').innerHTML=rows.map(ingredientRow).join('');
      const inci=rows.map((row)=>row.inci_name).filter(Boolean).join(', '); if(id('packagingInci'))id('packagingInci').value=inci;
      if(formula.default_rose_asset_id)applyRoseAssetPreset(formula.default_rose_asset_id,false); else if(formula.default_rose_colour&&id('packagingRoseColour')){id('packagingRoseColour').value=formula.default_rose_colour;if(id('packagingRoseAsset'))id('packagingRoseAsset').value='rose-custom-v1';updateRoseAssetPath();}
      bindDynamicRows(); renderPreview(); message(`Formula “${formula.formula_name}” applied. ${formula.source_material_template_id?'Its purchased base dependency is attached for source review. ':''}Review the finished ingredients and save the project.`,'success');
    } catch(error) { message(error.message||'The saved formula could not be applied.','error'); }
  }

  async function saveFormulaLibrary() {
    const ingredients=ingredientRowsFromDom(); if(!ingredients.length){message('Add at least one structured ingredient before saving a formula.','error');return;}
    const selectedId=Number(id('packagingFormulaLibraryId')?.value||0); const selected=state.formulaLibrary.find((row)=>Number(row.packaging_formula_library_id)===selectedId);
    const requestedName=String(id('packagingFormulaLibraryName')?.value||'').trim(); const formulaName=requestedName||((selected&&Number(selected.is_system)!==1)?selected.formula_name:'');
    if(!formulaName){message('Enter a new/custom formula name first.','error');id('packagingFormulaLibraryName')?.focus();return;}
    const attachedBase=state.detail?.source_materials?.find((row)=>String(row.material_role)==='base');const selectedSource=sourceMaterialById(Number(id('packagingSourceMaterialTemplateId')?.value||0));const formulaBaseId=Number(attachedBase?.packaging_source_material_template_id||((selectedSource&&sourceMaterialDefaultRole(selectedSource.material_subtype||selectedSource.material_type)==='base')?selectedSource.packaging_source_material_template_id:0))||null;
    try{message('Saving reusable finished formula…');const data=await api({action:'save_formula_library',packaging_project_id:Number(id('packagingProjectId')?.value||0),packaging_formula_library_id:selected&&Number(selected.is_system)!==1&&!requestedName?selectedId:null,formula_name:formulaName,product_family:id('packagingCollection')?.value||'',product_identity_en:id('packagingIdentityEn')?.value||'',product_identity_fr:id('packagingIdentityFr')?.value||'',default_rose_asset_id:id('packagingRoseAsset')?.value||'',default_rose_colour:id('packagingRoseColour')?.value||'',structured_ingredients:ingredients,source_material_template_id:formulaBaseId,notes:id('packagingFormulaLibraryNotes')?.value||''});refreshLibraryState(data);state.activeTab='library';renderProjects();renderMain();message(data.message,'success');}
    catch(error){message(error.message||'Formula library entry could not be saved.','error');}
  }

  async function deleteFormulaLibrary() {
    const formulaId=Number(id('packagingFormulaLibraryId')?.value||0); const formula=state.formulaLibrary.find((row)=>Number(row.packaging_formula_library_id)===formulaId);
    if(!formula){message('Choose a custom formula to delete.','error');return;} if(Number(formula.is_system)===1){message('Built-in formula presets are protected. Save or delete only custom formulas.','error');return;}
    if(!confirm(`Remove “${formula.formula_name}” from the active formula library?`))return;
    try{const data=await api({action:'delete_formula_library',packaging_project_id:Number(id('packagingProjectId')?.value||0),packaging_formula_library_id:formulaId});refreshLibraryState(data);state.activeTab='library';renderProjects();renderMain();message(data.message,'success');}catch(error){message(error.message,'error');}
  }

  function addLibraryContentToProject(contentId) {
    const row=state.contentLibrary.find((item)=>Number(item.packaging_content_library_id)===Number(contentId)); if(!row)return;
    if(row.content_type==='claim'){addClaim({claim_en:row.text_en||row.item_name,claim_fr:row.text_fr||'',icon_name:row.icon_name||'leaf',is_approved:0,compliance_note:'Added from reusable claim library; review before approval.'});state.activeTab='claims';activateTab('claims');message(`Claim “${row.item_name}” added for review.`,'success');return;}
    addIngredient({inci_name:row.inci_name||row.item_name,display_name_en:row.text_en||row.item_name,display_name_fr:row.text_fr||row.inci_name||row.item_name,organic_flag:Number(row.metadata?.organic_flag||0),allergen_note:row.metadata?.allergen_note||row.metadata?.notes||'',required_on_label:1});state.activeTab='ingredients';activateTab('ingredients');message(`${row.item_name} added as a structured ingredient/additive row. Review supplier INCI and label requirements.`,'success');
  }

  async function saveLibraryContent() {
    const contentType=id('packagingLibraryContentType')?.value||'ingredient'; const itemName=String(id('packagingLibraryItemName')?.value||'').trim(); if(!itemName){message('Enter a library item name first.','error');return;}
    try{const data=await api({action:'save_content_library',packaging_project_id:Number(id('packagingProjectId')?.value||0),content_type:contentType,item_name:itemName,inci_name:id('packagingLibraryInci')?.value||'',text_en:id('packagingLibraryTextEn')?.value||'',text_fr:id('packagingLibraryTextFr')?.value||'',icon_name:id('packagingLibraryIcon')?.value||'',metadata:{notes:id('packagingLibraryNotes')?.value||''}});refreshLibraryState(data);state.activeTab='library';renderProjects();renderMain();message(data.message,'success');}
    catch(error){message(error.message||'Library item could not be saved.','error');}
  }

  async function saveReusableClaim(){
    const textEn=String(id('claimLibraryTextEn')?.value||'').trim();const textFr=String(id('claimLibraryTextFr')?.value||'').trim();const name=String(id('claimLibraryName')?.value||textEn).trim();
    if(!name||!textEn){message('Enter at least a library name and English claim text.','error');return;}
    try{const data=await api({action:'save_content_library',packaging_project_id:Number(id('packagingProjectId')?.value||0),content_type:'claim',item_name:name,text_en:textEn,text_fr:textFr,icon_name:id('claimLibraryIcon')?.value||'leaf',metadata:{notes:id('claimLibraryNotes')?.value||''}});refreshLibraryState(data);state.activeTab='claims';renderProjects();renderMain();message(`${data.message} It is now available in the Claims database with its icon.`,'success');}
    catch(error){message(error.message||'Reusable claim could not be saved.','error');}
  }

  async function deleteLibraryContent(contentId) {
    const row=state.contentLibrary.find((item)=>Number(item.packaging_content_library_id)===Number(contentId)); if(!row)return; if(Number(row.is_system)===1){message('Built-in library presets are protected.','error');return;}
    if(!confirm(`Remove “${row.item_name}” from the active reusable library?`))return;
    try{const data=await api({action:'delete_content_library',packaging_project_id:Number(id('packagingProjectId')?.value||0),packaging_content_library_id:Number(contentId)});refreshLibraryState(data);state.activeTab='library';renderProjects();renderMain();message(data.message,'success');}catch(error){message(error.message,'error');}
  }

  async function reviewVersion(versionId) {
    try { const status = document.querySelector(`[data-version-status="${versionId}"]`)?.value || 'needs_review'; const data = await api({ action: 'review_version', packaging_project_id: Number(id('packagingProjectId')?.value || 0), packaging_project_version_id: versionId, review_status: status }); state.projects = data.projects || []; state.detail = data.detail; renderProjects(); renderMain(); message(data.message, 'success'); }
    catch (error) { message(error.message, 'error'); }
  }

  function printerProfileFromDom(){
    const selected=String(id('printTestPrinterProfile')?.value||'');const existing=selected&&selected!=='__manual__'?getPrinterProfile(selected):null;
    return {...(existing||{}),name:String(id('printTestPrinterName')?.value||existing?.name||'').trim(),paper:String(id('printTestPaper')?.value||existing?.paper||'Letter 8.5 × 11 in'),margin_mm:Math.max(0,num(id('printProfileMargin')?.value,existing?.margin_mm??0)),gap_mm:Math.max(0,num(id('printProfileGap')?.value,existing?.gap_mm??0)),scale_percent:Math.max(1,num(id('printTestScale')?.value,existing?.scale_percent??100)),auto_rotate:id('printProfileAutoRotate')?.checked!==false,settings_note:String(id('printProfileSettingsNote')?.value||existing?.settings_note||'')};
  }
  function applyPrinterProfile(name=''){
    const profile=getPrinterProfile(name);if(!profile){if(name==='__manual__'&&id('printTestPrinterName'))id('printTestPrinterName').value='';updatePrintSheetPlan();return;}
    if(id('printTestPrinterName'))id('printTestPrinterName').value=profile.name||'';if(id('printTestPaper'))id('printTestPaper').value=profile.paper||'Letter 8.5 × 11 in';if(id('printProfileMargin'))id('printProfileMargin').value=num(profile.margin_mm,0);if(id('printProfileGap'))id('printProfileGap').value=num(profile.gap_mm,0);if(id('printTestScale'))id('printTestScale').value=num(profile.scale_percent,100);if(id('printProfileAutoRotate'))id('printProfileAutoRotate').checked=profile.auto_rotate!==false;if(id('printProfileSettingsNote'))id('printProfileSettingsNote').value=profile.settings_note||'';updatePrintSheetPlan();
  }
  function saveCurrentPrinterProfile(){
    const profile=printerProfileFromDom();if(!profile.name){message('Enter a printer/profile name before saving its settings.','error');return;}const rows=loadPrinterProfiles();const index=rows.findIndex((row)=>String(row.name||'').toLowerCase()===profile.name.toLowerCase());if(index>=0)rows[index]=profile;else rows.push(profile);savePrinterProfiles(rows);if(id('printTestPrinterProfile')){id('printTestPrinterProfile').innerHTML=printerProfileOptions(profile.name);id('printTestPrinterProfile').value=profile.name;}message(`Printer profile “${profile.name}” saved in this browser. Choose the same physical printer in the system print dialog.`, 'success');updatePrintSheetPlan();
  }
  function updatePrintSheetPlan(){
    const mount=id('printSheetPlan');if(!mount)return;const plan=sheetPlan(currentTemplate(),printerProfileFromDom());const rotation=plan.rotated?' · label rotated 90°':'';mount.innerHTML=plan.count?`<strong>${plan.count} label${plan.count===1?'':'s'} per Letter sheet</strong><span>${plan.orientation} paper · ${plan.cols} across × ${plan.rows} down${rotation} · ${Math.round(plan.scale*1000)/10}% scale · ${num(plan.margin).toFixed(1)} mm margins · ${num(plan.gap).toFixed(1)} mm gap</span>`:`<strong>No label fits at the current physical size/settings.</strong><span>Reduce printer margins only if the printer supports it, or use a larger sheet. Do not shrink a required exact-size label merely to force it onto the page.</span>`;
  }
  async function printOptimizedSheet(){
    const profile=printerProfileFromDom();const plan=sheetPlan(currentTemplate(),profile);if(!plan.count){message('No label fits on 8.5 × 11 paper at the selected exact-size profile. Review margins/paper before printing.','error');return;}let svg;try{svg=await inlineSvgAssets(svgMarkup());}catch(error){message(error.message,'error');return;}const win=open('','_blank','noopener,noreferrer');if(!win){message('Pop-up blocked. Allow pop-ups for the optimized label sheet.','error');return;}const template=currentTemplate();const lw=num(template.page_width_mm,50.8)*plan.scale;const lh=num(template.page_height_mm,25.4)*plan.scale;const packedW=plan.rotated?lh:lw;const packedH=plan.rotated?lw:lh;const labelHtml=Array.from({length:plan.count},()=>`<div class="label-cell ${plan.rotated?'rotated':''}"><div class="label-art">${svg}</div></div>`).join('');
    win.document.write(`<!doctype html><html><head><title>${esc(fileBase())} — ${plan.count} up Letter sheet</title><style>@page{size:letter ${plan.orientation};margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}.sheet{width:${plan.pageW}mm;height:${plan.pageH}mm;padding:${plan.margin}mm;display:grid;grid-template-columns:repeat(${plan.cols},${packedW}mm);grid-auto-rows:${packedH}mm;gap:${plan.gap}mm;align-content:start;justify-content:start;overflow:hidden}.label-cell{position:relative;width:${packedW}mm;height:${packedH}mm;overflow:hidden}.label-art{position:absolute;left:0;top:0;width:${lw}mm;height:${lh}mm}.label-art>svg{display:block;width:${lw}mm!important;height:${lh}mm!important}.rotated .label-art{transform:rotate(90deg) translateY(-100%);transform-origin:top left}@media screen{body{background:#ddd}.sheet{margin:8px auto;background:#fff;box-shadow:0 1px 10px #777}}</style></head><body><main class="sheet">${labelHtml}</main><script>onload=()=>setTimeout(()=>print(),350)<\/script></body></html>`);win.document.close();message(`Prepared ${plan.count} labels on one 8.5 × 11 sheet. In the system dialog choose “${profile.name||'the intended printer'}”, Actual Size / 100%, and matching margins.`, 'success');
  }

  async function savePrintTest() {
    try {
      const data = await api({ action: 'save_print_test', packaging_project_id: Number(id('packagingProjectId')?.value || 0), packaging_project_version_id: Number(id('printTestVersion')?.value || 0) || null, test_status: id('printTestStatus')?.value, printed_at: id('printTestDate')?.value, printer_name: id('printTestPrinterName')?.value, paper_stock: id('printTestPaper')?.value, scale_percent: Number(id('printTestScale')?.value || 100), measured_strip_width_in: Number(id('printTestStripWidth')?.value || 0), measured_band_height_in: Number(id('printTestBandHeight')?.value || 0), measured_front_width_in: Number(id('printTestFrontWidth')?.value || 0), measured_front_height_in: Number(id('printTestFrontHeight')?.value || 0), measured_rear_circle_mm: Number(id('printTestRearCircle')?.value || 0), wrap_fit_status: id('printTestWrap')?.value, legibility_status: id('printTestLegibility')?.value, overlap_status: id('printTestOverlap')?.value, proof_image_url: id('printTestProofUrl')?.value, notes: id('printTestNotes')?.value });
      state.projects = data.projects || []; state.detail = data.detail; state.activeTab = 'print'; renderProjects(); renderMain(); message(data.message, 'success');
    } catch (error) { message(error.message, 'error'); }
  }

  function fileBase() {
    const template = currentTemplate(); const prefix = String(template.package_type || 'packaging').replace(/_/g, '-');
    const family = String(id('packagingCollection')?.value || id('packagingProjectName')?.value || prefix).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,80) || prefix;
    const version = (state.detail?.versions?.[0]?.version_number || 1).toString(); return `${prefix}-${family}-v${version}.0`;
  }
  function download(blob, name) { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = name; document.body.appendChild(link); link.click(); setTimeout(() => { URL.revokeObjectURL(link.href); link.remove(); }, 1200); }
  async function recordExport(format, name, checksum) { try { await api({ action: 'record_export', packaging_project_id: Number(id('packagingProjectId')?.value || 0), packaging_project_version_id: Number(state.detail?.versions?.[0]?.packaging_project_version_id || 0) || null, export_format: format, file_name: name, version: String(state.detail?.versions?.[0]?.version_number || 1), checksum, snapshot: projectPayload() }); } catch (error) { message(`File prepared, but export history could not be recorded: ${error.message}`, 'error'); } }

  async function inlineSvgAssets(markup) {
    const sources = [...new Set([...String(markup).matchAll(/<image\b[^>]*\bhref="(\/assets\/[^"]+)"/g)].map((match) => match[1]))];
    let output = markup;
    for (const source of sources) {
      try {
        const response = await fetch(source, { credentials: 'same-origin' }); if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob(); const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || '')); reader.onerror = () => reject(reader.error || new Error('Asset conversion failed.')); reader.readAsDataURL(blob); });
        output = output.split(`href="${source}"`).join(`href="${dataUrl}"`);
      } catch (error) { throw new Error(`Artwork asset ${source} could not be embedded in the export: ${error.message}`); }
    }
    return output;
  }

  async function exportFile(format) {
    let svg; try { svg = await inlineSvgAssets(svgMarkup()); } catch (error) { message(error.message, 'error'); return; } const base = fileBase(); const template = currentTemplate(); const widthMm = num(template.page_width_mm,279.4); const heightMm = num(template.page_height_mm,38.1); const checksum = await sha256(svg);
    if (format === 'svg') { const name = `${base}.svg`; download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), name); await recordExport(format,name,checksum); return; }
    if (format === 'pdf_print') { const win = open('', '_blank', 'noopener,noreferrer'); if (!win) { message('Pop-up blocked. Allow pop-ups for Print / Save PDF.', 'error'); return; } win.document.write(`<!doctype html><html><head><title>${esc(base)}</title><style>@page{size:${widthMm}mm ${heightMm}mm;margin:0}html,body{margin:0;padding:0;width:${widthMm}mm;height:${heightMm}mm}svg{display:block;width:${widthMm}mm;height:${heightMm}mm}</style></head><body>${svg}<script>onload=()=>setTimeout(()=>print(),350)<\/script></body></html>`); win.document.close(); await recordExport(format,`${base}-print.pdf`,checksum); return; }
    const source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); const image = new Image();
    image.onload = () => { const canvas = document.createElement('canvas'); canvas.width = Math.round(widthMm / 25.4 * 300); canvas.height = Math.round(heightMm / 25.4 * 300); const context = canvas.getContext('2d'); if (!context) { message('Canvas rendering is unavailable. Use SVG.', 'error'); return; } if (format === 'jpg') { context.fillStyle = '#fff'; context.fillRect(0,0,canvas.width,canvas.height); } context.drawImage(image,0,0,canvas.width,canvas.height); URL.revokeObjectURL(source); const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'; canvas.toBlob(async (blob) => { if (!blob) { message('Raster export failed. Use SVG.', 'error'); return; } const name = `${base}-preview.${format === 'jpg' ? 'jpg' : format}`; download(blob,name); await recordExport(format,name,checksum); }, mime, .95); };
    image.onerror = () => { URL.revokeObjectURL(source); message('Raster preview could not be rendered. Use SVG.', 'error'); }; image.src = source;
  }

  function applyGlacialPurpleReference() {
    if (!confirm('Apply the approved Glacial Purple visual reference to this draft? Product identity, formula/INCI rows, claims, warnings and verified net quantity will be preserved.')) return;
    // Build 246: the approved reference controls visual treatment only. It must never invent
    // formula, ingredient, claim or compliance facts. Those come from the linked product/
    // production release and remain reviewable independently of the artwork.
    const values = { packagingCollection:'Glacial Purple', packagingRoseColour:'#A57BCB', packagingThemeColour:'#FBF5E8', packagingBorderColour:'#32105E', packagingAccentGold:'#B88A2F', packagingSecondaryColour:'#5A2A86', packagingRoseAsset:'rose-lavender-v1', packagingArtworkAsset:'', packagingDesignProfile:'soap_reference_v3' };
    Object.entries(values).forEach(([key,value]) => { const node = id(key); if (node) node.value = value; });
    updateRoseAssetPath(); renderPreview();
    message('Approved Glacial Purple visual treatment applied. Existing product identity, verified INCI ingredients, claims, warnings and quantity were preserved.', 'success');
  }

  function bindSourceCardActions(){
    document.querySelectorAll('[data-use-source-material]').forEach((button)=>button.onclick=()=>applySourceMaterialTemplate(Number(button.dataset.useSourceMaterial||0)));document.querySelectorAll('[data-load-source-material]').forEach((button)=>button.onclick=()=>loadSourceMaterialEditor(Number(button.dataset.loadSourceMaterial||0)));document.querySelectorAll('[data-delete-source-material]').forEach((button)=>button.onclick=()=>deleteSourceMaterialTemplate(Number(button.dataset.deleteSourceMaterial||0)));document.querySelectorAll('[data-detach-source-material]').forEach((button)=>button.onclick=()=>detachSourceMaterialTemplate(Number(button.dataset.detachSourceMaterial||0)));document.querySelectorAll('[data-add-source-benefit-claim]').forEach((button)=>button.onclick=()=>addSourceBenefitAsClaim(Number(button.dataset.addSourceBenefitClaim||0),Number(button.dataset.benefitIndex||0)));
  }
  function bindSourceLibraryControls(){
    id('loadPackagingSourceInventory')?.addEventListener('click',useInventoryForSourceMaterial);id('previewPackagingSourceAmazon')?.addEventListener('click',previewAmazonSourceMaterial);id('savePackagingSourceMaterial')?.addEventListener('click',saveSourceMaterialTemplate);id('clearPackagingSourceMaterialEditor')?.addEventListener('click',clearSourceMaterialEditor);id('importPackagingSourceIngredients')?.addEventListener('click',importSourceIngredientText);id('addPackagingSourceInci')?.addEventListener('click',()=>addSourceInciRow({required_on_label:1}));bindSourceInciRows();bindSourceCardActions();
    id('packagingSourceMaterialTemplateId')?.addEventListener('change',(event)=>{const sourceId=Number(event.target.value||0);state.activeSourceMaterialId=sourceId;const row=sourceMaterialById(sourceId);const mount=id('packagingSourceActiveCard');if(mount)mount.innerHTML=row?sourceMaterialCard(row,new Set((state.detail?.source_materials||[]).map((item)=>Number(item.packaging_source_material_template_id||0))),!!state.detail?.project):'<p class="small">Choose a source-material template.</p>';bindSourceCardActions();if(row)loadSourceMaterialEditor(sourceId);});
    id('packagingSourceMaterialSubtype')?.addEventListener('change',(event)=>{const subtype=event.target.value;if(id('packagingSourceProductFamily')&&subtype==='soap_base')id('packagingSourceProductFamily').value='soap';if(id('packagingSourceProductFamily')&&subtype==='candle_wax')id('packagingSourceProductFamily').value='candle';if(id('packagingSourceFragranceReview'))id('packagingSourceFragranceReview').value=['fragrance_oil','essential_oil_blend'].includes(subtype)?'needs_supplier_data':'not_applicable';});
    const active=Number(id('packagingSourceMaterialTemplateId')?.value||0);if(active&&!id('packagingSourceMaterialEditId')?.value)loadSourceMaterialEditor(active);
  }

  function bindReusableContentPicker(){
    const select=id('packagingReusableContentSelect');if(select){select.addEventListener('change',()=>{state.activeContentLibraryId=Number(select.value||0);const mount=id('packagingReusableContentActive');if(mount)mount.innerHTML=activeReusableContentMarkup(state.activeContentLibraryId);document.querySelectorAll('#packagingReusableContentActive [data-add-library-content]').forEach((button)=>button.onclick=()=>addLibraryContentToProject(Number(button.dataset.addLibraryContent||0)));document.querySelectorAll('#packagingReusableContentActive [data-delete-library-content]').forEach((button)=>button.onclick=()=>deleteLibraryContent(Number(button.dataset.deleteLibraryContent||0)));});}
  }

  function bindDetail() {
    document.querySelectorAll('[data-packaging-tab]').forEach((button) => button.addEventListener('click', () => activateTab(button.dataset.packagingTab)));
    document.querySelectorAll('.packaging-editor-card input,.packaging-editor-card textarea,.packaging-editor-card select').forEach((node) => { const eventName = node.type === 'color' || node.type === 'checkbox' ? 'input' : 'change'; node.addEventListener(eventName, renderPreview); if (node.tagName === 'TEXTAREA' || ['text','number','url','search'].includes(node.type)) node.addEventListener('input', renderPreview); });
    id('addSoapIngredient')?.addEventListener('click', () => addIngredient({required_on_label:1})); id('addSoapClaim')?.addEventListener('click', () => addClaim({icon_name:'leaf'})); id('addPackagingComponent')?.addEventListener('click', () => addComponent({component_type:'label',quantity_per_finished_unit:1})); bindDynamicRows();
    id('packagingRoseAsset')?.addEventListener('change', (event) => applyRoseAssetPreset(event.target.value)); id('packagingProductRosePreset')?.addEventListener('change', (event) => applyProductRosePreset(event.target.value)); id('packagingRoseColour')?.addEventListener('input', (event) => { const selected=rosePresetById(id('packagingRoseAsset')?.value); if(!selected.colour || String(selected.colour).toLowerCase()!==String(event.target.value).toLowerCase()){if(id('packagingRoseAsset'))id('packagingRoseAsset').value='rose-custom-v1';updateRoseAssetPath();} if(id('packagingSecondaryColour'))id('packagingSecondaryColour').value=mixHex(event.target.value,'#000000',.28); renderPreview(); });
    id('packagingTemplateId')?.addEventListener('change', applySelectedTemplate); document.querySelectorAll('[data-use-packaging-template]').forEach((button)=>button.addEventListener('click',()=>{if(id('packagingTemplateId'))id('packagingTemplateId').value=button.dataset.usePackagingTemplate||'';applySelectedTemplate();})); id('savePackagingTemplate')?.addEventListener('click', saveAsTemplate);
    id('generatePackagingFrenchDraft')?.addEventListener('click', generateFrenchDraft);
    if (String(currentTemplate().package_type) === 'soap_ribbon' && id('packagingDesignProfile')) id('packagingDesignProfile').value = 'soap_reference_v3';
    id('savePackagingProject')?.addEventListener('click', saveProject); id('savePackagingComponents')?.addEventListener('click', saveComponents); id('saveClaimLibraryItem')?.addEventListener('click',saveReusableClaim); id('savePackagingVersion')?.addEventListener('click', saveVersion); id('duplicatePackagingProject')?.addEventListener('click', duplicateProject); id('archivePackagingProject')?.addEventListener('click', archiveProject); id('deletePackagingProject')?.addEventListener('click', deleteProject); id('savePrintTest')?.addEventListener('click', savePrintTest); id('applyGlacialPurpleReference')?.addEventListener('click', applyGlacialPurpleReference); id('applyPackagingFormulaLibrary')?.addEventListener('click', applyFormulaLibrary); id('savePackagingFormulaLibrary')?.addEventListener('click', saveFormulaLibrary); id('deletePackagingFormulaLibrary')?.addEventListener('click', deleteFormulaLibrary); id('savePackagingLibraryContent')?.addEventListener('click', saveLibraryContent); document.querySelectorAll('[data-add-library-content]').forEach((button)=>button.addEventListener('click',()=>addLibraryContentToProject(Number(button.dataset.addLibraryContent||0)))); document.querySelectorAll('[data-delete-library-content]').forEach((button)=>button.addEventListener('click',()=>deleteLibraryContent(Number(button.dataset.deleteLibraryContent||0)))); bindSourceLibraryControls(); bindReusableContentPicker(); id('printTestPrinterProfile')?.addEventListener('change',(event)=>applyPrinterProfile(event.target.value)); id('savePrinterProfile')?.addEventListener('click',saveCurrentPrinterProfile); id('printOptimizedSheet')?.addEventListener('click',printOptimizedSheet); ['printTestScale','printProfileMargin','printProfileGap','printProfileAutoRotate'].forEach((field)=>{const node=id(field);if(node){node.addEventListener('input',updatePrintSheetPlan);node.addEventListener('change',updatePrintSheetPlan);}}); updatePrintSheetPlan();
    document.querySelectorAll('[data-packaging-export]').forEach((button) => button.addEventListener('click', () => exportFile(button.dataset.packagingExport))); document.querySelectorAll('[data-review-version]').forEach((button) => button.addEventListener('click', () => reviewVersion(Number(button.dataset.reviewVersion || 0))));
    renderPreview();
  }

  function restoreLocal(showMessage = true) {
    try { const draft = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (!draft) { if (showMessage) message('No browser packaging draft was found.', 'error'); return; } if (!state.detail?.project) { if (showMessage) message('Open or create a project before restoring the browser draft.', 'error'); return; }
      const simple = { packagingProjectName:'packagingProjectName', packagingCollection:'packagingCollection', packagingProductName:'packagingProductName', packagingSubtitle:'packagingSubtitle', packagingIdentityEn:'packagingIdentityEn', packagingIdentityFr:'packagingIdentityFr', packagingInci:'packagingInci', packagingIngredientsEn:'packagingIngredientsEn', packagingIngredientsFr:'packagingIngredientsFr', packagingNetQuantity:'packagingNetQuantity', packagingNetWeightOz:'packagingNetWeightOz', packagingNetWeightG:'packagingNetWeightG', packagingWebsite:'packagingWebsite', packagingDealerName:'packagingDealerName', packagingDealerAddress:'packagingDealerAddress', packagingContact:'packagingContact', packagingMadeInCanada:'packagingMadeInCanada', packagingWarningsEn:'packagingWarningsEn', packagingWarningsFr:'packagingWarningsFr', packagingPrintNotes:'packagingPrintNotes' };
      Object.entries(simple).forEach(([key,field]) => { if (id(field) && draft[key] !== undefined) id(field).value = draft[key] ?? ''; });
      if (draft.theme) Object.entries({rose_colour:'packagingRoseColour',theme_colour:'packagingThemeColour',border_colour:'packagingBorderColour',accent_gold:'packagingAccentGold',secondary_colour:'packagingSecondaryColour'}).forEach(([key,field]) => { if (id(field) && draft.theme[key]) id(field).value = draft.theme[key]; });
      if (draft.artwork) Object.entries({ rose_asset_id:'packagingRoseAsset', rose_style:'packagingRoseStyle', badge_shape:'packagingBadgeShape', top_arc_text:'packagingTopArcText', bottom_arc_text:'packagingBottomArcText', centre_mark:'packagingCentreMark', candle_primary_text:'packagingCandlePrimaryText', candle_date_line_1:'packagingCandleDateLine1', candle_event_line:'packagingCandleEventLine', candle_date_line_2:'packagingCandleDateLine2', artwork_asset:'packagingArtworkAsset' }).forEach(([key,field]) => { if (id(field) && draft.artwork[key] !== undefined) id(field).value = draft.artwork[key] ?? ''; });
      if (Array.isArray(draft.structured_ingredients)) { id('soapIngredientRows').innerHTML = draft.structured_ingredients.map(ingredientRow).join(''); }
      if (Array.isArray(draft.structured_claims)) { id('soapClaimRows').innerHTML = draft.structured_claims.map(claimRow).join(''); }
      bindDynamicRows(); updateRoseAssetPath(); renderPreview(); if (showMessage) message(`Browser draft restored from ${draft.saved_at || 'an earlier session'}. Review and save it to D1.`, 'success');
    } catch { if (showMessage) message('The browser draft could not be restored.', 'error'); }
  }

  function bind() {
    id('newPackagingProject')?.addEventListener('click', createProject); id('refreshPackagingStudio')?.addEventListener('click', () => load(Number(state.detail?.project?.packaging_project_id || 0))); id('restorePackagingDraft')?.addEventListener('click', () => restoreLocal(true)); id('packagingProjectSearch')?.addEventListener('input', renderProjects);
    id('packagingProjectList')?.addEventListener('click', (event) => { const button = event.target.closest('[data-open-packaging]'); if (button) load(Number(button.dataset.openPackaging || 0)); });
  }

  document.addEventListener('DOMContentLoaded', () => { bind(); load(); });
})();
