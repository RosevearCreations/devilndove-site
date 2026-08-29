// File: /functions/api/admin/social-product-automation.js
// Release 460 — review-first product social drafts with provider execution hard-closed.
// Legacy credential presence may be diagnosed safely, but this owner route never contacts a provider.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import {
  getProductSocialAutomationSettings,
  updateProductSocialAutomationSettings
} from '../_lib/productSocialAutomation.js';

function json(data, status = 200) {
  return jsonResponse(data, status, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
}

function envText(env = {}, ...keys) {
  for (const key of keys) {
    const value = String(env?.[key] || '').trim();
    if (value) return value;
  }
  return '';
}

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

function closedConnection(provider, legacyCredentialsPresent, secretNames, capability) {
  return {
    connected: false,
    mode: 'provider_execution_closed',
    provider_execution: false,
    provider_publication: false,
    provider_contacted: false,
    legacy_credentials_present: Boolean(legacyCredentialsPresent),
    secret_names: secretNames,
    capability
  };
}

function connectionStatus(env = {}) {
  const text = (...keys) => envText(env, ...keys);
  const facebookLegacy = Boolean(text('FACEBOOK_PAGE_ID', 'META_PAGE_ID') && text('FACEBOOK_PAGE_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN'));
  const instagramLegacy = Boolean(text('INSTAGRAM_USER_ID', 'IG_USER_ID', 'INSTAGRAM_BUSINESS_ACCOUNT_ID') && text('INSTAGRAM_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN', 'FACEBOOK_PAGE_ACCESS_TOKEN'));
  const xLegacy = Boolean(text('X_USER_ACCESS_TOKEN', 'TWITTER_USER_ACCESS_TOKEN'));
  const pinterestLegacy = Boolean(text('PINTEREST_ACCESS_TOKEN') && text('PINTEREST_BOARD_ID'));
  const tiktokLegacy = Boolean(text('TIKTOK_ACCESS_TOKEN'));
  const youtubeLegacy = Boolean(text('YOUTUBE_ACCESS_TOKEN'));

  return {
    facebook: closedConnection('facebook', facebookLegacy, ['FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN'], 'Local draft preparation only. Release 460 provider execution is closed; use the secure OAuth readiness and local publication-plan contracts.'),
    instagram: closedConnection('instagram', instagramLegacy, ['INSTAGRAM_USER_ID', 'INSTAGRAM_ACCESS_TOKEN'], 'Local draft preparation only. Release 460 provider execution is closed; Instagram publication permission is not yet claimed ready.'),
    pinterest: closedConnection('pinterest', pinterestLegacy, ['PINTEREST_ACCESS_TOKEN', 'PINTEREST_BOARD_ID'], 'Local draft preparation only. Release 460 provider execution is closed.'),
    x: closedConnection('x', xLegacy, ['X_USER_ACCESS_TOKEN'], 'Local draft preparation only. Release 460 provider execution is closed.'),
    tiktok: closedConnection('tiktok', tiktokLegacy, ['TIKTOK_ACCESS_TOKEN'], 'Local draft preparation only. Release 460 provider execution is closed.'),
    youtube: closedConnection('youtube', youtubeLegacy, ['YOUTUBE_ACCESS_TOKEN'], 'Local draft preparation only. Release 460 provider execution is closed.')
  };
}

export async function onRequestGet(context) {
  const granted = await access(context);
  if (granted.error) return granted.error;
  try {
    const settings = await getProductSocialAutomationSettings(granted.db);
    return json({
      ok: true,
      release: 460,
      settings,
      connection_status: connectionStatus(context.env),
      policy: {
        automatic_publish_supported: false,
        provider_execution: false,
        provider_publication: false,
        provider_live_authorization: false,
        automatic_queue_supported: true,
        automatic_queue_rule: 'Only creates a draft after a product is eligible. A human may review local media/privacy/caption preparation, but Release 460 does not execute provider publication.'
      }
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'social_product_automation',
      incident_code: 'social_product_automation_get_failed',
      severity: 'warning',
      message: error?.message || 'Could not load product social automation settings.',
      related_user_id: granted.adminUser.user_id,
      details: { error: String(error?.stack || error?.message || error) }
    }).catch(() => null);
    return json({ ok: false, error: 'Could not load product social automation settings.' }, 500);
  }
}

export async function onRequestPost(context) {
  const granted = await access(context);
  if (granted.error) return granted.error;
  let body = {};
  try { body = await context.request.json(); } catch {}
  const action = String(body.action || 'save').trim().toLowerCase();

  if (action === 'test_meta_connections') {
    await auditAdminAction(context.env, context.request, granted.adminUser, {
      action_type: 'social_meta_connection_probe_blocked',
      target_type: 'social_connection',
      target_key: 'meta_facebook_instagram',
      details: {
        release: 460,
        provider_execution: false,
        provider_publication: false,
        provider_contacted: false,
        validation_endpoint: '/api/admin/provider-publication-plan'
      }
    }).catch(() => null);
    return json({
      ok: false,
      release: 460,
      code: 'provider_execution_closed',
      error: 'Live Meta connection probing is closed for Release 460. Use secure OAuth readiness diagnostics and mock-proven provider contracts instead.',
      validation_endpoint: '/api/admin/provider-publication-plan',
      provider_execution: false,
      provider_publication: false,
      provider_live_authorization: false,
      provider_contacted: false,
      production_mutation: false,
      connection_status: connectionStatus(context.env)
    }, 409);
  }
  if (action !== 'save') return json({ ok: false, error: 'Unsupported social product automation action.' }, 400);

  try {
    const settings = await updateProductSocialAutomationSettings(granted.db, body, granted.adminUser.user_id);
    await auditAdminAction(context.env, context.request, granted.adminUser, {
      action_type: 'social_product_automation_save',
      target_type: 'social_product_automation_settings',
      target_id: 1,
      target_key: 'product_social_automation',
      details: {
        auto_queue_enabled: settings.auto_queue_enabled,
        auto_queue_on_review_status: settings.auto_queue_on_review_status,
        default_platforms: settings.default_platforms,
        require_active_product: settings.require_active_product,
        require_featured_image: settings.require_featured_image
      }
    }).catch(() => null);
    return json({
      ok: true,
      release: 460,
      message: settings.auto_queue_enabled
        ? 'Automatic product social drafts are enabled. Eligible product approvals will create one review-first draft; provider execution remains closed.'
        : 'Automatic product social drafts are disabled.',
      settings,
      connection_status: connectionStatus(context.env),
      provider_execution: false,
      provider_publication: false
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'social_product_automation',
      incident_code: 'social_product_automation_save_failed',
      severity: 'warning',
      message: error?.message || 'Could not save product social automation settings.',
      related_user_id: granted.adminUser.user_id,
      details: { error: String(error?.stack || error?.message || error) }
    }).catch(() => null);
    return json({ ok: false, error: error?.message || 'Could not save social automation settings.' }, 400);
  }
}
