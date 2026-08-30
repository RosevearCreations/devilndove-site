const SHAPES = {
  custom_request_order_status_links: ['custom_request_order_status_link_id','custom_request_id','order_id','order_status_token','link_status','customer_email','customer_name','created_by_user_id','created_at','updated_at','order_stage','stage_notes','stage_updated_at','expired_at','voided_at'],
  custom_request_quote_share_links: ['custom_request_quote_share_link_id','custom_request_id','quote_draft_id','share_token','share_status','customer_name','customer_email','title','quote_total_cents','scope_summary','payment_summary_json','expires_at','accepted_at','declined_at','customer_response_note','created_by_user_id','created_at','updated_at','voided_at','expired_at','lifecycle_note'],
  custom_request_quote_drafts: ['custom_request_quote_draft_id','custom_request_id','quote_status','title','scope_notes','estimated_budget_cents','quote_key','updated_at','material_cost_cents','labor_cost_cents','pickup_shipping_cents','tax_estimate_cents','quote_total_cents'],
  custom_request_quote_line_items: ['custom_request_quote_line_item_id','custom_request_id','quote_draft_id','line_type','line_label','quantity','unit_amount_cents','line_amount_cents','is_taxable','line_status','sort_order','created_by_user_id','updated_by_user_id','created_at','updated_at'],
  custom_request_quote_revisions: ['custom_request_quote_revision_id','custom_request_id','quote_draft_id','revision_type','revision_status','revision_notes','snapshot_json','created_by_user_id','created_at'],
  custom_request_payment_request_drafts: ['custom_request_payment_request_draft_id','custom_request_id','quote_draft_id','share_link_id','payment_request_key','payment_request_status','request_type','amount_cents','tax_cents','currency','customer_name','customer_email','due_date','review_notes','source_payload_json','created_by_user_id','reviewed_by_user_id','reviewed_at','created_at','updated_at'],
  custom_request_order_drafts: ['custom_request_order_draft_id','custom_request_id','quote_draft_id','share_link_id','order_draft_key','order_draft_status','customer_name','customer_email','subtotal_cents','shipping_cents','tax_cents','total_cents','currency','fulfillment_notes','source_payload_json','created_by_user_id','reviewed_by_user_id','reviewed_at','created_at','updated_at'],
  custom_request_payment_links: ['custom_request_payment_link_id','custom_request_id','payment_request_draft_id','quote_draft_id','payment_link_key','link_token','link_status','link_url_path','request_type','amount_cents','tax_cents','currency','customer_name','customer_email','provider','provider_reference','approval_notes','customer_viewed_at','customer_ready_at','customer_note','approved_by_user_id','approved_at','created_at','updated_at','viewed_at','ready_to_pay_at','customer_ready_note','order_id','payment_id','external_share_status','gate_status','preferred_provider','checkout_redirect_url','expired_at','voided_at','lifecycle_note'],
  custom_request_payment_checkout_records: ['custom_request_payment_checkout_record_id','custom_request_id','payment_link_id','order_id','payment_id','provider','checkout_status','provider_order_id','provider_payment_id','redirect_url','mode','source_payload_json','created_by_user_id','created_at','updated_at']
};
function rows(result){return Array.isArray(result?.results)?result.results:[];}
async function tableHasColumns(db,tableName,required){
  if(!db)return false;
  const result=await db.prepare(`PRAGMA table_info(${tableName})`).all().catch(()=>({results:[]}));
  const columns=new Set(rows(result).map(row=>String(row?.name||'').trim()).filter(Boolean));
  return required.every(name=>columns.has(name));
}
async function hasAll(db,names){for(const name of names){if(!(await tableHasColumns(db,name,SHAPES[name])))return false;}return true;}
export async function hasCustomRequestOrderSchema(db){return hasAll(db,['custom_request_order_status_links']);}
export async function hasCustomRequestQuoteSchema(db){return hasAll(db,['custom_request_quote_share_links','custom_request_quote_drafts','custom_request_quote_line_items','custom_request_quote_revisions','custom_request_payment_request_drafts','custom_request_order_drafts']);}
export async function hasCustomRequestPaymentSchema(db){return hasAll(db,['custom_request_quote_drafts','custom_request_payment_links','custom_request_payment_checkout_records']);}
