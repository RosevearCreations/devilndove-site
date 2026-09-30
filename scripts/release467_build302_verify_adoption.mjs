import fs from 'node:fs';
const [input,sha,output]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));
const rows=Array.isArray(raw)?raw:(raw.results||[]);
if(rows.length!==5)throw new Error('Unexpected statement count '+rows.length);
const reads=rows.map(x=>Number(x?.meta?.rows_read||0));
const aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const pre=(rows[0]?.results||[])[0]||{};
const selected=rows[2]?.results||[];
const safety=(rows[3]?.results||[])[0]||{};
const boundary=(rows[4]?.results||[])[0]||{};
if(Number(pre.creative_work_project_id)!==7||pre.project_key!=='CP-MSXCYQB6'||pre.project_title!=='Under the Sea')throw new Error('Project identity drift');
if(pre.story_kind!=='maker_story'||pre.story_review_status!=='needs_review'||Number(pre.public_story_candidate)!==0)throw new Error('Maker Story review-first state drift');
if(Number(pre.active_events)!==3||Number(pre.safe_text_events)!==3)throw new Error('Factual text-only timeline prerequisite drift');
if(![0,3].includes(Number(pre.selected_evidence_before||0)))throw new Error('Unexpected pre-adoption selected evidence count');
if(Number(pre.caip_assets)!==0||Number(pre.private_upload_files)!==0)throw new Error('Fail closed: CAIP media appeared after discovery');
if(selected.length!==3)throw new Error('Expected exactly three selected factual evidence rows');
const byId=new Map(selected.map(x=>[Number(x.creative_work_event_id),x]));
for(const id of [1,2,3]){
  const row=byId.get(id);if(!row)throw new Error('Missing selected event '+id);
  if(Number(row.selected)!==1||Number(row.is_public_candidate||0)!==0||String(row.media_url||'')!=='')throw new Error('Evidence crossed media/public boundary for event '+id);
  if(!String(row.review_notes||'').includes('does not grant public-use rights'))throw new Error('Rights-separation note missing for event '+id);
}
if(byId.get(1).evidence_role!=='process_evidence'||byId.get(2).evidence_role!=='material_evidence'||byId.get(3).evidence_role!=='material_evidence')throw new Error('Evidence role classification mismatch');
for(const key of ['public_story_candidates','public_event_candidates','selected_media_evidence','caip_asset_count','caip_public_allowed_assets','private_upload_files','fully_public_allowed_uploads']){
  if(Number(safety[key]||0)!==0)throw new Error('Public/private safety boundary failed: '+key+'='+safety[key]);
}
if(Number(boundary.selected_evidence)!==3||Number(boundary.caip_workspaces)!==1||Number(boundary.content_packages)!==1)throw new Error('Evidence or identity boundary mismatch');
if(Number(boundary.approved_deliverables)!==0||Number(boundary.publications)!==0||Number(boundary.social_rows_total)!==0||Number(boundary.foreign_key_violations)!==0)throw new Error('Build 303/304 or integrity boundary crossed');
console.log('BUILD302_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD302_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD302_PRE_ADOPTION=',JSON.stringify(pre));
console.log('BUILD302_SELECTED_EVIDENCE=',JSON.stringify(selected));
console.log('BUILD302_PUBLIC_SAFETY=',JSON.stringify(safety));
console.log('BUILD302_BOUNDARY=',JSON.stringify(boundary));
console.log('BUILD302_EVIDENCE_PUBLIC_SAFETY_ADOPTION=GREEN');
fs.writeFileSync(output,JSON.stringify({
  release:467,build:302,exact_development_sha:sha,reads,aggregate_rows_read:aggregate,
  project:{id:7,key:'CP-MSXCYQB6',title:'Under the Sea'},selected,safety,boundary,
  development_d1_mutation:'three existing evidence-selection rows only',
  caip_media_state_change:false,public_rights_inference:false,content_studio_refresh:false,
  automatic_publication:false,production_d1_contact:false
},null,2)+'\n');
