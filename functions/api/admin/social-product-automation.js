// File: /functions/api/admin/social-product-automation.js
// Build 210 — admin-only settings for review-first product social drafts.

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

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

function connectionStatus(env = {}) {
  const text = (...keys) => {
    for (const key of keys) {
      const value = String(env?.[key] || '').trim();
      if (value) return value;
    }
    return '';
  };
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
      build: 'Build 210',
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
