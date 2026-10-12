import test from 'node:test';import assert from 'node:assert/strict';
import {isoUtc,validateWindow,overlaps,conflictAssessment} from '../functions/api/admin/_lib/calendarRules.js';
const a={resource_site_item_inventory_id:11,starts_at_utc:'2026-10-20T10:00:00Z',ends_at_utc:'2026-10-20T11:00:00Z',entry_status:'active',entry_kind:'project_booking'};
test('UTC-only precise windows and timezone safety',()=>{
 assert.equal(isoUtc('2026-10-20T10:00:00Z'),'2026-10-20T10:00:00Z');
 assert.equal(isoUtc('2026-10-20T10:00:00-04:00'),null);
 assert.equal(isoUtc('2026-02-29T00:00:00Z'),null);
 assert.equal(validateWindow('2026-10-20T10:00:00Z','2026-10-20T11:00:00Z'),null);
 assert.equal(validateWindow('2026-10-20T11:00:00Z','2026-10-20T10:00:00Z'),'INVALID_WINDOW');
 assert.equal(validateWindow('2026-10-20T10:00:00Z','2027-01-20T10:00:00Z'),'INVALID_WINDOW');
});
test('overlap detection is half-open, real resource-specific and excludes cancelled entries',()=>{
 assert.equal(overlaps(a,{starts_at_utc:'2026-10-20T11:00:00Z',ends_at_utc:'2026-10-20T12:00:00Z'}),false);
 assert.equal(overlaps(a,{starts_at_utc:'2026-10-20T10:59:59Z',ends_at_utc:'2026-10-20T12:00:00Z'}),true);
 const candidate={resource_site_item_inventory_id:11,starts_at_utc:'2026-10-20T10:15:00Z',ends_at_utc:'2026-10-20T10:30:00Z'};
 const checks=conflictAssessment([a,{...a,resource_site_item_inventory_id:12},{...a,entry_status:'cancelled'},{...a,entry_kind:'maintenance'}],candidate);
 assert.equal(checks.conflicts.length,2);
 assert.equal(checks.requires_override,true);
 assert.equal(checks.maintenance_conflict,true);
});
