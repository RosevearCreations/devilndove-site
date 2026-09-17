// Release 467 Build 166 — zero-D1 compatibility alias for legacy Product media URLs.
// /media/product is retained because several admin image tools emitted it before the canonical
// /api/product-media route was standardized. Both paths now execute the same R2-only handler.
export { onRequestGet } from '../api/product-media.js';
