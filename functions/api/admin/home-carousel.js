// Devil n Dove Build 443 — audited Home carousel editor.
import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';

const ACTIONS = new Set(['save','publish','pause','archive','reorder']);
const STATUSES = new Set(['draft','published','paused','archived']);

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function clean(value, max) {
  return normalizeText(value).slice(0, max);
}

function int(value, fallback = 0) {
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}

function safeLocalUrl(value) {
  const url = clean(value, 500);
  return url.startsWith('/') && !url.startsWith('//') && !/[\r\n]/.test(url) ? url : '';
}

function normalizeDate(value) {
  const raw = clean(value, 40);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function tableExists(db, name) {
  return Boolean(await db.prepare(
    "SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name=? LIMIT 1"
  ).bind(name).first().catch(() => null));
}

async function access(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  if (!(await tableExists(db, 'home_carousel_slides'))) {
    return { error: json({
      ok: false,
      code: 'carousel_schema_not_ready',
      error: 'Build 443 carousel migration is not installed. The public Home page is safely using its static hero.',
    }, 409) };
  }
  return { user, db };
}

async function loadSlides(db) {
  const result = await db.prepare(`
    SELECT slide_id,title,body_text,image_url,alt_text,cta_label,cta_url,status,supersedes_slide_id,
           sort_order,starts_at,ends_at,auto_advance_seconds,published_at,created_at,updated_at
    FROM home_carousel_slides
    ORDER BY CASE status WHEN 'published' THEN 0 WHEN 'draft' THEN 1 WHEN 'paused' THEN 2 ELSE 3 END,
             sort_order ASC, slide_id ASC
    LIMIT 200
  `).all();
  return Array.isArray(result?.results) ? result.results : [];
}

function validateSlide(body, { publishing = false } = {}) {
  const title = clean(body.title, 120);
  const bodyText = clean(body.body_text, 320);
  const imageUrl = safeLocalUrl(body.image_url);
  const altText = clean(body.alt_text, 220);
  const ctaLabel = clean(body.cta_label, 80);
  const ctaUrl = safeLocalUrl(body.cta_url);
  const startsAt = normalizeDate(body.starts_at);
  const endsAt = normalizeDate(body.ends_at);
  const sortOrder = Math.max(1, Math.min(999999, int(body.sort_order, 100) || 100));
  const autoAdvanceSeconds = Math.max(5, Math.min(20, int(body.auto_advance_seconds, 7) || 7));
  const errors = [];
  if (!title) errors.push('Title is required.');
  if (!imageUrl) errors.push('Image must be a same-site path beginning with /.');
  if (!altText) errors.push('Descriptive alt text is required.');
  if (Boolean(ctaLabel) !== Boolean(ctaUrl)) errors.push('CTA label and same-site CTA URL must be provided together.');
  if (body.cta_url && !ctaUrl) errors.push('CTA URL must be a same-site path beginning with /.');
  if ((body.starts_at && !startsAt) || (body.ends_at && !endsAt)) errors.push('Schedule dates must be valid.');
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) errors.push('End date must be after start date.');
  if (publishing && (!title || !imageUrl || !altText)) errors.push('A complete title, approved image and alt text are required to publish.');
  return { errors, value: { title, bodyText, imageUrl, altText, ctaLabel, ctaUrl, startsAt, endsAt, sortOrder, autoAdvanceSeconds } };
}

async function recordEvent(db, slideId, actionType, userId) {
  await db.prepare(`
    INSERT INTO home_carousel_events(slide_id,action_type,actor_user_id,snapshot_json,created_at)
    SELECT slide_id,?,?,json_object(
      'slide_id',slide_id,'title',title,'body_text',COALESCE(body_text,''),
      'image_url',image_url,'alt_text',alt_text,'cta_label',COALESCE(cta_label,''),
      'cta_url',COALESCE(cta_url,''),'status',status,'sort_order',sort_order,
      'starts_at',starts_at,'ends_at',ends_at,'auto_advance_seconds',auto_advance_seconds,
      'published_at',published_at,'supersedes_slide_id',supersedes_slide_id,'updated_at',updated_at
    ),CURRENT_TIMESTAMP
    FROM home_carousel_slides WHERE slide_id=?
  `).bind(actionType, userId, slideId).run();
}

export async function onRequestGet(context) {
  const resolved = await access(context);
  if (resolved.error) return resolved.error;
  try {
    return json({ ok: true, build: 443, schema_ready: true, slides: await loadSlides(resolved.db) });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'home_carousel', incident_code: 'admin_read_failed',
      message: 'Home carousel editor could not load.', related_user_id: resolved.user.user_id,
    });
    return json({ ok: false, error: 'Could not load Home carousel slides.' }, 500);
  }
}

export async function onRequestPost(context) {
  const resolved = await access(context);
  if (resolved.error) return resolved.error;
  let body = {};
  try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Valid JSON is required.' }, 400); }
  const action = clean(body.action, 20).toLowerCase();
  if (!ACTIONS.has(action)) return json({ ok: false, error: 'Unsupported carousel action.' }, 400);

  try {
    if (action === 'reorder') {
      const submitted = Array.isArray(body.items) ? body.items.slice(0, 200) : [];
      const byId = new Map();
      for (const item of submitted) {
        const slideId = Math.max(0, int(item.slide_id));
        if (slideId) byId.set(slideId, { slide_id: slideId, sort_order: Math.max(1, Math.min(999999, int(item.sort_order, 100) || 100)) });
      }
      const items = [...byId.values()];
      if (!items.length) return json({ ok: false, error: 'At least one saved slide is required to reorder.' }, 400);
      const found = await resolved.db.prepare(
        `SELECT slide_id FROM home_carousel_slides WHERE slide_id IN (${items.map(() => '?').join(',')})`
      ).bind(...items.map((item) => item.slide_id)).all();
      if ((found?.results || []).length !== items.length) {
        return json({ ok: false, error: 'Carousel order changed concurrently. Reload before saving order.' }, 409);
      }
      const statements = [];
      for (const item of items) {
        statements.push(resolved.db.prepare(
          'UPDATE home_carousel_slides SET sort_order=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE slide_id=?'
        ).bind(item.sort_order, resolved.user.user_id, item.slide_id));
      }
      if (statements.length) await resolved.db.batch(statements);
      for (const item of items) {
        await recordEvent(resolved.db, item.slide_id, 'reordered', resolved.user.user_id);
      }
      await auditAdminAction(context.env, context.request, resolved.user, {
        action_type: 'home_carousel_reordered', target_type: 'home_carousel', details: { item_count: statements.length },
      });
      return json({ ok: true, message: 'Carousel order saved.', slides: await loadSlides(resolved.db) });
    }

    const slideId = Math.max(0, int(body.slide_id));
    if (['pause','archive'].includes(action)) {
      if (!slideId) return json({ ok: false, error: 'Slide ID is required.' }, 400);
      const existing = await resolved.db.prepare('SELECT slide_id FROM home_carousel_slides WHERE slide_id=? LIMIT 1').bind(slideId).first();
      if (!existing) return json({ ok: false, error: 'Carousel slide was not found.' }, 404);
      const status = action === 'pause' ? 'paused' : 'archived';
      await resolved.db.prepare(
        'UPDATE home_carousel_slides SET status=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE slide_id=?'
      ).bind(status, resolved.user.user_id, slideId).run();
      await recordEvent(resolved.db, slideId, action === 'pause' ? 'paused' : 'archived', resolved.user.user_id);
      await auditAdminAction(context.env, context.request, resolved.user, {
        action_type: `home_carousel_${action}`, target_type: 'home_carousel_slide', target_id: slideId,
      });
      return json({ ok: true, message: `Slide ${status}.`, slides: await loadSlides(resolved.db) });
    }

    const validated = validateSlide(body, { publishing: action === 'publish' });
    if (validated.errors.length) return json({ ok: false, error: validated.errors.join(' ') }, 400);
    const v = validated.value;
    const requestedStatus = clean(body.status, 20).toLowerCase();
    const status = action === 'publish' ? 'published' : (STATUSES.has(requestedStatus) && requestedStatus !== 'published' ? requestedStatus : 'draft');
    const existing = slideId ? await resolved.db.prepare(
      'SELECT slide_id,status,supersedes_slide_id FROM home_carousel_slides WHERE slide_id=? LIMIT 1'
    ).bind(slideId).first() : null;
    if (slideId && !existing) return json({ ok: false, error: 'Carousel slide was not found.' }, 404);
    const createDraftFromPublished = action === 'save' && existing?.status === 'published';
    if (createDraftFromPublished) {
      const openDraft = await resolved.db.prepare(
        "SELECT slide_id FROM home_carousel_slides WHERE supersedes_slide_id=? AND status IN ('draft','paused') LIMIT 1"
      ).bind(slideId).first();
      if (openDraft) return json({ ok: false, error: 'A draft replacement already exists for this published slide. Edit that draft before creating another.' }, 409);
    }
    let targetId = createDraftFromPublished ? 0 : slideId;
    const supersedesId = createDraftFromPublished ? slideId : null;

    if (targetId) {
      await resolved.db.prepare(`
        UPDATE home_carousel_slides
        SET title=?,body_text=?,image_url=?,alt_text=?,cta_label=?,cta_url=?,status=?,sort_order=?,
            starts_at=?,ends_at=?,auto_advance_seconds=?,updated_by=?,
            published_by=CASE WHEN ?='published' THEN ? ELSE published_by END,
            published_at=CASE WHEN ?='published' THEN CURRENT_TIMESTAMP ELSE published_at END,
            updated_at=CURRENT_TIMESTAMP
        WHERE slide_id=?
      `).bind(v.title,v.bodyText||null,v.imageUrl,v.altText,v.ctaLabel||null,v.ctaUrl||null,status,v.sortOrder,
        v.startsAt,v.endsAt,v.autoAdvanceSeconds,resolved.user.user_id,status,resolved.user.user_id,status,targetId).run();
    } else {
      const row = await resolved.db.prepare(`
        INSERT INTO home_carousel_slides(
          title,body_text,image_url,alt_text,cta_label,cta_url,status,sort_order,starts_at,ends_at,
          auto_advance_seconds,supersedes_slide_id,created_by,updated_by,published_by,published_at,created_at,updated_at
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CASE WHEN ?='published' THEN CURRENT_TIMESTAMP ELSE NULL END,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        RETURNING slide_id
      `).bind(v.title,v.bodyText||null,v.imageUrl,v.altText,v.ctaLabel||null,v.ctaUrl||null,status,v.sortOrder,
        v.startsAt,v.endsAt,v.autoAdvanceSeconds,supersedesId,resolved.user.user_id,resolved.user.user_id,
        status==='published'?resolved.user.user_id:null,status).first();
      targetId = Number(row?.slide_id || 0);
      if (!targetId) throw new Error('Carousel slide insert returned no identifier.');
    }

    if (status === 'published' && existing?.supersedes_slide_id) {
      const priorId = Number(existing.supersedes_slide_id || 0);
      await resolved.db.prepare(
        "UPDATE home_carousel_slides SET status='archived',updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE slide_id=? AND status='published'"
      ).bind(resolved.user.user_id, priorId).run();
      await recordEvent(resolved.db, priorId, 'archived', resolved.user.user_id);
    }

    const event = targetId === slideId && slideId ? (status === 'published' ? 'published' : 'saved') : (status === 'published' ? 'published' : 'created');
    await recordEvent(resolved.db, targetId, event, resolved.user.user_id);
    await auditAdminAction(context.env, context.request, resolved.user, {
      action_type: `home_carousel_${event}`, target_type: 'home_carousel_slide', target_id: targetId,
      details: { status, sort_order: v.sortOrder, scheduled: Boolean(v.startsAt || v.endsAt) },
    });
    return json({ ok: true, message: status === 'published' ? 'Slide published.' : 'Draft saved.', slides: await loadSlides(resolved.db) });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'home_carousel', incident_code: 'admin_write_failed', severity: 'error',
      message: 'Home carousel action failed without claiming success.', related_user_id: resolved.user.user_id,
      details: { action },
    });
    return json({ ok: false, error: 'Carousel change was not completed. The last saved state is unchanged.' }, 500);
  }
}
