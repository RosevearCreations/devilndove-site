import { captureRuntimeIncident } from './_lib/adminAudit.js';
import { cleanApplicationMode, expandCommunityEventOccurrences, hasPublicCommunitySchema, listPublicCommunityEvents, listPublicPickupProfiles, listVendorApplicationOptionsReadOnly, normalizeVendorApplication } from './_lib/publicCommunityReadService.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=120','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});}
function fallbackEvents(){return [];}
function fallbackPickupProfiles(){return [{pickup_profile_id:0,label:'Southern Ontario by appointment',pickup_mode:'appointment',city:'Tillsonburg area',region_label:'Southern Ontario',appointment_only:1,lead_time_hours:24,public_note:'Use Contact before checkout if an item is fragile, oversized, externally listed, or easier to hand off in person.',availability_note:'Availability can vary for handmade, vintage, and external-channel items.',map_url:'',contact_hint:'Please confirm timing and item availability first.',is_active:1,sort_order:0}];}

export async function onRequestGet(context){
  const db=context.env.DB||context.env.DD_DB;
  if(!db) return json({ok:true,warning:'Database binding is unavailable. Returning safe community fallbacks.',events:fallbackEvents(),pickup_profiles:fallbackPickupProfiles(),upcoming_occurrences:[],vendor_application_options:[],summary:{event_count:0,pickup_profile_count:1,authority:'binding_unavailable'}});
  try{
    if(!(await hasPublicCommunitySchema(db))) throw new Error('public_community_schema_unavailable');
    const [events,pickup_profiles,vendor_application_options]=await Promise.all([listPublicCommunityEvents(db),listPublicPickupProfiles(db),listVendorApplicationOptionsReadOnly(db)]);
    const upcoming_occurrences=expandCommunityEventOccurrences(events,{maxCount:12,horizonDays:210});
    return json({ok:true,events,pickup_profiles,upcoming_occurrences,vendor_application_options,summary:{event_count:events.length,pickup_profile_count:pickup_profiles.length,upcoming_occurrence_count:upcoming_occurrences.length,vendor_application_enabled_count:vendor_application_options.length,authority:'d1'}});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'community_content',incident_code:'community_content_load_failed',severity:'warning',message:'Community content query failed. Safe fallbacks were returned.',details:{error:String(error?.message||error||'Unknown error')}});
    return json({ok:true,warning:'Community content is temporarily using safe fallback messaging.',events:fallbackEvents(),pickup_profiles:fallbackPickupProfiles(),upcoming_occurrences:[],vendor_application_options:[],summary:{event_count:0,pickup_profile_count:1,upcoming_occurrence_count:0,vendor_application_enabled_count:0,authority:'fallback'}});
  }
}

export async function onRequestPost(context){
  const db=context.env.DB||context.env.DD_DB;if(!db)return json({ok:false,error:'Vendor applications are temporarily unavailable.'},503);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  if(String(body.action||'').trim().toLowerCase()!=='submit_vendor_application')return json({ok:false,error:'Unsupported action.'},400);
  try{
    if(!(await hasPublicCommunitySchema(db))) return json({ok:false,error:'community_schema_unavailable',message:'Vendor applications are temporarily unavailable.'},503);
    const communityEventId=Number(body.community_event_id||0),vendorName=String(body.vendor_name||'').trim(),contactEmail=String(body.contact_email||'').trim();
    if(!communityEventId)return json({ok:false,error:'Choose an event first.'},400);if(!vendorName)return json({ok:false,error:'Vendor or shop name is required.'},400);if(!contactEmail||!/@/.test(contactEmail))return json({ok:false,error:'A valid contact email is required.'},400);
    const event=await db.prepare(`SELECT community_event_id,title,application_mode,vendor_capacity,event_status FROM community_events WHERE community_event_id=? AND is_active=1 LIMIT 1`).bind(communityEventId).first();
    if(!event)return json({ok:false,error:'That event could not be found.'},404);if(cleanApplicationMode(event.application_mode)!=='internal')return json({ok:false,error:'That event is not using internal vendor applications.'},400);
    await db.prepare(`INSERT INTO event_vendor_applications (community_event_id,event_title_snapshot,vendor_name,contact_name,contact_email,contact_phone,city,offered_items,website_url,marketplace_url,instagram_url,setup_notes,application_status,internal_note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'submitted',NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(communityEventId,String(event.title||''),vendorName,String(body.contact_name||'').trim()||null,contactEmail,String(body.contact_phone||'').trim()||null,String(body.city||'').trim()||null,String(body.offered_items||'').trim()||null,String(body.website_url||'').trim()||null,String(body.marketplace_url||'').trim()||null,String(body.instagram_url||'').trim()||null,String(body.setup_notes||'').trim()||null).run();
    return json({ok:true,message:'Vendor application saved for review.',application:normalizeVendorApplication({community_event_id:communityEventId,event_title_snapshot:String(event.title||''),vendor_name:vendorName,contact_email:contactEmail,application_status:'submitted'})});
  }catch(error){await captureRuntimeIncident(context.env,context.request,{incident_scope:'community_content',incident_code:'vendor_application_submit_failed',severity:'warning',message:'Vendor application submit failed.',details:{error:String(error?.message||error||'Unknown error')}});return json({ok:false,error:'Vendor application could not be saved right now.'},500);}
}
