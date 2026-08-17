// Build 212 — Meta data-deletion callback readiness endpoint.
// A signed_request must be validated with META_APP_SECRET before an automated
// deletion confirmation can be issued. Until then, direct users to the public instructions.
function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export async function onRequestGet(context) {
  return json({ ok: true, endpoint: new URL(context.request.url).pathname, status: 'ready_for_configuration', instructions_url: 'https://devilndove.com/data-deletion/', automated_signed_request_processing: false, note: 'Build 212 does not claim to process Meta signed deletion requests until signature validation and deletion-job tracking are enabled.' });
}
export async function onRequestPost(context) {
  let form;
  try { form = await context.request.formData(); } catch { return json({ ok: false, error: 'Expected form data.' }, 400); }
  if (!form.get('signed_request')) return json({ ok: false, error: 'signed_request is required.' }, 400);
  if (!String(context.env?.META_APP_SECRET || '').trim()) return json({ ok: false, error: 'Automated Meta data deletion is not configured. Use the public deletion instructions.', url: 'https://devilndove.com/data-deletion/' }, 503);
  return json({ ok: false, error: 'Signed-request validation and tracked deletion execution are not enabled in Build 212. No unverified deletion was performed.', url: 'https://devilndove.com/data-deletion/' }, 501);
}
