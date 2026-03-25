function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const requestType = normalizeText(body.request_type);
  const contactEmail = normalizeEmail(body.contact_email);
  const possibleEmail = normalizeEmail(body.possible_email);
  const displayName = normalizeText(body.display_name);
  const note = normalizeText(body.note);

  if (!['forgot_password', 'forgot_email'].includes(requestType)) {
    return json({ ok: false, error: 'Invalid request type.' }, 400);
  }
  if (!contactEmail) {
    return json({ ok: false, error: 'A contact email is required.' }, 400);
  }

  await env.DB.prepare(`
    INSERT INTO auth_recovery_requests (
      request_type,
      contact_email,
      possible_email,
      display_name,
      note,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(requestType, contactEmail, possibleEmail || null, displayName || null, note || null).run();

  return json({
    ok: true,
    message: 'Your request has been recorded. For privacy, we do not confirm whether a matching account exists.'
  });
}
