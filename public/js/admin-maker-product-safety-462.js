/* Build 462 — one explicit Product GET and optional original owner-trial GET. No writes. */
import {CANADA_SAFETY_SOURCES_462,SAFETY_CATEGORIES_462,safetyQuestions462,safetyProductId462,safetyEvidenceRef462,evaluateSafety462} from './maker-product-safety-policy-462.mjs?v=462';
const el=id=>document.getElementById(id),productInput=el('psProduct'),categoryInput=el('psCategory'),projectInput=el('psProject'),scenarioInput=el('psScenario');
const productStatus=el('psProductStatus'),trialStatus=el('psTrialStatus'),summary=el('psSummary'),questions=el('psQuestions'),holds=el('psHolds'),sources=el('psSources');
const loadProduct=el('psLoadProduct'),loadTrial=el('psLoadTrial'),worksheet=el('psWorksheet');
const make=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
let product=null,ownerTrial=null,checks={},busy=false,sourceProductId=0,sourceProjectId=0,sourceScenario='';
const status=(target,message,error=false)=>{target.textContent=message;target.className='ps-status'+(error?' ps-error':'');};
const checkedCategory=()=>categoryInput.value;
const validProduct=()=>safetyProductId462(productInput.value.trim());
const validProject=()=>safetyProductId462(projectInput.value.trim());
const evaluated=()=>evaluateSafety462({productId:validProduct(),product,category:checkedCategory(),checks,ownerTrial,projectId:validProject(),scenario:scenarioInput.value});
async function get(url){
 try{const response=await fetch(url,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  const data=await response.json().catch(()=>({error:'Invalid Admin source response.'}));
  return response.ok&&data?.ok?data:{ok:false,error:String(data?.error||`HTTP ${response.status}`).slice(0,180)};
 }catch{return {ok:false,error:'Original Admin source is temporarily unavailable.'};}
}
function sourceLink(key){const source=CANADA_SAFETY_SOURCES_462[key];if(!source)return null;const a=make('a',source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function renderSources(){sources.replaceChildren();const selected=SAFETY_CATEGORIES_462.find(x=>x.key===checkedCategory());
 const keys=new Set(['ccpsa','packaging','incident',...(selected?.sources||[]),...safetyQuestions462(checkedCategory()).map(q=>q.source)]);
 for(const key of keys){const a=sourceLink(key);if(!a)continue;const card=make('article',undefined,'ps-source');card.append(a);sources.append(card);}
}
function reviewChanged(key,field,value){checks={...checks,[key]:{...checks[key],[field]:value}};paintStatus();}
function renderQuestions(){questions.replaceChildren();for(const q of safetyQuestions462(checkedCategory())){
  const card=make('article',undefined,'ps-question'),title=make('h3',q.label),help=make('p',q.help),checkLabel=make('label',undefined,'ps-check'),check=document.createElement('input');
  check.type='checkbox';check.checked=checks[q.key]?.reviewed===true;check.disabled=!product;const checkText=make('span','I personally reviewed this question using the original physical/source evidence.');
  checkLabel.append(check,checkText);check.addEventListener('change',()=>reviewChanged(q.key,'reviewed',check.checked));
  const referenceLabel=make('label','Specific original record, lot, photo, test or receipt reference (6–140 characters):');
  const input=document.createElement('input');input.type='text';input.maxLength=140;input.placeholder='Actual source ID or test reference — not a guessed result';input.disabled=!product;
  input.value=checks[q.key]?.reference||'';input.addEventListener('input',()=>reviewChanged(q.key,'reference',input.value));referenceLabel.append(input);
  const p=make('p');const link=sourceLink(q.source);if(link)p.append(link);
  card.append(title,help,checkLabel,referenceLabel,p);questions.append(card);
 }}
function paintStatus(){const result=evaluated();holds.replaceChildren();for(const hold of result.holds)holds.append(make('p','HOLD: '+hold,'ps-hold'));
 status(summary,`HOLD — ${result.reviewed}/${result.total} questions personally checked with source references. ${result.ownerReceiptId?'Original physical-safety Owner Trial receipt #'+result.ownerReceiptId+' found (not a Product certificate).':'No verified linked physical-safety owner receipt.'} Nothing was saved or published.`);
 worksheet.disabled=!product;
}
function draw(){renderSources();renderQuestions();paintStatus();}
function resetProduct(){product=null;sourceProductId=0;checks={};worksheet.disabled=true;status(productStatus,'HOLD: Product selection changed. Load this exact original Product before reviewing.');draw();}
function resetTrial(){ownerTrial=null;sourceProjectId=0;sourceScenario='';status(trialStatus,'HOLD: Project or journey changed. Reload original owner receipts to verify scope.');paintStatus();}
productInput.addEventListener('input',()=>{const id=validProduct();el('psEditorLink').href=id?`/admin/product-editor/?product_id=${id}`:'/admin/product-editor/';resetProduct();});
categoryInput.addEventListener('change',()=>{checks={};draw();});
projectInput.addEventListener('input',()=>{const id=validProject();el('psTrialLink').href=id?`/admin/maker-owner-trials/?scenario=${scenarioInput.value}&project_id=${id}`:'/admin/maker-owner-trials/';resetTrial();});
scenarioInput.addEventListener('change',()=>{const id=validProject();el('psTrialLink').href=id?`/admin/maker-owner-trials/?scenario=${scenarioInput.value}&project_id=${id}`:'/admin/maker-owner-trials/';resetTrial();});
loadProduct.addEventListener('click',async()=>{const id=validProduct();if(!id||busy){status(productStatus,'HOLD: Enter a real positive saved Product ID.',true);return;}
 busy=true;loadProduct.disabled=true;product=null;checks={};draw();status(productStatus,'Reading one original Product from its canonical Admin authority…');
 try{const data=await get('/api/admin/product-editor-detail?product_id='+id);
  if(!data.ok||safetyProductId462(data.product?.product_id)!==id)throw Error(data.error||'Product identity mismatch.');
  product=data.product;sourceProductId=id;status(productStatus,`Loaded original Product #${id}: ${String(product.name||'Unnamed Product').slice(0,100)}. Saved category: ${String(product.product_category||'Not recorded').slice(0,100)}. Status: ${String(product.status||'unknown').slice(0,30)}. Its category is a hint, not legal classification. No write occurred.`);
 }catch(error){status(productStatus,'HOLD: '+String(error.message||'Product source unavailable.'),true);}
 finally{busy=false;loadProduct.disabled=false;draw();}
});
loadTrial.addEventListener('click',async()=>{const id=validProject(),scenario=scenarioInput.value;
 if(!id||busy){status(trialStatus,'HOLD: Enter a valid exact Creative Project ID first.',true);return;}
 busy=true;loadTrial.disabled=true;ownerTrial=null;paintStatus();status(trialStatus,'Reading the original Maker Owner Trial receipts for the selected project…');
 try{const query=new URLSearchParams({scenario,project_id:String(id)});
  const data=await get('/api/admin/maker-owner-trials?'+query);
  if(!data.ok||Number(data.selected?.creative_work_project_id)!==id)throw Error(data.error||'No matching project or authorised original source.');
  ownerTrial=data;sourceProjectId=id;sourceScenario=scenario;
  const last=data.history?.find(x=>x.checkpoint_key==='physical_safety');
  status(trialStatus,last?`Project #${id}, latest physical-safety receipt #${last.maker_owner_trial_review_id}: ${last.decision.toUpperCase()}, source ${last.source_kind} #${last.source_id||'none'}, ${last.created_at}. A physical review is not proof this Product is legally saleable.${data.history_truncated?' Older history omitted.':''}`:
   `Project #${id} has no physical-safety receipt in the most recent ${data.history?.length||0} records. Keep HOLD and review original maker QA.${data.history_truncated?' Older receipts may exist.':''}`);
 }catch(error){status(trialStatus,'HOLD: '+String(error.message||'Original owner trial unavailable.'),true);}
 finally{busy=false;loadTrial.disabled=false;paintStatus();}
});
worksheet.addEventListener('click',()=>{if(!product||sourceProductId!==validProduct())return;
 const result=evaluated(),questions=safetyQuestions462(checkedCategory());
 const packet={document_type:'DEVIL_N_DOVE_UNAPPROVED_SAFETY_REVIEW_WORKSHEET',build:462,created_at:new Date().toISOString(),
  product_id:result.productId,product_sku:String(product.sku||'').slice(0,80),selected_category:result.category,
  original_project_id:validProject()||null,scenario:scenarioInput.value,original_owner_trial_receipt_id:result.ownerReceiptId,
  checks:questions.map(q=>({key:q.key,question:q.label,reviewed:checks[q.key]?.reviewed===true,
   original_evidence_reference:safetyEvidenceRef462(checks[q.key]?.reference)||null,official_source:CANADA_SAFETY_SOURCES_462[q.source]?.url||null})),
  unresolved_holds:result.holds,certified:false,label_approved:false,publication_authorized:false,server_receipt_created:false};
 const blob=new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.download=`devilndove-build462-HOLD-product-${sourceProductId}.json`;a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 status(summary,'Downloaded an unapproved HOLD worksheet for personal files. No server review receipt or legal certification was created.');
});
for(const cat of SAFETY_CATEGORIES_462.slice(1)){const option=new Option(cat.label,cat.key);categoryInput.add(option);}
const initial=new URLSearchParams(location.search),p=safetyProductId462(initial.get('project_id'));if(p){projectInput.value=String(p);el('psTrialLink').href=`/admin/maker-owner-trials/?scenario=${scenarioInput.value}&project_id=${p}`;}
draw();
