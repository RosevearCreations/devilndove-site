/* QL-265 · nonproduction connection screen, deliberately no network or storage. */
(() => {
  'use strict';
  const root = document.querySelector('[data-comms-connection]');
  if (!root) return;
  const source = root.getAttribute('data-comms-connection');
  const run = root.querySelector('[data-comms-local-test]');
  const output = root.querySelector('[data-comms-local-result]');
  if (!run || !output) return;
  run.addEventListener('click', () => {
    const checks = [
      { id: 'source-identity', passed: typeof source === 'string' && /^[a-z0-9-]+$/.test(source) },
      { id: 'nonproduction-only', passed: root.getAttribute('data-mode') === 'nonproduction-only' },
      { id: 'private-custody-not-inferred', passed: root.getAttribute('data-signer') === 'not-verified' },
      { id: 'owner-test-not-inferred', passed: root.getAttribute('data-owner-test') === 'not-given' },
      { id: 'network-not-started', passed: true }
    ];
    const report = {
      schema: 'rosevear-comms-local-preflight/v1', source,
      mode: 'LOCAL_INTERFACE_ONLY',
      checks,
      localPass: checks.every(check => check.passed),
      networkRequests: 0, authenticatedGatewayGets: 0,
      signedProofB: 'NOT_VERIFIED', privateRoles: 'NOT_VERIFIED',
      isolatedNonproductionTenant: 'NOT_VERIFIED', ownerTestAuthorization: 'NOT_GIVEN',
      futureBoundedWindow: 'TWO_POSITIVE_AND_SEVEN_DENIAL_GETS_IN_15_MINUTES',
      remoteConnection: 'DISCONNECTED / HOLD'
    };
    output.textContent = JSON.stringify(report, null, 2);
  });
})();
