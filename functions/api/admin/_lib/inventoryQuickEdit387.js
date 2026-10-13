// Build 387: integer-cent estimate only. Canadian rates are operator-entered, default 13% for Ontario.
export function costTaxEstimate(value, ratePercent = 13, included = false) {
 const cents=Number(value),rate=Number(ratePercent);
 if(!Number.isSafeInteger(cents)||cents<0||cents>1000000000)throw Error('Enter a valid purchase amount in cents.');
 if(!Number.isFinite(rate)||rate<0||rate>30||Math.round(rate*100)!==rate*100)throw Error('Tax rate must be 0–30% with up to 2 decimals.');
 const bps=Math.round(rate*100);
 const tax=included?Math.round(cents*bps/(10000+bps)):Math.round(cents*bps/10000);
 const net=included?cents-tax:cents,gross=net+tax;
 return {purchase_cost_entered_cents:cents,tax_rate_basis_points:bps,tax_included:included?1:0,
  net_unit_cost_cents:net,tax_estimate_cents:tax,gross_unit_cost_cents:gross};
}
export function validQuickEdit(input) {
 const qty=Number(input.on_hand_quantity),ratio=Number(input.usage_units_per_stock_unit);
 const labels=[String(input.stock_unit_label||'').trim().toLowerCase(),String(input.usage_unit_label||'').trim().toLowerCase()];
 if(!Number.isFinite(qty)||qty<0||qty>1e9||Math.round(qty*1e6)!==qty*1e6)throw Error('On-hand quantity must be 0–1,000,000,000 with up to six decimals.');
 if(!Number.isFinite(ratio)||ratio<=0||ratio>1e9||Math.round(ratio*1e6)!==ratio*1e6)throw Error('Units per stock unit must be positive with up to six decimals.');
 if(labels.some(x=>!x||x.length>40||!/^[a-z0-9 ._/-]+$/.test(x)))throw Error('Unit labels must contain 1–40 ordinary characters.');
 const note=String(input.note||'').trim();if(note.length<12||note.length>500)throw Error('Enter a factual correction reason (12–500 characters).');
 return {on_hand_quantity:qty,usage_units_per_stock_unit:ratio,stock_unit_label:labels[0],usage_unit_label:labels[1],note};
}
