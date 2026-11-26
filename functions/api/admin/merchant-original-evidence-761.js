// Build 761 — original authenticated Google Merchant, product image-byte and eWallet evidence.
// GET-only, owner-triggered, no external write, no credential/PII disclosure, no source fabrication.
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {merchantCoverage} from '../_lib/merchantSearchDistribution.js';
import {paymentExecutionStatus} from '../_lib/paymentExecution.js';

const hold=(reason,extra={})=>({status:'HOLD',reason,...extra});
const amount=x=>Number(x?.amountMicros);
const correctMoney=(m,expected=15000000)=>m?.currencyCode==='CAD'&&amount(m)===expected;
const equals=(v,n)=>Number.isFinite(Number(v))&&Number(v)===n;
const plain=s=>String(s??'').trim();
const matchingSiteUrl=value=>{
 try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='devilndove.com'&&
   (u.pathname==='/returns/'||u.pathname==='/returns/index.html');}catch{return false;}
};
export function assessGoogleShipping(settings){
 if(!settings||!Array.isArray(settings.services))return hold('GOOGLE_SHIPPING_UNREADABLE');
 const active=settings.services.filter(s=>s?.active===true&&Array.isArray(s.deliveryCountries)&&s.deliveryCountries.includes('CA'));
 if(!active.length)return hold('NO_ACTIVE_CANADA_SHIPPING');
 const details=active.map(s=>{
  const time=s.deliveryTime||{},groups=Array.isArray(s.rateGroups)?s.rateGroups:[];
  const flat=groups.length>0&&groups.every(r=>correctMoney(r?.singleValue?.flatRate));
  const timeMatch=equals(time.minHandlingDays,5)&&equals(time.maxHandlingDays,10)&&
   equals(time.minTransitDays,3)&&equals(time.maxTransitDays,15);
  const rates=flat&&s.currencyCode==='CAD';
  return {service:plain(s.serviceName).slice(0,75),rate_cad:rates?15:null,
   rate_matched:rates,handling_days_matched:timeMatch,active:true,delivery_country:'CA',
   shipping_labels_present:groups.some(r=>Array.isArray(r?.applicableShippingLabels)&&r.applicableShippingLabels.length>0)};
 });
 const pass=details.every(s=>s.rate_matched&&s.handling_days_matched&&!s.shipping_labels_present);
 return pass?{status:'MATCH',source:'LIVE_GOOGLE_MERCHANT_API',services:details}
   :hold('ACCOUNT_SHIPPING_DIFFERENT_OR_PARTIAL',{source:'LIVE_GOOGLE_MERCHANT_API',services:details});
}
export function assessGoogleReturns(raw){
 const policies=Array.isArray(raw?.onlineReturnPolicies)?raw.onlineReturnPolicies:[];
 const selected=policies.filter(p=>Array.isArray(p?.countries)&&p.countries.includes('CA')&&plain(p.label).toLowerCase()==='default');
 if(selected.length!==1)return hold('DEFAULT_CANADIAN_RETURN_POLICY_NOT_UNIQUE',{default_ca_count:selected.length});
 const p=selected[0],fixed=p.restockingFee?.fixedFee;
 const zeroRestock=!p.restockingFee||correctMoney(fixed,0)||amount(fixed)===0&&(!fixed?.currencyCode||fixed.currencyCode==='CAD');
 const pieces={
   label:'default',policy_id:plain(p.returnPolicyId).slice(0,32),
   country:'CA',uri_matches_site:matchingSiteUrl(p.returnPolicyUri),
   window_days:plain(p.policy?.type)==='NUMBER_OF_DAYS_AFTER_DELIVERY'?Number(p.policy.days):null,
   actual_buyer_return_postage:p.returnShippingFee?.type==='CUSTOMER_PAYING_ACTUAL_FEE',
   mail_supported:Array.isArray(p.returnMethods)&&p.returnMethods.includes('BY_MAIL'),
   no_restocking_fee:zeroRestock,
   refund_days:Number(p.processRefundDays||0)||null,
   defective_only:p.acceptDefectiveOnly===true
 };
 const pass=pieces.uri_matches_site&&pieces.window_days===14&&pieces.actual_buyer_return_postage&&
   pieces.mail_supported&&pieces.no_restocking_fee&&pieces.refund_days!==null&&pieces.refund_days<=10&&!pieces.defective_only;
 return pass?{status:'MATCH',source:'LIVE_GOOGLE_MERCHANT_API',policy:pieces}
   :hold('ACCOUNT_RETURNS_DIFFERENT_OR_PARTIAL',{source:'LIVE_GOOGLE_MERCHANT_API',policy:pieces});
}
export function assessWallet(url,env={}){
 const paypal=paymentExecutionStatus(url,env,'paypal'),stripe=paymentExecutionStatus(url,env,'stripe');
 // Never treat rendered payment options or configured credentials as completed money movement.
 const p={label:'PayPal',shown_in_checkout:true,provider_configured:paypal.configured===true,
  production_execution_authorized:paypal.execution_authorized===true,source_code:paypal.code};
 const s={label:'Stripe card checkout',shown_in_checkout:true,provider_configured:stripe.configured===true,
  production_execution_authorized:stripe.execution_authorized===true,source_code:stripe.code};
 return {status:p.production_execution_authorized?'SOURCE_READY_UNVERIFIED':'HOLD',
  reason:p.production_execution_authorized?'ORIGINAL_GUEST_CHECKOUT_PROVIDER_WITNESS_REQUIRED':'PAYPAL_PRODUCTION_EXECUTION_NOT_AUTHORIZED',
  sources:[p,s],google_wallet_verified:false,apple_pay_verified:false,amazon_pay_verified:false,
  provider_order_created:false,payment_performed:false,
  scorecard_verified:false,real_guest_payment_receipt_required:true};
}
// Data extraction from actual public image bytes, not D1 tags, filenames or generated thumbnails.
export function readOriginalImageDimensions(bytes){
 const a=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes||[]);
 if(a.length>=24&&a[0]===137&&a[1]===80&&a[2]===78&&a[3]===71){
  const v=new DataView(a.buffer,a.byteOffset,a.byteLength);
  return {type:'PNG',width:v.getUint32(16),height:v.getUint32(20)};
 }
 if(a.length>=12&&a[0]===255&&a[1]===216){
  let i=2;while(i+8<a.length){
   if(a[i]!==255){i++;continue;}
   while(i<a.length&&a[i]===255)i++;
   if(i>=a.length)break;
   const marker=a[i++];
   if(marker===0xda||marker===0xd9)break;
   if(marker>=0xd0&&marker<=0xd7||marker===0x01)continue;
   if(i+2>a.length)break;
   const size=a[i]*256+a[i+1];
   if(size<2||i+size>a.length)break;
   if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&size>=7)
    return {type:'JPEG',height:a[i+3]*256+a[i+4],width:a[i+5]*256+a[i+6]};
   i+=size;
  }
 }
 if(a.length>=30&&String.fromCharCode(...a.slice(0,4))==='RIFF'&&String.fromCharCode(...a.slice(8,12))==='WEBP'){
  const kind=String.fromCharCode(...a.slice(12,16));
  if(kind==='VP8X'){
   const w=1+a[24]+(a[25]<<8)+(a[26]<<16),h=1+a[27]+(a[28]<<8)+(a[29]<<16);
   return {type:'WEBP',width:w,height:h};
  }
  if(kind==='VP8 '&&a.length>=30&&a[23]===0x9d&&a[24]===0x01&&a[25]===0x2a)
   return {type:'WEBP',width:(a[26]|a[27]<<8)&0x3fff,height:(a[28]|a[29]<<8)&0x3fff};
 }
 return null;
}
async function boundedSourceBytes(response,limit=65536){
 const reader=response.body?.getReader?.();
 if(!reader){const a=new Uint8Array(await response.arrayBuffer());return a.slice(0,limit);}
 const pieces=[];let used=0;
 try{
  while(used<limit){
   const {done,value}=await reader.read();if(done)break;
   if(!value?.length)continue;
   const fragment=value.slice(0,limit-used);pieces.push(fragment);used+=fragment.length;
  }
 }finally{try{await reader.cancel();}catch{}}
 const out=new Uint8Array(used);let pos=0;for(const p of pieces){out.set(p,pos);pos+=p.length;}return out;
}
export async function probeOriginalImage(uri,requestFetch=fetch){
 let u;try{u=new URL(uri);}catch{return hold('IMAGE_URL_INVALID');}
 if(u.protocol!=='https:'||!['devilndove.com','www.devilndove.com'].includes(u.hostname)||
   !/^\/(?:media\/|api\/media\/|uploads\/|assets\/products\/|assets\/images\/products\/)/.test(u.pathname))
  return hold('IMAGE_SOURCE_NOT_TRUSTED',{host:u.hostname});
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),6500);
 try{
  const res=await requestFetch(u.href,{method:'GET',redirect:'error',cache:'no-store',headers:{Range:'bytes=0-65535',Accept:'image/*'},signal:ctrl.signal});
  if(!res.ok||![200,206].includes(res.status))return hold('IMAGE_FETCH_HTTP_'+res.status);
  const type=plain(res.headers.get('content-type')).toLowerCase();
  if(!/^image\/(?:jpeg|png|webp)(?:;|$)/.test(type))return hold('IMAGE_CONTENT_TYPE_UNSUPPORTED');
  const bytes=await boundedSourceBytes(res);
  const d=readOriginalImageDimensions(bytes);
  if(!d||!Number.isInteger(d.width)||!Number.isInteger(d.height)||d.width<=0||d.height<=0)
   return hold('ORIGINAL_IMAGE_DIMENSIONS_UNDECODABLE');
  const meets=d.width>1024&&d.height>1024;
  return {status:meets?'PIXEL_DIMENSIONS_VERIFIED':'LOW_RESOLUTION',
    width:d.width,height:d.height,format:d.type,
    image_bytes_sampled:bytes.length,verified_from:'LIVE_IMAGE_BYTES',high_resolution_dimensions:meets,
    photo_authenticity_certified:false,google_image_crawl_certified:false};
 }catch{return hold('IMAGE_SOURCE_FETCH_UNAVAILABLE');}
 finally{clearTimeout(timeout);}
}
async function readMerchantResource(path,token,requestFetch=fetch){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),7000);
 try{
  const url='https://merchantapi.googleapis.com/accounts/v1/'+path;
  const r=await requestFetch(url,{method:'GET',redirect:'error',cache:'no-store',
   headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:c.signal});
  if(!r.ok)return {ok:false,reason:'GOOGLE_HTTP_'+r.status};
  const data=await r.json().catch(()=>null);
  return data&&typeof data==='object'?{ok:true,data}:{ok:false,reason:'GOOGLE_INVALID_RESPONSE'};
 }catch{return {ok:false,reason:'GOOGLE_READ_TIMEOUT_OR_NETWORK'};}
 finally{clearTimeout(t);}
}
async function originalGoogleAccount(env){
 const id=plain(env.GOOGLE_MERCHANT_ACCOUNT_ID),token=plain(env.GOOGLE_MERCHANT_ACCESS_TOKEN);
 if(!/^[0-9]{5,20}$/.test(id)||token.length<20)
  return hold('GOOGLE_MERCHANT_OAUTH_OR_ACCOUNT_NOT_CONNECTED',{
   api_read_performed:false,provider_writes_performed:false,merchant_account_configured:/^[0-9]{5,20}$/.test(id),
   oauth_token_configured:token.length>=20,shipping:hold('NOT_VERIFIED'),returns:hold('NOT_VERIFIED')
  });
 const base='accounts/'+id+'/';
 const ship=await readMerchantResource(base+'shippingSettings',token);
 const returns=await readMerchantResource(base+'onlineReturnPolicies',token);
 const shipping=ship.ok?assessGoogleShipping(ship.data):hold(ship.reason);
 const returnPolicy=returns.ok?assessGoogleReturns(returns.data):hold(returns.reason);
 const status=shipping.status==='MATCH'&&returnPolicy.status==='MATCH'?'LIVE_ACCOUNT_POLICIES_MATCH':'HOLD';
 return {status,source:'GOOGLE_MERCHANT_API_V1_READ_ONLY',account_id:id,
  api_read_performed:true,shipping,returns:returnPolicy,provider_writes_performed:false,
  google_store_quality_score_not_accessed:true,google_account_login_not_inferred:true};
}
export async function onRequestGet(context){
 const user=await getAdminUserFromRequest(context.request,context.env);
 if(!user)return jsonResponse({ok:false,error:'Admin access required'},401,{'Cache-Control':'no-store'});
 const db=getDb(context.env);
 if(!db)return jsonResponse({ok:false,error:'Database unavailable'},503,{'Cache-Control':'no-store'});
 // An explicit authenticated Admin click is the only caller. No scheduled tasks.
 const account=await originalGoogleAccount(context.env);
 const coverage=await merchantCoverage(db,context.env);
 const sample=[...(coverage.eligible||[]),...(coverage.blocked||[])].filter(p=>p.image_link).slice(0,4);
 const media=[];
 for(const p of sample){
  const imgs=[p.image_link,...(p.additional_image_links||[]).slice(0,1)];
  const proofs=await Promise.all(imgs.map(async(uri,i)=>({
    position:i===0?'primary':'additional',
    ...await probeOriginalImage(uri)
  })));
  media.push({product_id:p.product_id,title:plain(p.title).slice(0,85),
   source_image_count:p.image_count,high_resolution_verified:proofs.every(x=>x.high_resolution_dimensions===true),
   images:proofs});
 }
 const allImagesVerified=media.length>0&&media.every(p=>p.high_resolution_verified);
 const imageStatus=allImagesVerified?'SAMPLED_IMAGES_DIMENSIONS_VERIFIED':'HOLD';
 const payment=assessWallet('https://devilndove.com/checkout/',context.env);
 return jsonResponse({ok:true,build:761,mode:'ADMIN_CLICK_ONLY_ORIGINAL_EVIDENCE',generated_at:new Date().toISOString(),
   account,media:{status:imageStatus,checked_product_count:media.length,feed_eligible_count:coverage.eligible.length,
    feed_blocked_count:coverage.blocked.length,products:media,all_catalog_items_certified:false,
    actual_visual_photo_quality_certified:false,google_image_crawl_certified:false},
   payment,release_status:'SOURCE_DIAGNOSTIC_ONLY_NOT_MERCHANT_CERTIFICATION',
   original_external_account_policy_proof:account.status==='LIVE_ACCOUNT_POLICIES_MATCH',
   google_store_quality_verified:false,provider_mutations:0,d1_mutations:0,
   no_automatic_account_submission:true},200,{'Cache-Control':'no-store'});
}
