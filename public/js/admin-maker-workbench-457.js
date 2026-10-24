/* Build 457 — one bounded, authenticated GET per page; no task, inventory, provider or approval writes. */
import {MAKER_LINKS,MAKER_PHASES,TRIAL_SCENARIOS,nextMakerAction,projectId,workbenchUrl} from './maker-workbench-policy-457.mjs';

const byId=id=>document.getElementById(id);
const projectSelect=byId('mwProject'),focusSelect=byId('mwFocus'),trialSelect=byId('mwTrial');
const status=byId('mwStatus'),next=byId('mwNext'),previous=byId('mwPrevious'),refresh=byId('mwRefresh');
let currentPage={projects:[],has_more:false,next_cursor:null,total_active_projects:0},cursor=0,older=[],selected=null,busy=false;

const option=(value,label)=>new Option(String(label),String(value));
function say(message,error=false){status.textContent=message;status.className='mw-status'+(error?' mw-error':'');}
function selectedId(){return projectId(projectSelect.value);}
function selectedRoute(){return currentPage.projects.find(p=>projectId(p.creative_work_project_id)===selectedId())||null;}
function evidenceList(route){
 const ul=byId('mwEvidence');ul.replaceChildren();
 if(!route){const li=document.createElement('li');li.textContent='No project selected; no evidence counted.';ul.append(li);return;}
 for(const [name,value] of [
  ['Linked CAIP workspaces',route.caip_workspaces],['Active process events',route.active_events],
  ['Selected evidence rows',route.selected_evidence_rows],['Maker Story profiles',route.maker_story_profiles]
 ]){const li=document.createElement('li'),strong=document.createElement('strong');strong.textContent=String(Number(value||0));li.append(strong,document.createTextNode(' · '+name));ul.append(li);}
}
function paint(){
 const route=selectedRoute(),id=selectedId(),focus=focusSelect.value,trial=trialSelect.value;
 const recommended=nextMakerAction(route,focus);
 byId('mwSuggestion').textContent=recommended.title;
 byId('mwSuggestionDetail').textContent=recommended.explanation;
 const target=MAKER_LINKS.find(x=>x.key===recommended.key)||MAKER_LINKS[0];
 const suggested=byId('mwSuggestedLink');suggested.href=workbenchUrl(target,id,trial);suggested.textContent='Open '+target.title;
 evidenceList(route);
 const cards=byId('mwWorkspaces');cards.replaceChildren();
 for(const item of MAKER_LINKS){
  const card=document.createElement('article');card.className='mw-card';card.dataset.current=String(item.phase===focus||focus==='overview'&&item.key===recommended.key);
  const title=document.createElement('h3');title.textContent=item.title;
  const description=document.createElement('p');description.textContent=item.description;
  const link=document.createElement('a');link.href=workbenchUrl(item,id,trial);link.textContent='Open '+item.title;
  const details=document.createElement('details'),summary=document.createElement('summary'),help=document.createElement('p');
  summary.textContent='ⓘ How this step works';help.textContent=item.help;
  details.append(summary,help);card.append(title,description,link,details);cards.append(card);
 }
}
async function loadPage(targetCursor=cursor,keepSelection=0){
 if(busy)return false;busy=true;refresh.disabled=true;next.disabled=true;previous.disabled=true;
 say('Refreshing read-only Creative Project routes…');
 try{
  const url='/api/admin/project-workflow-routing?'+new URLSearchParams({cursor:String(targetCursor),limit:'25'});
  const response=await fetch(url,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  const data=await response.json().catch(()=>({error:'Invalid response'}));
  if(!response.ok||!data.ok||!Array.isArray(data.projects))throw Error(data.error||'Authenticated Creative Project list unavailable.');
  currentPage=data;cursor=targetCursor;
  projectSelect.replaceChildren(option('','Choose an existing Creative Project'),...data.projects.map(p=>option(p.creative_work_project_id,`#${p.creative_work_project_id} · ${p.project_title} (${p.project_status})`)));
  if(keepSelection&&data.projects.some(p=>projectId(p.creative_work_project_id)===keepSelection))projectSelect.value=String(keepSelection);
  selected=selectedRoute();
  byId('mwPage').textContent=`Page ${older.length+1} · ${data.projects.length} shown of ${data.total_active_projects} active projects`;
  say(data.projects.length?'Choose a real Creative Project, then a workshop phase.':'No projects on this page. Create original records in Creative Process.');
  paint();return true;
 }catch(error){
  say('HOLD — '+error.message+'. Try Admin sign-in or refresh; no record was changed.',true);
  return false;
 }finally{busy=false;refresh.disabled=false;next.disabled=!currentPage.has_more;previous.disabled=!older.length;}
}
for(const stage of MAKER_PHASES.slice(1))focusSelect.add(option(stage.key,stage.label));
projectSelect.addEventListener('change',()=>{selected=selectedRoute();paint();});
focusSelect.addEventListener('change',paint);trialSelect.addEventListener('change',paint);
refresh.addEventListener('click',()=>loadPage(cursor,selectedId()));
next.addEventListener('click',async()=>{
 if(!currentPage.has_more||!projectId(currentPage.next_cursor))return;
 const last=cursor,history=older.slice();older.push(last);
 if(!await loadPage(projectId(currentPage.next_cursor)))older=history;
 previous.disabled=!older.length;
});
previous.addEventListener('click',async()=>{
 if(!older.length)return;
 const history=older.slice(),prior=older.pop();
 if(!await loadPage(prior))older=history;
 previous.disabled=!older.length;
});

// An explicit project URL opens the matching first page if present, without fetching private records in the background.
const params=new URLSearchParams(location.search),initialProject=projectId(params.get('project_id'));
if(MAKER_PHASES.some(s=>s.key===params.get('phase')))focusSelect.value=params.get('phase');
if(TRIAL_SCENARIOS.includes(params.get('scenario')))trialSelect.value=params.get('scenario');
paint();loadPage(0,initialProject);
