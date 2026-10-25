/* Build 459 — no local copy, public search, private URLs, polling or write operations. */
(()=>{'use strict';
 const el=id=>document.getElementById(id),kind=el('mfKind'),query=el('mfQuery'),scope=el('mfProject'),status=el('mfStatus'),results=el('mfResults');
 const submit=el('mfSearch'),clear=el('mfClear'),next=el('mfNext'),previous=el('mfPrevious'),page=el('mfPage');
 let busy=false,cursor='',history=[],current={results:[],has_more:false,next_cursor:null},selected={kind:'project',q:'',project_id:''};
 const positive=s=>/^[1-9]\d{0,9}$/.test(String(s??''))?String(s):'';
 const sameFilter=()=>selected.kind===kind.value&&selected.q===query.value.trim()&&selected.project_id===scope.value.trim();
 function announce(message,error=false){status.textContent=message;status.className='mf-status'+(error?' mf-error':'');}
 function link(title,href){const a=document.createElement('a');a.textContent=title;a.href=href;return a;}
 const row=(parent,label,value)=>{const p=document.createElement('p'),b=document.createElement('strong');b.textContent=label+' ';p.append(b,document.createTextNode(value));parent.append(p);};
 function paint(){
  results.replaceChildren();const found=current.results||[];
  if(!found.length){const p=document.createElement('p');p.textContent='No matching source records on this page. Try another term or a specific Creative Project. No acceptance is inferred.';results.append(p)}
  for(const item of found){
   const card=document.createElement('article');card.className='mf-result';card.setAttribute('role','listitem');
   const category=document.createElement('p');category.className='mf-kind';category.textContent=item.kind.toUpperCase()+' · Source #'+item.source_id;
   const title=document.createElement('h3');title.textContent=item.title||'Untitled original record';card.append(category,title);
   row(card,'Project:',String(item.project_id));if(item.detail)row(card,'Source reference:',item.detail);
   row(card,'Recorded state:',item.status||'Not recorded');
   const links=document.createElement('div');links.className='mf-actions';
   links.append(link('Open source module',item.source_href),link('Open Creative Project',item.project_href));card.append(links);
   if(item.kind==='project'){
    const button=document.createElement('button');button.type='button';button.textContent='Search linked evidence';button.addEventListener('click',()=>{
     scope.value=String(item.project_id);kind.value='design';query.value='';history=[];search('');
    });card.append(button);
   }
   const help=document.createElement('details'),summary=document.createElement('summary'),detail=document.createElement('p');help.className='mf-help';
   summary.textContent='ⓘ What does this match prove?';detail.textContent=item.exact_source_id_must_be_checked_in_owner_module?
    'This is a real database source reference, not a completion or safety approval. Open its original module and choose the exact source ID shown above; no record is selected there automatically.':
    'The project scope is carried where supported. Verify the original source and its rights/safety state; a link does not approve production or public media.';
   help.append(summary,detail);card.append(help);results.append(card);
  }
  next.disabled=busy||!current.has_more;previous.disabled=busy||!history.length;
  page.textContent=`Page ${history.length+1} · ${found.length} source match${found.length===1?'':'es'}`+(current.has_more?' · More available':' · End of current results');
 }
 async function search(targetCursor=''){
  if(busy)return false;
  const values={kind:kind.value,q:query.value.trim(),project_id:scope.value.trim()};
  if(values.kind==='tool'&&!positive(values.project_id)){announce('Choose a valid exact Creative Project ID before searching its linked tools.',true);return false}
  if(values.project_id&&!positive(values.project_id)){announce('Project ID must be a positive number from a real Creative Project.',true);return false}
  if(values.q.length===1){announce('Use at least two characters or clear the search text to browse a selected project.',true);return false}
  busy=true;submit.disabled=true;next.disabled=true;previous.disabled=true;clear.disabled=true;
  announce('Checking the original private Maker source records…');
  const params=new URLSearchParams({kind:values.kind,q:values.q,limit:'20'});
  if(values.project_id)params.set('project_id',values.project_id);
  if(targetCursor)params.set('cursor',targetCursor);
  try{
   const response=await fetch('/api/admin/maker-evidence-search?'+params,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
   const data=await response.json().catch(()=>({error:'Invalid Maker source response.'}));
   if(!response.ok||!data.ok||!Array.isArray(data.results))throw Error(data.error||'Unable to read source records.');
   selected=values;cursor=targetCursor;current=data;
   announce(data.results.length?'Exact source matches found. Open the owning module to inspect original evidence.':'No matching original records found. Nothing was changed.');
   paint();return true;
  }catch(error){announce('HOLD: '+error.message+' Sign in to Admin or refine this source search; no records changed.',true);return false}
  finally{busy=false;submit.disabled=false;clear.disabled=false;next.disabled=!current.has_more;previous.disabled=!history.length;}
 }
 el('mfForm').addEventListener('submit',event=>{event.preventDefault();history=[];search('')});
 clear.addEventListener('click',()=>{kind.value='project';scope.value='';query.value='';history=[];search('')});
 next.addEventListener('click',async()=>{if(!sameFilter()){history=[];await search('');return}
  if(!current.has_more||!positive(current.next_cursor))return;
  const remembered=history.slice();history.push(cursor);if(!await search(String(current.next_cursor)))history=remembered;
  paint();});
 previous.addEventListener('click',async()=>{if(!sameFilter()){history=[];await search('');return}
  if(!history.length)return;const remembered=history.slice(),prev=history.pop();
  if(!await search(prev))history=remembered;paint();});
 // Explicit project URLs from Maker Workbench only select a scope; no private result is auto-accepted.
 const params=new URLSearchParams(location.search),id=positive(params.get('project_id'));
 if(id){scope.value=id;kind.value='design';}search('');
})();
