/* Build 41 — Packaging Studio printable safe-area guard. */
(() => {
  'use strict';
  if (!location.pathname.startsWith('/admin/packaging-studio')) return;
  globalThis.DDPackagingSafeArea = { build: 41 };
})();
