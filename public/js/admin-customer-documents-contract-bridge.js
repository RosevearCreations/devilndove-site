// Devil n Dove Build 415 — Customer Documents read/write transport bridge.
// Preserves the mature Build 227 UI while routing its compatibility endpoint calls
// through the Build 397 read and Build 414 write authorities.
(() => {
  if (!window.DDAuth || typeof window.DDAuth.apiFetch !== 'function') return;
  if (window.DDCustomerDocumentsContractBridge?.installed) return;

  const originalApiFetch = window.DDAuth.apiFetch.bind(window.DDAuth);
  const READ_CONTRACT = '/api/admin/contracts/operations-customer-documents-read';
  const WRITE_CONTRACT = '/api/admin/contracts/operations-customer-documents-write';

  function asUrl(input) {
    try { return new URL(String(input), window.location.origin); }
    catch { return null; }
  }

  window.DDAuth.apiFetch = function customerDocumentsContractApiFetch(input, options = {}) {
    const url = asUrl(input);
    const method = String(options?.method || 'GET').trim().toUpperCase();
    if (url?.pathname === '/api/admin/customer-documents') {
      if (method === 'POST') return originalApiFetch(WRITE_CONTRACT, options);
      if (method === 'GET') {
        const destination = `${READ_CONTRACT}${url.search || ''}`;
        return originalApiFetch(destination, options);
      }
    }
    return originalApiFetch(input, options);
  };

  window.DDCustomerDocumentsContractBridge = Object.freeze({
    build: 415,
    installed: true,
    readContract: READ_CONTRACT,
    readContractBuild: 397,
    writeContract: WRITE_CONTRACT,
    writeContractBuild: 414,
    createsNetworkTransport: false,
  });
  document.documentElement.dataset.ddCustomerDocumentsContractBridgeBuild = '415';
})();
