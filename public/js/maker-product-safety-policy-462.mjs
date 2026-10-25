/* Build 462 — Canadian maker safety operator questions, never legal certification. */
export const CANADA_SAFETY_SOURCES_462=Object.freeze({
 ccpsa:{title:'Health Canada — Canada Consumer Product Safety Act guide',url:'https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/canada-consumer-product-safety-act-guide.html'},
 packaging:{title:'Competition Bureau — prepackaged non-food labelling',url:'https://competition-bureau.canada.ca/en/labelling/prepackaged-non-food-consumer-products/what-must-be-label'},
 incident:{title:'Health Canada — mandatory consumer-product incident reporting',url:'https://www.canada.ca/en/health-canada/services/consumer-product-safety/legislation-guidelines/acts-regulations/canada-consumer-product-safety-act/industry/guide-mandatory-reporting-section-14.html'},
 candles:{title:'Health Canada — candle safety',url:'https://www.canada.ca/en/health-canada/services/healthy-living/your-health/products/candle-safety.html'},
 cosmetics:{title:'Health Canada — industry cosmetic labels',url:'https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/labelling-cosmetics.html'},
 cosmeticNotify:{title:'Health Canada — cosmetic notification',url:'https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/notification-cosmetics.html'},
 cosmeticClass:{title:'Health Canada — what is a cosmetic?',url:'https://www.canada.ca/en/health-canada/services/cosmetics/what-is-cosmetic.html'},
 jewellery:{title:'Health Canada — children’s jewellery industry guidance',url:'https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/guide-children-jewellery/guidance-document.html'},
 toys:{title:'Health Canada — toys and soft-toy safety guidance',url:'https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/industry-guide-safety-requirements-children-toys-related-products-summary/guidance-document.html'},
 textile:{title:'Competition Bureau — filled/stuffed textile labelling',url:'https://competition-bureau.canada.ca/en/labelling/textile-labelling/guide-labelling-stuffed-or-filled-textile-articles'}
});

export const SAFETY_CATEGORIES_462=Object.freeze([
 {key:'unclassified',label:'Not classified yet — keep HOLD',sources:['ccpsa','packaging']},
 {key:'jewellery_adult',label:'Adult jewellery and metal pieces',sources:['ccpsa','packaging']},
 {key:'jewellery_child',label:'Jewellery that appeals primarily to children under 15',sources:['jewellery','ccpsa','packaging']},
 {key:'candles',label:'Candles / wax goods for burning',sources:['candles','ccpsa','packaging']},
 {key:'cosmetics_soap',label:'Body soap, skincare, cosmetic or bath product',sources:['cosmeticClass','cosmetics','cosmeticNotify','packaging']},
 {key:'toy_plush',label:'Children’s toys, plush and soft toys',sources:['toys','textile','packaging']},
 {key:'resin_fabrication',label:'Resin, polymer clay or fabricated household pieces',sources:['ccpsa','packaging']},
 {key:'other',label:'Other / mixed goods — specialist classification needed',sources:['ccpsa','packaging']}
]);

const question=(key,label,help,source)=>Object.freeze({key,label,help,source});
const COMMON=Object.freeze([
 question('identity','Confirm Product identity, intended use and actual audience','Compare the exact Product record, item photograph and how it is advertised. A marketing age label does not by itself determine legal classification.','ccpsa'),
 question('trace','Trace this piece/batch to real materials, lot and original maker/QA records','Identify actual lot/component sources and finished-piece/quality records. A typed number alone is not proof.','ccpsa'),
 question('package','Review the applicable non-food package label','Determine whether Consumer Packaging and Labelling rules apply, including product identity, net quantity, dealer identification, accuracy and applicable language rules or exemptions.','packaging'),
 question('incident','Review hazards, complaints, incident and recall escalation','Check foreseeable hazards and incident reporting duties. Never treat a completed checklist as safety clearance.','incident')
]);
const SPECIAL=Object.freeze({
 jewellery_adult:[question('jewel_finish','Inspect edges, fastening, components and actual intended use','Document material identity, sharp edges, mechanical failures and skin-contact claims without asserting certification.','ccpsa')],
 jewellery_child:[question('child_scope','Determine child-directed jewellery scope','Review sizing, decoration, packaging, promotion and intended/foreseeable use; jewellery appealing primarily to under-15s has specific requirements.','jewellery'),question('child_metals','Obtain applicable lead/cadmium component evidence','Read the current limits and test guidance; do not infer compliance from metal colour, a supplier claim or a home test.','jewellery'),question('child_parts','Assess detachable parts and ingestion/choking hazards','Inspect small/detachable components and labelling; specialist test evidence may be required.','jewellery')],
 candles:[question('candle_burn','Document real burn, flame, stability and container tests','Evaluate the actual wick, wax, vessel, multi-wick configuration, heat, soot, tipping, ignition and batch variability.','candles'),question('candle_warning','Check actual use/burn warning and instructions','Review fire precautions, trimming, supervision and placement instructions on the physical item; do not auto-generate a certified warning label.','candles'),question('candle_ingredients','Review fragrance, colour and other constituent hazards','Use ingredient/supplier records and applicable requirements; do not assume all scented items share one regulatory classification.','ccpsa')],
 cosmetics_soap:[question('cosmetic_scope','Determine cosmetic/soap classification and claims','Body soaps are commonly cosmetics; therapeutic/drug claims may change the applicable regime. Confirm before using this review.','cosmeticClass'),question('cosmetic_ingredients','Review actual formula, restricted ingredients, INCI and label','Verify the formula and ingredient listing, warnings, identity and applicable bilingual requirements against current rules.','cosmetics'),question('cosmetic_notification','Check applicable Health Canada cosmetic notification','Manufacturers/importers generally must notify within 10 days after first Canadian sale. Filing is not product approval; do not invent a filing or first-sale date.','cosmeticNotify'),question('cosmetic_batch','Trace sanitation, allergens/hazards, batch and intended use','Inspect factual manufacturing and batch records and determine any special warnings from real formulation.','cosmetics')],
 toy_plush:[question('toy_class','Determine real toy classification and foreseeable ages','A collector or 3+ label does not by itself exclude toy rules or under-three foreseeable use.','toys'),question('toy_mechanics','Review eyes, seams, stuffing, attachment and small parts','Review applicable mechanical hazards and age-related testing with actual samples; no assumptions from a photograph.','toys'),question('toy_flame','Check applicable soft-toy flammability and material evidence','Verify relevant flammability, surface coatings and other Toys Regulations tests; do not mark a fabric safe from its trade name.','toys'),question('toy_textile','Review whether filled/textile article label rules apply','Check textile-filling/cover fibre, dealer and possible exclusions using Competition Bureau guidance.','textile')],
 resin_fabrication:[question('resin_use','Review actual cure, material composition and exposure hazards','Check cure and finished-piece safety. Food contact, skin use, toys, heat resistance or other special claims require a separate applicable-regime review.','ccpsa'),question('fabricated_edges','Inspect heat, edges, brittle parts and functional misuse','A successful machine run is not evidence of consumer-product safety; review physical failure modes.','ccpsa')]
});

export function safetyQuestions462(category){
 const selected=SAFETY_CATEGORIES_462.find(c=>c.key===category);
 if(!selected)return [];
 return [...COMMON,...(SPECIAL[category]||[])];
}
export function safetyProductId462(raw){const x=String(raw??'');return /^[1-9]\d{0,9}$/.test(x)?Number(x):0;}
export function safetyEvidenceRef462(raw){
 const x=String(raw??'').trim();return x.length>=6&&x.length<=140&&!/[<>\x00-\x1f]/.test(x)?x:'';
}
export function evaluateSafety462({productId=0,product=null,category='',checks={},ownerTrial=null,projectId=0,scenario=''}={}){
 const id=safetyProductId462(productId),realId=safetyProductId462(product?.product_id),group=SAFETY_CATEGORIES_462.find(x=>x.key===category)||null;
 const questions=safetyQuestions462(category);const reviewed=questions.filter(q=>checks?.[q.key]?.reviewed===true&&safetyEvidenceRef462(checks[q.key]?.reference));
 const holds=[];
 if(!id||!product||id!==realId)holds.push('A matching current original Product is required.');
 if(!group||category==='unclassified'||category==='other')holds.push('Product classification and applicable regulatory regime need human determination.');
 if(group&&reviewed.length!==questions.length)holds.push(`${questions.length-reviewed.length} of ${questions.length} questions have no personal review and specific evidence reference.`);
 const trialRows=Array.isArray(ownerTrial?.history)?ownerTrial.history:[];
 const latestSafety=trialRows.find(x=>x.checkpoint_key==='physical_safety')||null;
 const validTrial=Boolean(ownerTrial?.ok&&safetyProductId462(projectId)>0&&
   Number(ownerTrial.selected?.creative_work_project_id)===safetyProductId462(projectId)&&
   latestSafety?.scenario_key===scenario&&latestSafety?.decision==='accepted'&&
   latestSafety.personally_observed===1&&latestSafety.source_kind!=='none'&&Number(latestSafety.source_id)>0);
 if(!validTrial)holds.push('No linked personally observed original physical-safety owner review receipt was verified for the selected Creative Project.');
 if(ownerTrial?.history_truncated)holds.push('Only the latest 120 owner receipts were loaded; older review history requires separate inspection.');
 holds.push('A qualified human must review applicable current law, physical evidence, claims and final printed label before sale; this tool never certifies or releases a Product.');
 return Object.freeze({state:'HOLD_CANADIAN_SAFETY_OWNER_REVIEW',productId:id||null,category:group?.key||null,reviewed:reviewed.length,total:questions.length,
  ownerReceiptId:validTrial?Number(latestSafety.maker_owner_trial_review_id)||null:null,holds,
  publicationAllowed:false,certified:false,labelApproved:false,providerWritesAllowed:false,productMutationAllowed:false});
}
