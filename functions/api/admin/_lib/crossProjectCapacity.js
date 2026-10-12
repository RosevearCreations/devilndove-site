// Build 378. Pure, read-only cross-project capacity interpretation. Never infer calendar availability.
const number = value => Number(value || 0) || 0;
const text = value => String(value ?? '');
export function buildCapacityReport({projects=[],stations=[],storyLinks=[],requirements=[],truncated={}}) {
  const byProject = new Map(projects.map(p => [number(p.creative_work_project_id), {
    id:number(p.creative_work_project_id), key:text(p.project_key), title:text(p.project_title),
    status:text(p.project_status), workstation_ids:[], unmapped_equipment:[], operation_demands:0,
    maker_story_station_links:0
  }]));
  const byStation = new Map(stations.map(s => [number(s.site_item_inventory_id),{
    id:number(s.site_item_inventory_id), name:text(s.item_name), process_name:text(s.process_name),
    demand_projects:new Set(), sources:new Set(), competing_project_count:0,
    capacity_state:'AVAILABILITY_UNVERIFIED', actual_booking_count:null
  }]));
  const relations=new Set();
  function attach(projectId,stationId,source) {
    const p=byProject.get(number(projectId)),s=byStation.get(number(stationId));
    if(!p || !s) return false;
    const key=p.id+':'+s.id;
    if(!relations.has(key)){relations.add(key);p.workstation_ids.push(s.id);s.demand_projects.add(p.id);}
    s.sources.add(source);
    return true;
  }
  for(const link of storyLinks) {
    const p=byProject.get(number(link.creative_work_project_id));
    if(p){p.maker_story_station_links++;attach(p.id,link.site_item_inventory_id,'maker_story_reference');}
  }
  const seenRequirements=new Set();
  for(const row of requirements) {
    const p=byProject.get(number(row.creative_work_project_id));
    if(!p)continue;
    const resourceId=number(row.creative_project_operation_resource_id);
    if(!seenRequirements.has(resourceId)){seenRequirements.add(resourceId);p.operation_demands++;}
    if(!attach(p.id,row.station_id,'operation_resource')) {
      const identity=resourceId+':'+number(row.site_item_inventory_id);
      if(!p.unmapped_equipment.some(x=>x.identity===identity))p.unmapped_equipment.push({
        identity, resource_id:number(row.site_item_inventory_id),name:text(row.item_name),
        operation_title:text(row.operation_title),reason:'NO_ACTIVE_STATION_MATCH'
      });
    }
  }
  for(const p of byProject.values())p.workstation_ids.sort((a,b)=>a-b);
  const resolvedStations=[...byStation.values()].map(s=>{
    const projectIds=[...s.demand_projects].sort((a,b)=>a-b);
    return {id:s.id,name:s.name,process_name:s.process_name,demand_project_ids:projectIds,
      sources:[...s.sources].sort(),competing_project_count:projectIds.length,
      shared_demand:projectIds.length>1,capacity_state:s.capacity_state,
      actual_booking_count:null,actual_available_slots:null};
  });
  return {
    projects:[...byProject.values()],
    workstations:resolvedStations,
    summary:{
      loaded_projects:byProject.size,station_tools:byStation.size,
      stations_with_demand:resolvedStations.filter(s=>s.demand_project_ids.length>0).length,
      shared_demand_stations:resolvedStations.filter(s=>s.shared_demand).length,
      projects_with_unmapped_equipment:[...byProject.values()].filter(p=>p.unmapped_equipment.length>0).length
    },
    completeness:{station_catalog_truncated:!!truncated.stations,
      story_link_rows_truncated:!!truncated.storyLinks,
      operation_resource_rows_truncated:!!truncated.requirements},
    interpretation:'SHARED_DEMAND_NOT_SIMULTANEOUS_BOOKING',
    availability:'UNVERIFIED_NO_CANONICAL_RESERVATION_OR_TIME_WINDOW',
    allocations_created:0
  };
}
