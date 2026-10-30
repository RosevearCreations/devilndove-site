/* Build 521: compare a possibly completed Product save with one authoritative
 * Product detail GET. Never make, schedule or infer another write. */
export const PRODUCT_SAVE_FIELDS_521=Object.freeze([
  'name','slug','sku','product_category','color_name','color_names_text','shipping_code',
  'review_status','short_description','description','product_type','status',
  'price_cents','compare_at_price_cents','currency','taxable','tax_class_id',
  'requires_shipping','weight_grams','inventory_tracking','inventory_quantity',
  'digital_file_url','featured_image_url','sort_order','meta_title','meta_description',
  'keywords','h1_override','canonical_url','og_title','og_description','og_image_url',
  'merchandise_origin','sale_channel','external_listing_url','external_listing_label',
  'condition_summary','era_label','sourcing_notes'
]);
const numberFields=new Set(['price_cents','compare_at_price_cents','taxable','tax_class_id',
  'requires_shipping','weight_grams','inventory_tracking','inventory_quantity','sort_order']);
const canonical=(name,value)=>value==null||value===''?'':numberFields.has(name)?
  (Number.isFinite(Number(value))?String(Number(value)):'INVALID_NUMBER'):String(value).trim();

export function compareUncertainProductSave521({productId,submitted,saved}={}){
  if(!Number.isSafeInteger(Number(productId))||Number(productId)<1||
    Number(saved?.product_id)!==Number(productId)||!submitted||typeof submitted!=='object')
    return {reviewed:false,savedMatch:false,different:[],unavailable:[],matching:[],fieldSnapshots:[],
      next:'Product identity or authoritative server data is unavailable. Keep the browser draft and do not retry the write.'};
  const different=[],unavailable=[],matching=[],fieldSnapshots=[];
  for(const field of PRODUCT_SAVE_FIELDS_521){
    if(!Object.hasOwn(submitted,field)||!Object.hasOwn(saved,field)){
      unavailable.push(field);fieldSnapshots.push({field,status:'unavailable',browser:submitted[field]??null,server:null});continue;
    }
    const same=canonical(field,submitted[field])===canonical(field,saved[field]);
    (same?matching:different).push(field);
    if(!same)fieldSnapshots.push({field,status:'different',browser:submitted[field],server:saved[field]});
  }
  return {reviewed:true,savedMatch:different.length===0&&unavailable.length===0,
    different,unavailable,matching,fieldSnapshots,
    next:different.length||unavailable.length?
      'Some saved fields differ or could not be independently returned. Choose to keep the current server record, or restore the preserved browser draft for careful review. Nothing will be re-sent automatically.':
      'Every submitted Product field matches the authoritative server record. Do not repeat the earlier Save. The saved Etsy ID and gallery can now be reviewed without redoing Product creation.'};
}
