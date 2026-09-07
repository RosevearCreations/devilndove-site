import fs from 'node:fs';
import vm from 'node:vm';
import process from 'node:process';

const source = fs.readFileSync(new URL('../public/js/storefront-search-collections.js', import.meta.url), 'utf8');
const sandbox = { console, globalThis: null };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'storefront-search-collections.js' });

const api = sandbox.DDStorefrontSearchCollections;
if (!api) throw new Error('DDStorefrontSearchCollections export missing');

let checks = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    console.error(`${String(checks).padStart(2, '0')}. FAIL — ${label}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${String(checks).padStart(2, '0')}. PASS — ${label}`);
}

check(api.BUILD === 75 && api.CONTRACT === 'storefront-search-collections', 'Build 75 public authority identity is stable');
check(api.availabilityOfProduct({ product_type:'digital', inventory_tracking:0 }).status === 'available', 'digital Product is available without pretending physical inventory');
check(api.availabilityOfProduct({ product_type:'physical', inventory_tracking:1, inventory_quantity:3 }).status === 'available', 'positive tracked inventory is available');
check(api.availabilityOfProduct({ product_type:'physical', inventory_tracking:1, inventory_quantity:0 }).status === 'out_of_stock', 'zero tracked inventory is out of stock');
check(api.availabilityOfProduct({ product_type:'physical', inventory_tracking:0 }).status === 'check', 'untracked physical inventory stays fail-closed at check availability');

const products = [
  { product_id:1, name:'Amber Ring', product_category:'Jewelry', product_type:'physical', inventory_tracking:1, inventory_quantity:2, price_cents:4200, sort_order:2, created_at:'2026-08-01', merchandise_origin:'handmade', featured_image_url:'/a.webp', color_names:['Gold'] },
  { product_id:2, name:'Blue Print', product_category:'Digital', product_type:'digital', inventory_tracking:0, inventory_quantity:0, price_cents:1200, sort_order:1, created_at:'2026-09-01', merchandise_origin:'handmade', featured_image_url:'/b.webp', color_names:['Blue'] },
  { product_id:3, name:'Vintage Spoon', product_category:'Jewelry', product_type:'physical', inventory_tracking:1, inventory_quantity:0, price_cents:2800, sort_order:3, created_at:'2026-07-01', merchandise_origin:'vintage', color_names:['Silver'] },
];

const jewelry = api.filterAndSortProducts(products, { category:'jewelry', sort:'featured' });
check(jewelry.length === 2 && jewelry.every((row) => row.product_category === 'Jewelry'), 'category filter is exact and case-insensitive');

const available = api.filterAndSortProducts(products, { availability:'available', sort:'featured' });
check(available.length === 2 && available.some((row) => row.product_type === 'digital'), 'availability filter includes digital and positive tracked stock without unknown stock claims');

const priceAsc = api.filterAndSortProducts(products, { sort:'price_asc' });
check(priceAsc.map((row) => row.product_id).join(',') === '2,3,1', 'price ascending sort is deterministic');

const nameSort = api.filterAndSortProducts(products, { sort:'name' });
check(nameSort.map((row) => row.name).join(',') === 'Amber Ring,Blue Print,Vintage Spoon', 'name sort is deterministic');

const summary = api.buildMerchandisingSummary(products);
check(summary.total === 3 && summary.available === 2 && summary.out_of_stock === 1 && summary.categories === 2 && summary.automatic_merchandising_action === false && summary.additional_product_request === false, 'merchandising summary is derived only and performs no automatic action or extra Product request');

const relax = api.buildRelaxationPlan({ category:'Jewelry', availability:'available', q:'ring', max_price_cents:'3000' });
check(relax.length === 4 && relax[0].key === 'category' && relax.some((row) => row.key === 'q'), 'zero-result assistance proposes bounded filter relaxation instead of hidden fallback behavior');

if (process.exitCode) process.exit(process.exitCode);
console.log(`BUILD 75 STOREFRONT SEARCH & COLLECTIONS RUNTIME: PASS (${checks} checks)`);
