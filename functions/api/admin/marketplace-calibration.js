import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { readChannelPolicy, marketplaceSchemaStatus, jsonArray } from '../_lib/marketplaceReadiness.js';
import { evaluateMarketplaceCalibration, MARKETPLACE_CALIBRATION_RELEASE, MARKETPLACE_CALIBRATION_CONTRACT } from '../_lib/marketplaceCalibration.js';

function text(v){ return String(v ?? '').trim(); }
function rows(r){ return Array.isArray(r?.results) ? r.results : []; }

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request, context.env);
  if(!adminUser) return jsonResponse({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env);
  if(!db) return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  const schema=await marketplaceSchemaStatus(db);
  if(!schema.ready) return jsonResponse({ok:true,release:MARKETPLACE_CALIBRATION_RELEASE,contract:MARKETPLACE_CALIBRATION_CONTRACT,schema_ready:false,missing_tables:schema.missing_tables,provider_execution_allowed:false,publication_allowed:false,channels:[]});

  const url=new URL(context.request.url);
  const requested=text(url.searchParams.get('channel')).toLowerCase();
  const channelKeys=requested ? [requested] : ['etsy','facebook','pinterest','tiktok','manual'];
  const quarter=text(url.searchParams.get('quarter')) || `${new Date().getUTCFullYear()}-Q${Math.floor(new Date().getUTCMonth()/3)+1}`;
  const match=/^(\d{4})-Q([1-4])$/.exec(quarter);
  if(!match) return jsonResponse({ok:false,error:'quarter must be YYYY-Q1 through YYYY-Q4'},400);
  const year=Number(match[1]); const q=Number(match[2]); const startMonth=(q-1)*3+1;
  const start=`${year}-${String(startMonth).padStart(2,'0')}-01`;
  const endYear=startMonth+3>12 ? year+1 : year;
  const endMonth=((startMonth+2)%12)+1;
  const end=`${endYear}-${String(endMonth).padStart(2,'0')}-01`;

  const providerRows=rows(await db.prepare('SELECT provider_key,setup_status,enabled,setup_authority FROM provider_setup_authorities ORDER BY provider_key').all().catch(()=>({results:[]})));
  const providers=new Map(providerRows.map((r)=>[text(r.provider_key),r]));
  const profileResult=await db.prepare(`SELECT p.*, pr.name, pr.sku, pr.slug, pr.price_cents, pr.quantity, pr.description, pr.short_description
    FROM marketplace_listing_profiles p LEFT JOIN products pr ON pr.id=p.product_id
    WHERE p.channel_key IN (${channelKeys.map(()=>'?').join(',')}) ORDER BY p.channel_key,p.product_id LIMIT 300`).bind(...channelKeys).all().catch(()=>({results:[]}));
  const profiles=rows(profileResult);
  const imageResult=await db.prepare(`SELECT channel_key,product_id,image_url,alt_text,sort_order FROM marketplace_export_image_selections
    WHERE channel_key IN (${channelKeys.map(()=>'?').join(',')}) ORDER BY channel_key,product_id,sort_order`).bind(...channelKeys).all().catch(()=>({results:[]}));
  const images=rows(imageResult);
  const costs=rows(await db.prepare(`SELECT provider,marketplace_channel,cost_type,payout_reference,amount_cents,currency FROM commerce_transaction_costs
    WHERE COALESCE(occurred_at,created_at)>=? AND COALESCE(occurred_at,created_at)<?`).bind(start,end).all().catch(()=>({results:[]})));

  const out=[];
  for(const channel of channelKeys){
    const policy=await readChannelPolicy(db,channel);
    if(!policy){ out.push({channel,schema_ready:true,missing_policy:true,provider_execution_allowed:false,publication_allowed:false}); continue; }
    const provider=providers.get(text(policy.provider_key)) || {};
    const channelProfiles=profiles.filter((p)=>text(p.channel_key)===channel);
    const channelCosts=costs.filter((c)=>text(c.marketplace_channel)===channel || text(c.provider)===text(policy.provider_key));
    const commerce={cost_row_count:channelCosts.length,payout_reference_count:channelCosts.filter((c)=>text(c.payout_reference)).length,total_cost_cents:channelCosts.reduce((n,c)=>n+Number(c.amount_cents||0),0)};
    const examples=channelProfiles.slice(0,25).map((profile)=>{
      const selected=images.filter((img)=>text(img.channel_key)===channel && Number(img.product_id)===Number(profile.product_id));
      return evaluateMarketplaceCalibration({
        channel,policy,provider,profile,product:profile,selected_images:selected,
        tags:jsonArray(profile.tags_json,50),materials:jsonArray(profile.materials_json,50),commerce,
        tax_handling_reviewed:Boolean(profile.review_notes && /tax/i.test(profile.review_notes)),
        currency_reviewed:true,
        creator_info_reviewed:Boolean(profile.review_notes && /creator info/i.test(profile.review_notes)),
        verified_media_domain:Boolean(profile.review_notes && /verified (media )?domain/i.test(profile.review_notes)),
        consent_reviewed:Boolean(profile.review_notes && /consent/i.test(profile.review_notes)),
        business_account_reviewed:Boolean(profile.review_notes && /business account/i.test(profile.review_notes)),
        domain_claim_reviewed:Boolean(profile.review_notes && /domain claim/i.test(profile.review_notes)),
        commerce_account_reviewed:Boolean(profile.review_notes && /commerce account/i.test(profile.review_notes)),
        catalog_reviewed:Boolean(profile.review_notes && /catalog/i.test(profile.review_notes)),
        etsy_shop_reviewed:Boolean(profile.review_notes && /etsy shop/i.test(profile.review_notes)),
        api_terms_reviewed:Boolean(profile.review_notes && /api terms/i.test(profile.review_notes)),
        seo_gate_passed:true,
      });
    });
    const failed=examples.reduce((n,x)=>n+Number(x.summary?.failed||0),0);
    const total=examples.reduce((n,x)=>n+Number(x.summary?.total||0),0);
    out.push({channel,display_name:policy.display_name,mode:policy.integration_mode,provider_key:policy.provider_key,provider_setup_status:provider.setup_status||'not_configured',provider_execution_allowed:false,publication_allowed:false,quarter,commerce,profile_count:channelProfiles.length,calibration_check_count:total,calibration_failed_count:failed,readiness_percent:total?Math.round(((total-failed)/total)*100):0,examples});
  }

  return jsonResponse({ok:true,release:MARKETPLACE_CALIBRATION_RELEASE,contract:MARKETPLACE_CALIBRATION_CONTRACT,mode:'read-only-marketplace-calibration',schema_ready:true,request_time_schema_mutation:false,provider_execution_allowed:false,publication_allowed:false,quarter,channels:out});
}
