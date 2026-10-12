export const KINDS=Object.freeze(['project_booking','maintenance','resource_hold','project_deadline']);
const iso=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export function isoUtc(x){
 if(typeof x!=='string'||!iso.test(x))return null;
 const d=new Date(x);
 return Number.isFinite(d.valueOf())&&d.toISOString().replace('.000Z','Z')===x?x:null;
}
export function validateWindow(start,end,maxDays=31){
 if(!isoUtc(start)||!isoUtc(end))return 'UTC_TIME_REQUIRED';
 const length=Date.parse(end)-Date.parse(start);
 if(length<=0||length>maxDays*86400000)return 'INVALID_WINDOW';
 return null;
}
export function overlaps(a,b){return a.starts_at_utc<b.ends_at_utc&&b.starts_at_utc<a.ends_at_utc;}
export function conflictAssessment(existing,candidate){
 const rows=existing.filter(x=>x.entry_status==='active'&&x.resource_site_item_inventory_id===candidate.resource_site_item_inventory_id&&overlaps(x,candidate));
 return {conflicts:rows,requires_override:rows.length>0,maintenance_conflict:rows.some(x=>x.entry_kind==='maintenance')};
}
