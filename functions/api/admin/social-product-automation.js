// File: /functions/api/admin/social-product-automation.js
// Build 227 — review-first product social drafts plus safe Meta credential tests.

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

function graphVersion(env = {}) {
  const configured = envText(env, 'META_GRAPH_API_VERSION');
  return /^v\d{1,3}\.\d{1,3}$/.test(configured) ? configured : 'v26.0';
}

async function metaGet(env, path, token, params = {}) {
  const url = new URL(`https://graph.facebook.com/${graphVersion(env)}/${String(path || '').replace(/^\/+/, '')}`);
  for (const [key, value] of Object.entries(params)) if (value !== '' && value != null) url.searchParams.set(key, String(value));
  url.searchParams.set('access_token', token);
  try {
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok && !data?.error, status: response.status, data, error_code: data?.error?.code || null, error_type: String(data?.error?.type || '').slice(0, 120), error_message: String(data?.error?.message || '').slice(0, 240) };
  } catch (error) {
    return { ok: false, status: 0, data: {}, error_code: null, error_type: 'network_error', error_message: String(error?.name === 'TimeoutError' ? 'Meta request timed out after 10 seconds.' : 'Meta request could not be completed.').slice(0, 240) };
  }
}

async function testMetaConnections(env = {}) {
  const pageId = envText(env, 'FACEBOOK_PAGE_ID', 'META_PAGE_ID');
  const pageToken = envText(env, 'FACEBOOK_PAGE_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN');
  const configuredInstagramId = envText(env, 'INSTAGRAM_USER_ID', 'IG_USER_ID', 'INSTAGRAM_BUSINESS_ACCOUNT_ID');
  const instagramToken = envText(env, 'INSTAGRAM_ACCESS_TOKEN') || pageToken;
  const testedAt = new Date().toISOString();
  const result = { tested_at: testedAt, graph_api_version: graphVersion(env), secrets_exposed: false, facebook: { configured: Boolean(pageId && pageToken), ok: false }, instagram: { configured: Boolean(configuredInstagramId && instagramToken), ok: false }, token_debug: { configured: false, ok: false } };
  let pageResult = null;
  if (pageId && pageToken) {
    pageResult = await metaGet(env, pageId, pageToken, { fields: 'id,name,instagram_business_account{id,username}' });
    const returnedId = String(pageResult.data?.id || '');
    result.facebook = { configured: true, ok: pageResult.ok && returnedId === pageId, http_status: pageResult.status, id_match: returnedId === pageId, page_id: returnedId || null, page_name: String(pageResult.data?.name || '').slice(0, 180) || null, linked_instagram_id: String(pageResult.data?.instagram_business_account?.id || '') || null, error_code: pageResult.error_code, error_type: pageResult.error_type, error_message: pageResult.error_message || null };
  } else result.facebook.missing_variables = ['FACEBOOK_PAGE_ID or META_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN or META_PAGE_ACCESS_TOKEN'].filter((_, index) => index === 0 ? !pageId : !pageToken);
  const instagramId = configuredInstagramId || String(pageResult?.data?.instagram_business_account?.id || '');
  result.instagram.configured = Boolean(instagramId && instagramToken);
  if (instagramId && instagramToken) {
    const igResult = await metaGet(env, instagramId, instagramToken, { fields: 'id,username,account_type' });
    const returnedId = String(igResult.data?.id || '');
    result.instagram = { configured: true, ok: igResult.ok && returnedId === instagramId, http_status: igResult.status, id_match: returnedId === instagramId, instagram_user_id: returnedId || null, username: String(igResult.data?.username || '').slice(0, 180) || null, account_type: String(igResult.data?.account_type || '').slice(0, 80) || null, derived_from_page: !configuredInstagramId, error_code: igResult.error_code, error_type: igResult.error_type, error_message: igResult.error_message || null };
  } else result.instagram.missing_variables = ['INSTAGRAM_USER_ID / IG_USER_ID / INSTAGRAM_BUSINESS_ACCOUNT_ID (or a Page-linked professional account)', 'INSTAGRAM_ACCESS_TOKEN or Page token'].filter((_, index) => index === 0 ? !instagramId : !instagramToken);
  const appId = envText(env, 'META_APP_ID', 'FACEBOOK_APP_ID'); const appSecret = envText(env, 'META_APP_SECRET', 'FACEBOOK_APP_SECRET');
  if (appId && appSecret && pageToken) {
    const debug = await metaGet(env, 'debug_token', `${appId}|${appSecret}`, { input_token: pageToken }); const data = debug.data?.data || {};
    result.token_debug = { configured: true, ok: debug.ok && data.is_valid === true, http_status: debug.status, is_valid: data.is_valid === true, app_id_match: String(data.app_id || '') === appId, token_type: String(data.type || '').slice(0, 80) || null, expires_at: Number(data.expires_at || 0) || null, data_access_expires_at: Number(data.data_access_expires_at || 0) || null, scopes: Array.isArray(data.scopes) ? data.scopes.map((value) => String(value).slice(0, 120)).slice(0, 100) : [], error_code: debug.error_code, error_type: debug.error_type, error_message: debug.error_message || null };
  }
  result.overall_ok = result.facebook.ok && result.instagram.ok && (!result.token_debug.configured || result.token_debug.ok);
  return result;
}

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

function connectionStatus(env = {}) {
  const text = (...keys) => envText(env, ...keys);
  const facebook = Boolean(text('FACEBOOK_PAGE_ID', 'META_PAGE_ID') && text('FACEBOOK_PAGE_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN'));
  const instagram = Boolean(text('INSTAGRAM_USER_ID', 'IG_USER_ID', 'INSTAGRAM_BUSINESS_ACCOUNT_ID') && text('INSTAGRAM_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN', 'FACEBOOK_PAGE_ACCESS_TOKEN'));
  const x = Boolean(text('X_USER_ACCESS_TOKEN', 'TWITTER_USER_ACCESS_TOKEN'));
  const pinterest = Boolean(text('PINTEREST_ACCESS_TOKEN') && text('PINTEREST_BOARD_ID'));
  const tiktok = Boolean(text('TIKTOK_ACCESS_TOKEN'));
  const youtube = Boolean(text('YOUTUBE_ACCESS_TOKEN'));

  return {
    facebook: { connected: facebook, mode: facebook ? 'api_publish_ready' : 'setup_required', secret_names: ['FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN'], capability: 'Page photo/link posts through the existing review-first queue.' },
    instagram: { connected: instagram, mode: instagram ? 'api_publish_ready' : 'setup_required', secret_names: ['INSTAGRAM_USER_ID', 'INSTAGRAM_ACCESS_TOKEN'], capability: 'Professional-account single-image publishing through the existing review-first queue.' },
    pinterest: { connected: pinterest, mode: pinterest ? 'api_publish_ready' : 'setup_required', secret_names: ['PINTEREST_ACCESS_TOKEN', 'PINTEREST_BOARD_ID'], capability: 'Image Pins through the existing review-first queue.' },
    x: { connected: x, mode: x ? 'api_publish_ready' : 'setup_required', secret_names: ['X_USER_ACCESS_TOKEN'], capability: 'Text/link posts through the existing review-first queue.' },
    tiktok: { connected: tiktok, mode: tiktok ? 'credentials_present_manual_review' : 'setup_required', secret_names: ['TIKTOK_ACCESS_TOKEN'], capability: 'Preparation/manual review only in this build; Direct Post needs a dedicated OAuth, upload, creator-info, and approval flow.' },
    youtube: { connected: youtube, mode: youtube ? 'credentials_present_manual_review' : 'setup_required', secret_names: ['YOUTUBE_ACCESS_TOKEN'], capability: 'Preparation/manual review only in this build; resumable video upload requires the dedicated Google OAuth upload flow.' }
  };
}

export async function onRequestGet(context) {
  const granted = await access(context);
  if (granted.error) return granted.error;
  try {
    const settings = await getProductSocialAutomationSettings(granted.db);
    return json({
      ok: true,
      build: 'Build 227',
      settings,
      connection_status: connectionStatus(context.env),
      policy: {
        automatic_publish_supported: false,
        automatic_queue_supported: true,
        automatic_queue_rule: 'Only creates a draft after a product is eligible. A human must review media/privacy/caption and explicitly approve/publish it from the Social Publishing workspace.'
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
    try {
      const test = await testMetaConnections(context.env);
      await auditAdminAction(context.env, context.request, granted.adminUser, { action_type: 'social_meta_connections_tested', target_type: 'social_connection', target_key: 'meta_facebook_instagram', details: { overall_ok: test.overall_ok, facebook_ok: test.facebook.ok, instagram_ok: test.instagram.ok, token_debug_ok: test.token_debug.configured ? test.token_debug.ok : null, graph_api_version: test.graph_api_version, secrets_exposed: false } }).catch(() => null);
      return json({ ok: true, message: test.overall_ok ? 'Facebook Page and Instagram professional-account credentials passed safe read-only tests.' : 'Meta test completed. Review the failed or incomplete checks below; no post was published.', meta_test: test, connection_status: connectionStatus(context.env) });
    } catch (error) {
      await captureRuntimeIncident(context.env, context.request, { incident_scope: 'social_product_automation', incident_code: 'social_meta_connection_test_failed', severity: 'warning', message: 'Meta connection test could not complete.', related_user_id: granted.adminUser.user_id, details: { error: String(error?.message || error || 'Unknown Meta test failure') } }).catch(() => null);
      return json({ ok: false, error: 'Meta connection test could not complete. Secret values were not returned.' }, 502);
    }
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
      message: settings.auto_queue_enabled
        ? 'Automatic product social drafts are enabled. Eligible product approvals will create one review-first draft; nothing will auto-publish.'
        : 'Automatic product social drafts are disabled.',
      settings,
      connection_status: connectionStatus(context.env)
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
