/* Release 467 Build 434: public search result boundaries.
   Search can render products, creations and navigational pages ONLY.
   Operational tools/supplies/movie records must never become merchandise results. */
(function (root) {
  'use strict';
  const TYPES = Object.freeze(['Product', 'Creation', 'Page']);
  const SAFE_SLUG = /^[a-z0-9][a-z0-9_-]{0,159}$/i;
  const PAGE_PATHS = Object.freeze([
    '/', '/about/', '/shop/', '/gallery/', '/creations/', '/tools/',
    '/supplies/', '/toolshed/', '/movies/', '/contact/', '/workshop-journal/'
  ]);
  const REFERENTIAL_PAGES = new Set(['/tools/', '/supplies/', '/toolshed/', '/movies/']);
  function cleanText(v){ return String(v == null ? '' : v).trim(); }
  function canShowProduct(row){
    if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
    if (!Number.isSafeInteger(Number(row.product_id)) || Number(row.product_id) < 1) return false;
    if (!SAFE_SLUG.test(cleanText(row.slug)) || !cleanText(row.name)) return false;
    if (cleanText(row.status || 'active').toLowerCase() !== 'active') return false;
    if (!['approved','published',''].includes(cleanText(row.review_status || '').toLowerCase())) return false;
    if (['tool','tools','supply','supplies','consumable','inventory'].includes(
      cleanText(row.item_kind || row.source_type || '').toLowerCase())) return false;
    if (row.inventory_only === true || row.is_inventory_only === true) return false;
    return true;
  }
  function canShowResult(row){
    if (!row || !TYPES.includes(row.type) || !cleanText(row.name)) return false;
    if (row.type === 'Product')
      return /^\/shop\/product\/\?slug=[a-z0-9_-]{1,160}$/i.test(cleanText(row.url));
    if (row.type === 'Creation') return row.url === '/creations/';
    return PAGE_PATHS.includes(row.url);
  }
  function resultAction(row){
    if (row?.type==='Product') return 'View product';
    if (row?.type==='Creation') return 'View creations';
    if (row?.type==='Page' && REFERENTIAL_PAGES.has(row.url)) return 'Explore reference page';
    return 'Open page';
  }
  function resultContext(row){
    if (row?.type==='Page' && REFERENTIAL_PAGES.has(row.url))
      return row.url==='/movies/' ? 'Movie collection reference — not a shop listing' :
        'Workshop reference — not offered for checkout';
    return '';
  }
  const api=Object.freeze({canShowProduct,canShowResult,resultAction,resultContext,PAGE_PATHS,TYPES});
  if (typeof module==='object' && module && module.exports) module.exports=api;
  if (root && typeof root==='object') root.DDSearchBoundary434=api;
})(typeof globalThis!=='undefined'?globalThis:null);
