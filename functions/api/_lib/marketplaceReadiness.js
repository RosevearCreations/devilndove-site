// Release 450 marketplace readiness helpers, extended by Release 467 Build 14 image-quality validation.
// No request-time schema mutation and no provider execution.

export const MARKETPLACE_RELEASE = 450;
export const MARKETPLACE_CONTRACT = 'release450-marketplace-readiness';
export const REQUIRED_MARKETPLACE_TABLES = Object.freeze([
  'provider_setup_authorities',
  'marketplace_channels',
  'marketplace_channel_policies',
  'marketplace_listing_profiles',
  'marketplace_listing_validation_snapshots',
  'marketplace_export_image_selections',
  'marketplace_export_history',
  'marketplace_export_row_validation_results',
  'marketplace_export_download_gates',
  'marketplace_download_block_events',
  'marketplace_csv_mappings',
]);

export const ETSY_WHO_MADE = Object.freeze(['i_did', 'someone_else', 'collective']);
export const ETSY_WHEN_MADE = Object.freeze([
  'made_to_order', '2020_2026', '2010_2019', '2007_2009', 'before_2007',
  '2000_2006', '1990s', '1980s', '1970s', '1960s', '1950s', '1940s',
  '1930s', '1920s', '1910s', '1900s', '1800s', '1700s', 'before_1700',
]);
export const PERSONALIZATION_TYPES = Object.freeze(['text_input', 'dropdown', 'unlabeled_upload', 'labeled_upload']);

function text(value) { return String(value ?? '').trim(); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
export function jsonArray(value, limit = 100) {
  if (Array.isArray(value)) return value.slice(0, limit);
  try {
    const parsed = JSON.parse(text(value) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, limit) : [];
  } catch { return []; }
}
export function cleanList(value, itemLimit = 80, countLimit = 40) {
  return jsonArray(value, countLimit).map((item) => text(item).slice(0, itemLimit)).filter(Boolean);
}

export async function marketplaceSchemaStatus(db) {
  if (!db) return { ready: false, missing_tables: [...REQUIRED_MARKETPLACE_TABLES] };
  try {
    const placeholders = REQUIRED_MARKETPLACE_TABLES.map(() => '?').join(',');
    const result = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`)
      .bind(...REQUIRED_MARKETPLACE_TABLES).all();
    const found = new Set(rows(result).map((row) => text(row?.name)));
    const missing = REQUIRED_MARKETPLACE_TABLES.filter((name) => !found.has(name));
    return { ready: missing.length === 0, missing_tables: missing };
  } catch {
    return { ready: false, missing_tables: [...REQUIRED_MARKETPLACE_TABLES] };
  }
}

export async function readChannelPolicy(db, channelKey) {
  const key = text(channelKey).toLowerCase();
  const row = await db.prepare(`
    SELECT p.*, c.enabled AS channel_enabled, c.syndication_mode, c.publication_allowed,
           c.setup_status AS channel_setup_status,
           s.setup_status AS provider_setup_status, s.enabled AS provider_enabled,
           s.required_config_keys_json, s.setup_authority
    FROM marketplace_channel_policies p
    LEFT JOIN marketplace_channels c ON c.channel_key=p.channel_key
    LEFT JOIN provider_setup_authorities s ON s.provider_key=p.provider_key
    WHERE p.channel_key=? LIMIT 1
  `).bind(key).first().catch(() => null);
  if (!row) return null;
  return {
    ...row,
    channel_key: key,
    provider_execution_allowed: Number(row.provider_execution_allowed || 0),
    publication_allowed: Number(row.publication_allowed || 0),
    channel_enabled: Number(row.channel_enabled || 0),
    provider_enabled: Number(row.provider_enabled || 0),
    max_images: Number(row.max_images || 0),
    max_tags: Number(row.max_tags || 0),
    max_variations: Number(row.max_variations || 0),
    max_personalization_questions: Number(row.max_personalization_questions || 0),
  };
}

function validatePersonalization(profile, policy, blockers, warnings) {
  const questions = jsonArray(profile?.personalization_questions_json, 20);
  if (!questions.length) return;
  if (!Number(policy?.supports_personalization || 0)) {
    blockers.push('This channel does not currently support prepared personalization questions.');
    return;
  }
  const max = Number(policy?.max_personalization_questions || 0);
  if (max && questions.length > max) blockers.push(`Personalization supports at most ${max} question(s).`);
  let uploadQuestions = 0;
  questions.forEach((question, index) => {
    const type = text(question?.question_type);
    const label = `Personalization question ${index + 1}`;
    if (!PERSONALIZATION_TYPES.includes(type)) blockers.push(`${label} has an unsupported question type.`);
    const questionText = text(question?.question_text);
    if (!questionText || questionText.length > 45) blockers.push(`${label} question text must be 1–45 characters.`);
    const instructions = text(question?.instructions);
    if (instructions.length > 120) blockers.push(`${label} instructions exceed 120 characters.`);
    if (type === 'text_input') {
      const maxChars = Number(question?.max_allowed_characters || 0);
      if (maxChars < 1 || maxChars > 1024) blockers.push(`${label} text limit must be 1–1024.`);
    }
    if (type === 'unlabeled_upload' || type === 'labeled_upload') {
      uploadQuestions += 1;
      const maxFiles = Number(question?.max_allowed_files || 0);
      if (maxFiles < 1 || maxFiles > 10) blockers.push(`${label} upload count must be 1–10.`);
    }
    if (type === 'dropdown') {
      const options = cleanList(question?.options || [], 20, 30);
      if (!options.length || options.length > 30) blockers.push(`${label} dropdown must contain 1–30 options.`);
    }
  });
  if (uploadQuestions > 1) blockers.push('Etsy personalization supports at most one upload-type question per listing.');
  if (questions.length > 1) warnings.push('Multiple personalization questions require Etsy multiple-question support during provider execution.');
}

function selectedImageRows(selectedImages) {
  return (Array.isArray(selectedImages) ? selectedImages : []).map((image) => {
    if (typeof image === 'string') return { image_url: text(image), metadata_available: false };
    return {
      ...(image || {}),
      image_url: text(image?.image_url || image?.url),
      alt_text: text(image?.alt_text),
      image_role: text(image?.image_role),
      public_use_status: text(image?.public_use_status).toLowerCase(),
      width_px: Number(image?.width_px || 0),
      height_px: Number(image?.height_px || 0),
      merchandising_score: Number(image?.merchandising_score || image?.first_image_score || 0),
      metadata_available: true,
    };
  }).filter((image) => image.image_url);
}

export function validateSelectedImageSet(selectedImages = []) {
  const images = selectedImageRows(selectedImages);
  const blockers = [];
  const warnings = [];
  const urls = images.map((image) => image.image_url.toLowerCase());
  const duplicateCount = Math.max(0, urls.length - new Set(urls).size);
  const metadataImages = images.filter((image) => image.metadata_available);
  const lead = images[0] || null;

  if (!images.length) blockers.push('At least one marketplace image is required.');
  if (duplicateCount > 0) blockers.push(`${duplicateCount} duplicate marketplace image URL(s) are selected.`);

  if (metadataImages.length) {
    const missingAlt = metadataImages.filter((image) => text(image.alt_text).length < 5).length;
    const blockedUse = metadataImages.filter((image) => ['internal_review', 'consent_needed', 'blocked', ''].includes(image.public_use_status)).length;
    if (missingAlt > 0) blockers.push(`${missingAlt} selected marketplace image(s) are missing useful alt text.`);
    if (blockedUse > 0) blockers.push(`${blockedUse} selected marketplace image(s) are not cleared for public use.`);

    if (lead?.metadata_available) {
      const width = Number(lead.width_px || 0);
      const height = Number(lead.height_px || 0);
      const score = Number(lead.merchandising_score || 0);
      const knowsSize = width > 0 && height > 0;
      if (knowsSize && (width < 800 || height < 800)) blockers.push('Selected lead image is under the 800×800 marketplace safety minimum.');
      if (knowsSize && (width < 1200 || height < 1200)) warnings.push('Selected lead image is below the preferred 1200×1200 target.');
      if (knowsSize && height > width * 1.18) warnings.push('Selected lead image is strongly portrait; square or landscape is easier to reuse across marketplace cards.');
      if (score > 0 && score < 70) warnings.push('Selected lead image merchandising score is below 70%.');
    }
  }

  if (images.length > 0 && images.length < 3) warnings.push('Only one or two marketplace images are selected; three or more distinct buyer-useful views are preferred.');

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    blocker_count: blockers.length,
    warning_count: warnings.length,
    selected_count: images.length,
    metadata_checked_count: metadataImages.length,
    duplicate_count: duplicateCount,
  };
}

export function validateListingDraft({ channel, product = {}, profile = {}, selectedImages = [], policy = {} }) {
  const key = text(channel).toLowerCase();
  const blockers = [];
  const warnings = [];
  const title = text(profile.title_override || product.name);
  const description = text(profile.description_override || product.description || product.short_description);
  const tags = cleanList(profile.tags_json, 80, 50);
  const materials = cleanList(profile.materials_json, 80, 50);
  const variations = jsonArray(profile.variation_properties_json, 10);
  const priceCents = Number(product.price_cents || 0);
  const quantity = Number(profile.quantity_override || product.quantity || 1);
  const imageLimit = Number(policy.max_images || 10);
  const imageRows = selectedImageRows(selectedImages);
  const imageReadiness = validateSelectedImageSet(imageRows);

  if (!title) blockers.push('Missing listing title.');
  if (!description) blockers.push('Missing listing description.');
  if (!imageRows.length) blockers.push('At least one public-ready image must be selected.');
  if (imageLimit && imageRows.length > imageLimit) blockers.push(`Selected images exceed the channel limit of ${imageLimit}.`);
  blockers.push(...imageReadiness.blockers.filter((message) => message !== 'At least one marketplace image is required.'));
  warnings.push(...imageReadiness.warnings);

  if (key === 'etsy') {
    if (title.length > 140) blockers.push('Etsy title exceeds the local 140-character safety limit.');
    if (priceCents <= 0) blockers.push('Etsy requires a positive price.');
    if (quantity <= 0) blockers.push('Etsy requires positive quantity.');
    if (!ETSY_WHO_MADE.includes(text(profile.who_made))) blockers.push('Etsy requires who_made.');
    if (!ETSY_WHEN_MADE.includes(text(profile.when_made))) blockers.push('Etsy requires when_made.');
    if (!(Number(profile.taxonomy_id || 0) > 0)) blockers.push('Etsy requires a taxonomy_id.');
    const maxTags = Number(policy.max_tags || 13);
    if (tags.length > maxTags) blockers.push(`Etsy supports at most ${maxTags} prepared tags.`);
    if (!tags.length) warnings.push('No Etsy search tags prepared yet.');
    if (!materials.length) warnings.push('No Etsy materials prepared yet.');
    const listingType = text(profile.listing_type || 'physical');
    if (listingType === 'physical' || listingType === 'both') {
      if (!text(profile.shipping_profile_reference)) blockers.push('Physical Etsy listings require a shipping-profile reference.');
      if (!text(profile.readiness_state_reference)) blockers.push('Physical Etsy listings require a processing/readiness-state reference.');
    }
    const maxVariations = Number(policy.max_variations || 3);
    if (variations.length > maxVariations) blockers.push(`Prepared Etsy variation properties exceed ${maxVariations}.`);
    if (variations.length === 3) warnings.push('Third Etsy variation is provider developer-preview sensitive; keep provider execution disabled until Etsy go-live is confirmed.');
    validatePersonalization(profile, policy, blockers, warnings);
  } else if (key === 'facebook') {
    if (priceCents <= 0) warnings.push('No positive product price is available for Facebook catalog preparation.');
  } else if (key === 'pinterest') {
    if (!text(product.slug)) blockers.push('Pinterest preparation needs a canonical Product link/slug.');
  } else if (key === 'tiktok') {
    warnings.push('TikTok provider posting requires current creator-info/consent/privacy handling; Release 450 prepares media metadata only.');
  }

  if (Number(policy.provider_execution_allowed || 0) !== 0 || Number(policy.publication_allowed || 0) !== 0) {
    blockers.push('Release 450 requires provider execution and publication to remain disabled.');
  }

  return {
    validation_state: blockers.length ? 'blocked' : warnings.length ? 'needs_review' : 'draft_ready',
    blockers,
    warnings,
    blocker_count: blockers.length,
    warning_count: warnings.length,
    image_readiness: imageReadiness,
    payload: { title, description, tags, materials, quantity, price_cents: priceCents, selected_images: imageRows.length },
  };
}
