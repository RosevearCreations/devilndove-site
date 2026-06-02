async function saveMarketplacePreset(db, adminUser, payload = {}) {
  await seedMarketplacePresets(db);
  const channel = clean(payload.channel || '', 40).toLowerCase();

  if (!['etsy', 'facebook', 'pinterest', 'manual'].includes(channel)) {
    throw new Error('Choose a supported marketplace channel.');
  }

  let tags = [];

  try {
    const parsed = JSON.parse(clean(payload.default_tags_json || '[]', 1200) || '[]');
    tags = Array.isArray(parsed)
      ? parsed.map((item) => clean(item, 60)).filter(Boolean).slice(0, 30)
      : [];
  } catch {
    tags = clean(payload.default_tags_json || '', 1200)
      .split(/[\r\n,;|]+/)
      .map((item) => clean(item, 60))
      .filter(Boolean)
      .slice(0, 30);
  }

  await db.prepare(`
    INSERT INTO marketplace_channel_presets (
      channel,
      category_label,
      shipping_profile_label,
      default_tags_json,
      default_fields_json,
      preset_status,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, '{}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(channel) DO UPDATE SET
      category_label = excluded.category_label,
      shipping_profile_label = excluded.shipping_profile_label,
      default_tags_json = excluded.default_tags_json,
      preset_status = 'active',
      updated_at = CURRENT_TIMESTAMP
  `)
    .bind(
      channel,
      clean(payload.category_label || '', 120),
      clean(payload.shipping_profile_label || '', 120),
      JSON.stringify(tags)
    )
    .run();

  return {
    ok: true,
    message: `Marketplace preset saved for ${channel}.`,
    channel,
    updated_by: adminUser?.email || ''
  };
}
