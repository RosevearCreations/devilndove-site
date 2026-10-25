/* Build 464: real-order owner pilot. This is not a shipment, contact, refund or exchange executor. */
export const PILOT_ROUTES_464=Object.freeze([
 {key:'packing',label:'Protective packing review',event_kind:'packing_review',mode:'shipping',needs_consent:true,needs_payment:true},
 {key:'shipment',label:'Actual Canadian carrier receipt',event_kind:'shipping_receipt',mode:'shipping',needs_consent:true,needs_payment:true},
 {key:'pickup',label:'Actual local pickup receipt',event_kind:'pickup_receipt',mode:'pickup',needs_consent:true,needs_payment:true},
 {key:'damage',label:'Damage report — hold & investigation',event_kind:'damage_hold',mode:'any',needs_consent:false,needs_payment:false},
 {key:'refund',label:'Return — manual refund review ONLY',event_kind:'return_hold',mode:'any',needs_consent:false,needs_payment:false},
 {key:'exchange',label:'Return — manual exchange review ONLY',event_kind:'return_hold',mode:'any',needs_consent:false,needs_payment:false},
 {key:'repair',label:'Repair — owner-reviewed follow-up',event_kind:'repair_followup',mode:'any',needs_consent:true,needs_payment:false},
 {key:'aftercare',label:'Aftercare — consent reviewed, no message',event_kind:'aftercare_followup',mode:'any',needs_consent:true,needs_payment:false}
]);
const clean=(v,max=160)=>String(v??'').trim().slice(0,max);
const confirmedPayment=new Set(['paid','completed','captured']);
const closedOrder=new Set(['cancelled','canceled','refunded']);
const positiveId=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
export function evaluatePilot464({detail,fulfillment,form={}}={}){
 const holds=[],route=PILOT_ROUTES_464.find(x=>x.key===form.route),order=detail?.order;
 if(!route)holds.push('Choose a defined pilot path.');
 if(detail?.ok!==true||!order||!positiveId(order.order_id)||detail?.diagnostics?.warnings?.length)
  holds.push('An unambiguous canonical order and complete order detail are required; partial fallback data is HOLD.');
 if(fulfillment?.ok!==true||!fulfillment?.order||!Array.isArray(fulfillment.evidence))
  holds.push('The original Build 454 append-only evidence source must load; no fabricated carrier or pickup receipts.');
 if(order&&fulfillment?.order&&(positiveId(order.order_id)!==positiveId(fulfillment.order.order_id)||String(order.order_number||'')!==String(fulfillment.order.order_number||'')||String(order.order_status||'')!==String(fulfillment.order.order_status||'')))
  holds.push('Canonical Orders and fulfillment evidence disagree; refresh original records before any receipt.');
 if(order&&String(order.currency||'').toUpperCase()!=='CAD')holds.push('The verified order must be in CAD; no foreign-currency pilot fulfillment.');
 if(route?.mode==='shipping'&&order&&(String(order.fulfillment_type||'').toLowerCase()!=='shipping'||String(order.shipping_country||'').toUpperCase()!=='CA'))
  holds.push('Canada-only shipping is required; U.S. shipping remains suspended.');
 if(route?.mode==='pickup'&&order&&String(order.fulfillment_type||'').toLowerCase()!=='pickup')holds.push('Only original local-pickup orders can receive pickup evidence.');
 if(route?.needs_payment&&order&&!confirmedPayment.has(String(order.payment_status||'').toLowerCase()))
  holds.push('Original Orders payment status is not paid/captured; review settlement independently before fulfillment.');
 if(route?.needs_payment&&order&&closedOrder.has(String(order.order_status||'').toLowerCase()))
  holds.push('Cancelled/refunded orders cannot receive outbound-fulfillment receipts.');
 if(route?.needs_consent&&(form.consent_state!=='verified'||clean(form.consent_reference,120).length<8))
  holds.push('Personally check the real customer instruction/consent at its original source and record a specific private reference. No contact is sent here.');
 if(!form.owner_observed)holds.push('The operator must attest to reviewing the actual order and independent real-world evidence.');
 if(clean(form.review_note,1200).length<24)holds.push('Describe the factual observation or unresolved issue in at least 24 characters.');
 if(route?.key==='shipment'&&(!clean(form.carrier,120)||!clean(form.tracking_reference,160)||!clean(form.receipt_reference,160)))
  holds.push('Actual carrier, tracking and independent postage receipt references are required.');
 if(route?.key==='pickup'&&!clean(form.receipt_reference,160))holds.push('Actual local pickup receipt reference is required.');
 const evidenceCount=Array.isArray(fulfillment?.evidence)?fulfillment.evidence.length:0;
 const actionable=holds.length===0;
 return Object.freeze({state:actionable?'READY_TO_APPEND_OWNER_REVIEW':'HOLD_SOURCE_OR_OWNER_REVIEW',holds,route:route?.key||null,event_kind:route?.event_kind||null,
  order_id:positiveId(order?.order_id),evidence_count:evidenceCount,history_truncated:Boolean(fulfillment?.history_truncated),
  operator_attested:!!form.owner_observed,external_customer_consent_independently_verified:false,
  payment_execution:false,refund_execution:false,exchange_execution:false,carrier_booking:false,customer_message:false,
  automatic_order_transition:false,automatic_inventory_mutation:false,real_world_pilot_accepted:false,can_append_existing_receipt:actionable});
}
export function pilotPayload464({decision,form,orderId,requestKey}){
 if(!decision?.can_append_existing_receipt||!positiveId(orderId)||decision.order_id!==positiveId(orderId)||!/^\w{16,80}$/.test(String(requestKey||'')))return null;
 const note=`Build 464 owner pilot; route=${decision.route}; customer consent=${form.consent_state==='verified'?'MANUALLY_ATTESTED':'NOT_VERIFIED'}; original consent ref=${clean(form.consent_reference,120)||'HOLD'}; financial/provider action=NONE. ${clean(form.review_note,800)}`;
 return {order_id:positiveId(orderId),event_kind:decision.event_kind,request_key:requestKey,review_note:note.slice(0,1200),
  package_instructions:clean(form.package_instructions,1200),carrier:decision.route==='shipment'?clean(form.carrier,120):'',
  tracking_reference:decision.route==='shipment'?clean(form.tracking_reference,160):'',
  receipt_reference:['shipment','pickup'].includes(decision.route)?clean(form.receipt_reference,160):clean(form.receipt_reference,160)};
}
