// Build 468 — shared, read-only classification for login and Product Editor incidents.
// Never replays a request, reads D1, stores credentials or sends telemetry.
((root) => {
  'use strict';
  const safeRef = (value) => /^[a-z0-9-]{8,90}$/i.test(String(value || '')) ? String(value) : '';
  function classify(error, operation = 'load') {
    const status = Number(error?.httpStatus ?? error?.status ?? 0);
    const code = String(error?.code || '').toLowerCase();
    const message = String(error?.message || '');
    const cloudflareRay = safeRef(error?.cloudflareRay);
    const resource = error?.isCloudflareResourceLimit === true ||
      String(error?.cloudflareErrorType || '') === '1102' ||
      code === 'cloudflare_worker_resource_limit' ||
      /(?:error\s*(?:code|1102)?\s*[:#]?\s*1102|worker exceeded resource limits)/i.test(message);
    const quota = code === 'd1_read_capacity_unavailable' ||
      (status === 503 && /(?:D1|rows read|database quota|read capacity)/i.test(message));
    const auth = status === 401 || status === 403;
    const uncertainWrite = operation === 'save' && (resource || quota || status === 0 ||
      status === 409 && code === 'product_price_readback_unconfirmed' ||
      [408,429,500,502,503,504].includes(status));
    const temporary = resource || quota || [0,408,429,500,502,503,504].includes(status) ||
      code === 'auth_login_timeout';
    const category = resource ? 'worker_1102' : quota ? 'd1_503' : auth ? 'authorization' :
      uncertainWrite ? 'unconfirmed_write' : temporary ? 'temporary' : 'review';
    let guidance = 'Review the details and correct the request before trying again.';
    if (operation === 'login') {
      guidance = temporary
        ? 'The login response was not confirmed. We kept the form available; wait, then use Sign In again deliberately. No automatic login retry occurred.'
        : auth ? 'Please verify the account details and sign in again.' : guidance;
    } else if (uncertainWrite) {
      guidance = 'The Product save result is unconfirmed. A write may have completed. Your browser draft is retained. Press Retry load to compare the server copy before deciding whether to save again; there is no automatic write retry.';
    } else if (auth) {
      guidance = 'Administrator access must be verified again. Your browser draft is retained; sign in and return to this Product.';
    } else if (temporary) {
      guidance = 'The Product could not load reliably. Wait and press Retry load manually; browser recovery is preserved and there is no background retry.';
    }
    return Object.freeze({category, status, temporary, uncertainWrite, requiresManualReview: uncertainWrite || auth,
      cloudflareRay, guidance});
  }
  const api = Object.freeze({classify});
  root.DDRecovery468 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
