// Build 234 - reference-faithful soap labels, reusable templates and candle-top engraving layouts.
(() => {
  const STORAGE_KEY = 'dd_packaging_studio_local_draft_v4';
  const state = { projects: [], templates: [], products: [], inventory: [], referenceSources: [], detail: null, loading: false, activeTab: 'product' };
  const id = (name) => document.getElementById(name);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const xml = (value) => String(value ?? '').replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]));
  const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const bool = (value) => value === true || value === 'true' || Number(value) === 1;

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

  function ingredientDisplay(language) {
    const rows = ingredientRowsFromDom();
    if (rows.length) return rows.filter((row) => row.required_on_label !== 0).map((row) => language === 'fr' ? row.display_name_fr : row.display_name_en).filter(Boolean).map((row) => `• ${row}`).join('\n');
    return language === 'fr' ? (id('packagingIngredientsFr')?.value || id('packagingInci')?.value || '') : (id('packagingIngredientsEn')?.value || id('packagingInci')?.value || '');
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
    if (key.includes('recycle')) return `<g transform="translate(${x} ${y}) scale(.42)" fill="none" stroke="${colour}" stroke-width="2.4"><circle r="13"/><path d="M-7 4l5-9 4 7M7-4l-5 9-4-7"/></g>`;
    if (key.includes('hand') || key.includes('care')) return `<g transform="translate(${x} ${y}) scale(.42)" fill="none" stroke="${colour}" stroke-width="2.4"><circle r="13"/><path d="M-7 2c5-8 8-8 12 0M-8 4c4 7 12 7 16 0M0-5v11"/></g>`;
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
    const theme = data.theme || {}; const artwork = data.artwork || {}; const layout = template.layout || {};
    const widthMm = num(template.page_width_mm, 279.4); const heightMm = num(template.page_height_mm, 38.1); const height = Math.round(heightMm / 25.4 * 100);
    const bandY = (height - 75) / 2; const centreY = height / 2; const rose = theme.rose_colour || '#7B4DA6'; const border = theme.border_colour || '#32105E';
    const gold = theme.accent_gold || '#B88A2F'; const background = theme.theme_colour || '#FBF5E8'; const secondary = theme.secondary_colour || '#5A2A86';
    const family = data.packagingCollection || 'Glacial Purple'; const typeEn = data.packagingIdentityEn || 'Aloe Soap'; const typeFr = data.packagingIdentityFr || 'Savon à l’aloès';
    const structuredIngredients = Array.isArray(data.structured_ingredients) ? data.structured_ingredients : [];
    const enFromRows = structuredIngredients.filter((row) => Number(row.required_on_label) !== 0).map((row) => row.display_name_en).filter(Boolean).map((row) => `• ${row}`).join('\n');
    const frFromRows = structuredIngredients.filter((row) => Number(row.required_on_label) !== 0).map((row) => row.display_name_fr).filter(Boolean).map((row) => `• ${row}`).join('\n');
    const en = enFromRows || ingredientDisplay('en') || '• Aloe Soap Base – SLS/SLES free\n• No Palm Oil\n• Organic Soap Base'; const fr = frFromRows || ingredientDisplay('fr') || '• Base de savon à l’aloès – sans SLS/SLES\n• Sans huile de palme\n• Base de savon biologique';
    const claims = Array.isArray(data.structured_claims) && data.structured_claims.length ? data.structured_claims : claimRowsFromDom().length ? claimRowsFromDom() : [
      { claim_en: 'Natural Ingredients', claim_fr: 'Ingrédients naturels', icon_name: 'leaf' },
      { claim_en: 'Handmade with Care', claim_fr: 'Fait à la main avec soin', icon_name: 'hands' },
      { claim_en: 'Gentle & Moisturizing', claim_fr: 'Doux et hydratant', icon_name: 'leaf' },
      { claim_en: 'Please Recycle', claim_fr: 'Veuillez recycler', icon_name: 'recycle' }
    ];
    const rearDiameter = Math.min(height - 12, Math.round(num(template.rear_width_mm, 38.1) / 25.4 * 100)); const rearR = rearDiameter / 2; const rearCx = 765;
    const topLabel = artwork.top_arc_text || 'Rosevear Creations'; const bottomLabel = artwork.bottom_arc_text || 'MADE IN CANADA'; const centreMark = artwork.centre_mark || '♥';
    const roseAsset = artwork.artwork_asset || layout.artwork_asset || '/assets/packaging/artwork/soap-botanical-purple-rose-v1.png';
    const frontOuter = artwork.badge_shape === 'scalloped' ? `<path d="${scallopedOvalPath(350,centreY,100,75)}" fill="${background}" stroke="${gold}" stroke-width="5"/>` : `<ellipse cx="350" cy="${centreY}" rx="100" ry="75" fill="${background}" stroke="${gold}" stroke-width="5"/>`;
    const damaskId = 'soap-reference-damask-v2';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 1100 ${height}" role="img" aria-label="${xml(family)} ${xml(typeEn)} continuous soap ribbon label">
      <defs><pattern id="${damaskId}" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M18 2C12 9 12 15 18 18C24 15 24 9 18 2ZM18 34C12 27 12 21 18 18C24 21 24 27 18 34ZM2 18C9 12 15 12 18 18C15 24 9 24 2 18ZM34 18C27 12 21 12 18 18C21 24 27 24 34 18Z" fill="none" stroke="${gold}" stroke-width=".7" opacity=".14"/></pattern></defs>
      <style>.pkg-copy{font-family:Arial,Helvetica,sans-serif;fill:${border}}.pkg-serif{font-family:Georgia,'Times New Roman',serif;fill:${border}}.pkg-script{font-family:'Brush Script MT','Segoe Script',cursive;fill:${secondary}}</style>
      <rect width="1100" height="${height}" fill="#fff"/><rect x="0" y="${bandY}" width="1100" height="75" rx="5" fill="${background}"/><rect x="0" y="${bandY}" width="1100" height="75" fill="url(#${damaskId})"/>
      <rect x="2" y="${bandY + 2}" width="1096" height="71" rx="4" fill="none" stroke="${border}" stroke-width="4"/><line x1="2" y1="${bandY + 9}" x2="1098" y2="${bandY + 9}" stroke="${gold}" stroke-width="2"/><line x1="2" y1="${bandY + 66}" x2="1098" y2="${bandY + 66}" stroke="${gold}" stroke-width="2"/>
      <text x="18" y="${bandY + 17}" font-size="7.6" font-weight="700" class="pkg-copy">INGREDIENTS:</text>${textBlock(en,18,bandY + 27,6.2,55,8,4.7,'start')}
      <g>${frontOuter}<ellipse cx="350" cy="${centreY}" rx="94" ry="69" fill="none" stroke="${border}" stroke-width="2"/><ellipse cx="350" cy="${centreY}" rx="90" ry="65" fill="none" stroke="${gold}" stroke-width="1" stroke-dasharray="2 3"/>
        <image href="${xml(roseAsset)}" x="252" y="${centreY - 67}" width="93" height="134" preserveAspectRatio="xMidYMid meet"/>
        <text x="393" y="${centreY - 51}" text-anchor="middle" font-size="10.5" class="pkg-script">${xml(topLabel)}</text><text x="393" y="${centreY - 38}" text-anchor="middle" font-size="7.8" class="pkg-script">- Devil n Dove -</text>
        <line x1="357" y1="${centreY - 30}" x2="429" y2="${centreY - 30}" stroke="${gold}" stroke-width="1"/><text x="393" y="${centreY - 27}" text-anchor="middle" font-size="5.8" fill="${gold}">${xml(centreMark)}</text>
        <text x="393" y="${centreY - 4}" text-anchor="middle" font-size="${fontSize(family,22,14.5,8.5)}" class="pkg-script">${xml(family)}</text><text x="393" y="${centreY + 17}" text-anchor="middle" font-size="12.2" class="pkg-serif">${xml(typeEn)}</text>
        <text x="393" y="${centreY + 38}" text-anchor="middle" font-size="8.1" class="pkg-script">${xml(data.packagingSubtitle || 'Handcrafted with Care')}</text><text x="393" y="${centreY + 56}" text-anchor="middle" font-size="6.8" font-weight="700" class="pkg-copy">— ${xml(centreMark)}  ${xml(bottomLabel)}  ${xml(centreMark)} —</text>
        <circle cx="457" cy="${centreY - 12}" r="16" fill="${background}" stroke="${border}" stroke-width="2"/><circle cx="457" cy="${centreY - 12}" r="12" fill="none" stroke="${gold}" stroke-width="1"/><text x="457" y="${centreY - 15}" text-anchor="middle" font-size="4.2" font-weight="700" class="pkg-copy">DEVILNDOVE</text><path d="M452 ${centreY - 7}q5-7 10 0q-5 6-10 0z" fill="none" stroke="${border}" stroke-width="1"/><text x="457" y="${centreY + 1}" text-anchor="middle" font-size="3.7" class="pkg-copy">.COM</text>
      </g>
      <text x="490" y="${bandY + 17}" font-size="7.6" font-weight="700" class="pkg-copy">INGRÉDIENTS :</text>${textBlock(fr,490,bandY + 27,6.2,55,8,4.7,'start')}
      <g><circle cx="${rearCx}" cy="${centreY}" r="${rearR}" fill="${background}" stroke="${secondary}" stroke-width="4"/><circle cx="${rearCx}" cy="${centreY}" r="${rearR - 6}" fill="none" stroke="${gold}" stroke-width="2"/><text x="${rearCx}" y="${centreY - 28}" text-anchor="middle" font-size="10" class="pkg-script">Rosevear Creations</text><text x="${rearCx}" y="${centreY - 14}" text-anchor="middle" font-size="8" class="pkg-script">- Devil n Dove -</text><text x="${rearCx}" y="${centreY + 5}" text-anchor="middle" font-size="7" class="pkg-copy">Handmade in Small Batches</text><text x="${rearCx}" y="${centreY + 25}" text-anchor="middle" font-size="10" font-weight="700" fill="${secondary}" class="pkg-copy">${xml(data.packagingWebsite || 'devilndove.com')}</text><text x="${rearCx}" y="${centreY + 40}" text-anchor="middle" font-size="7" font-weight="700" class="pkg-copy">MADE IN CANADA</text></g>
      <g>${claims.slice(0,4).map((claim,index) => { const y = bandY + 12 + index * 12.5; return `${iconSvg(claim.icon_name, 858, y, secondary)}<text x="870" y="${y - 2.5}" font-size="6.1" font-weight="700" class="pkg-copy">${xml(claim.claim_en || '')}</text><text x="870" y="${y + 4}" font-size="5.25" class="pkg-copy">${xml(claim.claim_fr || '')}</text>`; }).join('')}</g>
      <line x1="850" y1="${bandY + 56}" x2="1084" y2="${bandY + 56}" stroke="${gold}" stroke-width="1"/><text x="854" y="${bandY + 64}" font-size="5.5" font-weight="700" class="pkg-copy">${xml(data.packagingNetQuantity || 'NET WT. APPROX. 4.5 OZ / 127 G')}</text>
      ${guideSvg(height, artwork)}
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
    if (packageType === 'soap_ribbon' || profile === 'soap_reference_v2') return glacialRibbonSvg(data, template);
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
    if (isSoap && (wrapLines(ingredients.map((row) => `• ${row.display_name_en || ''}`).join('\n'),55,99).length > 8 || wrapLines(ingredients.map((row) => `• ${row.display_name_fr || ''}`).join('\n'),55,99).length > 8)) warnings.push('Ingredient copy exceeds the eight-line narrow-band preview; shorten display wording or use a physically tested larger label profile without reducing below the chosen minimum print size.');
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

  function claimRow(row = {}, index = 0) {
    return `<tr data-soap-claim-row><td class="row-order">${index + 1}</td><td><input class="input" data-field="claim_en" value="${esc(row.claim_en || '')}" placeholder="English claim"/></td><td><input class="input" data-field="claim_fr" value="${esc(row.claim_fr || '')}" placeholder="French claim"/></td><td><select class="input" data-field="icon_name">${['leaf','hands','recycle','heart','none'].map((name) => `<option ${String(row.icon_name || 'leaf') === name ? 'selected' : ''}>${name}</option>`).join('')}</select></td><td><label class="compact-check"><input type="checkbox" data-field="is_approved" ${Number(row.is_approved) === 1 ? 'checked' : ''}/> Approved</label></td><td><input class="input" data-field="compliance_note" value="${esc(row.compliance_note || '')}" placeholder="Review note"/></td><td><button class="btn danger" type="button" data-remove-claim>Remove</button></td></tr>`;
  }

  function componentRow(row = {}, index = 0) {
    const inventoryOptions = state.inventory.map((item) => `<option value="${Number(item.site_item_inventory_id || 0)}" ${Number(row.site_item_inventory_id) === Number(item.site_item_inventory_id) ? 'selected' : ''}>${esc(item.item_name)} · ${esc(item.on_hand_quantity || 0)} ${esc(item.stock_unit_label || 'unit')} · ${esc((Number(item.unit_cost_cents || 0) / 100).toFixed(2))}</option>`).join('');
    return `<tr data-packaging-component-row><td class="row-order">${index + 1}</td><td><select class="input" data-field="component_type">${['label','container','closure','box','wrap','tissue','insert','seal','barcode','shipping','other'].map((value) => `<option value="${value}" ${String(row.component_type || 'label') === value ? 'selected' : ''}>${value}</option>`).join('')}</select></td><td><input class="input" data-field="component_name" value="${esc(row.component_name || '')}" placeholder="Bottle, label stock, insert…"/></td><td><select class="input" data-field="site_item_inventory_id"><option value="">No inventory link</option>${inventoryOptions}</select></td><td><input class="input" data-field="sku_reference" value="${esc(row.sku_reference || '')}" placeholder="SKU / supplier ref"/></td><td><input class="input" data-field="quantity_per_finished_unit" type="number" min="0.0001" step="0.0001" value="${esc(row.quantity_per_finished_unit ?? 1)}"/></td><td><input class="input" data-field="wastage_percent" type="number" min="0" step="0.1" value="${esc(row.wastage_percent || 0)}"/></td><td><input class="input" data-field="unit_cost_cents" type="number" min="0" step="1" value="${esc(row.unit_cost_cents || 0)}"/></td><td><label class="compact-check"><input type="checkbox" data-field="lot_tracking_required" ${Number(row.lot_tracking_required) === 1 ? 'checked' : ''}/> Lot</label></td><td><input class="input" data-field="supplier_name" value="${esc(row.supplier_name || '')}" placeholder="Supplier"/></td><td><input class="input" data-field="notes" value="${esc(row.notes || '')}" placeholder="Finish, size, reorder note"/></td><td><button class="btn danger" type="button" data-remove-component>Remove</button></td></tr>`;
  }

  function tabButton(key, label) { return `<button class="packaging-tab ${state.activeTab === key ? 'is-active' : ''}" type="button" data-packaging-tab="${key}">${label}</button>`; }
  function tabPanel(key, content) { return `<section class="packaging-tab-panel ${state.activeTab === key ? 'is-active' : ''}" data-packaging-panel="${key}">${content}</section>`; }

  function detailMarkup() {
    const project = state.detail?.project || {}; const template = state.detail?.template || {}; const theme = project.theme || template.theme || {};
    const artwork = project.artwork || {}; const ingredients = state.detail?.ingredients || []; const claims = state.detail?.structured_claims || []; const components = state.detail?.components || []; const componentSummary = state.detail?.component_summary || {};
    const versions = state.detail?.versions || []; const exports = state.detail?.soap_exports?.length ? state.detail.soap_exports : (state.detail?.exports || []); const printTests = state.detail?.print_tests || [];
    const newestVersion = versions[0]?.packaging_project_version_id || '';
    return `<section class="card packaging-editor-card"><div class="section-heading-row"><div><p class="eyebrow">${esc(project.project_key || 'New packaging system')}</p><h2 style="margin:0">${esc(project.project_name || project.product_name || 'Labeling and packaging project')}</h2></div><div class="packaging-project-actions"><button class="btn" id="duplicatePackagingProject" type="button">Duplicate</button><button class="btn" id="archivePackagingProject" type="button">Archive</button></div></div>
      <input type="hidden" id="packagingProjectId" value="${Number(project.packaging_project_id || 0)}"/>
      <div class="packaging-tab-list" role="tablist" aria-label="Labeling and packaging editor sections">${tabButton('product','1. Product')}${tabButton('components','2. Components & Cost')}${tabButton('ingredients','3. Ingredients')}${tabButton('french','4. French')}${tabButton('rose','5. Artwork & Colours')}${tabButton('claims','6. Claims')}${tabButton('layout','7. Layout')}${tabButton('preview','8. Preview')}${tabButton('print','9. Print Test')}${tabButton('versions','10. Versions')}</div>
      ${tabPanel('product',`<h3>Product and project</h3><div class="grid cols-3"><label><span class="small">Project name</span><input class="input" id="packagingProjectName" value="${esc(project.project_name || '')}"/></label><label><span class="small">Template — controls the renderer and saved package type</span><select class="input" id="packagingTemplateId">${options(state.templates,project.packaging_template_id,(row)=>`${row.template_name} · ${num(row.page_width_mm)}×${num(row.page_height_mm)} mm${Number(row.is_system)===1?'':' · custom'}`)}</select></label><label><span class="small">Linked store product</span><select class="input" id="packagingProductId"><option value="">No product link</option>${options(state.products,project.product_id,(row)=>`${row.name} · ${row.sku || `#${row.product_id}`}`)}</select></label></div>
        <div class="grid cols-3"><label><span class="small">Package type (set by template)</span><select class="input" id="packagingType" disabled>${[['soap_ribbon','Soap ribbon'],['candle_top','Candle top / lid'],['engraved_round','Engraved round / coaster'],['product_label','General product label'],['candle_label','Candle label'],['jewelry_card','Jewelry card'],['package_insert','Package insert / care card'],['shipping_label','Shipping label'],['gift_set','Gift set packaging']].map(([value,label])=>`<option value="${value}" ${String(template.package_type||project.package_type||'soap_ribbon')===value?'selected':''}>${label}</option>`).join('')}</select></label><label><span class="small">Project status</span><select class="input" id="packagingStatus">${['draft','review','approved','archived'].map((value)=>`<option ${project.project_status===value?'selected':''}>${value}</option>`).join('')}</select></label><label><span class="small">Compliance status</span><select class="input" id="packagingCompliance">${['needs_review','ready_for_review','approved','blocked'].map((value)=>`<option ${project.compliance_status===value?'selected':''}>${value}</option>`).join('')}</select></label></div>
        <div class="grid cols-3"><label><span class="small">Product family / main name</span><input class="input" id="packagingCollection" value="${esc(project.collection_name || '')}" placeholder="Glacial Purple"/></label><label><span class="small">Product / variant</span><input class="input" id="packagingProductName" value="${esc(project.product_name || '')}" placeholder="Aloe Soap, candle, jewelry…"/></label><label><span class="small">Front tagline</span><input class="input" id="packagingSubtitle" value="${esc(project.product_subtitle || 'Handcrafted with Care')}"/></label></div>
        <div class="grid cols-2"><label><span class="small">Product identity — English</span><input class="input" id="packagingIdentityEn" value="${esc(project.product_identity_en || 'Aloe Soap')}"/></label><label><span class="small">Product identity — French</span><input class="input" id="packagingIdentityFr" value="${esc(project.product_identity_fr || 'Savon à l’aloès')}"/></label></div>
        <label><span class="small">Master INCI list</span><textarea class="input" id="packagingInci" rows="4">${esc(project.ingredients_inci || '')}</textarea></label>
        <div class="grid cols-4"><label><span class="small">Net weight wording</span><input class="input" id="packagingNetQuantity" value="${esc(project.net_quantity_text || '')}" placeholder="NET WT. APPROX. 4.5 OZ / 127 G"/></label><label><span class="small">Ounces</span><input class="input" id="packagingNetWeightOz" type="number" step="0.01" value="${esc(project.net_weight_oz || '')}"/></label><label><span class="small">Grams</span><input class="input" id="packagingNetWeightG" type="number" step="0.1" value="${esc(project.net_weight_g || project.weight_grams || '')}"/></label><label><span class="small">Website</span><input class="input" id="packagingWebsite" value="${esc(project.website_text || 'devilndove.com')}"/></label></div>
        <div class="grid cols-3"><label><span class="small">Dealer / business</span><input class="input" id="packagingDealerName" value="${esc(project.dealer_name || 'Rosevear Creations - Devil n Dove')}"/></label><label><span class="small">Principal business address</span><input class="input" id="packagingDealerAddress" value="${esc(project.dealer_address || '')}"/></label><label><span class="small">Consumer contact</span><input class="input" id="packagingContact" value="${esc(project.contact_text || 'devilndove.com/contact')}"/></label></div><label><span class="small">Made in Canada wording</span><input class="input" id="packagingMadeInCanada" value="${esc(project.made_in_canada_text || 'Made in Canada / Fabriqué au Canada')}"/></label>`)}
      ${tabPanel('components',`<div class="section-heading-row"><div><h3>Packaging components, inventory and cost</h3><p class="small">Record every label, container, closure, insert, seal and shipping component used per finished unit. Inventory links provide on-hand context; saving this BOM does not consume stock.</p></div><button class="btn" id="addPackagingComponent" type="button">Add component</button></div><div class="packaging-cost-summary"><strong>${Number(componentSummary.active_count||0)} component(s)</strong><span>Estimated packaging cost per finished unit: ${new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(componentSummary.estimated_unit_cost_cents||0)/100)}</span><span>${Number(componentSummary.lot_tracked_count||0)} lot-tracked</span></div><div class="admin-table-wrap packaging-row-editor"><table><thead><tr><th>#</th><th>Type</th><th>Component</th><th>Inventory link</th><th>SKU/ref</th><th>Qty/unit</th><th>Waste %</th><th>Unit cost ¢</th><th>Trace</th><th>Supplier</th><th>Notes</th><th></th></tr></thead><tbody id="packagingComponentRows">${(components.length?components:[{}]).map(componentRow).join('')}</tbody></table></div><div class="packaging-save-actions"><button class="btn primary" id="savePackagingComponents" type="button">Save packaging BOM</button><a class="btn" href="/admin/inventory-operations/">Open inventory operations</a></div><p class="small">Cost estimate = component unit cost × quantity per finished unit × (1 + waste %). Confirm actual purchase-lot costs before using this value for pricing or accounting.</p>`)}
      ${tabPanel('ingredients',`<div class="section-heading-row"><div><h3>Structured ingredient rows</h3><p class="small">One D1 row per ingredient preserves order, INCI, bilingual display wording, organic status and allergen review evidence.</p></div><button class="btn" id="addSoapIngredient" type="button">Add ingredient</button></div><div class="admin-table-wrap packaging-row-editor"><table><thead><tr><th>#</th><th>INCI</th><th>English</th><th>French</th><th>Organic</th><th>Allergen note</th><th>Label</th><th></th></tr></thead><tbody id="soapIngredientRows">${(ingredients.length?ingredients:[{}]).map(ingredientRow).join('')}</tbody></table></div><label><span class="small">English panel fallback / supporting copy</span><textarea class="input" id="packagingIngredientsEn" rows="5">${esc(project.ingredients_en || '')}</textarea></label>`)}
      ${tabPanel('french',`<h3>French content review</h3><p class="small">French is equal label content, not an optional translation. Keep the structured ingredient rows aligned and review product identity, warnings and claims independently.</p><label><span class="small">French panel fallback / supporting copy</span><textarea class="input" id="packagingIngredientsFr" rows="6">${esc(project.ingredients_fr || '')}</textarea></label><div class="grid cols-2"><label><span class="small">Warnings — English</span><textarea class="input" id="packagingWarningsEn" rows="4">${esc(project.warnings_en || '')}</textarea></label><label><span class="small">Warnings — French</span><textarea class="input" id="packagingWarningsFr" rows="4">${esc(project.warnings_fr || '')}</textarea></label></div>`)}
      ${tabPanel('rose',`<h3>Artwork, wording and colours</h3><div class="packaging-reference-pair"><div class="packaging-reference-note"><img src="/assets/packaging/soap/reference/glacial-purple-aloe-soap-approved-reference.png" alt="Approved Glacial Purple Aloe Soap continuous ribbon reference"/><div><strong>Approved soap-label reference</strong><p class="small">The soap renderer now preserves the permanent brand marks, botanical rose, centred hierarchy, bilingual panels, rear seal, claims and net weight.</p><button class="btn" id="applyGlacialPurpleReference" type="button">Apply Glacial Purple example</button></div></div><div class="packaging-reference-note"><img src="/assets/packaging/reference/wedding-candle-top-john-laurie-approved-reference.png" alt="Approved round wedding and anniversary candle-top reference"/><div><strong>Candle-top direction</strong><p class="small">Choose a candle-top template, then replace the names, dates and occasion below. Curved brand and origin text remain centred on the circular paths.</p></div></div></div><div class="grid cols-3"><label><span class="small">Rose asset</span><select class="input" id="packagingRoseAsset"><option value="rose-purple-v1" ${(project.rose_asset_id||artwork.rose_asset_id||'rose-purple-v1')==='rose-purple-v1'?'selected':''}>Purple botanical rose</option><option value="rose-green-v1" ${(project.rose_asset_id||artwork.rose_asset_id)==='rose-green-v1'?'selected':''}>Green rose direction</option><option value="rose-oatmeal-v1" ${(project.rose_asset_id||artwork.rose_asset_id)==='rose-oatmeal-v1'?'selected':''}>Oatmeal / cream direction</option></select></label><label><span class="small">Rose style</span><select class="input" id="packagingRoseStyle"><option value="full_rose" ${String(artwork.rose_style||'full_rose')==='full_rose'?'selected':''}>Full botanical rose</option><option value="minimal" ${String(artwork.rose_style)==='minimal'?'selected':''}>Minimal rose mark</option></select></label><label><span class="small">Badge shape</span><select class="input" id="packagingBadgeShape"><option value="oval" ${String(artwork.badge_shape||'oval')==='oval'?'selected':''}>Front oval</option><option value="scalloped" ${String(artwork.badge_shape)==='scalloped'?'selected':''}>Scalloped edge</option></select></label></div><div class="grid cols-5"><label><span class="small">Rose colour</span><input class="input" id="packagingRoseColour" type="color" value="${esc(theme.rose_colour||'#7B4DA6')}"/></label><label><span class="small">Background</span><input class="input" id="packagingThemeColour" type="color" value="${esc(theme.theme_colour||'#FBF5E8')}"/></label><label><span class="small">Dark border / engraving ink</span><input class="input" id="packagingBorderColour" type="color" value="${esc(theme.border_colour||'#32105E')}"/></label><label><span class="small">Gold trim</span><input class="input" id="packagingAccentGold" type="color" value="${esc(theme.accent_gold||'#B88A2F')}"/></label><label><span class="small">Accent purple</span><input class="input" id="packagingSecondaryColour" type="color" value="${esc(theme.secondary_colour||'#5A2A86')}"/></label></div><div class="grid cols-3"><label><span class="small">Upper arc wording</span><input class="input" id="packagingTopArcText" value="${esc(artwork.top_arc_text||template.layout?.default_top_arc_text||'')}"/></label><label><span class="small">Lower arc wording</span><input class="input" id="packagingBottomArcText" value="${esc(artwork.bottom_arc_text||template.layout?.default_bottom_arc_text||'')}"/></label><label><span class="small">Centre mark</span><input class="input" id="packagingCentreMark" value="${esc(artwork.centre_mark||'♥')}" maxlength="8"/></label></div><h4>Candle-top / round-template wording</h4><div class="grid cols-4"><label><span class="small">Names or main wording</span><input class="input" id="packagingCandlePrimaryText" value="${esc(artwork.candle_primary_text||template.layout?.default_primary_text||'')}" placeholder="John and Laurie"/></label><label><span class="small">First date</span><input class="input" id="packagingCandleDateLine1" value="${esc(artwork.candle_date_line_1||template.layout?.default_date_line_1||'')}" placeholder="March 3rd 1990"/></label><label><span class="small">Occasion</span><input class="input" id="packagingCandleEventLine" value="${esc(artwork.candle_event_line||template.layout?.default_event_line||'')}" placeholder="35 Year Anniversary"/></label><label><span class="small">Celebration date</span><input class="input" id="packagingCandleDateLine2" value="${esc(artwork.candle_date_line_2||template.layout?.default_date_line_2||'')}" placeholder="March 3rd 2025"/></label></div><label><span class="small">Artwork asset path (advanced; keep text out of the artwork)</span><input class="input" id="packagingArtworkAsset" value="${esc(artwork.artwork_asset||template.layout?.artwork_asset||'')}" placeholder="/assets/packaging/artwork/..."></label>`)}
      ${tabPanel('claims',`<div class="section-heading-row"><div><h3>Bilingual claims</h3><p class="small">Claims remain review-first. Marking a row approved records internal review only and is not legal approval.</p></div><button class="btn" id="addSoapClaim" type="button">Add claim</button></div><div class="admin-table-wrap packaging-row-editor"><table><thead><tr><th>#</th><th>English</th><th>French</th><th>Icon</th><th>Approved</th><th>Review note</th><th></th></tr></thead><tbody id="soapClaimRows">${(claims.length?claims:[{claim_en:'Natural Ingredients',claim_fr:'Ingrédients naturels',icon_name:'leaf'},{claim_en:'Handmade with Care',claim_fr:'Fait à la main avec soin',icon_name:'hands'},{claim_en:'Gentle & Moisturizing',claim_fr:'Doux et hydratant',icon_name:'leaf'},{claim_en:'Please Recycle',claim_fr:'Veuillez recycler',icon_name:'recycle'}]).map(claimRow).join('')}</tbody></table></div>`)}
      ${tabPanel('layout',`<h3>Physical size, layout and reusable templates</h3><div class="packaging-dimension-summary"><strong>${esc(template.template_name||'Template')} ${Number(template.is_system)===1?'· system template':'· custom template'}</strong><p class="small">${esc(template.description||'')}</p></div><div class="grid cols-4"><label><span class="small">Canvas width mm</span><input class="input" id="packagingTemplateWidth" type="number" min="20" max="1200" step="0.1" value="${num(template.page_width_mm,279.4)}"/></label><label><span class="small">Canvas height mm</span><input class="input" id="packagingTemplateHeight" type="number" min="20" max="1200" step="0.1" value="${num(template.page_height_mm,38.1)}"/></label><label><span class="small">Front width mm</span><input class="input" id="packagingTemplateFrontWidth" type="number" min="0" max="1200" step="0.1" value="${num(template.front_width_mm,0)}"/></label><label><span class="small">Front height mm</span><input class="input" id="packagingTemplateFrontHeight" type="number" min="0" max="1200" step="0.1" value="${num(template.front_height_mm,0)}"/></label><label><span class="small">Rear width mm</span><input class="input" id="packagingTemplateRearWidth" type="number" min="0" max="1200" step="0.1" value="${num(template.rear_width_mm,0)}"/></label><label><span class="small">Rear height mm</span><input class="input" id="packagingTemplateRearHeight" type="number" min="0" max="1200" step="0.1" value="${num(template.rear_height_mm,0)}"/></label><label><span class="small">Shape</span><select class="input" id="packagingTemplateShape">${['rectangle','oval','round','soap_wrap'].map((value)=>`<option value="${value}" ${String(template.layout?.shape||'rectangle')===value?'selected':''}>${value.replace('_',' ')}</option>`).join('')}</select></label><label><span class="small">Design profile</span><select class="input" id="packagingDesignProfile">${['soap_reference_v2','candle_top_wedding','candle_top_centered','round_maker_mark','general_centered','general_rectangle'].map((value)=>`<option value="${value}" ${String(template.layout?.design_profile||'general_rectangle')===value?'selected':''}>${value.replaceAll('_',' ')}</option>`).join('')}</select></label><label><span class="small">Bleed mm</span><input class="input" id="packagingBleedMm" type="number" min="0" max="25" step="0.1" value="${num(template.layout?.bleed_mm,template.layout?.bleed_in?num(template.layout.bleed_in)*25.4:0)}"/></label><label><span class="small">Safe margin mm</span><input class="input" id="packagingSafeMarginMm" type="number" min="0" max="100" step="0.1" value="${num(template.layout?.safe_margin_mm,template.layout?.safe_margin_in?num(template.layout.safe_margin_in)*25.4:3)}"/></label></div><div class="grid cols-2"><label><span class="small">New reusable template name</span><input class="input" id="packagingCustomTemplateName" placeholder="Example: 3.75-inch wedding candle top"/></label><label><span class="small">Template description</span><input class="input" id="packagingCustomTemplateDescription" placeholder="Material, printer/laser, product family and fit notes"/></label></div><button class="btn" id="savePackagingTemplate" type="button">Save these dimensions and features as a reusable template</button><div class="grid cols-5 packaging-guide-controls"><label><input type="checkbox" id="packagingShowGuides" ${Number(artwork.show_guides)===1?'checked':''}/> All guides</label><label><input type="checkbox" id="packagingShowBleed" ${Number(artwork.show_bleed)===1?'checked':''}/> Bleed</label><label><input type="checkbox" id="packagingShowSafeArea" ${Number(artwork.show_safe_area)===1?'checked':''}/> Safe area</label><label><input type="checkbox" id="packagingShowFoldGuides" ${Number(artwork.show_fold_guides)===1?'checked':''}/> Folds</label><label><input type="checkbox" id="packagingShowGlueZone" ${Number(artwork.show_glue_zone)===1?'checked':''}/> Glue zone</label></div>${String(template.package_type)==='soap_ribbon'?'<div class="packaging-warning-list"><strong>Dimensional conflict preserved for review</strong><p class="small">The supplied specification requires a 38.1 mm-high artboard and a 50 mm rear circle. Those cannot physically fit together. Use the photo-fit profile for a 38.1 mm rear seal, or the 50 mm profile with a taller artboard.</p></div>':''}<label><span class="small">Print and finishing notes</span><textarea class="input" id="packagingPrintNotes" rows="4">${esc(project.print_notes||'')}</textarea></label>`)}
      ${tabPanel('preview',`<div class="section-heading-row"><div><h3>Live exact-size SVG preview</h3><p class="small" id="packagingPreviewSize">Loading dimensions…</p></div><span class="status-pill">SVG master</span></div><div id="packagingSvgPreview" class="packaging-svg-preview"></div><div id="packagingComplianceResults"></div><div class="packaging-export-actions"><button class="btn primary" data-packaging-export="svg">Export SVG</button><button class="btn" data-packaging-export="png">Export PNG</button><button class="btn" data-packaging-export="webp">Export WebP</button><button class="btn" data-packaging-export="jpg">Export JPG</button><button class="btn" data-packaging-export="pdf_print">Print / Save PDF</button></div>`)}
      ${tabPanel('print',`<h3>100% physical print test</h3><p class="small">Print at actual size with browser scaling set to 100% or Actual Size. Measure the physical label and record the evidence below.</p><div class="grid cols-3"><label><span class="small">Version tested</span><select class="input" id="printTestVersion"><option value="">Project draft</option>${versions.map((version)=>`<option value="${version.packaging_project_version_id}" ${Number(newestVersion)===Number(version.packaging_project_version_id)?'selected':''}>Version ${version.version_number} — ${esc(version.version_label||'')}</option>`).join('')}</select></label><label><span class="small">Result</span><select class="input" id="printTestStatus"><option value="needs_test">Needs test</option><option value="passed">Passed</option><option value="failed">Failed</option></select></label><label><span class="small">Printed date/time</span><input class="input" id="printTestDate" type="datetime-local"/></label></div><div class="grid cols-3"><label><span class="small">Printer</span><input class="input" id="printTestPrinter"/></label><label><span class="small">Paper / stock</span><input class="input" id="printTestPaper"/></label><label><span class="small">Scale %</span><input class="input" id="printTestScale" type="number" value="100" step="0.1"/></label></div><div class="grid cols-5"><label><span class="small">Strip width in</span><input class="input" id="printTestStripWidth" type="number" step="0.001" value="11"/></label><label><span class="small">Band height in</span><input class="input" id="printTestBandHeight" type="number" step="0.001" value="0.75"/></label><label><span class="small">Front width in</span><input class="input" id="printTestFrontWidth" type="number" step="0.001" value="2"/></label><label><span class="small">Front height in</span><input class="input" id="printTestFrontHeight" type="number" step="0.001" value="1.5"/></label><label><span class="small">Round / rear diameter mm</span><input class="input" id="printTestRearCircle" type="number" step="0.1" value="${['candle_top','engraved_round'].includes(String(template.package_type))?Math.min(num(template.page_width_mm),num(template.page_height_mm)):num(template.rear_width_mm,38.1)}"/></label></div><div class="grid cols-3"><label><span class="small">Wrap fit</span><select class="input" id="printTestWrap"><option>not_checked</option><option>passed</option><option>failed</option></select></label><label><span class="small">Legibility</span><select class="input" id="printTestLegibility"><option>not_checked</option><option>passed</option><option>failed</option></select></label><label><span class="small">Overlap / folds</span><select class="input" id="printTestOverlap"><option>not_checked</option><option>passed</option><option>failed</option></select></label></div><label><span class="small">Proof image URL</span><input class="input" id="printTestProofUrl" type="url" placeholder="R2 or approved media URL"/></label><label><span class="small">Print-test notes</span><textarea class="input" id="printTestNotes" rows="4"></textarea></label><button class="btn primary" id="savePrintTest" type="button">Save print-test evidence</button><h4>Print-test history</h4><div class="admin-table-wrap"><table><thead><tr><th>Status</th><th>Version</th><th>Scale</th><th>Measurements</th><th>Physical checks</th><th>Date</th></tr></thead><tbody>${printTests.length?printTests.map((test)=>`<tr><td>${esc(test.test_status)}</td><td>${esc(test.packaging_project_version_id||'draft')}</td><td>${esc(test.scale_percent)}%</td><td>${esc(test.measured_strip_width_in||'—')} in × ${esc(test.measured_band_height_in||'—')} in; front ${esc(test.measured_front_width_in||'—')} × ${esc(test.measured_front_height_in||'—')}</td><td>${esc(test.wrap_fit_status)} / ${esc(test.legibility_status)} / ${esc(test.overlap_status)}</td><td>${esc(test.created_at||'')}</td></tr>`).join(''):'<tr><td colspan="6">No physical print tests recorded.</td></tr>'}</tbody></table></div>`)}
      ${tabPanel('versions',`<h3>Review versions and exports</h3><div class="admin-table-wrap"><table><thead><tr><th>Version</th><th>Label</th><th>Review</th><th>Created</th><th>Action</th></tr></thead><tbody>${versions.length?versions.map((version)=>`<tr><td>${version.version_number}</td><td>${esc(version.version_label||'')}</td><td><select class="input" data-version-status="${version.packaging_project_version_id}">${['needs_review','approved','changes_requested','blocked'].map((status)=>`<option ${version.review_status===status?'selected':''}>${status}</option>`).join('')}</select></td><td>${esc(version.created_at||'')}</td><td><button class="btn" data-review-version="${version.packaging_project_version_id}">Save review</button></td></tr>`).join(''):'<tr><td colspan="5">No review versions saved.</td></tr>'}</tbody></table></div><h4>Export history</h4><div class="packaging-export-history">${exports.length?exports.map((entry)=>`<span>${esc(entry.export_format)} · ${esc(entry.file_name||'prepared file')} · ${esc(entry.checksum?String(entry.checksum).slice(0,12):'no checksum')} · ${esc(entry.generated_at||entry.created_at||'')}</span>`).join(''):'<span class="small">No exports recorded.</span>'}</div>`)}
      <div class="packaging-save-actions packaging-sticky-actions"><button class="btn primary" id="savePackagingProject" type="button">Save project</button><button class="btn" id="savePackagingVersion" type="button">Save review version</button></div></section>`;
  }

  function activateTab(key) {
    state.activeTab = key;
    document.querySelectorAll('[data-packaging-tab]').forEach((node) => node.classList.toggle('is-active', node.dataset.packagingTab === key));
    document.querySelectorAll('[data-packaging-panel]').forEach((node) => node.classList.toggle('is-active', node.dataset.packagingPanel === key));
    if (key === 'preview') renderPreview();
  }

  function updateRowNumbers(selector) { document.querySelectorAll(selector).forEach((row, index) => { const cell = row.querySelector('.row-order'); if (cell) cell.textContent = String(index + 1); }); }
  function addIngredient(row = {}) { id('soapIngredientRows')?.insertAdjacentHTML('beforeend', ingredientRow(row, document.querySelectorAll('[data-soap-ingredient-row]').length)); bindDynamicRows(); renderPreview(); }
  function addClaim(row = {}) { id('soapClaimRows')?.insertAdjacentHTML('beforeend', claimRow(row, document.querySelectorAll('[data-soap-claim-row]').length)); bindDynamicRows(); renderPreview(); }
  function addComponent(row = {}) { id('packagingComponentRows')?.insertAdjacentHTML('beforeend', componentRow(row, document.querySelectorAll('[data-packaging-component-row]').length)); bindDynamicRows(); }

  function bindDynamicRows() {
    document.querySelectorAll('[data-remove-ingredient]').forEach((button) => { button.onclick = () => { button.closest('[data-soap-ingredient-row]')?.remove(); updateRowNumbers('[data-soap-ingredient-row]'); renderPreview(); }; });
    document.querySelectorAll('[data-remove-claim]').forEach((button) => { button.onclick = () => { button.closest('[data-soap-claim-row]')?.remove(); updateRowNumbers('[data-soap-claim-row]'); renderPreview(); }; });
    document.querySelectorAll('[data-remove-component]').forEach((button) => { button.onclick = () => { button.closest('[data-packaging-component-row]')?.remove(); updateRowNumbers('[data-packaging-component-row]'); }; });
    document.querySelectorAll('[data-packaging-component-row] [data-field="site_item_inventory_id"]').forEach((select) => { select.onchange = () => { const inventory=state.inventory.find((item)=>Number(item.site_item_inventory_id)===Number(select.value||0));const row=select.closest('[data-packaging-component-row]');if(!inventory||!row)return;const name=row.querySelector('[data-field="component_name"]');const sku=row.querySelector('[data-field="sku_reference"]');const cost=row.querySelector('[data-field="unit_cost_cents"]');const supplier=row.querySelector('[data-field="supplier_name"]');if(name&&!name.value)name.value=inventory.item_name||'';if(sku&&!sku.value)sku.value=inventory.supplier_sku||inventory.external_key||'';if(cost&&!Number(cost.value||0))cost.value=Number(inventory.unit_cost_cents||0);if(supplier&&!supplier.value)supplier.value=inventory.supplier_name||''; }; });
    document.querySelectorAll('[data-soap-ingredient-row] input,[data-soap-claim-row] input,[data-soap-claim-row] select').forEach((node) => { node.oninput = renderPreview; node.onchange = renderPreview; });
  }

  function renderMain() {
    const main = id('packagingStudioMain'); if (!main) return;
    if (!state.detail?.project) { main.innerHTML = '<section class="card packaging-studio-welcome"><h2>Choose or create a labeling and packaging project</h2><p>Use one project for the editable label, packaging component bill of materials, cost estimate, versions, print tests and approval evidence. Soap ribbons retain the detailed bilingual/INCI workflow.</p></section>'; return; }
    main.innerHTML = detailMarkup(); bindDetail();
  }

  async function load(projectId = 0) {
    try { state.loading = true; message('Loading Labeling & Packaging System…'); const data = await api(null, projectId); state.projects = data.projects || []; state.templates = data.templates || []; state.products = data.products || []; state.inventory = data.inventory || []; state.referenceSources = data.reference_sources || []; state.detail = data.detail || null; renderProjects(); renderMain(); message(`Labeling & Packaging System loaded with ${state.referenceSources.length} adopted source reference${state.referenceSources.length===1?'':'s'}.`, 'success'); }
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
      packagingTemplateRearHeight: template.rear_height_mm, packagingTemplateShape: layout.shape || 'rectangle', packagingDesignProfile: layout.design_profile || 'general_rectangle',
      packagingBleedMm: layout.bleed_mm ?? (num(layout.bleed_in) * 25.4), packagingSafeMarginMm: layout.safe_margin_mm ?? (num(layout.safe_margin_in) * 25.4),
      packagingTopArcText: layout.default_top_arc_text || (template.package_type === 'soap_ribbon' ? 'Rosevear Creations' : ''), packagingBottomArcText: layout.default_bottom_arc_text || (template.package_type === 'soap_ribbon' ? 'MADE IN CANADA' : ''),
      packagingCandlePrimaryText: layout.default_primary_text || '', packagingCandleDateLine1: layout.default_date_line_1 || '', packagingCandleEventLine: layout.default_event_line || '',
      packagingCandleDateLine2: layout.default_date_line_2 || '', packagingArtworkAsset: layout.artwork_asset || ''
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
        layout: { ...template.layout, default_top_arc_text: data.artwork.top_arc_text, default_bottom_arc_text: data.artwork.bottom_arc_text, default_primary_text: data.artwork.candle_primary_text, default_date_line_1: data.artwork.candle_date_line_1, default_event_line: data.artwork.candle_event_line, default_date_line_2: data.artwork.candle_date_line_2, artwork_asset: data.artwork.artwork_asset }, theme: data.theme
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

  async function reviewVersion(versionId) {
    try { const status = document.querySelector(`[data-version-status="${versionId}"]`)?.value || 'needs_review'; const data = await api({ action: 'review_version', packaging_project_id: Number(id('packagingProjectId')?.value || 0), packaging_project_version_id: versionId, review_status: status }); state.projects = data.projects || []; state.detail = data.detail; renderProjects(); renderMain(); message(data.message, 'success'); }
    catch (error) { message(error.message, 'error'); }
  }

  async function savePrintTest() {
    try {
      const data = await api({ action: 'save_print_test', packaging_project_id: Number(id('packagingProjectId')?.value || 0), packaging_project_version_id: Number(id('printTestVersion')?.value || 0) || null, test_status: id('printTestStatus')?.value, printed_at: id('printTestDate')?.value, printer_name: id('printTestPrinter')?.value, paper_stock: id('printTestPaper')?.value, scale_percent: Number(id('printTestScale')?.value || 100), measured_strip_width_in: Number(id('printTestStripWidth')?.value || 0), measured_band_height_in: Number(id('printTestBandHeight')?.value || 0), measured_front_width_in: Number(id('printTestFrontWidth')?.value || 0), measured_front_height_in: Number(id('printTestFrontHeight')?.value || 0), measured_rear_circle_mm: Number(id('printTestRearCircle')?.value || 0), wrap_fit_status: id('printTestWrap')?.value, legibility_status: id('printTestLegibility')?.value, overlap_status: id('printTestOverlap')?.value, proof_image_url: id('printTestProofUrl')?.value, notes: id('printTestNotes')?.value });
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
    if (!confirm('Apply the Glacial Purple photo-reference wording and colours to this draft? Existing fields will be replaced.')) return;
    const values = { packagingCollection:'Glacial Purple', packagingProductName:'Aloe Soap', packagingSubtitle:'Handcrafted with Care', packagingIdentityEn:'Aloe Soap', packagingIdentityFr:'Savon à l’aloès', packagingNetQuantity:'NET WT. APPROX. 4.5 OZ / 127 G', packagingNetWeightOz:'4.5', packagingNetWeightG:'127', packagingRoseColour:'#7B4DA6', packagingThemeColour:'#FBF5E8', packagingBorderColour:'#32105E', packagingAccentGold:'#B88A2F', packagingSecondaryColour:'#5A2A86', packagingRoseAsset:'rose-purple-v1' };
    Object.entries(values).forEach(([key,value]) => { const node = id(key); if (node) node.value = value; });
    if (!ingredientRowsFromDom().length || confirm('Replace the current ingredient rows with the six visible reference rows?')) {
      id('soapIngredientRows').innerHTML = [
        ['Aloe Soap Base','Aloe Soap Base – SLS/SLES free','Base de savon à l’aloès – sans SLS/SLES'],['','No Palm Oil','Sans huile de palme'],['','Organic Soap Base','Base de savon biologique'],['','Bulk Aloe Melt and Pour Soap Base','Base de savon à fondre et à verser à l’aloès en vrac'],['','Natural Soap Base for Soap Making Organic','Base de savon naturelle pour fabrication de savon biologique'],['','Soap Making Supplies','Fournitures pour fabrication de savon']
      ].map((row,index)=>ingredientRow({inci_name:row[0],display_name_en:row[1],display_name_fr:row[2],required_on_label:1},index)).join(''); bindDynamicRows();
    }
    renderPreview(); message('Glacial Purple photo-reference layout applied. Replace reference wording with the verified formula and INCI facts before approval.', 'success');
  }

  function bindDetail() {
    document.querySelectorAll('[data-packaging-tab]').forEach((button) => button.addEventListener('click', () => activateTab(button.dataset.packagingTab)));
    document.querySelectorAll('.packaging-editor-card input,.packaging-editor-card textarea,.packaging-editor-card select').forEach((node) => { const eventName = node.type === 'color' || node.type === 'checkbox' ? 'input' : 'change'; node.addEventListener(eventName, renderPreview); if (node.tagName === 'TEXTAREA' || ['text','number','url','search'].includes(node.type)) node.addEventListener('input', renderPreview); });
    id('addSoapIngredient')?.addEventListener('click', () => addIngredient({required_on_label:1})); id('addSoapClaim')?.addEventListener('click', () => addClaim({icon_name:'leaf'})); id('addPackagingComponent')?.addEventListener('click', () => addComponent({component_type:'label',quantity_per_finished_unit:1})); bindDynamicRows();
    id('packagingRoseAsset')?.addEventListener('change', (event) => { const presets = { 'rose-purple-v1':['#7B4DA6','#5A2A86'], 'rose-green-v1':['#66804A','#365737'], 'rose-oatmeal-v1':['#D7C3A3','#785B45'] }; const preset = presets[event.target.value]; if (preset) { if (id('packagingRoseColour')) id('packagingRoseColour').value = preset[0]; if (id('packagingSecondaryColour')) id('packagingSecondaryColour').value = preset[1]; renderPreview(); } });
    id('packagingTemplateId')?.addEventListener('change', applySelectedTemplate); id('savePackagingTemplate')?.addEventListener('click', saveAsTemplate);
    id('savePackagingProject')?.addEventListener('click', saveProject); id('savePackagingComponents')?.addEventListener('click', saveComponents); id('savePackagingVersion')?.addEventListener('click', saveVersion); id('duplicatePackagingProject')?.addEventListener('click', duplicateProject); id('archivePackagingProject')?.addEventListener('click', archiveProject); id('savePrintTest')?.addEventListener('click', savePrintTest); id('applyGlacialPurpleReference')?.addEventListener('click', applyGlacialPurpleReference);
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
      bindDynamicRows(); renderPreview(); if (showMessage) message(`Browser draft restored from ${draft.saved_at || 'an earlier session'}. Review and save it to D1.`, 'success');
    } catch { if (showMessage) message('The browser draft could not be restored.', 'error'); }
  }

  function bind() {
    id('newPackagingProject')?.addEventListener('click', createProject); id('refreshPackagingStudio')?.addEventListener('click', () => load(Number(state.detail?.project?.packaging_project_id || 0))); id('restorePackagingDraft')?.addEventListener('click', () => restoreLocal(true)); id('packagingProjectSearch')?.addEventListener('input', renderProjects);
    id('packagingProjectList')?.addEventListener('click', (event) => { const button = event.target.closest('[data-open-packaging]'); if (button) load(Number(button.dataset.openPackaging || 0)); });
  }

  document.addEventListener('DOMContentLoaded', () => { bind(); load(); });
})();
