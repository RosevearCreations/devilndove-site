/* Build 503 — tell the owner WHICH Etsy step failed and whether rechecking is safe.
 * Pure presentation logic only. This never authorizes or retries a provider write. */
const text=value=>String(value??'').trim();
export function etsyStep503(path,body){
  const action=text(body?.action),url=text(path);
  if(url.includes('product-channel-intent'))return {label:'Etsy checkbox and saved destination',kind:'read'};
  if(url.includes('product-etsy-unified-approval'))return {label:'Complete-package owner approval',kind:'local-write'};
  if(url.includes('product-etsy-existing-draft')){
    if(action==='inspect_listing')return {label:'Verify the existing Etsy draft and Canada-only shipping',kind:'read'};
    if(action==='link_existing')return {label:'Save Etsy listing ID against Product #53',kind:'local-write'};
    if(action==='update_saved_fields')return {label:'Update the existing Etsy draft’s title, description, price and stock',kind:'etsy-write'};
    return {label:'Read the saved Etsy listing ID',kind:'read'};
  }
  if(url.includes('product-distribution-406'))return {label:'Check Product gallery and photograph approvals',kind:'read'};
  if(url.includes('product-etsy-images'))return action==='transfer_one'?
    {label:`Upload approved Product photo #${Number(body.product_image_id)||'?'}`,kind:'etsy-write'}:
    {label:'Check approved Product photos and Etsy photo receipts',kind:'read'};
  if(url.includes('product-etsy-tags'))return action==='update_native_tags'?
    {label:'Update the existing Etsy draft’s search tags',kind:'etsy-write'}:
    {label:'Check saved Product/Etsy search tags',kind:'read'};
  if(url.includes('product-etsy-advanced-sync'))return action==='sync_metadata_once'?
    {label:'Update advanced Etsy listing details',kind:'etsy-write'}:
    {label:'Check advanced Etsy listing details',kind:'read'};
  if(url.includes('product-etsy-draft'))return action==='create_draft'?
    {label:'Create a new unpublished Etsy draft',kind:'etsy-write'}:
    {label:'Check Etsy account, category and Canada-only shipping',kind:'read'};
  return {label:'Check the saved Etsy Product package',kind:body?'local-write':'read'};
}
export function etsyFailure503(path,body,error){
  const step=etsyStep503(path,body),status=Number(error?.httpStatus||error?.status||0);
  const ray=text(error?.cloudflareRay);
  const ref=ray&&/^[a-z0-9-]{8,90}$/i.test(ray)?` Cloudflare reference: ${ray}.`:'';
  const failed=status>=500||status===0;
  const cause=failed?`Devil n Dove's server returned ${status?`HTTP ${status}`:'no response'}; this is not a missing Product field.`:
    text(error?.message)||'This check could not finish.';
  const next=step.kind==='read'?'No Etsy changes were requested by this check. Retry the READ when the server is available.':
    step.kind==='local-write'?'The local approval or listing-ID link might have saved. Refresh the saved Etsy ID before another attempt; never create a duplicate.':
    'An Etsy change might have happened. Check the SAME Etsy draft and its receipts before attempting another update; never create a duplicate.';
  return `${step.label}: ${cause}${ref} ${next}`;
}
export function etsyFixLocation503(issues){
  const first=Array.isArray(issues)?issues.find(Boolean):'';
  if(/photo|image|gallery|R2|media|original|public.use|permission/i.test(first))return {tab:'media',label:'Fix photographs'};
  if(/tag|phrase|keyword|search/i.test(first))return {tab:'seo',label:'Fix Product search tags'};
  if(/description|product details|materials/i.test(first))return {tab:'description',label:'Fix Product description'};
  return null;
}
