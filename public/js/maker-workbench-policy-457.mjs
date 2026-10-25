/* Build 457 — read-only Maker workbench routing; no new canonical project authority. */
export const MAKER_PHASES = Object.freeze([
  {key:'overview',label:'Where should we begin?'},
  {key:'design',label:'Design / CAD / prototype'},
  {key:'materials',label:'Materials and actual usage'},
  {key:'making',label:'Making and workshop time'},
  {key:'quality',label:'Quality, failure or salvage'},
  {key:'cost',label:'True costs and pricing'},
  {key:'media',label:'Photos, video and our story'},
  {key:'owner',label:'Real owner trial review'},
  {key:'commission',label:'Custom customer commission'}
]);

export const MAKER_LINKS = Object.freeze([
  {key:'project',phase:'overview',title:'Creative Project',href:'/admin/creative-process/',passProject:true,
   description:'Create or review the original project and factual process events.',help:'One canonical Creative Project owns this identity. Private therapy and learning work do not need a product or sale.'},
  {key:'design',phase:'design',title:'Design & revisions',href:'/admin/project-design-files/',passProject:true,
   description:'Review original CAD, patterns and revision evidence.',help:'Revisions are original private files. Machine readiness and manufacturing decisions remain separate.'},
  {key:'materials',phase:'materials',title:'Materials & actual usage',href:'/admin/project-bom/',passProject:true,
   description:'Compare planned amounts with real Inventory postings, scrap and returns.',help:'A plan does not consume stock. The Inventory authority records real use and returns; if the project is older than the original module list, find it in Creative Process.'},
  {key:'making',phase:'making',title:'Guided manufacturing',href:'/admin/guided-manufacturing/',passProject:false,
   description:'Review traveler steps, cures, holds and source-linked evidence.',help:'Opening a traveler does not start a machine or certify a physical result; select our project in the original module.'},
  {key:'quality',phase:'quality',title:'Quality & salvage',href:'/admin/finished-quality/',passProject:true,
   description:'Record real finished, failed or reworked piece evidence.',help:'A first-quality outcome is not automatically safe to sell. Human release decisions and Product readiness remain separate.'},
  {key:'product-safety',phase:'quality',title:'Canadian Product Safety & Label Review',href:'/admin/maker-product-safety/',passProject:true,
   description:'Compare one original Product with category-specific Canadian safety, packaging and owner evidence questions.',help:'This private worksheet references official Canadian guidance and original owner-trial receipts. It never certifies goods, writes an approval, changes labels or allows a sale. A child-directed or cosmetic product needs its specific human review.'},
  {key:'cost',phase:'cost',title:'True costs (CAD)',href:'/admin/project-costs/',passProject:true,
   description:'Compare actual costs, unknowns, labour, waste and potential prices.',help:'An estimate never posts Accounting, changes a Product price or creates a sale.'},
  {key:'media',phase:'media',title:'Photography & maker stories',href:'/admin/maker-media-stories/',passProject:true,
   description:'Prepare a private factual story with original media and rights evidence.',help:'Private workshop photos do not imply consent for a public store, Etsy or social post.'},
  {key:'media-acceptance',phase:'media',title:'Media & accessibility acceptance',href:'/admin/maker-media-acceptance/',passProject:true,
   description:'Inspect source-linked frames, captions, principal-image, consent and hands-on accessibility HOLDs.',help:'This private read-only audit uses the original Maker Story sources. Real photo dimensions, consent evidence, keyboard/touch and actual owner acceptance must be checked manually; no image or story is auto-approved.'},
  {key:'owner',phase:'owner',title:'Owner trial evidence',href:'/admin/maker-owner-trials/',passProject:false,
   description:'Review genuine owner observations and retain immutable HOLD or accepted receipts.',help:'Acceptance here only means we reviewed a linked source. It does not certify safety, authorize customer consent or publish anything.'},
  {key:'etsy-owner',phase:'owner',title:'Etsy draft & marketplace owner acceptance',href:'/admin/etsy-owner-acceptance/',passProject:false,
   description:'Inspect verified Etsy shop, Product, local draft, receipt and Canada-only shipping source evidence.',help:'Production OAuth stays on devilndove.com. This read-only view never creates Etsy drafts or publishes, and Meta stays a manual Product Editor handoff until supported API permissions are proven.'},
  {key:'commission',phase:'commission',title:'Commission workbench',href:'/admin/commission-workbench/',passProject:false,
   description:'Return to the real customer request, quote and approval authority.',help:'Customer requests must stay in their own module. Do not infer a customer’s permission from a Creative Project.'},
  {key:'finder',phase:'overview',title:'Maker source & evidence finder',href:'/admin/maker-evidence-search/',passProject:true,
   description:'Search original Creative Projects, designs, recipe versions, linked tools and finished-piece serials.',help:'Private Admin read-only results link to their canonical owning modules. No raw media keys, customer data, source downloads, permission change or maker acceptance is inferred.'},
  {key:'resource-budget',phase:'overview',title:'D1, Workers, R2 & GitHub usage review',href:'/admin/maker-resource-budget/',passProject:false,
   description:'Compare actual provider usage and plan ceilings with source links; inspect measured Build 462 GitHub workflow timings.',help:'Cloudflare dashboard billing and observability are the only authority for actual D1/Worker/R2 usage. The static GitHub sample is historical; missing metrics remain HOLD. No provider reads or quota/payment changes run automatically.'},
  {key:'fulfillment-pilot',phase:'owner',title:'Real fulfillment, returns & aftercare pilot',href:'/admin/maker-fulfillment-pilot/',passProject:false,
   description:'Review an actual order, Canadian pickup/carrier receipts, damage/returns and customer consent. Append owner evidence only.',help:'Original Orders and Build 454 records are required. Missing evidence stays HOLD; no refund, exchange, message, postage purchase, carrier booking or inventory/order transition is performed.'},
  {key:'maker-closure',phase:'owner',title:'Maker Pilot closure & next priority queue',href:'/admin/maker-pilot-closure/',passProject:false,
   description:'Independent actual-source review of the Maker Pilot, unresolved owner/provider HOLDS and proposed Builds 466–475.',help:'Reads only selected original Admin sources on request. Session attestations and a downloadable HOLD packet cannot certify real customer, legal, billing, Etsy or delivery acceptance; no automatic external actions.'}
]);

export const TRIAL_SCENARIOS = Object.freeze([
  'jewellery_metal','resin_clay','digital_fabrication','failed_salvage','private_therapeutic','custom_commission'
]);

export function projectId(value){
 const raw=String(value??'');if(!/^[1-9]\d{0,9}$/.test(raw))return 0;
 const n=Number(raw);return Number.isSafeInteger(n)?n:0;
}

export function workbenchUrl(link,selectedProject,trialScenario='jewellery_metal'){
 if(!MAKER_LINKS.includes(link))throw Error('Unknown Maker workspace');
 const id=projectId(selectedProject);
 if(link.key==='owner'){
  const scenario=TRIAL_SCENARIOS.includes(trialScenario)?trialScenario:'jewellery_metal';
  const query=new URLSearchParams({scenario});
  if(id&&scenario!=='custom_commission')query.set('project_id',String(id));
  return link.href+'?'+query;
 }
 return link.href+(id&&link.passProject?'?project_id='+id:'');
}

export function nextMakerAction(route,focus='overview'){
 const stage=MAKER_LINKS.find(x=>x.phase===focus)||MAKER_LINKS[0];
 if(!route)return {title:'Choose an existing Creative Project',explanation:'Select a real project to see its original evidence coverage. Commission requests stay with the commission workbench.',key:'project'};
 const counts=[
  {count:route.caip_workspaces,title:'Check the project’s linked CAIP workspace',explanation:'No linked CAIP workspace was returned in this page of source records.'},
  {count:route.active_events,title:'Record an actual process event',explanation:'No active real-work process event was returned for this project.'},
  {count:route.selected_evidence_rows,title:'Select factual evidence',explanation:'No selected supporting evidence was returned for this project.'},
  {count:route.maker_story_profiles,title:'Review Maker Story facts',explanation:'No Maker Story profile was returned. Personal learning work may remain private.'}
 ];
 const gap=counts.find(x=>Number(x.count||0)===0);
 if(focus==='overview')return gap?{...gap,key:'project'}:{title:'Review original evidence and human decisions',explanation:'The basic linked-source counters are present. Their completeness, media rights, quality and owner acceptance are not inferred.',key:'project'};
 return {title:'Next for '+stage.title,explanation:stage.description+' '+(gap?'Source overview also shows a gap: '+gap.title+'.':'This route does not assert this stage is complete.'),key:stage.key};
}
