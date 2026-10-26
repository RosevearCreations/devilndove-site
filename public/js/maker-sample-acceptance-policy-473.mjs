/* Build 473: owner-supplied physical sample observations, never a compliance approval. */
import {SAFETY_CATEGORIES_462,safetyProductId462} from './maker-product-safety-policy-462.mjs';

export const CANADIAN_SAMPLE_SOURCES_473=Object.freeze({
  packaging:{label:'Competition Bureau — mandatory information for prepackaged non-food labels',url:'https://competition-bureau.canada.ca/en/labelling/prepackaged-non-food-consumer-products/what-must-be-label'},
  jewellery:{label:'Health Canada — children’s jewellery regulatory guidance',url:'https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/guide-children-jewellery/guidance-document.html'},
  candles:{label:'Health Canada — candle safety',url:'https://www.canada.ca/en/health-canada/services/healthy-living/your-health/products/candle-safety.html'},
  cosmetics:{label:'Health Canada — industry guide to cosmetic labels',url:'https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/labelling-cosmetics.html'},
  cosmeticNotification:{label:'Health Canada — cosmetic notification requirements',url:'https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/notification-cosmetics.html'},
  toys:{label:'Health Canada — toys, soft-toy and flammability safety guidance',url:'https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/industry-guide-safety-requirements-children-toys-related-products-summary/guidance-document.html'},
  stuffed:{label:'Competition Bureau — stuffed/filled textile article rules and exemptions',url:'https://competition-bureau.canada.ca/en/labelling/textile-labelling/guide-labelling-stuffed-or-filled-textile-articles'},
  resin:{label:'Health Canada — resin kit recall, chemical labelling and child-resistant containers',url:'https://recalls-rappels.canada.ca/en/alert-recall/various-new-classic-resin-products-recalled-due-improper-labelling'},
  ccpsa:{label:'Health Canada — general Consumer Product Safety Act obligations',url:'https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/canada-consumer-product-safety-act-guide.html'}
});
const item=(key,label,guide,source,{specialist=false}={})=>Object.freeze({key,label,guide,source,specialist});
const COMMON=Object.freeze([
  item('actual_item','Physically match the saved Product, its exact sample and manufacturing batch','Compare original photographs, finished piece, component receipt and actual intended user. A different unit or lot is not interchangeable evidence.','ccpsa'),
  item('printed_label','Inspect the real finished label and packaging, including claims','Review applicable product identity, English/French, metric quantity, dealer identity, legibility, warnings and any exclusions. A screen mockup is not a physical label.','packaging'),
  item('damage','Inspect physical defects, normal use, foreseeable misuse and complaint/recall signals','Describe cracks, sharp edges, detachment, exposure, heat or other real hazards, then escalate any defect.','ccpsa')
]);
const BY_CATEGORY=Object.freeze({
  jewellery_adult:[
    item('metals','Inspect metal identity, coatings, jewellery attachment and skin-contact facts','Record supplier lot/test documents and examine sharp points, clasps and detached parts. Adult-marketing alone is not classification proof.','ccpsa'),
    item('skin_contact','Confirm skin exposure, allergies and finish claims against actual components','Do not promise hypoallergenic or nickel-free without appropriate substantive evidence.','ccpsa')
  ],
  jewellery_child:[
    item('child_audience','Determine whether appearance, packaging and advertising primarily appeal to children under 15','Use real product appearance, sizing and advertising, not merely a seller-selected age.','jewellery'),
    item('lead_cadmium','Verify qualified lead/cadmium composition results for the relevant components','Test reports must identify sample, material, method and applicable current limits. Supplier guess or colour is not test evidence.','jewellery',{specialist:true}),
    item('small_parts','Physically examine detachable parts, choking and ingestion hazards','Age and component hazards may require an independent assessment.','jewellery',{specialist:true})
  ],
  candles:[
    item('burn_test','Observe representative complete burn, flame, container temperature and stability','Record wick, wax, vessel, fragrance, batch, burn interval and observed heat/tipping/soot; a single photo is insufficient.','candles',{specialist:true}),
    item('burn_warning','Examine affixed burning instructions and applicable warning text','Check placement, supervision, distance from flammables and any product-specific hazards using the physical label.','candles'),
    item('wick_vessel','Verify wick construction, vessel integrity and ingredient source lot','Include lead-core/re-lighting and other prohibited/hazardous features as applicable; obtain competent assessment.','ccpsa',{specialist:true})
  ],
  cosmetics_soap:[
    item('cosmetic_scope','Confirm whether soap/skin product is a cosmetic and review every claim','Therapeutic claims can change classification; review real advertising, not only the label.','cosmetics',{specialist:true}),
    item('ingredient_label','Compare INCI ingredient declaration and warnings with the actual batch formula','Review bilingual product identity, dealer, quantity, ingredient order, required warnings and current allergen requirements.','cosmetics',{specialist:true}),
    item('notification','Verify actual Cosmetic Notification Form reference and the applicable timing','Do not equate notification with approval or invent a filing. Check the real first-sale date and Health Canada record.','cosmeticNotification',{specialist:true}),
    item('batch_sanitation','Inspect real hygienic production, batch trace and shelf-life/stability evidence','Verify formula, batch, handling, preservation and testing where appropriate.','cosmetics',{specialist:true})
  ],
  resin_fabrication:[
    item('cure','Verify completed cure and actual use limits of the finished piece','Check cure schedule, tackiness, brittleness, heat, cracks, coatings and supplier lot.','ccpsa'),
    item('food_heat','Determine food-contact, heat, skin contact and child-use claims','Any such claim can require different testing or rules. Record exact marketed function and independent review.','ccpsa',{specialist:true}),
    item('raw_kit','Determine whether uncured resin/hardener kits are included in what is sold','If chemicals are supplied, review Consumer Chemicals and Containers labelling and packaging separately; a cured keepsake differs from a resin kit.','resin',{specialist:true})
  ],
  toy_plush:[
    item('age_scope','Assess actual toy/collector status and foreseeable use by children under three','A 3+ or collector disclaimer is not evidence of legal exemption.','toys',{specialist:true}),
    item('seams_parts','Inspect seams, eyes, ornaments, gold emblem, stuffing and detachable parts','Document attachment construction and appropriate mechanical tests on actual samples.','toys',{specialist:true}),
    item('flammability','Verify soft-toy material and applicable flammability/coating safety tests','Supplier fabric name alone cannot prove flammability or toxicological compliance.','toys',{specialist:true}),
    item('filling_label','Verify applicable fibre/filling labelling and exemptions on actual plush packaging','Check whether the specific stuffed toy is exempt from parts of textile labelling law without assuming an exemption.','stuffed',{specialist:true})
  ]
});
export const SAMPLE_REVIEW_STATES_473=Object.freeze([
  {key:'unreviewed',label:'Not examined — HOLD'},
  {key:'observed',label:'Personally examined; reference attached (not approval)'},
  {key:'defect',label:'Observed concern or failure — STOP / HOLD'},
  {key:'expert_pending',label:'Specialist test, interpretation or applicability pending — HOLD'}
]);
export function sampleQuestions473(category){
  if(!SAFETY_CATEGORIES_462.some(x=>x.key===category)||category==='other'||category==='unclassified')return [];
  return [...COMMON,...(BY_CATEGORY[category]||[])];
}
export function sampleReference473(raw){
  const s=String(raw??'').trim();
  return s.length>=6&&s.length<=120&&!/[:][/][/]|[<>{}@?\\\x00-\x1f]/.test(s)?s:'';
}
export function evaluateSample473({productId,verifiedProductId,category,sampleId,lotReference,physicalPresent=false,checks={}}={}){
  const id=safetyProductId462(productId),verified=safetyProductId462(verifiedProductId),questions=sampleQuestions473(category);
  const sample=sampleReference473(sampleId),lot=sampleReference473(lotReference);
  const counts={observed:0,defect:0,pending:0,unreviewed:0};
  const holds=[];
  if(!id||verified!==id)holds.push('Load and match this exact saved original Product before reviewing a sample.');
  if(!sample||!lot)holds.push('Record an actual individual sample ID and original batch/lot reference.');
  if(physicalPresent!==true)holds.push('A responsible person has not confirmed having the physical sample in hand.');
  if(!questions.length)holds.push('Product category and all applicable regulations require human classification.');
  const reviewedQuestions=questions.map(q=>{
    const row=checks?.[q.key]||{},status=SAMPLE_REVIEW_STATES_473.some(x=>x.key===row.status)?row.status:'unreviewed';
    const evidenceReference=sampleReference473(row.reference)||null;
    if(status==='observed'&&evidenceReference){counts.observed++;if(q.specialist)holds.push(`Independent or qualified interpretation is still required for ${q.label.toLowerCase()}.`);}
    else if(status==='defect'){counts.defect++;holds.push(`STOP: Defect or safety concern recorded for ${q.label.toLowerCase()}.`);}
    else if(status==='expert_pending'){counts.pending++;holds.push(`Specialist evidence pending for ${q.label.toLowerCase()}.`);}
    else{counts.unreviewed++;holds.push(`No personally reviewed original evidence for ${q.label.toLowerCase()}.`);}
    return {key:q.key,question:q.label,state:status,source:CANADIAN_SAMPLE_SOURCES_473[q.source]?.url||null,evidence_reference:evidenceReference,requires_specialist_review:q.specialist};
  });
  holds.push('Qualified product-specific review of real physical tests, current law, claims and printed label is required before Canadian sale. This worksheet never authorizes or certifies a Product.');
  return {state:'HOLD_PHYSICAL_CANADIAN_SAMPLE_ACCEPTANCE',productId:id||null,category:category||'unclassified',sampleId:sample||null,lotReference:lot||null,
    physicallyInspected:physicalPresent===true,counts,checks:reviewedQuestions,holds,
    complianceApproved:false,labelApproved:false,productReleased:false,publicationAllowed:false,shippingAuthorized:false,providerWritesAllowed:false,serverReceiptCreated:false};
}
