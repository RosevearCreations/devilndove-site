#!/usr/bin/env node
// Build 438 pure unit proof: module session verification interruptions are retryable 503s,
// while absent/expired sessions remain ordinary unauthenticated results.

import {
  APP_MODULE_SESSION_UNAVAILABLE_CODE,
  appModuleSessionUnavailableResponse,
  isAppModuleSessionVerificationUnavailable,
  resolveAppModuleRequestUser,
} from '../functions/api/_lib/appModuleSessionGuard.js';

let checks = 0;
const failures = [];

function check(condition, label) {
  checks += 1;
  console.log(`${String(checks).padStart(2, '0')}. ${condition ? 'PASS' : 'FAIL'} — ${label}`);
  if (!condition) failures.push(label);
}

function request(token = '') {
  return new Request('https://example.test/admin/', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function dbReturning(value) {
  return {
    prepare() {
      return {
        bind() {
          return {
            async first() {
              return value;
            },
          };
        },
      };
    },
  };
}

function dbThrowing() {
  return {
    prepare() {
      return {
        bind() {
          return {
            async first() {
              throw new Error('synthetic D1 interruption');
            },
          };
        },
      };
    },
  };
}

console.log('BUILD 438 MODULE SESSION RESILIENCE TEST');
console.log('Cloudflare/D1/provider access: NONE');
console.log('Production mutation capability: NONE');
console.log();

const anonymous = await resolveAppModuleRequestUser(request(), {});
check(anonymous === null, 'request with no credential remains anonymously accessible without requiring D1');

let missingDbError = null;
try {
  await resolveAppModuleRequestUser(request('valid-looking-token'), {});
} catch (error) {
  missingDbError = error;
}
check(
  isAppModuleSessionVerificationUnavailable(missingDbError)
    && missingDbError?.code === APP_MODULE_SESSION_UNAVAILABLE_CODE,
  'credential plus missing D1 binding is classified as session verification unavailable, not invalid login',
);

let interruptedError = null;
try {
  await resolveAppModuleRequestUser(request('valid-looking-token'), { DB: dbThrowing() });
} catch (error) {
  interruptedError = error;
}
check(
  isAppModuleSessionVerificationUnavailable(interruptedError)
    && interruptedError?.code === APP_MODULE_SESSION_UNAVAILABLE_CODE,
  'D1 session-query interruption is classified as retryable verification failure',
);

const expired = await resolveAppModuleRequestUser(request('expired-token'), { DB: dbReturning(null) });
check(expired === null, 'clean D1 no-session result remains ordinary unauthenticated/expired-session state');

const admin = await resolveAppModuleRequestUser(request('good-token'), {
  DB: dbReturning({
    session_id: 44,
    expires_at: '2099-01-01 00:00:00',
    user_id: 7,
    email: 'admin@example.test',
    display_name: 'Admin',
    role: 'admin',
    is_active: 1,
  }),
});
check(admin?.user_id === 7 && admin?.role === 'admin' && admin?.session_id === 44, 'valid session resolves the current user exactly once');

const unavailable = appModuleSessionUnavailableResponse({ api: true });
const payload = await unavailable.json();
check(
  unavailable.status === 503
    && unavailable.headers.get('Retry-After') === '5'
    && payload?.code === APP_MODULE_SESSION_UNAVAILABLE_CODE
    && payload?.retryable === true,
  'verification interruption response is 503/retryable and never masquerades as 401',
);

console.log();
if (failures.length) {
  console.log(`BUILD 438 MODULE SESSION RESILIENCE TEST: FAIL (${failures.length}/${checks} failed)`);
  for (const failure of failures) console.log(' -', failure);
  process.exit(1);
}

console.log(`BUILD 438 MODULE SESSION RESILIENCE TEST: PASS (${checks}/${checks})`);
console.log('False 401/logout on D1 verification interruption: PREVENTED');
console.log('Invalid/expired session semantics: PRESERVED');
console.log('Production mutation executed: NO');
console.log('PRODUCTION PROMOTION: CLOSED');
