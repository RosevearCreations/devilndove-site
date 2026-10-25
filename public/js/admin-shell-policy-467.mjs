/* Build 467 — owner-selectable Admin theme and source-owned contextual help. */
export const ADMIN_THEMES_467=Object.freeze([
 {key:'standard',label:'Standard — current styling'},
 {key:'purple',label:'Purple — plum, bronze and gold'}
]);
export const ADMIN_SHELL_LINKS_467=Object.freeze([
 {key:'home',label:'Dashboard',href:'/admin/'},
 {key:'maker',label:'Maker Workbench',href:'/admin/maker-workbench/'},
 {key:'products',label:'Products',href:'/admin/products/'},
 {key:'inventory',label:'Inventory',href:'/admin/inventory-operations/'},
 {key:'orders',label:'Orders',href:'/admin/orders/'},
 {key:'owner',label:'Owner Trials',href:'/admin/maker-owner-trials/'}
]);
export const ADMIN_SHELL_PAGES_467=Object.freeze([
 'home','maker-workbench','maker-owner-trials','maker-pilot-closure','maker-trial-debrief','maker-product-safety'
]);
export const ADMIN_HELP_467=Object.freeze({
 home:'Navigate to the original owning Admin module. At-a-glance data stays read-only until an authorized action is taken in its workspace.',
 products:'Products are edited in the Product workspace. An item does not automatically become Etsy- or Marketplace-published.',
 inventory:'Inventory owns actual tool locations, stock and consumption. Viewing a summary never posts quantities or costs.',
 orders:'Orders and their original fulfillment ledger own customer requests, shipments, refunds and aftercare. Do not infer delivery from a shipping label.',
 maker:'Start with an actual Creative Project. Private learning work may stay private and never become a product or public story.',
 trials:'A genuine owner may record a source-linked review; the latest HOLD overrides an earlier acceptance. These receipts are not product-safety certification.',
 closure:'A technical deployment can be GREEN while real owner, provider, product-safety and customer acceptance remain HOLD.',
 debrief:'Only original scoped Maker trial and optional Order receipts are compared. A typed ID alone cannot prove that a real case exists.',
 safety:'Review actual Canadian product category, labels, physical evidence and applicable rules. This screen cannot certify a product or permit a sale.',
 media:'Original photo or video rights, captions, private access and public consent require separate owner approval.',
 commission:'A customer request and proof are original commission authorities. Maker observations cannot create customer permission.',
 cost:'Budget estimates and cost comparisons do not move money, post accounting or consume inventory.',
 default:'Open the original owning module for source evidence and explicit human review. Nothing in this Help panel saves, publishes, bills, ships or certifies an item.'
});
export function normalizeAdminTheme467(value){
 return ADMIN_THEMES_467.some(t=>t.key===value)?value:'standard';
}
export function adminHelpFor467(title='',route=''){
 const t=String(title??'').toLowerCase(),r=String(route??'').toLowerCase();
 if(/safety|label|compliance/.test(t)||r.includes('product-safety'))return ADMIN_HELP_467.safety;
 if(/refund|fulfill|shipping|returns|aftercare|orders/.test(t)||r.includes('/orders/'))return ADMIN_HELP_467.orders;
 if(/inventory|tools|stock|consumable/.test(t)||r.includes('inventory'))return ADMIN_HELP_467.inventory;
 if(/product|catalogue|catalog/.test(t)||r.includes('/products/'))return ADMIN_HELP_467.products;
 if(/media|photography|story|video/.test(t))return ADMIN_HELP_467.media;
 if(/commission|custom request|quote/.test(t)||r.includes('commission'))return ADMIN_HELP_467.commission;
 if(/cost|pricing|budget|accounting/.test(t))return ADMIN_HELP_467.cost;
 if(/debrief|receipt reconciliation/.test(t)||r.includes('maker-trial-debrief'))return ADMIN_HELP_467.debrief;
 if(/closure|roadmap/.test(t)||r.includes('maker-pilot-closure'))return ADMIN_HELP_467.closure;
 if(/owner trial|maker trial|owner review/.test(t)||r.includes('maker-owner-trials'))return ADMIN_HELP_467.trials;
 if(/maker|creative|project|workstation|production/.test(t)||r.includes('maker-workbench'))return ADMIN_HELP_467.maker;
 if(/dashboard|command centre|at a glance|seller daily/.test(t)||r==='/admin/')return ADMIN_HELP_467.home;
 return ADMIN_HELP_467.default;
}
export function adminPageHelp467(page=''){
 const map={home:ADMIN_HELP_467.home,'maker-workbench':ADMIN_HELP_467.maker,
  'maker-owner-trials':ADMIN_HELP_467.trials,'maker-pilot-closure':ADMIN_HELP_467.closure,
  'maker-trial-debrief':ADMIN_HELP_467.debrief,'maker-product-safety':ADMIN_HELP_467.safety};
 return map[page]||ADMIN_HELP_467.default;
}
