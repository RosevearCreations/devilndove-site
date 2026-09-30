import fs from 'node:fs';
const [input,sha,out]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));
const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==6)throw new Error('Unexpected statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const pre=(sets[0]?.results||[])[0]||{};
const drafts=sets[4]?.results||[];
const integrity=(sets[5]?.results||[])[0]||{};
if(Number(pre.content_project_id||0)!==23||String(pre.content_project_key)!=='creative-project-5-35th-promo'||Number(pre.content_packages||0)!==1||Number(pre.deliverables||0)!==19||Number(pre.factual_template_deliverables||0)!==19)throw new Error('Second Story package preflight mismatch');
if(Number(pre.selected_evidence||0)!==1||String(pre.story_review_status)!=='needs_review'||Number(pre.public_story_candidate||0)!==0||String(pre.outcome_status)!=='unknown')throw new Error('Second Story evidence/review preflight mismatch');
if(Number(pre.caip_assets||0)!==0||Number(pre.private_upload_files||0)!==0||Number(pre.publications||0)!==0)throw new Error('Second Story media/publication preflight drift');
if(drafts.length!==19)throw new Error('Expected 19 review outcomes');
const byKey=Object.fromEntries(drafts.map(d=>[d.deliverable_key,d]));
for(const key of ['seo-assets','blog-article']){
 const d=byKey[key]||{};
 if(String(d.approval_status)!=='approved'||Number(d.copy_locked||0)!==1||Number(d.approved_by_user_id||0)<=0||!String(d.approved_at||''))throw new Error('Approved copy outcome drift '+key);
}
if(!String(byKey['seo-assets']?.body_content||'').includes('currently documented from the existing project brief'))throw new Error('SEO copy not corrected to planning-only facts');
if(!String(byKey['blog-article']?.body_content||'').includes('No execution, finished result, lesson, reviewed media, or public release has been recorded'))throw new Error('Blog copy not corrected to planning-only facts');
for(const d of drafts.filter(d=>!['seo-assets','blog-article'].includes(d.deliverable_key))){
 if(String(d.approval_status)!=='changes_requested'||Number(d.copy_locked||0)!==0)throw new Error('Unsupported draft was not changes_requested '+d.deliverable_key);
}
const expected={content_packages:1,deliverables:19,approved_deliverables:2,changes_requested_deliverables:17,locked_deliverables:2,published_deliverables:0,aligned_handoffs:1,publications:0,social_rows:0,caip_assets:0,private_upload_files:0,maker_story_still_review_first:1,duplicate_content_source_identities:0,foreign_key_violations:0};
for(const [k,v] of Object.entries(expected))if(Number(integrity[k]||0)!==v)throw new Error('Build 309 integrity drift '+k+'='+integrity[k]);
const evidence={release:467,build:309,exact_development_sha:sha,statement_count:6,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,preflight:pre,approved_keys:['seo-assets','blog-article'],approved_count:2,changes_requested_count:17,copy_locked_count:2,handoff_evidence_count:1,maker_story_state:'needs_review',public_story_candidate:0,outcome_status:'unknown',integrity,automatic_content_refresh:false,automatic_publication:false,provider_execution:false,media_rights_inference:false,production_d1_contact:false};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD309_PREFLIGHT=',JSON.stringify(pre));
console.log('BUILD309_APPROVED=',JSON.stringify(drafts.filter(d=>d.approval_status==='approved')));
console.log('BUILD309_INTEGRITY=',JSON.stringify(integrity));
console.log('BUILD309_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD309_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD309_SECOND_STORY_CONTENT_REVIEW_APPROVAL=GREEN');
