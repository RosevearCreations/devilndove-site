// Release 460 Financials payment execution authority.
// Credentials/configuration alone never authorize a remote payment-provider call.

function text(value) {
  return String(value ?? '').trim();
}

export function isDevelopmentPaymentHost(hostname) {
  const host = text(hostname).toLowerCase();
  return host === 'devilndove-site-dev.pages.dev' || host.endsWith('.devilndove-site-dev.pages.dev');
}

function requestHost(requestUrl) {
  try {
    return new URL(String(requestUrl || '')).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function stripeCredentialState(env = {}) {
  const secret = text(env.STRIPE_SECRET_KEY);
  const publishable = text(env.STRIPE_PUBLISHABLE_KEY);
  const secretTest = secret.startsWith('sk_test_') || secret.startsWith('rk_test_');
  const publishableTest = !publishable || publishable.startsWith('pk_test_');
  const secretLive = secret.startsWith('sk_live_') || secret.startsWith('rk_live_');
  const publishableLive = publishable.startsWith('pk_live_');
  return {
    configured: Boolean(secret),
    public_key_configured: Boolean(publishable),
    test_mode: Boolean(secretTest && publishableTest),
    live_credential_detected: Boolean(secretLive || publishableLive),
  };
}

function paypalCredentialState(env = {}) {
  const clientId = text(env.PAYPAL_CLIENT_ID);
  const secret = text(env.PAYPAL_SECRET);
  const mode = text(env.PAYPAL_ENV || 'sandbox').toLowerCase() || 'sandbox';
  return {
    configured: Boolean(clientId && secret),
    test_mode: mode === 'sandbox',
    live_credential_detected: mode === 'live',
    environment: mode === 'live' ? 'live' : (mode === 'sandbox' ? 'sandbox' : 'unknown'),
  };
}

export function paymentExecutionStatus(requestUrl, env = {}, providerValue = '') {
  const provider = text(providerValue).toLowerCase();
  const host = requestHost(requestUrl);
  const development_host = isDevelopmentPaymentHost(host);
  const operator_switch_set = text(env.PAYMENT_PROVIDER_EXECUTION_MODE).toLowerCase() === 'development-explicit';

  let providerState;
  if (provider === 'stripe') providerState = stripeCredentialState(env);
  else if (provider === 'paypal') providerState = paypalCredentialState(env);
  else {
    return {
      provider,
      remote_provider: false,
      configured: false,
      test_mode: false,
      live_credential_detected: false,
      development_host,
      operator_switch_set,
      execution_authorized: false,
      code: 'payment_provider_not_remote',
    };
  }

  let code = 'payment_provider_execution_closed';
  if (!development_host) code = 'payment_execution_development_only';
  else if (!operator_switch_set) code = 'payment_provider_execution_closed';
  else if (!providerState.configured) code = 'payment_provider_not_configured';
  else if (providerState.live_credential_detected || !providerState.test_mode) code = 'payment_live_credentials_forbidden';
  else code = 'payment_provider_execution_authorized';

  const execution_authorized = code === 'payment_provider_execution_authorized';
  return {
    provider,
    remote_provider: true,
    configured: providerState.configured,
    test_mode: providerState.test_mode,
    environment: providerState.environment || (providerState.test_mode ? 'test' : 'unknown'),
    live_credential_detected: providerState.live_credential_detected,
    development_host,
    operator_switch_set,
    execution_authorized,
    code,
  };
}

export function paymentExecutionBoundary(env = {}) {
  return {
    operator_switch: 'PAYMENT_PROVIDER_EXECUTION_MODE',
    operator_switch_set: text(env.PAYMENT_PROVIDER_EXECUTION_MODE).toLowerCase() === 'development-explicit',
    required_value: 'development-explicit',
    development_only: true,
    test_sandbox_only: true,
    production_execution: false,
  };
}
