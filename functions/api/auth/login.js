// File: /functions/api/auth/login.js
// Devil n Dove Cloudflare Pages + D1 login endpoint.
//
// Build 204 auth compatibility safeguard:
// - Auth uses the Pages D1 binding named DB.
// - A legacy bootstrap used members + a different sessions table; this endpoint
//   detects that schema before authenticating and returns a precise safe code.
// - The paired SQL repair preserves member rows and archives legacy sessions.

const AUTH_ROUTE_HEADERS = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Allow": "OPTIONS, GET, HEAD, POST"
};

const REQUIRED_AUTH_COLUMNS = {
  users: ["user_id", "email", "password_hash", "display_name", "role", "is_active", "created_at", "updated_at"],
  sessions: ["session_id", "user_id", "session_token", "token", "expires_at", "created_at"]
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...AUTH_ROUTE_HEADERS, ...headers } });
}

function empty(status = 204, headers = {}) {
  return new Response(null, { status, headers: { ...AUTH_ROUTE_HEADERS, ...headers } });
}

function normalizeText(value) { return String(value || "").trim(); }
function normalizeEmail(value) { return normalizeText(value).toLowerCase(); }
function toHex(buffer) { return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
async function sha256Hex(input) { const encoded = new TextEncoder().encode(String(input || "")); const digest = await crypto.subtle.digest("SHA-256", encoded); return toHex(digest); }
async function verifyStoredPasswordHash(password, storedHash) {
  const normalizedStoredHash = String(storedHash || "").trim();
  if (!normalizedStoredHash) return false;
  if (normalizedStoredHash.startsWith("sha256$")) return (await sha256Hex(password)) === normalizedStoredHash.slice("sha256$".length);
  return false;
}
function makeSessionToken() { return `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`; }

function buildSessionCookie(request, token, maxAgeSeconds = 60 * 60 * 24 * 30) {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  const host = String(url.hostname || "").toLowerCase();
  const parts = [
    `dd_auth_token=${encodeURIComponent(String(token || ""))}`,
    "Path=/",
    `Max-Age=${Number(maxAgeSeconds || 0)}`,
    "HttpOnly",
    "SameSite=Lax"
  ];
  if (secure) parts.push("Secure");
  if (host === "devilndove.com" || host.endsWith(".devilndove.com")) parts.push("Domain=.devilndove.com");
  return parts.join("; ");
}

function compactError(error) {
  const text = String(error?.message || error || "Unknown error").replace(/\s+/g, " ").trim();
  return text.slice(0, 240) || "Unknown error";
}

function missingColumns(columns, requiredColumns) {
  return requiredColumns.filter((column) => !columns.has(column));
}

async function inspectAuthDatabase(env) {
  const db = env?.DB;
  if (!db || typeof db.prepare !== "function") {
    return {
      binding_available: false,
      ping: "not_run",
      ready: false,
      code: "AUTH_DB_BINDING_MISSING",
      hint: "Connect the Production Cloudflare D1 binding named DB to this Pages project."
    };
  }

  try {
    await db.prepare("SELECT 1 AS ok").first();
    const tableResult = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'sessions', 'members')").all();
    const tableNames = new Set((tableResult?.results || []).map((row) => String(row?.name || "").toLowerCase()));

    const columnsFor = async (tableName) => {
      if (!tableNames.has(tableName)) return new Set();
      const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
      return new Set((result?.results || []).map((row) => String(row?.name || "").toLowerCase()));
    };

    const usersColumns = await columnsFor("users");
    const sessionsColumns = await columnsFor("sessions");
    const membersColumns = await columnsFor("members");
    const missingUsersColumns = missingColumns(usersColumns, REQUIRED_AUTH_COLUMNS.users);
    const missingSessionsColumns = missingColumns(sessionsColumns, REQUIRED_AUTH_COLUMNS.sessions);
    const legacySessionsShape = sessionsColumns.has("member_id") || sessionsColumns.has("token_hash");
    const legacyMembersShape = membersColumns.has("member_id") && membersColumns.has("email") && membersColumns.has("password_hash");
    const currentSchemaReady = tableNames.has("users") && tableNames.has("sessions") && !missingUsersColumns.length && !missingSessionsColumns.length;

    if (legacyMembersShape && (!tableNames.has("users") || legacySessionsShape || !currentSchemaReady)) {
      return {
        binding_available: true,
        ping: "ok",
        users_table: tableNames.has("users"),
        sessions_table: tableNames.has("sessions"),
        members_table: true,
        users_missing_columns: missingUsersColumns,
        sessions_missing_columns: missingSessionsColumns,
        ready: false,
        code: "AUTH_LEGACY_SCHEMA",
        hint: "Collect the safe schema diagnostic and Cloudflare Function log before any D1 change. Do not run a legacy migration unless the deployed database and route fault are independently verified."
      };
    }

    if (!currentSchemaReady) {
      return {
        binding_available: true,
        ping: "ok",
        users_table: tableNames.has("users"),
        sessions_table: tableNames.has("sessions"),
        members_table: tableNames.has("members"),
        users_missing_columns: missingUsersColumns,
        sessions_missing_columns: missingSessionsColumns,
        ready: false,
        code: "AUTH_SCHEMA_INCOMPLETE",
        hint: "Run the current Devil n Dove D1 schema or the targeted auth repair after confirming the table layout in database_auth_runtime_diagnostics.sql."
      };
    }

    return {
      binding_available: true,
      ping: "ok",
      users_table: true,
      sessions_table: true,
      members_table: tableNames.has("members"),
      ready: true,
      code: "AUTH_READY",
      hint: "The D1 binding and current authentication schema are reachable."
    };
  } catch (error) {
    return {
      binding_available: true,
      ping: "failed",
      ready: false,
      code: "AUTH_DB_UNREACHABLE",
      hint: "Check the D1 binding, D1 availability, and the Cloudflare Pages Function log.",
      detail: compactError(error)
    };
  }
}

function loginUnavailable(authDatabase) {
  return json({
    ok: false,
    error: "Login is temporarily unavailable.",
    code: authDatabase.code || "AUTH_DB_UNAVAILABLE",
    hint: authDatabase.hint || "Check the D1 DB binding and authentication tables."
  }, 503, { "X-DD-Auth-Code": authDatabase.code || "AUTH_DB_UNAVAILABLE" });
}

async function handleLoginPost(context) {
  const { request, env } = context;
  const authDatabase = await inspectAuthDatabase(env);
  if (!authDatabase.ready) return loginUnavailable(authDatabase);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON body.", code: "AUTH_INVALID_JSON" }, 400); }
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!email) return json({ ok: false, error: "Email is required.", code: "AUTH_EMAIL_REQUIRED" }, 400);
  if (!password) return json({ ok: false, error: "Password is required.", code: "AUTH_PASSWORD_REQUIRED" }, 400);

  const user = await env.DB.prepare("SELECT user_id, email, password_hash, display_name, role, is_active, created_at, updated_at FROM users WHERE LOWER(email)=LOWER(?) LIMIT 1").bind(email).first();
  if (!user) return json({ ok: false, error: "Invalid email or password.", code: "AUTH_INVALID_CREDENTIALS" }, 401);
  if (Number(user.is_active || 0) !== 1) return json({ ok: false, error: "This account is inactive.", code: "AUTH_ACCOUNT_INACTIVE" }, 403);
  if (!(await verifyStoredPasswordHash(password, user.password_hash))) return json({ ok: false, error: "Invalid email or password.", code: "AUTH_INVALID_CREDENTIALS" }, 401);

  const sessionToken = makeSessionToken();
  try {
    await env.DB.prepare("INSERT INTO sessions (user_id, session_token, token, expires_at, created_at) VALUES (?, ?, ?, datetime('now', '+30 days'), CURRENT_TIMESTAMP)").bind(Number(user.user_id || 0), sessionToken, sessionToken).run();
  } catch (error) {
    return json({
      ok: false,
      error: "Login is temporarily unavailable.",
      code: "AUTH_SESSION_CREATE_FAILED",
      hint: "The account was verified, but D1 could not create its login session. Check the sessions table columns and the response detail.",
      detail: compactError(error)
    }, 503, { "X-DD-Auth-Code": "AUTH_SESSION_CREATE_FAILED" });
  }

  let session;
  try {
    session = await env.DB.prepare("SELECT session_id, user_id, session_token, token, expires_at, created_at FROM sessions WHERE user_id = ? ORDER BY session_id DESC LIMIT 1").bind(Number(user.user_id || 0)).first();
  } catch (error) {
    return json({
      ok: false,
      error: "Login is temporarily unavailable.",
      code: "AUTH_SESSION_READ_FAILED",
      hint: "D1 created a session but could not read it back. Check the sessions table columns and the response detail.",
      detail: compactError(error)
    }, 503, { "X-DD-Auth-Code": "AUTH_SESSION_READ_FAILED" });
  }
  await env.DB.prepare("UPDATE users SET last_login_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(Number(user.user_id || 0)).run().catch(() => null);

  return json({
    ok: true,
    message: "Login successful.",
    session_token: session?.session_token || sessionToken,
    token: session?.token || sessionToken,
    session: { session_id: Number(session?.session_id || 0), session_token: session?.session_token || sessionToken, token: session?.token || sessionToken, expires_at: session?.expires_at || null, created_at: session?.created_at || null },
    user: { user_id: Number(user.user_id || 0), email: user.email || email, display_name: user.display_name || "", role: user.role || "member", is_active: Number(user.is_active || 0), created_at: user.created_at || null, updated_at: user.updated_at || null }
  }, 200, { "Set-Cookie": buildSessionCookie(request, session?.session_token || sessionToken) });
}

export async function onRequest(context) {
  const method = String(context?.request?.method || "GET").toUpperCase();
  if (method === "OPTIONS") return empty(204);

  if (method === "GET" || method === "HEAD") {
    const authDatabase = await inspectAuthDatabase(context?.env);
    return json({
      ok: true,
      route: "/api/auth/login",
      status: authDatabase.ready ? "ready" : "needs_configuration",
      accepts: ["POST"],
      functions_active: true,
      has_db_binding: authDatabase.binding_available,
      auth_database: authDatabase,
      note: "Submit login credentials with POST JSON: { email, password }."
    }, 200);
  }

  if (method === "POST") {
    try {
      return await handleLoginPost(context);
    } catch (error) {
      const detail = compactError(error);
      console.error("auth_login_failed", { detail });
      return json({
        ok: false,
        error: "Login is temporarily unavailable.",
        code: "AUTH_LOGIN_UNEXPECTED_FAILURE",
        hint: "Open the failed request Response tab and the Cloudflare Pages Function log. The response detail is safe to share for troubleshooting.",
        detail
      }, 500, { "X-DD-Auth-Code": "AUTH_LOGIN_UNEXPECTED_FAILURE" });
    }
  }

  return json({ ok: false, error: `Method ${method} is not allowed for login.`, allowed_methods: ["OPTIONS", "GET", "HEAD", "POST"] }, 405);
}

export async function onRequestOptions(context) { return onRequest(context); }
export async function onRequestGet(context) { return onRequest(context); }
export async function onRequestHead(context) { return onRequest(context); }
export async function onRequestPost(context) { return onRequest(context); }
