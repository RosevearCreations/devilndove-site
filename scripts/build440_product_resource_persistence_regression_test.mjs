#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const apiPath=path.join(root,'functions/api/admin/product-resources.js');
const persistencePath=path.join(root,'functions/api/admin/_productResourcePersistence.js');
const dataPath=path.join(root,'functions/api/admin/_productResourcesData.js');
const apiSource=fs.readFileSync(apiPath,'utf8');
const persistenceSource=fs.readFileSync(persistencePath,'utf8');
const dataSource=fs.readFileSync(dataPath,'utf8');
const { normalizeSubmittedLinks }=await import(pathToFileURL(persistencePath).href);
const { resourcePreview }=await import(pathToFileURL(dataPath).href);

const checks=[];
function check(condition,label){
  if(!condition) throw new Error(label);
  checks.push(label);
  console.log(`${String(checks.length).padStart(2,'0')}. PASS — ${label}`);
}

console.log('BUILD 440 PRODUCT RESOURCE PERSISTENCE / NORMALIZATION REGRESSION');
console.log('Remote access: NONE\n');

const normalized=normalizeSubmittedLinks([
  {resource_kind:' Supply ',source_key:' Wax-Key ',quantity_used:0,lot_size_units:0,consumption_mode:'per_unit',sort_order:0},
  {resource_kind:'supply',source_key:'wax-key',quantity_used:9,lot_size_units:9,sort_order:1},
  {resource_kind:'TOOL',source_key:'Wax-Key',quantity_used:-2,lot_size_units:null,consumption_mode:'story_only',sort_order:2},
  {resource_kind:'product',source_key:'forbidden',quantity_used:1},
  {resource_kind:'supply',source_key:'',quantity_used:1},
]);

check(normalized.length===2,'submitted Tool/Supply identities are deduplicated while different resource kinds remain distinct');
check(normalized[0].resource_kind==='supply' && normalized[0].source_key==='Wax-Key','first canonical submitted display key is retained after trim');
check(normalized[0].quantity_used===1 && normalized[0].lot_size_units===1,'missing/non-positive Supply use-per-batch and lot size default to one');
check(normalized[1].resource_kind==='tool' && normalized[1].quantity_used===1 && normalized[1].lot_size_units===1,'Tool use-per-batch and lot size also default safely to one');
check(normalized[1].consumption_mode==='story_only','valid consumption mode survives normalization');

const preview=resourcePreview({unit_cost_cents:100,on_hand_quantity:2,usage_units_per_stock_unit:10},{quantity_used:0,lot_size_units:0,consumption_mode:'per_unit'});
check(preview.estimated_cost_per_product_cents===10 && preview.buildable_products===20,'read-side preview treats historical zero use-per-batch as safe default one');

check(apiSource.includes("from './_productResourcePersistence.js'"),'desktop Product resource endpoint uses the shared persistence authority');
check(persistenceSource.includes("const identity = `${resourceKind}\\u0000${sourceKey.toLowerCase()}`"),'save dedupe identity is case-insensitive');
check(persistenceSource.includes("db.prepare('DELETE FROM product_resource_links WHERE product_id = ?').bind(normalizedProductId)"),'existing links are deleted inside the atomic statement list');
check(persistenceSource.includes('await db.batch(statements);'),'Product resource replacement executes as one D1 batch');
check(!/DELETE FROM product_resource_links[^;]+\.run\(\)/s.test(persistenceSource),'shared Product resource replacement has no destructive pre-batch DELETE');
check(persistenceSource.includes('INSERT INTO product_resource_ingredient_profiles') && persistenceSource.includes('SELECT product_resource_link_id') && persistenceSource.includes('FROM product_resource_links'),'Supply ingredient profile is linked inside the same atomic batch without a second write phase');
check(apiSource.includes('const persistedLinks = await loadProductLinks(db, productId)'),'saved use/batch values are read back from D1 before desktop response');

check(dataSource.includes("LOWER(TRIM(COALESCE(sii2.external_key, ''))) = LOWER(TRIM(COALESCE(prl.source_key, '')))"),'linked Inventory lookup normalizes case and whitespace');
check(dataSource.includes("LOWER(TRIM(COALESCE(ci2.source_key, ''))) = LOWER(TRIM(COALESCE(prl.source_key, '')))"),'linked catalog fallback lookup normalizes case and whitespace');
check(dataSource.includes("LOWER(TRIM(COALESCE(sii.external_key, ''))) = LOWER(TRIM(COALESCE(ci.source_key, '')))"),'catalog fallback suppresses Inventory duplicates using normalized identity');
check(dataSource.includes('quantity_used: positive(row.quantity_used, 1)') && dataSource.includes('lot_size_units: positive(row.lot_size_units, 1)'),'historical zero/missing persisted values are presented with safe default one');

console.log(`\nBUILD 440 PRODUCT RESOURCE PERSISTENCE / NORMALIZATION REGRESSION: PASS (${checks.length}/${checks.length})`);
