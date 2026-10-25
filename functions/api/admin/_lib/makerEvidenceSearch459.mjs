/* Build 459: Admin-only source-linked Maker finder. No media keys, file URLs or writes. */
export const SEARCH_KINDS=Object.freeze(['project','design','recipe','tool','piece']);
export const MAX_SEARCH_RESULTS=25;
const PAGE_SIZE=20;
const CURSOR_START=Number.MAX_SAFE_INTEGER;
const positive=v=>/^[1-9]\d{0,9}$/.test(String(v??''))?Number(v):0;
const cursorValue=v=>/^[1-9]\d{0,15}$/.test(String(v??''))&&Number.isSafeInteger(Number(v))?Number(v):0;
const escapeLike=value=>value.replace(/[\\%_]/g,match=>'\\'+match);
const like=column=>`LOWER(COALESCE(${column},'')) LIKE ? ESCAPE '\\'`;

export function parseMakerSearch(input){
 const params=input instanceof URLSearchParams?input:new URLSearchParams(input);
 const kind=String(params.get('kind')||'project');
 if(!SEARCH_KINDS.includes(kind))throw Error('Choose an existing Maker source type.');
 const rawScope=params.get('project_id')||'',projectId=rawScope?positive(rawScope):0;
 if(rawScope&&!projectId)throw Error('Project scope must be an existing positive numeric ID.');
 const rawCursor=params.get('cursor')||'',cursor=rawCursor?cursorValue(rawCursor):CURSOR_START;
 if(rawCursor&&!cursor)throw Error('Invalid or expired search page cursor.');
 const rawLimit=params.get('limit')||String(PAGE_SIZE);
 if(!/^\d{1,2}$/.test(rawLimit)||Number(rawLimit)<1||Number(rawLimit)>MAX_SEARCH_RESULTS)throw Error('Maker result page must contain 1–25 records.');
 const query=String(params.get('q')??'').trim().replace(/\s+/g,' ');
 if(query.length>80||query.length===1)throw Error('Search text must have 2–80 characters, or be empty for a project-scoped list.');
 if(kind==='tool'&&!projectId)throw Error('Choose a real Creative Project to find only its linked workshop tools.');
 if(kind!=='project'&&!projectId&&query.length<2)throw Error('Enter 2+ search characters or select a real Creative Project.');
 return {kind,projectId,cursor,limit:Number(rawLimit),query};
}

/* SQL clauses are fixed trusted source projections; every operator input is bound. */
export function makerSearchPlan(params){
 const {kind,projectId,cursor,limit,query}=params;
 if(!SEARCH_KINDS.includes(kind)||!Number.isSafeInteger(cursor)||cursor<1||limit<1||limit>MAX_SEARCH_RESULTS)throw Error('Invalid search plan.');
 const source={
  project:{id:'p.creative_work_project_id',from:'creative_work_projects p',projection:
   'p.creative_work_project_id AS source_id,p.creative_work_project_id AS project_id,p.project_title AS title,p.project_key AS detail,p.project_status AS status',
   words:['p.project_title','p.project_key']},
  design:{id:'d.maker_design_file_revision_id',from:'maker_design_file_revisions d',projection:
   "d.maker_design_file_revision_id AS source_id,d.creative_work_project_id AS project_id,d.design_title AS title,(d.design_key || ' · Revision ' || d.revision_no) AS detail,d.machine_readiness AS status",
   words:['d.design_title','d.design_key']},
  recipe:{id:'v.workshop_knowledge_recipe_version_id',from:'workshop_knowledge_recipe_versions v JOIN workshop_knowledge_entries e ON e.workshop_knowledge_entry_id=v.workshop_knowledge_entry_id',projection:
   "v.workshop_knowledge_recipe_version_id AS source_id,v.source_creative_work_project_id AS project_id,e.title AS title,(e.entry_key || ' · Version ' || v.version_number) AS detail,v.recipe_state AS status",
   words:['e.title','e.entry_key']},
  tool:{id:'i.site_item_inventory_id',from:'site_item_inventory i',projection:
   "i.site_item_inventory_id AS source_id,? AS project_id,i.item_name AS title,COALESCE(i.source_type,'tool') AS detail,CASE WHEN COALESCE(i.is_active,1)=0 THEN 'inactive_tool' WHEN COALESCE(i.do_not_reuse,0)=1 THEN 'do_not_reuse' ELSE 'tool_source_only' END AS status",
   words:['i.item_name','i.external_key']},
  piece:{id:'p.maker_finished_piece_id',from:'maker_finished_pieces p JOIN maker_quality_attempts a ON a.maker_quality_attempt_id=p.maker_quality_attempt_id',projection:
   "p.maker_finished_piece_id AS source_id,a.creative_work_project_id AS project_id,p.serial_code AS title,('Product #' || p.product_id || ' · Quality attempt #' || p.maker_quality_attempt_id || ' · ' || p.variant_label) AS detail,'registered_not_sale_approval' AS status",
   words:['p.serial_code','p.variant_label','p.edition_label']}
 }[kind];
 const conditions=[`${source.id} < ?`],bind=kind==='tool'?[projectId,cursor]:[cursor];
 if(projectId){
  if(kind==='tool'){
   conditions.push(`LOWER(TRIM(COALESCE(i.source_type,'')))='tool' AND EXISTS (
    SELECT 1 FROM creative_project_operation_resources r
    JOIN creative_project_operations o ON o.creative_project_operation_id=r.creative_project_operation_id
    WHERE r.site_item_inventory_id=i.site_item_inventory_id AND o.creative_work_project_id=?)`);
  }else{
   const projectColumn={project:'p.creative_work_project_id',design:'d.creative_work_project_id',
    recipe:'v.source_creative_work_project_id',piece:'a.creative_work_project_id'}[kind];
   conditions.push(`${projectColumn}=?`);
  }
  bind.push(projectId);
 }
 if(query){conditions.push('('+source.words.map(like).join(' OR ')+')');bind.push(...source.words.map(()=>`%${escapeLike(query.toLowerCase())}%`));}
 const sql=`SELECT ${source.projection} FROM ${source.from} WHERE ${conditions.join(' AND ')} ORDER BY ${source.id} DESC LIMIT ?`;
 bind.push(limit+1);
 return {sql,bind,kind};
}

const SOURCE_PAGES=Object.freeze({project:'/admin/creative-process/',design:'/admin/project-design-files/',
 recipe:'/admin/workshop-knowledge/',tool:'/admin/shared-tools/',piece:'/admin/finished-pieces/'});
const asId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):0;
export function projectRecord(row,kind){
 const id=asId(row.source_id),projectId=asId(row.project_id);
 if(!id||!projectId||!SEARCH_KINDS.includes(kind))return null;
 const sourceBase=SOURCE_PAGES[kind];
 return {kind,source_id:id,project_id:projectId,title:String(row.title??'').slice(0,180),
  detail:String(row.detail??'').slice(0,150),status:String(row.status??'').slice(0,64),
  source_href:sourceBase+(kind==='project'||kind==='design'?'?project_id='+projectId:''),
  project_href:'/admin/creative-process/?project_id='+projectId,
  exact_source_id_must_be_checked_in_owner_module:!['project','design'].includes(kind),
  private_media_not_exposed:true,publication_approval_inferred:false};
}

export async function findMakerEvidence(db,params){
 const {sql,bind,kind}=makerSearchPlan(params);
 const query=await db.prepare(sql).bind(...bind).all();
 const source=Array.isArray(query?.results)?query.results:[];
 const hasMore=source.length>params.limit,rows=source.slice(0,params.limit).map(row=>projectRecord(row,kind)).filter(Boolean);
 return {results:rows,has_more:hasMore,next_cursor:hasMore?rows[rows.length-1]?.source_id??null:null,
  limit:params.limit,source_scan:'one_allowlisted_bounded_query',media_downloads:0};
}
