/* Build 473 — local, read-only real-sample safety review. Never certifies or publishes. */
import {sampleQuestions473,sampleReference473,SAMPLE_REVIEW_STATES_473,CANADIAN_SAMPLE_SOURCES_473,evaluateSample473} from './maker-sample-acceptance-policy-473.mjs?v=473';
const $=id=>document.getElementById(id),idInput=$('psProduct'),category=$('psCategory'),sampleId=$('ps473SampleId'),lot=$('ps473Lot'),present=$('ps473Present');
const sourceStatus=$('ps473SourceStatus'),questions=$('ps473Questions'),summary=$('ps473Summary'),holds=$('ps473Holds'),exportButton=$('ps473Export');
let verifiedProductId=0,checks={};
const add=(tag,content,className)=>{const node=document.createElement(tag);if(content!==undefined)node.textContent=content;if(className)node.className=className;return node;};
const selectedProductId=()=>/^[1-9][0-9]{0,9}$/.test(idInput.value.trim())?Number(idInput.value.trim()):0;
const current=()=>evaluateSample473({productId:selectedProductId(),verifiedProductId,category:category.value,sampleId:sampleId.value,lotReference:lot.value,physicalPresent:present.checked,checks});
function paint(){
 const result=current();holds.replaceChildren();for(const message of result.holds)holds.append(add('p','HOLD: '+message,'ps-hold'));
 summary.textContent=`HOLD — ${result.counts.observed} personally observed, ${result.counts.defect} concerns, ${result.counts.pending} specialist pending, ${result.counts.unreviewed} unreviewed. No physical or legal acceptance was created.`;
 summary.className='ps-status'+(result.counts.defect?' ps-error':'');exportButton.disabled=!verifiedProductId||verifiedProductId!==selectedProductId();
}
function render(){
 const enabled=!!verifiedProductId&&verifiedProductId===selectedProductId();
 for(const control of [sampleId,lot,present])control.disabled=!enabled;
 questions.replaceChildren();
 for(const item of sampleQuestions473(category.value)){
  const card=add('article',undefined,'ps-sample'),title=add('h3',item.label),help=add('p',item.guide);
  const stateLabel=add('label','Physical inspection or specialist status:');const selection=add('select');selection.disabled=!enabled;
  for(const state of SAMPLE_REVIEW_STATES_473){const option=new Option(state.label,state.key);selection.add(option);}
  selection.value=checks[item.key]?.status||'unreviewed';selection.addEventListener('change',()=>{checks={...checks,[item.key]:{...checks[item.key],status:selection.value}};paint();});stateLabel.append(selection);
  const referenceLabel=add('label','Actual observation/photo/QA/test/report reference (6–120 characters):');const input=add('input');input.type='text';input.maxLength=120;input.disabled=!enabled;
  input.autocomplete='off';input.placeholder='Source reference only; never paste credentials or URLs';input.value=checks[item.key]?.reference||'';
  input.addEventListener('input',()=>{checks={...checks,[item.key]:{...checks[item.key],reference:input.value}};paint();});referenceLabel.append(input);
  const link=add('a',CANADIAN_SAMPLE_SOURCES_473[item.source]?.label||'Canadian safety guidance');link.href=CANADIAN_SAMPLE_SOURCES_473[item.source]?.url||'https://www.canada.ca/en/health-canada.html';link.target='_blank';link.rel='noopener noreferrer';
  const alert= item.specialist?add('p','Specialist applicability, tests or qualified interpretation must be independently verified.','ps-hold'):null;
  card.append(title,help,stateLabel,referenceLabel,link);if(alert)card.append(alert);questions.append(card);
 }
 paint();
}
function reset(){checks={};sampleId.value='';lot.value='';present.checked=false;render();}
document.addEventListener('dd:maker-safety-product-verified',event=>{
 const id=Number(event.detail?.productId)||0;verifiedProductId=id===selectedProductId()?id:0;
 sourceStatus.textContent=verifiedProductId?`Loaded original Product #${verifiedProductId}. Select the legally applicable category and physically examine our exact sample. No extra D1 or R2 call.`:
  'HOLD: Original Product was changed or its authenticated read failed. Reload it before sample review.';
 reset();
});
category.addEventListener('change',reset);
for(const input of [sampleId,lot])input.addEventListener('input',paint);
present.addEventListener('change',paint);
exportButton.addEventListener('click',()=>{
 if(!verifiedProductId||verifiedProductId!==selectedProductId())return;
 const report=current(),packet={document_type:'DEVIL_N_DOVE_BUILD_473_UNAPPROVED_PHYSICAL_SAMPLE_HOLD',build:473,recorded_at:new Date().toISOString(),
  product_id:report.productId,selected_category:report.category,sample_id:report.sampleId,batch_or_lot_reference:report.lotReference,
  physically_present_confirmed:report.physicallyInspected,checks:report.checks,unresolved_holds:report.holds,
  certified:false,label_approved:false,publication_authorized:false,shipping_authorized:false,server_receipt_created:false};
 const blob=new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=add('a');
 link.download=`devilndove-build473-HOLD-product-${verifiedProductId}.json`;link.href=url;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 summary.textContent='Private unresolved physical-sample HOLD record downloaded. No safety clearance, persistent receipt or provider write occurred.';
});
render();
