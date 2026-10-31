/* Build 556: deterministic, read-only static Admin route inventory.
   Classification is provisional and never substitutes for owner visual acceptance. */
import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const admin=join(root,'admin');
const output=join(root,'docs/operations/RELEASE_467_BUILD_556_ADMIN_ROUTE_INVENTORY.json');
const referenceScreens=['Admin Dashboard','Product Management','Inventory & Stock','Orders & Fulfillment','Customer Requests','Production Calendar','Workstations & Capacity','Analytics & Reports','Shop Preview','Settings & Configuration'];

// Explicit evidence and *proposed* disposition for priority pages only. Everything
// else remains REVIEW; an existing page is never declared obsolete by inference.
const reviewed={
  '/admin/':{decision:'KEEP',screen:'Admin Dashboard',reason:'Existing Admin dashboard already received a dedicated shell/hero modernization. Preserve until owner review.'},
  '/admin/products/':{decision:'KEEP',screen:'Product Management',reason:'Existing compact Product browser and low-read recovery were previously revamped; preserve behavior and styling.'},
  '/admin/system-operations/':{decision:'KEEP',screen:'Settings & Configuration',reason:'Builds 546-555 already modernized monitoring and owner evidence; preserve current controls.'},
  '/admin/product-editor/':{decision:'REBUILD',screen:'Product Management',reason:'Owner explicitly requested replacing the confusing multi-panel Product Editor with a four-area workflow in Build 557.'},
  '/admin/inventory-operations/':{decision:'REVIEW',screen:'Inventory & Stock',reason:'Inventory Ops has its own prior workflow work; inspect its live layout before authorizing any visual change.'},
  '/admin/orders/':{decision:'IMPROVE',screen:'Orders & Fulfillment',reason:'Candidate for reference-style cards, filters and exception inspectors; preserve the existing order APIs and controls.'},
  '/admin/custom-request/':{decision:'IMPROVE',screen:'Customer Requests',reason:'Candidate for clearer intake and triage layout only after checking current owner-approved controls.'},
  '/admin/project-resource-calendar/':{decision:'REVIEW',screen:'Production Calendar',reason:'Calendar and resource workspaces have existing maker revamps; compare visually before changing.'},
  '/admin/project-capacity-planner/':{decision:'REVIEW',screen:'Workstations & Capacity',reason:'Capacity planner has existing scoped UI; verify whether it already matches the reference.'},
  '/admin/project-work-orders/':{decision:'REVIEW',screen:'Workstations & Capacity',reason:'Work-order flow has prior production enhancements and must not be visually overwritten without review.'},
  '/admin/analytics/':{decision:'IMPROVE',screen:'Analytics & Reports',reason:'Candidate for source-backed KPI and trend presentation, subject to a live visual check.'},
  '/admin/storefront/':{decision:'REVIEW',screen:'Shop Preview',reason:'Admin storefront preview is distinct from public storefront; verify its present appearance first.'},
  '/admin/it/':{decision:'REVIEW',screen:'Settings & Configuration',reason:'Recent I.T. work must be preserved; determine visually whether only small refinements are needed.'},
  '/admin/listings/':{decision:'IMPROVE',screen:'Product Management',reason:'Listing overview may need a consolidated destination handoff after the Product Editor rewrite.'},
  '/admin/social-publishing/':{decision:'REVIEW',screen:'Settings & Configuration',reason:'Existing social authorization and draft boundaries must remain intact; integration redesign is queued separately.'},
  '/admin/interface-blueprint/':{decision:'KEEP',screen:'Product Management',reason:'Build 556 opt-in Admin-only visual reference; read-only blueprint, not a product or provider editor.'}
};
function paths(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const path=join(dir,entry.name);
  return entry.isDirectory()?paths(path):entry.isFile()&&entry.name==='index.html'?[path]:[];
});}
function inventory(){const pages=paths(admin).map(path=>{
  const rel=relative(root,path).split(sep).join('/');
  const route='/'+rel.slice(0,-'index.html'.length);
  const html=readFileSync(path,'utf8');
  const explicit=reviewed[route];
  return {route,source:rel,decision:explicit?.decision||'REVIEW',reference_screen:explicit?.screen||'Unassigned / contextual module',reason:explicit?.reason||'Not individually approved for a revamp; inspect actual signed-in UI and owner acceptance before changing.',evidence:{byte_length:Buffer.byteLength(html),stylesheets:(html.match(/<link\b[^>]+rel=["']stylesheet["']/gi)||[]).length,scripts:(html.match(/<script\b/gi)||[]).length,forms:(html.match(/<form\b/gi)||[]).length,has_viewport:/name=["']viewport["']/.test(html)},owner_visual_acceptance:'PENDING'};
}).sort((a,b)=>a.route.localeCompare(b.route));
  const totals={total:pages.length,keep:pages.filter(x=>x.decision==='KEEP').length,improve:pages.filter(x=>x.decision==='IMPROVE').length,rebuild:pages.filter(x=>x.decision==='REBUILD').length,review:pages.filter(x=>x.decision==='REVIEW').length};
  return {format:'devilndove-admin-route-inventory-556',build:556,scope:'Admin routes only — does not classify or alter public storefront',classification:'PROVISIONAL_STATIC_AUDIT_NOT_OWNER_APPROVAL',reference_screens:referenceScreens,totals,routes:pages};
}
const json=JSON.stringify(inventory(),null,2)+'\n';
if(process.argv.includes('--check')){
  if(readFileSync(output,'utf8')!==json)throw Error('Build 556 Admin route inventory changed. Review routes and regenerate explicitly.');
  console.log('Build 556 Admin route inventory: exact source check PASS');
}else if(process.argv.includes('--write')){
  writeFileSync(output,json);
  console.log('Build 556 Admin route inventory written:',inventory().totals);
}else{
  console.log(JSON.stringify(inventory().totals));
}
