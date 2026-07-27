// Build 221 — Packaging Studio client with live SVG, local fallback, reference ribbon preset and export tracking.
(() => {
  const STORAGE_KEY = 'dd_packaging_studio_local_draft_v2';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const xml = (value) => String(value ?? '').replace(/[<>&"']/g, (char) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
  }[char]));
  const id = (name) => document.getElementById(name);
  const state = { projects: [], templates: [], products: [], detail: null, loading: false };

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
        <span>
          <strong>${esc(row.project_name || row.product_name || 'Untitled packaging')}</strong>
          <small>${esc(row.project_key || '')} · ${esc(row.project_status || 'draft')} · ${esc(row.compliance_status || 'needs_review')}</small>
        </span>
        <span class="status-pill">${esc(row.package_type || 'packaging')}</span>
      </button>`).join('') : '<p class="small">No matching packaging projects.</p>';
  }

  function options(rows, value, label) {
    return rows.map((row) => {
      const optionId = Number(row.packaging_template_id || row.product_id || 0);
      return `<option value="${optionId}" ${Number(value) === optionId ? 'selected' : ''}>${esc(label(row))}</option>`;
    }).join('');
  }

  function checkedList(name) {
    const value = state.detail?.project?.[name];
    return Array.isArray(value) ? value : [];
  }

  function currentTemplate() {
    const selectedId = Number(id('packagingTemplateId')?.value || state.detail?.project?.packaging_template_id || 0);
    return state.templates.find((row) => Number(row.packaging_template_id) === selectedId)
      || state.detail?.template
      || state.templates[0]
      || {};
  }

  function compliance(project) {
    const checks = [
      ['identity_en', 'English product identity', project.product_identity_en],
      ['identity_fr', 'French product identity', project.product_identity_fr],
      ['net', 'Metric net quantity', project.net_quantity_text],
      ['inci', 'INCI ingredient list', project.ingredients_inci],
      ['dealer', 'Dealer / business identity', project.dealer_name],
      ['address', 'Dealer principal place of business', project.dealer_address],
      ['contact', 'Consumer contact information', project.contact_text]
    ];
    const warningsNeeded = Boolean(String(project.warnings_en || project.warnings_fr || '').trim());
    if (warningsNeeded) {
      checks.push(['warning_en', 'English warning', project.warnings_en]);
      checks.push(['warning_fr', 'French warning', project.warnings_fr]);
    }
    const missing = checks.filter(([, , value]) => !String(value || '').trim());
    return { checks, missing, ready: missing.length === 0 };
  }

  function fontSize(textValue, maxLength, base, min) {
    const length = String(textValue || '').length;
    if (length <= maxLength) return base;
    return Math.max(min, Math.round((base * maxLength / length) * 10) / 10);
  }

  function lines(value, maxChars = 42, maxLines = 5) {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    const output = [];
    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxChars && current) {
        output.push(current);
        current = word;
      } else current = next;
      if (output.length >= maxLines) break;
    }
    if (output.length < maxLines && current) output.push(current);
    return output.slice(0, maxLines);
  }

  function textBlock(value, x, y, lineHeight, maxChars, maxLines, size, anchor = 'middle') {
    return lines(value, maxChars, maxLines)
      .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" font-size="${size}" class="pkg-copy">${xml(line)}</text>`)
      .join('');
  }

  function snapshot() {
    const names = [
      'packagingProjectId', 'packagingTemplateId', 'packagingProductId', 'packagingProjectName',
      'packagingType', 'packagingStatus', 'packagingCollection', 'packagingProductName',
      'packagingSubtitle', 'packagingIdentityEn', 'packagingIdentityFr', 'packagingInci',
      'packagingIngredientsEn', 'packagingIngredientsFr', 'packagingNetQuantity',
      'packagingWebsite', 'packagingDealerName', 'packagingDealerAddress', 'packagingContact',
      'packagingMadeInCanada', 'packagingWarningsEn', 'packagingWarningsFr',
      'packagingPrintNotes', 'packagingCompliance'
    ];
    const output = {};
    names.forEach((name) => {
      const node = id(name);
      if (node) output[name] = node.value;
    });
    output.claims = String(id('packagingClaims')?.value || '').split(/[,\n]/).map((value) => value.trim()).filter(Boolean);
    output.icons = String(id('packagingIcons')?.value || '').split(/[,\n]/).map((value) => value.trim()).filter(Boolean);
    output.theme = {
      rose_colour: id('packagingRoseColour')?.value || '#9b8068',
      theme_colour: id('packagingThemeColour')?.value || '#f2ead8',
      border_colour: id('packagingBorderColour')?.value || '#2f2721',
      accent_gold: id('packagingAccentGold')?.value || '#b69a61'
    };
    output.artwork = {
      rose_style: id('packagingRoseStyle')?.value || 'botanical_sprigs',
      badge_shape: id('packagingBadgeShape')?.value || 'scalloped',
      top_arc_text: id('packagingTopArcText')?.value || '',
      bottom_arc_text: id('packagingBottomArcText')?.value || '',
      centre_mark: id('packagingCentreMark')?.value || '◇'
    };
    output.saved_at = new Date().toISOString();
    return output;
  }

  function projectPayload() {
    const data = snapshot();
    return {
      action: 'save_project',
      packaging_project_id: Number(data.packagingProjectId || 0),
      packaging_template_id: Number(data.packagingTemplateId || 0),
      product_id: Number(data.packagingProductId || 0) || null,
      project_name: data.packagingProjectName,
      package_type: data.packagingType,
      project_status: data.packagingStatus,
      collection_name: data.packagingCollection,
      product_name: data.packagingProductName,
      product_subtitle: data.packagingSubtitle,
      product_identity_en: data.packagingIdentityEn,
      product_identity_fr: data.packagingIdentityFr,
      ingredients_inci: data.packagingInci,
      ingredients_en: data.packagingIngredientsEn,
      ingredients_fr: data.packagingIngredientsFr,
      net_quantity_text: data.packagingNetQuantity,
      website_text: data.packagingWebsite,
      dealer_name: data.packagingDealerName,
      dealer_address: data.packagingDealerAddress,
      contact_text: data.packagingContact,
      made_in_canada_text: data.packagingMadeInCanada,
      claims: data.claims,
      warnings_en: data.packagingWarningsEn,
      warnings_fr: data.packagingWarningsFr,
      icons: data.icons,
      theme: data.theme,
      artwork: data.artwork,
      print_notes: data.packagingPrintNotes,
      compliance_status: data.packagingCompliance
    };
  }

  function scallopedPath(cx, cy, innerRadius, outerRadius, teeth = 30) {
    const points = [];
    const steps = teeth * 2;
    for (let index = 0; index < steps; index += 1) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index / steps);
      const radius = index % 2 === 0 ? outerRadius : innerRadius;
      points.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
    }
    return `M${points.join(' L')} Z`;
  }

  function ornamentSvg(x, y, scale, colour, mirror = false, style = 'botanical_sprigs') {
    if (style === 'none') return '';
    const transform = `translate(${x} ${y}) scale(${mirror ? -scale : scale} ${scale})`;
    if (style === 'minimal') {
      return `<g transform="${transform}" fill="none" stroke="${colour}" stroke-width="2"><path d="M0 0 C20 -15 38 -12 54 0 C38 12 20 15 0 0Z"/><path d="M10 0H47"/></g>`;
    }
    return `<g transform="${transform}" fill="none" stroke="${colour}" stroke-width="2" stroke-linecap="round">
      <path d="M0 0 C15 -7 30 -7 48 0 C30 7 15 7 0 0Z"/>
      <path d="M12 0 C20 -16 30 -20 34 -25 C36 -13 30 -4 12 0Z"/>
      <path d="M23 1 C32 14 42 16 48 20 C47 9 39 3 23 1Z"/>
      <path d="M8 -1 C12 -11 18 -15 23 -18"/>
      <circle cx="27" cy="0" r="2.5" fill="${colour}"/>
    </g>`;
  }

  function scallopedRibbonSvg(data, template) {
    const theme = data.theme || {};
    const artwork = data.artwork || {};
    const background = theme.theme_colour || '#f2ead8';
    const border = theme.border_colour || '#2f2721';
    const gold = theme.accent_gold || '#b69a61';
    const botanical = theme.rose_colour || '#9b8068';
    const collection = artwork.top_arc_text || data.packagingCollection || 'Coconut milk';
    const bottomArc = artwork.bottom_arc_text || data.packagingProductName || 'Sweet Vanilla';
    const identityEn = data.packagingIdentityEn || 'Luxury Soap';
    const identityFr = data.packagingIdentityFr || 'Savon de luxe';
    const inci = data.packagingInci || 'INCI ingredients';
    const ingredientsEn = data.packagingIngredientsEn || inci;
    const ingredientsFr = data.packagingIngredientsFr || inci;
    const net = data.packagingNetQuantity || '100 g';
    const website = data.packagingWebsite || 'devilndove.com';
    const dealer = data.packagingDealerName || 'Devil n Dove';
    const made = data.packagingMadeInCanada || 'Made in Canada / Fabriqué au Canada';
    const claims = data.claims || [];
    const badgePath = artwork.badge_shape === 'oval'
      ? '<ellipse cx="145" cy="100" rx="90" ry="74"/>'
      : `<path d="${scallopedPath(145, 100, 82, 88, 34)}"/>`;
    const pageWidth = Number(template.page_width_mm || 279.4);
    const pageHeight = Number(template.page_height_mm || 50);
    const topArcSize = fontSize(collection, 24, 14, 8);
    const bottomArcSize = fontSize(bottomArc, 24, 13, 8);
    const titleSize = fontSize(identityEn, 22, 18, 11);
    const subtitleSize = fontSize(identityFr, 24, 12, 8);
    const mark = artwork.centre_mark || '◇';
    const uid = `pkg-${Number(data.packagingProjectId || 0)}-${Date.now().toString(36)}`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}mm" height="${pageHeight}mm" viewBox="0 0 1100 200" role="img" aria-label="${xml(bottomArc)} scalloped soap ribbon packaging">
      <defs>
        <path id="${uid}-top" d="M68 103 A77 77 0 0 1 222 103"/>
        <path id="${uid}-bottom" d="M62 116 A84 84 0 0 0 228 116"/>
      </defs>
      <style>
        .pkg-copy{font-family:Arial,sans-serif;fill:${border}}
        .pkg-serif{font-family:Georgia,serif;fill:${border}}
        .pkg-arc{font-family:Arial,sans-serif;fill:${border};font-weight:700;letter-spacing:1.4px;text-transform:uppercase}
      </style>
      <rect width="1100" height="200" fill="#fff"/>
      <rect x="0" y="62" width="1100" height="76" fill="${background}"/>
      <rect x="2" y="64" width="1096" height="72" fill="none" stroke="${gold}" stroke-width="3"/>
      <g opacity=".45" stroke="${border}" stroke-width="1">
        <line x1="278" y1="62" x2="278" y2="138"/>
        <line x1="490" y1="62" x2="490" y2="138"/>
        <line x1="702" y1="62" x2="702" y2="138"/>
        <line x1="910" y1="62" x2="910" y2="138"/>
      </g>
      <g fill="${background}" stroke="${gold}" stroke-width="3">${badgePath}</g>
      <circle cx="145" cy="100" r="73" fill="none" stroke="${border}" stroke-width="1.6"/>
      <circle cx="145" cy="100" r="68" fill="none" stroke="${gold}" stroke-width="1" opacity=".75"/>
      ${ornamentSvg(73, 98, .72, botanical, false, artwork.rose_style)}
      ${ornamentSvg(217, 98, .72, botanical, true, artwork.rose_style)}
      <text class="pkg-arc" font-size="${topArcSize}"><textPath href="#${uid}-top" startOffset="50%" text-anchor="middle">${xml(collection)}</textPath></text>
      <text x="145" y="93" text-anchor="middle" font-size="${titleSize}" font-weight="700" class="pkg-serif">${xml(identityEn)}</text>
      <text x="145" y="113" text-anchor="middle" font-size="${subtitleSize}" class="pkg-serif">${xml(identityFr)}</text>
      <text x="145" y="131" text-anchor="middle" font-size="11" class="pkg-serif">${xml(mark)}</text>
      <text class="pkg-arc" font-size="${bottomArcSize}"><textPath href="#${uid}-bottom" startOffset="50%" text-anchor="middle">${xml(bottomArc)}</textPath></text>
      <text x="384" y="76" text-anchor="middle" font-size="8" font-weight="700" class="pkg-copy">INGREDIENTS</text>
      ${textBlock(ingredientsEn, 384, 89, 9, 38, 5, 6.2)}
      <text x="596" y="76" text-anchor="middle" font-size="8" font-weight="700" class="pkg-copy">INGRÉDIENTS</text>
      ${textBlock(ingredientsFr, 596, 89, 9, 38, 5, 6.2)}
      <circle cx="806" cy="100" r="36" fill="${background}" stroke="${gold}" stroke-width="2"/>
      <circle cx="806" cy="100" r="31" fill="none" stroke="${border}" stroke-width="1"/>
      <text x="806" y="92" text-anchor="middle" font-size="9" font-weight="700" class="pkg-serif">${xml(dealer)}</text>
      <text x="806" y="106" text-anchor="middle" font-size="5.8" class="pkg-copy">${xml(website)}</text>
      <text x="806" y="118" text-anchor="middle" font-size="5.2" class="pkg-copy">${xml(made)}</text>
      <text x="1003" y="76" text-anchor="middle" font-size="8" font-weight="700" class="pkg-copy">CLAIMS / DETAILS</text>
      ${textBlock(claims.join(' • ') || made, 1003, 90, 9, 30, 4, 5.8)}
      <text x="1003" y="128" text-anchor="middle" font-size="6.2" class="pkg-copy">${xml(net)} • ${xml(website)}</text>
    </svg>`;
  }

  function standardRibbonSvg(data, template) {
    const theme = data.theme || {};
    const claims = data.claims || [];
    const title = data.packagingProductName || 'Product name';
    const subtitle = data.packagingSubtitle || data.packagingCollection || '';
    const identity = `${data.packagingIdentityEn || 'Soap'} / ${data.packagingIdentityFr || 'Savon'}`;
    const inci = data.packagingInci || 'INCI ingredients';
    const en = data.packagingIngredientsEn || inci;
    const fr = data.packagingIngredientsFr || inci;
    const website = data.packagingWebsite || 'devilndove.com';
    const dealer = data.packagingDealerName || 'Devil n Dove';
    const net = data.packagingNetQuantity || 'Net 100 g';
    const made = data.packagingMadeInCanada || 'Made in Canada / Fabriqué au Canada';
    const titleSize = fontSize(title, 22, 15, 8);
    const subtitleSize = fontSize(subtitle, 32, 7, 4.5);
    const pageWidth = Number(template.page_width_mm || 279.4);
    const pageHeight = Number(template.page_height_mm || 19);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}mm" height="${pageHeight}mm" viewBox="0 0 1100 75" role="img" aria-label="${xml(title)} soap ribbon packaging">
      <style>.pkg-copy{font-family:Arial,sans-serif;fill:${theme.border_colour || '#3b2c2f'}}.pkg-serif{font-family:Georgia,serif;fill:${theme.border_colour || '#3b2c2f'}}</style>
      <rect width="1100" height="75" fill="${theme.theme_colour || '#f4eadb'}"/>
      <rect x="1.5" y="1.5" width="1097" height="72" rx="4" fill="none" stroke="${theme.accent_gold || '#b38a3b'}" stroke-width="3"/>
      <g stroke="${theme.border_colour || '#3b2c2f'}" stroke-width="1" opacity=".45"><line x1="245" y1="0" x2="245" y2="75"/><line x1="465" y1="0" x2="465" y2="75"/><line x1="685" y1="0" x2="685" y2="75"/><line x1="905" y1="0" x2="905" y2="75"/></g>
      <ellipse cx="122" cy="37.5" rx="103" ry="30" fill="rgba(255,255,255,.5)" stroke="${theme.rose_colour || '#b74b63'}" stroke-width="2"/>
      <text x="135" y="25" text-anchor="middle" font-size="${titleSize}" font-weight="700" class="pkg-serif">${xml(title)}</text>
      <text x="135" y="38" text-anchor="middle" font-size="${subtitleSize}" class="pkg-copy">${xml(subtitle)}</text>
      <text x="135" y="51" text-anchor="middle" font-size="6" class="pkg-copy">${xml(identity)}</text>
      <text x="135" y="62" text-anchor="middle" font-size="6" class="pkg-copy">${xml(net)}</text>
      <text x="355" y="11" text-anchor="middle" font-size="7" font-weight="700" class="pkg-copy">INGREDIENTS</text>${textBlock(en, 355, 22, 8, 42, 6, 5.4)}
      <text x="575" y="11" text-anchor="middle" font-size="7" font-weight="700" class="pkg-copy">INGRÉDIENTS</text>${textBlock(fr, 575, 22, 8, 42, 6, 5.4)}
      <circle cx="795" cy="37" r="30" fill="rgba(255,255,255,.45)" stroke="${theme.rose_colour || '#b74b63'}" stroke-width="2"/>
      <text x="795" y="29" text-anchor="middle" font-size="8" font-weight="700" class="pkg-serif">${xml(dealer)}</text>
      <text x="795" y="40" text-anchor="middle" font-size="5.5" class="pkg-copy">${xml(website)}</text>
      <text x="795" y="51" text-anchor="middle" font-size="4.8" class="pkg-copy">${xml(made)}</text>
      <text x="1002" y="12" text-anchor="middle" font-size="7" font-weight="700" class="pkg-copy">CLAIMS / DETAILS</text>${textBlock(claims.join(' • ') || made, 1002, 24, 8, 32, 5, 5.2)}
      <text x="1002" y="65" text-anchor="middle" font-size="5.5" class="pkg-copy">${xml(net)} • ${xml(website)}</text>
    </svg>`;
  }

  function svgMarkup() {
    const data = snapshot();
    const template = currentTemplate();
    const key = String(template.template_key || '').toLowerCase();
    return key.includes('scalloped')
      ? scallopedRibbonSvg(data, template)
      : standardRibbonSvg(data, template);
  }

  function renderPreview() {
    const mount = id('packagingSvgPreview');
    if (mount) mount.innerHTML = svgMarkup();
    const result = compliance(projectPayload());
    const target = id('packagingComplianceResults');
    if (target) {
      target.innerHTML = `<div class="packaging-compliance-grid">${result.checks.map(([, label, value]) => `
        <span class="${String(value || '').trim() ? 'ok' : 'missing'}">${String(value || '').trim() ? '✓' : '!'} ${esc(label)}</span>`).join('')}</div>
        <p class="small">${result.ready ? 'Common required fields are present. Final regulatory and print review is still required.' : `${result.missing.length} common field(s) remain incomplete.`}</p>`;
    }
    const template = currentTemplate();
    const size = id('packagingPreviewSize');
    if (size) size.textContent = `Physical canvas: ${Number(template.page_width_mm || 279.4)} mm × ${Number(template.page_height_mm || 19)} mm. The narrow band remains 19 mm high; extended badges use the larger canvas.`;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot())); } catch {}
  }

  function detailMarkup() {
    const project = state.detail?.project || {};
    const template = state.detail?.template || {};
    const theme = project.theme || template.theme || {};
    const artwork = project.artwork || {};
    const claims = checkedList('claims').join(', ');
    const icons = checkedList('icons').join(', ');
    const versions = state.detail?.versions || [];
    const exports = state.detail?.exports || [];
    return `<section class="card packaging-editor-card">
      <div class="section-heading-row">
        <div><p class="eyebrow">${esc(project.project_key || 'New packaging')}</p><h2 style="margin:0">${esc(project.project_name || project.product_name || 'Packaging project')}</h2></div>
        <div class="packaging-project-actions"><button class="btn" id="duplicatePackagingProject" type="button">Duplicate</button><button class="btn" id="archivePackagingProject" type="button">Archive</button></div>
      </div>
      <input type="hidden" id="packagingProjectId" value="${Number(project.packaging_project_id || 0)}"/>
      <div class="grid cols-3">
        <label><span class="small">Project name</span><input class="input" id="packagingProjectName" value="${esc(project.project_name || '')}"/></label>
        <label><span class="small">Template</span><select class="input" id="packagingTemplateId">${options(state.templates, project.packaging_template_id, (row) => row.template_name)}</select></label>
        <label><span class="small">Linked product</span><select class="input" id="packagingProductId"><option value="">No product link</option>${options(state.products, project.product_id, (row) => `${row.name} · ${row.sku || `#${row.product_id}`}`)}</select></label>
      </div>
      <div class="grid cols-3">
        <label><span class="small">Package type</span><select class="input" id="packagingType"><option value="soap_ribbon" ${project.package_type === 'soap_ribbon' ? 'selected' : ''}>Soap ribbon</option><option value="candle_label" ${project.package_type === 'candle_label' ? 'selected' : ''}>Candle label</option><option value="jewelry_card" ${project.package_type === 'jewelry_card' ? 'selected' : ''}>Jewelry display card</option><option value="hang_tag" ${project.package_type === 'hang_tag' ? 'selected' : ''}>Hang tag</option><option value="insert_card" ${project.package_type === 'insert_card' ? 'selected' : ''}>Insert / care card</option></select></label>
        <label><span class="small">Project status</span><select class="input" id="packagingStatus">${['draft', 'review', 'approved', 'archived'].map((value) => `<option ${project.project_status === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
        <label><span class="small">Compliance review</span><select class="input" id="packagingCompliance">${['needs_review', 'ready_for_review', 'approved', 'blocked'].map((value) => `<option ${project.compliance_status === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
      </div>
      <div class="packaging-reference-note">
        <img src="/assets/soap-ribbon-scalloped-reference.svg" alt="Scalloped soap ribbon reference with curved collection and scent text, bilingual centre title, side botanical ornaments and a narrow wrap band"/>
        <div><strong>Photo-reference ribbon preset</strong><p class="small">The supplied ribbon maps collection text to the upper curve, English and French product identity to the centre, and the scent or product name to the lower curve. The scalloped badge extends beyond the 19 mm wrap band.</p><button class="btn" id="applySoapRibbonReference" type="button">Apply reference example</button></div>
      </div>
      <details open><summary>Product and bilingual label content</summary>
        <div class="grid cols-3">
          <label><span class="small">Collection / upper curved text</span><input class="input" id="packagingCollection" value="${esc(project.collection_name || '')}" placeholder="Coconut milk"/></label>
          <label><span class="small">Product / scent / lower curved text</span><input class="input" id="packagingProductName" value="${esc(project.product_name || '')}" placeholder="Sweet Vanilla"/></label>
          <label><span class="small">Subtitle</span><input class="input" id="packagingSubtitle" value="${esc(project.product_subtitle || '')}"/></label>
        </div>
        <div class="grid cols-2">
          <label><span class="small">Product identity — English</span><input class="input" id="packagingIdentityEn" value="${esc(project.product_identity_en || 'Luxury Soap')}"/></label>
          <label><span class="small">Product identity — French</span><input class="input" id="packagingIdentityFr" value="${esc(project.product_identity_fr || 'Savon de luxe')}"/></label>
        </div>
        <label><span class="small">INCI ingredient list</span><textarea class="input" id="packagingInci" rows="4">${esc(project.ingredients_inci || '')}</textarea></label>
        <div class="grid cols-2">
          <label><span class="small">English ingredient/supporting copy</span><textarea class="input" id="packagingIngredientsEn" rows="4">${esc(project.ingredients_en || '')}</textarea></label>
          <label><span class="small">French ingredient/supporting copy</span><textarea class="input" id="packagingIngredientsFr" rows="4">${esc(project.ingredients_fr || '')}</textarea></label>
        </div>
        <div class="grid cols-3">
          <label><span class="small">Net quantity</span><input class="input" id="packagingNetQuantity" value="${esc(project.net_quantity_text || '')}" placeholder="100 g"/></label>
          <label><span class="small">Website</span><input class="input" id="packagingWebsite" value="${esc(project.website_text || 'devilndove.com')}"/></label>
          <label><span class="small">Made in Canada text</span><input class="input" id="packagingMadeInCanada" value="${esc(project.made_in_canada_text || 'Made in Canada / Fabriqué au Canada')}"/></label>
        </div>
      </details>
      <details><summary>Dealer, contact, claims and warnings</summary>
        <div class="grid cols-3">
          <label><span class="small">Dealer / business</span><input class="input" id="packagingDealerName" value="${esc(project.dealer_name || 'Devil n Dove')}"/></label>
          <label><span class="small">Dealer principal address</span><input class="input" id="packagingDealerAddress" value="${esc(project.dealer_address || '')}"/></label>
          <label><span class="small">Consumer contact</span><input class="input" id="packagingContact" value="${esc(project.contact_text || 'devilndove.com/contact')}"/></label>
        </div>
        <div class="grid cols-2">
          <label><span class="small">Claims, comma separated</span><textarea class="input" id="packagingClaims" rows="3">${esc(claims)}</textarea></label>
          <label><span class="small">Icons, comma separated</span><textarea class="input" id="packagingIcons" rows="3">${esc(icons)}</textarea></label>
        </div>
        <div class="grid cols-2">
          <label><span class="small">Warnings — English</span><textarea class="input" id="packagingWarningsEn" rows="3">${esc(project.warnings_en || '')}</textarea></label>
          <label><span class="small">Warnings — French</span><textarea class="input" id="packagingWarningsFr" rows="3">${esc(project.warnings_fr || '')}</textarea></label>
        </div>
      </details>
      <details open><summary>Badge and theme engine</summary>
        <div class="grid cols-4">
          <label><span class="small">Botanical colour</span><input class="input" id="packagingRoseColour" type="color" value="${esc(theme.rose_colour || '#9b8068')}"/></label>
          <label><span class="small">Paper / ribbon colour</span><input class="input" id="packagingThemeColour" type="color" value="${esc(theme.theme_colour || '#f2ead8')}"/></label>
          <label><span class="small">Text / border colour</span><input class="input" id="packagingBorderColour" type="color" value="${esc(theme.border_colour || '#2f2721')}"/></label>
          <label><span class="small">Accent gold</span><input class="input" id="packagingAccentGold" type="color" value="${esc(theme.accent_gold || '#b69a61')}"/></label>
        </div>
        <div class="grid cols-3">
          <label><span class="small">Badge shape</span><select class="input" id="packagingBadgeShape"><option value="scalloped" ${artwork.badge_shape !== 'oval' ? 'selected' : ''}>Scalloped medallion</option><option value="oval" ${artwork.badge_shape === 'oval' ? 'selected' : ''}>Oval medallion</option></select></label>
          <label><span class="small">Side ornament</span><select class="input" id="packagingRoseStyle"><option value="botanical_sprigs" ${!artwork.rose_style || artwork.rose_style === 'botanical_sprigs' ? 'selected' : ''}>Botanical sprigs</option><option value="minimal" ${artwork.rose_style === 'minimal' ? 'selected' : ''}>Minimal line ornaments</option><option value="none" ${artwork.rose_style === 'none' ? 'selected' : ''}>No ornaments</option></select></label>
          <label><span class="small">Centre mark</span><input class="input" id="packagingCentreMark" value="${esc(artwork.centre_mark || '◇')}" maxlength="8"/></label>
        </div>
        <div class="grid cols-2">
          <label><span class="small">Upper arc override (optional)</span><input class="input" id="packagingTopArcText" value="${esc(artwork.top_arc_text || '')}" placeholder="Uses Collection when blank"/></label>
          <label><span class="small">Lower arc override (optional)</span><input class="input" id="packagingBottomArcText" value="${esc(artwork.bottom_arc_text || '')}" placeholder="Uses Product name when blank"/></label>
        </div>
      </details>
      <label><span class="small">Print and finishing notes</span><textarea class="input" id="packagingPrintNotes" rows="3">${esc(project.print_notes || '')}</textarea></label>
      <div class="packaging-save-actions"><button class="btn primary" id="savePackagingProject" type="button">Save packaging project</button><button class="btn" id="savePackagingVersion" type="button">Save review version</button></div>
    </section>
    <section class="card packaging-preview-card">
      <div class="section-heading-row"><div><h2 style="margin:0">Live soap ribbon preview</h2><p class="small" id="packagingPreviewSize">Physical dimensions load from the selected template.</p></div><span class="status-pill">Auto font scaling</span></div>
      <div id="packagingSvgPreview" class="packaging-svg-preview"></div>
      <div id="packagingComplianceResults"></div>
      <div class="packaging-export-actions"><button class="btn primary" data-packaging-export="svg">Export SVG</button><button class="btn" data-packaging-export="png">Export PNG</button><button class="btn" data-packaging-export="jpg">Export JPG</button><button class="btn" data-packaging-export="pdf_print">Print / Save PDF</button></div>
    </section>
    <section class="card">
      <h2>Version history</h2>
      <div class="admin-table-wrap"><table><thead><tr><th>Version</th><th>Label</th><th>Review</th><th>Created</th><th>Action</th></tr></thead><tbody>${versions.length ? versions.map((version) => `<tr><td>${Number(version.version_number || 0)}</td><td>${esc(version.version_label || '')}</td><td><select class="input" data-version-status="${Number(version.packaging_project_version_id || 0)}">${['needs_review', 'approved', 'changes_requested', 'blocked'].map((status) => `<option ${version.review_status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></td><td>${esc(version.created_at || '')}</td><td><button class="btn" data-review-version="${Number(version.packaging_project_version_id || 0)}">Save review</button></td></tr>`).join('') : '<tr><td colspan="5">No saved versions yet.</td></tr>'}</tbody></table></div>
      <h3>Export history</h3><div class="packaging-export-history">${exports.length ? exports.map((entry) => `<span>${esc(entry.export_format)} · ${esc(entry.file_name || 'prepared file')} · ${esc(entry.created_at || '')}</span>`).join('') : '<span class="small">No exports recorded yet.</span>'}</div>
    </section>`;
  }

  function applyReferenceExample() {
    if (!confirm('Apply the photographed soap-ribbon example to the current draft? Existing label text and colours in these fields will be replaced.')) return;
    const fields = {
      packagingCollection: 'Coconut milk',
      packagingProductName: 'Sweet Vanilla',
      packagingIdentityEn: 'Luxury Soap',
      packagingIdentityFr: 'Savon de luxe',
      packagingTopArcText: '',
      packagingBottomArcText: '',
      packagingCentreMark: '◇',
      packagingRoseColour: '#9b8068',
      packagingThemeColour: '#f2ead8',
      packagingBorderColour: '#2f2721',
      packagingAccentGold: '#b69a61',
      packagingBadgeShape: 'scalloped',
      packagingRoseStyle: 'botanical_sprigs'
    };
    Object.entries(fields).forEach(([fieldId, value]) => { const node = id(fieldId); if (node) node.value = value; });
    renderPreview();
    message('Photo-reference soap ribbon styling applied. Review every field before saving or printing.', 'success');
  }

  function bindDetail() {
    document.querySelectorAll('.packaging-editor-card input,.packaging-editor-card textarea,.packaging-editor-card select').forEach((node) => {
      node.addEventListener(node.type === 'color' ? 'input' : 'change', renderPreview);
      if (['text', 'search', 'number', 'url'].includes(node.type) || node.tagName === 'TEXTAREA') node.addEventListener('input', renderPreview);
    });
    id('savePackagingProject')?.addEventListener('click', saveProject);
    id('savePackagingVersion')?.addEventListener('click', saveVersion);
    id('duplicatePackagingProject')?.addEventListener('click', duplicateProject);
    id('archivePackagingProject')?.addEventListener('click', archiveProject);
    id('applySoapRibbonReference')?.addEventListener('click', applyReferenceExample);
    document.querySelectorAll('[data-packaging-export]').forEach((button) => button.addEventListener('click', () => exportFile(button.dataset.packagingExport)));
    document.querySelectorAll('[data-review-version]').forEach((button) => button.addEventListener('click', () => reviewVersion(Number(button.dataset.reviewVersion || 0))));
    renderPreview();
  }

  function renderMain() {
    const main = id('packagingStudioMain');
    if (!main) return;
    if (!state.detail?.project) {
      main.innerHTML = '<section class="card packaging-studio-welcome"><h2>Choose or create a packaging project</h2><p>Start with the supplied scalloped soap-ribbon reference or the standard ribbon template, link a product if one exists, and keep all editable content in structured fields.</p></section>';
      return;
    }
    main.innerHTML = detailMarkup();
    bindDetail();
  }

  async function load(projectId = 0) {
    try {
      state.loading = true;
      message('Loading Packaging Studio…');
      const data = await api(null, projectId);
      state.projects = data.projects || [];
      state.templates = data.templates || [];
      state.products = data.products || [];
      state.detail = data.detail || null;
      renderProjects();
      renderMain();
      message('Packaging Studio loaded.', 'success');
    } catch (error) {
      message(error.message, 'error');
      restoreLocal(false);
    } finally { state.loading = false; }
  }

  async function createProject() {
    const productOptions = state.products.slice(0, 150).map((product) => `${product.product_id}: ${product.name}`).join('\n');
    const productId = Number(prompt(`Optional product row ID. Leave blank for packaging not yet linked to a product.\n\nAvailable examples:\n${productOptions.slice(0, 1200)}`) || 0) || null;
    const product = state.products.find((row) => Number(row.product_id) === productId);
    const productName = product?.name || prompt('Packaging product or scent name:');
    if (!productName) return;
    try {
      const preferred = state.templates.find((row) => String(row.template_key || '').includes('scalloped')) || state.templates[0];
      const data = await api({ action: 'create_project', product_id: productId, packaging_template_id: Number(preferred?.packaging_template_id || 0), project_name: `${productName} packaging`, product_name: productName });
      state.projects = data.projects || [];
      state.detail = data.detail;
      renderProjects();
      renderMain();
      message(data.message, 'success');
    } catch (error) { message(error.message, 'error'); }
  }

  async function saveProject() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
      message('Saving packaging project…');
      const data = await api(projectPayload());
      state.projects = data.projects || [];
      state.detail = data.detail;
      renderProjects();
      renderMain();
      message(data.message, 'success');
    } catch (error) { message(`${error.message} Browser draft retained locally.`, 'error'); }
  }

  async function saveVersion() {
    try {
      await saveProject();
      const data = await api({
        action: 'save_version',
        packaging_project_id: Number(id('packagingProjectId')?.value || 0),
        version_label: prompt('Version label:', `Review ${new Date().toLocaleDateString()}`) || '',
        snapshot: projectPayload(),
        svg_markup: svgMarkup()
      });
      state.projects = data.projects || [];
      state.detail = data.detail;
      renderProjects();
      renderMain();
      message(data.message, 'success');
    } catch (error) { message(error.message, 'error'); }
  }

  async function duplicateProject() {
    if (!confirm('Duplicate this packaging project as a new draft?')) return;
    try {
      const data = await api({ action: 'duplicate_project', packaging_project_id: Number(id('packagingProjectId')?.value || 0) });
      state.projects = data.projects || [];
      state.detail = data.detail;
      renderProjects();
      renderMain();
      message(data.message, 'success');
    } catch (error) { message(error.message, 'error'); }
  }

  async function archiveProject() {
    if (!confirm('Archive this packaging project? Versions and export history will remain.')) return;
    try {
      const data = await api({ action: 'archive_project', packaging_project_id: Number(id('packagingProjectId')?.value || 0) });
      state.projects = data.projects || [];
      state.detail = data.detail;
      renderProjects();
      renderMain();
      message(data.message, 'success');
    } catch (error) { message(error.message, 'error'); }
  }

  async function reviewVersion(versionId) {
    try {
      const status = document.querySelector(`[data-version-status="${versionId}"]`)?.value || 'needs_review';
      const data = await api({ action: 'review_version', packaging_project_id: Number(id('packagingProjectId')?.value || 0), packaging_project_version_id: versionId, review_status: status });
      state.projects = data.projects || [];
      state.detail = data.detail;
      renderProjects();
      renderMain();
      message(data.message, 'success');
    } catch (error) { message(error.message, 'error'); }
  }

  function fileBase() {
    return String(id('packagingProjectName')?.value || 'devil-n-dove-packaging').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'packaging';
  }

  function download(blob, name) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { URL.revokeObjectURL(link.href); link.remove(); }, 1000);
  }

  async function recordExport(format, name) {
    try {
      await api({ action: 'record_export', packaging_project_id: Number(id('packagingProjectId')?.value || 0), export_format: format, file_name: name, snapshot: projectPayload() });
    } catch (error) { message(`File prepared, but export history could not be recorded: ${error.message}`, 'error'); }
  }

  async function exportFile(format) {
    const svg = svgMarkup();
    const base = fileBase();
    const template = currentTemplate();
    const widthMm = Number(template.page_width_mm || 279.4);
    const heightMm = Number(template.page_height_mm || 19);
    if (format === 'svg') {
      const name = `${base}.svg`;
      download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), name);
      await recordExport(format, name);
      return;
    }
    if (format === 'pdf_print') {
      const win = open('', '_blank', 'noopener,noreferrer');
      if (!win) { message('Pop-up blocked. Allow pop-ups to use Print / Save PDF.', 'error'); return; }
      win.document.write(`<!doctype html><html><head><title>${esc(base)}</title><style>@page{size:${widthMm}mm ${heightMm}mm;margin:0}html,body{margin:0;padding:0;width:${widthMm}mm;height:${heightMm}mm}svg{display:block;width:${widthMm}mm;height:${heightMm}mm}</style></head><body>${svg}<script>onload=()=>setTimeout(()=>print(),250)<\/script></body></html>`);
      win.document.close();
      await recordExport(format, `${base}.pdf`);
      return;
    }
    const source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const image = new Image();
    image.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1200, Math.round(widthMm / 25.4 * 300));
      canvas.height = Math.max(225, Math.round(heightMm / 25.4 * 300));
      const context = canvas.getContext('2d');
      if (format === 'jpg') { context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(source);
      canvas.toBlob(async (blob) => {
        if (!blob) { message('Raster export failed. Use SVG export instead.', 'error'); return; }
        const extension = format === 'jpg' ? 'jpg' : 'png';
        const name = `${base}.${extension}`;
        download(blob, name);
        await recordExport(format, name);
      }, format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
    };
    image.onerror = () => { URL.revokeObjectURL(source); message('Raster preview could not be rendered. Use SVG export instead.', 'error'); };
    image.src = source;
  }

  function restoreLocal(showMessage = true) {
    try {
      const draft = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!draft) { if (showMessage) message('No browser packaging draft was found.', 'error'); return; }
      if (!state.detail?.project) { if (showMessage) message('Open or create a packaging project before restoring the browser draft.', 'error'); return; }
      Object.entries(draft).forEach(([name, value]) => { const node = id(name); if (node && typeof value !== 'object') node.value = value ?? ''; });
      if (draft.claims && id('packagingClaims')) id('packagingClaims').value = draft.claims.join(', ');
      if (draft.icons && id('packagingIcons')) id('packagingIcons').value = draft.icons.join(', ');
      if (draft.theme) {
        if (id('packagingRoseColour')) id('packagingRoseColour').value = draft.theme.rose_colour || '#9b8068';
        if (id('packagingThemeColour')) id('packagingThemeColour').value = draft.theme.theme_colour || '#f2ead8';
        if (id('packagingBorderColour')) id('packagingBorderColour').value = draft.theme.border_colour || '#2f2721';
        if (id('packagingAccentGold')) id('packagingAccentGold').value = draft.theme.accent_gold || '#b69a61';
      }
      if (draft.artwork) {
        if (id('packagingRoseStyle')) id('packagingRoseStyle').value = draft.artwork.rose_style || 'botanical_sprigs';
        if (id('packagingBadgeShape')) id('packagingBadgeShape').value = draft.artwork.badge_shape || 'scalloped';
        if (id('packagingTopArcText')) id('packagingTopArcText').value = draft.artwork.top_arc_text || '';
        if (id('packagingBottomArcText')) id('packagingBottomArcText').value = draft.artwork.bottom_arc_text || '';
        if (id('packagingCentreMark')) id('packagingCentreMark').value = draft.artwork.centre_mark || '◇';
      }
      renderPreview();
      if (showMessage) message(`Browser draft restored from ${draft.saved_at || 'an earlier session'}. Review and save it to D1.`, 'success');
    } catch { if (showMessage) message('The browser draft could not be restored.', 'error'); }
  }

  function bind() {
    id('newPackagingProject')?.addEventListener('click', createProject);
    id('refreshPackagingStudio')?.addEventListener('click', () => load(Number(state.detail?.project?.packaging_project_id || 0)));
    id('restorePackagingDraft')?.addEventListener('click', () => restoreLocal(true));
    id('packagingProjectSearch')?.addEventListener('input', renderProjects);
    id('packagingProjectList')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-open-packaging]');
      if (button) load(Number(button.dataset.openPackaging || 0));
    });
  }

  document.addEventListener('DOMContentLoaded', () => { bind(); load(); });
})();
