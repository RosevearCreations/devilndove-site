import assert from 'node:assert/strict';
import test from 'node:test';
import {buildCapacityReport} from '../functions/api/admin/_lib/crossProjectCapacity.js';
test('shared demand across two distinct projects is not time conflict or actual availability',()=>{
 const report=buildCapacityReport({
  projects:[{creative_work_project_id:5,project_title:'Project A'},{creative_work_project_id:9,project_title:'Project B'}],
  stations:[{site_item_inventory_id:101,item_name:'Forge A'},{site_item_inventory_id:102,item_name:'Forge B'}],
  storyLinks:[{creative_work_project_id:5,site_item_inventory_id:101}],
  requirements:[{creative_work_project_id:9,creative_project_operation_resource_id:201,site_item_inventory_id:51,item_name:'Shared tongs',station_id:101},
    {creative_work_project_id:9,creative_project_operation_resource_id:201,site_item_inventory_id:51,item_name:'Shared tongs',station_id:102}]
 });
 assert.equal(report.summary.shared_demand_stations,1);
 assert.deepEqual(report.workstations[0].demand_project_ids,[5,9]);
 assert.deepEqual(report.projects[1].workstation_ids,[101,102]);
 assert.equal(report.projects[1].operation_demands,1);
 assert.equal(report.workstations[0].capacity_state,'AVAILABILITY_UNVERIFIED');
 assert.equal(report.workstations[0].actual_available_slots,null);
 assert.equal(report.allocations_created,0);
});
test('unmapped tools and truncated source rows fail open as warning, never invented available',()=>{
 const report=buildCapacityReport({projects:[{creative_work_project_id:7,project_title:'C'}],
 requirements:[{creative_work_project_id:7,creative_project_operation_resource_id:3,site_item_inventory_id:88,item_name:'Not assigned',station_id:null}],
 truncated:{requirements:true}});
 assert.equal(report.projects[0].unmapped_equipment.length,1);
 assert.equal(report.completeness.operation_resource_rows_truncated,true);
 assert.equal(report.availability,'UNVERIFIED_NO_CANONICAL_RESERVATION_OR_TIME_WINDOW');
});
test('does not invent stations or include unrelated project source records',()=>{
 const report=buildCapacityReport({projects:[{creative_work_project_id:1,project_title:'One'}],
 stations:[{site_item_inventory_id:20,item_name:'Station'}],
 storyLinks:[{creative_work_project_id:2,site_item_inventory_id:20}]});
 assert.equal(report.workstations[0].demand_project_ids.length,0);
 assert.equal(report.projects[0].maker_story_station_links,0);
});
