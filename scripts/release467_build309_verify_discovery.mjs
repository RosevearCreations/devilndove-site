import fs from 'node:fs';
const [input,sha,out]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));
const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==4)throw new Error('Unexpected statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0));
const aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const packages=sets[0]?.results||[];
const drafts=sets[1]?.results||[];
const story=sets[2]?.results||[];
const safety=(sets[3]?.results||[])[0]||{};
if(packages.length!==1)throw new Error('Expected exactly one Content Studio package for project 5');
if(drafts.length!==19)throw new Error('Expected exactly 19 factual-template drafts, found '+drafts.length);
if(story.length!==1||String(story[0].story_review_status)!=='needs_review'||Number(story[0].public_story_candidate||0)!==0)throw new Error('Second Maker Story review-first state drift');
if(Number(story[0].selected||0)!==1||String(story[0].media_url||'')!==''||Number(story[0].event_public_candidate||0)!==0)throw new Error('Second Story selected-evidence safety drift');
for(const k of ['caip_assets','private_upload_files','public_event_candidates','public_story_candidates','publications','social_rows','foreign_key_violations']){
  if(Number(safety[k]||0)!==0)throw new Error('Second Story public/media/downstream boundary drift '+k);
}
const evidence={release:467,build:309,exact_development_sha:sha,statement_count:4,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,package:packages[0],drafts,story:story[0],safety,copy_refresh:false,d1_mutation:false,provider_execution:false,production_d1_contact:false};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD309_PACKAGE=',JSON.stringify(packages[0]));
console.log('BUILD309_STORY=',JSON.stringify(story[0]));
console.log('BUILD309_DRAFTS=',JSON.stringify(drafts));
console.log('BUILD309_SAFETY=',JSON.stringify(safety));
console.log('BUILD309_DISCOVERY_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD309_DISCOVERY_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD309_SECOND_STORY_CONTENT_REVIEW_DISCOVERY=GREEN');
