import { cleanApplicationMode, expandCommunityEventOccurrences, normalizeCommunityEvent, normalizePickupProfile, normalizeVendorApplication } from '../_communityContent.js';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
const SHAPES = {
  community_events: ['community_event_id','title','event_type','event_status','starts_at','ends_at','venue_name','city','region_label','event_url','public_note','sale_channel_note','pickup_supported','is_featured','is_active','sort_order','created_at','updated_at','recurrence_rule','recurrence_interval','recurrence_count','recurrence_until','recurrence_label','image_url','image_alt','application_mode','application_url','vendor_capacity','vendor_note'],
  pickup_profiles: ['pickup_profile_id','label','pickup_mode','city','region_label','appointment_only','lead_time_hours','public_note','availability_note','map_url','contact_hint','is_active','sort_order','created_at','updated_at'],
  event_vendor_applications: ['event_vendor_application_id','community_event_id','event_title_snapshot','vendor_name','contact_name','contact_email','contact_phone','city','offered_items','website_url','marketplace_url','instagram_url','setup_notes','application_status','internal_note','created_at','updated_at']
};
async function hasShape(db, tableName) {
  const result=await db.prepare(`PRAGMA table_info(${tableName})`).all().catch(()=>({results:[]}));
  const columns=new Set(rows(result).map(r=>String(r?.name||'').trim()).filter(Boolean));
  return SHAPES[tableName].every(name=>columns.has(name));
}
export async function hasPublicCommunitySchema(db) {
  return (await hasShape(db,'community_events')) && (await hasShape(db,'pickup_profiles')) && (await hasShape(db,'event_vendor_applications'));
}
export async function listPublicCommunityEvents(db) {
  const result=await db.prepare(`SELECT community_event_id,title,event_type,event_status,starts_at,ends_at,venue_name,city,region_label,event_url,public_note,sale_channel_note,pickup_supported,is_featured,is_active,sort_order,recurrence_rule,recurrence_interval,recurrence_count,recurrence_until,recurrence_label,image_url,image_alt,application_mode,application_url,vendor_capacity,vendor_note,created_at,updated_at FROM community_events WHERE is_active=1 ORDER BY is_featured DESC,sort_order ASC,COALESCE(starts_at,created_at) ASC,community_event_id DESC`).all();
  return rows(result).map(normalizeCommunityEvent);
}
export async function listPublicPickupProfiles(db) {
  const result=await db.prepare(`SELECT pickup_profile_id,label,pickup_mode,city,region_label,appointment_only,lead_time_hours,public_note,availability_note,map_url,contact_hint,is_active,sort_order,created_at,updated_at FROM pickup_profiles WHERE is_active=1 ORDER BY sort_order ASC,label ASC,pickup_profile_id DESC`).all();
  return rows(result).map(normalizePickupProfile);
}
export async function listVendorApplicationOptionsReadOnly(db) {
  const events=await listPublicCommunityEvents(db);
  return events.filter(row=>cleanApplicationMode(row.application_mode)==='internal' && String(row.event_status||'').toLowerCase()!=='cancelled').map(row=>({community_event_id:row.community_event_id,title:row.title,city:row.city,starts_at:row.starts_at,application_mode:row.application_mode,vendor_capacity:row.vendor_capacity||0,vendor_note:row.vendor_note||''}));
}
export { cleanApplicationMode, expandCommunityEventOccurrences, normalizeVendorApplication };
