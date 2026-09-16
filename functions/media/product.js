// Release 467 Build 162 — D1-free same-origin media transport.
// Reuse the established R2-only Product media implementation outside the /api/product*
// module-route family so image delivery never performs Product/session/module D1 reads.
export { onRequestGet } from '../api/product-media.js';
