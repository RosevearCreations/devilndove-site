// File: /functions/api/before-after-gallery.js
// Public read-only endpoint for approved, consented before/after/process proof.

import { getDb, jsonResponse } from './_lib/adminAudit.js';

function json(data, status = 200) {
  return jsonResponse(data, status, {
    'Cache-Control': status === 200 ? 'public, max-age=300, stale-while-revalidate=900' : 'no-store'
  });
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok:true, items:[], source:'fallback', message:'Gallery proof is not configured yet.' });
  try {
    const result = await db.prepare(`SELECT approved_before_after_gallery_item_id,gallery_key,gallery_label,proof_kind,
      route_context,before_image_url,after_image_url,process_image_url,alt_text,story_note,sort_order,updated_at
      FROM approved_before_after_gallery_items
      WHERE approval_status='approved' AND consent_status='approved' AND public_use_status='approved'
      ORDER BY sort_order, updated_at DESC LIMIT 24`).all();
    return json({ ok:true, source:'d1', items:Array.isArray(result?.results)?result.results:[] });
  } catch {
    return json({ ok:true, source:'fallback', items:[], message:'Approved gallery proof will appear after the Build 191 migration and consent review.' });
  }
}
