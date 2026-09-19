// Release 467 Build 198 — role-aware contextual online help for public, Admin and Creator workflows.
(function(){
  'use strict';
  if(window.__DD_CONTEXT_HELP_BOOTSTRAP__) return;
  window.__DD_CONTEXT_HELP_BOOTSTRAP__ = true;

  function esc(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function clean(value){ return String(value == null ? '' : value).trim(); }
  function currentRole(){
    var path=String(location.pathname||'/').toLowerCase();
    if(/\/admin\/(creator|creative|caip|content|grey-hair|packaging)/.test(path)) return 'creator';
    if(path.indexOf('/admin/')===0) return 'admin';
    return 'user';
  }

  var HELP={
    'user.shop-search':{
      roles:['user'],title:'Shop search and filters',
      summary:'Use filters to narrow the same live Product catalog without creating a separate copy of Product data.',
      what:'Search, origin, category, colour, availability, price and discovery filters change which current public Products are shown.',
      how:['Choose only the filters that matter to you.','Use Reset to return to the full Shop.','Open a Product for its complete images, availability and buying details.'],
      changes:'Filtering never edits a Product. It only changes the current browse view.',
      links:[['Shop','/shop/']]
    },
    'user.shop-intent':{
      roles:['user'],title:'Shop by intent',
      summary:'Intent cards are shortcuts into evidence-based Shop filters.',
      what:'A Product appears in an intent path only when its current public information supports that label.',
      how:['Choose a card such as Local pickup, Vintage finds or Custom gifts.','Review the resulting Products and open one for full details.'],
      changes:'These cards do not reclassify or edit Products.',
      links:[['Shop','/shop/']]
    },
    'user.product-images':{
      roles:['user','admin','creator'],title:'Product images and framing',
      summary:'The storefront shows the complete approved Product image inside a consistent frame by default.',
      what:'The frame can contain portrait, landscape or square photography without silently cutting away part of the uploaded photo.',
      how:['Click thumbnails to see other approved Product views.','Admins can deliberately crop, recenter or create a derivative from Product Media / Photo Studio when a different composition is actually wanted.'],
      changes:'The storefront does not invent a crop. An explicit edited image becomes visible only after it is saved through the Product Media authority.',
      links:[['Product Media / Photo Studio','/admin/catalog-media/']]
    },
    'user.cart':{
      roles:['user'],title:'Cart and checkout',
      summary:'The cart holds selected items before checkout.',
      what:'Price, availability, fulfillment and Product identity remain server-authoritative when checkout is created.',
      how:['Add an item from Shop or Product Details.','Review quantity and fulfillment information in Cart.','Continue to checkout only when the details are correct.'],
      changes:'Adding or removing a cart item does not change Product stock by itself.',
      links:[['Cart','/cart/']]
    },
    'user.pickup':{
      roles:['user'],title:'Local pickup',
      summary:'Pickup information explains whether an item can be collected locally and what must be confirmed.',
      what:'Pickup eligibility comes from the Product/order workflow, not from the help text.',
      how:['Open the Pickup guide.','Confirm timing and availability before travelling.'],
      changes:'Help does not reserve stock or create an appointment.',
      links:[['Pickup guide','/pickup/']]
    },
    'user.custom-work':{
      roles:['user'],title:'Custom work requests',
      summary:'Custom Request collects enough information for Devil n Dove to review a one-off project.',
      what:'A request is not an automatic quote, production promise or reservation.',
      how:['Describe what you want and provide relevant choices/details.','Review any quote or follow-up before payment.'],
      changes:'Submitting a request creates a review path; it does not automatically publish or manufacture anything.',
      links:[['Request custom work','/custom-request/']]
    },
    'admin.today-attention':{
      roles:['admin','creator'],title:'Today Needs Attention',
      summary:'This is an operational triage view. It tells you what happened, where it happened and which owning workspace should be opened.',
      what:'Thresholds summarize recurring or stale runtime incidents. Incident cards identify the message/code, affected endpoint or area, age/severity and owner.',
      how:['Start with Critical or Error cards.','Open the owning workspace from the card instead of guessing where to fix it.','Use technical details when reproducing the issue.','Mark reviewing or resolved only when you have corrective evidence.'],
      changes:'This screen does not automatically retry payments, delete data, repair business records or resolve incidents.',
      links:[['I.T. operations','/admin/it/'],['Online Help Centre','/admin/help/']]
    },
    'admin.product-media':{
      roles:['admin','creator'],title:'Product Media / Photo Studio',
      summary:'Product Media owns Product gallery order, approved public-use metadata and deliberate image editing.',
      what:'Uploaded Product photos are preserved as authoritative images. Storefront frames show the full image by default.',
      how:['Choose one Product and one image.','Use focal/crop controls only when you intentionally want a different composition.','Preview before saving.','Use gallery order/featured controls to choose buyer-facing order.'],
      changes:'Crop/reframe work must be explicit. The storefront does not automatically crop a correctly uploaded photo.',
      links:[['Product Media / Photo Studio','/admin/catalog-media/']]
    },
    'admin.product-crop':{
      roles:['admin','creator'],title:'Crop, focal point and image position',
      summary:'Use these controls only when the source photo needs an intentional presentation adjustment.',
      what:'Focal point identifies the important part of an image. Crop coordinates define a deliberate crop or derivative.',
      how:['Start with the full original image.','Move the focal point to the subject only if needed.','Set a crop or derivative deliberately and preview it before saving.','Keep the original source preserved.'],
      changes:'Saving crop or derivative settings can change composition. It should never happen merely because a storefront card is square.',
      links:[['Product Media / Photo Studio','/admin/catalog-media/']]
    },
    'admin.media-studio':{
      roles:['admin','creator'],title:'Media & Content Studio',
      summary:'Media Studio owns static site presentation images such as heroes, workshop photos and engagement imagery, not Product catalog photos.',
      what:'Each page location has a stable page path and slot key. Assignments replace only that exact presentation slot.',
      how:['Open the exact page location.','Choose an existing site image or upload one.','Use Save details & use in this location to place it.','Use Save details only when you do not want the page image changed.'],
      changes:'Product, Inventory, Supply and Tool images remain in their specialist workspaces.',
      links:[['Media & Content Studio','/admin/media-content-studio/']]
    },
    'admin.product-editor':{
      roles:['admin'],title:'Product Editor',
      summary:'Product Editor owns buyer-facing Product facts such as name, description, pricing, category, fulfillment and publication readiness.',
      what:'Product facts are separate from Product Media composition and separate from Inventory stock movement.',
      how:['Edit only facts you can support.','Save and confirm the server response.','Use specialist Product Media controls for images.'],
      changes:'Do not invent category, shipping, cost or provenance facts merely to clear a readiness warning.',
      links:[['Products','/admin/products/']]
    },
    'admin.inventory':{
      roles:['admin','creator'],title:'Inventory Operations',
      summary:'Inventory owns supplies, tools, stock counts, reorder evidence and usage records.',
      what:'Product availability and raw material/tool evidence are related but are not the same record.',
      how:['Open the item identified by the work queue.','Review source/count evidence before changing quantity or provenance.','Use compensating/reviewed workflows for reversals.'],
      changes:'Help never adjusts stock automatically.',
      links:[['Inventory Operations','/admin/inventory-operations/']]
    },
    'admin.finance':{
      roles:['admin'],title:'Finance and Accounting',
      summary:'Finance workflows review payments, settlements, costs, reconciliation and accounting evidence.',
      what:'Provider status, orders and accounting records have separate authorities and should be reconciled rather than overwritten.',
      how:['Open the owning Finance or Accounting queue.','Review supporting order/provider evidence.','Post or reconcile only through the designated action.'],
      changes:'Context help never charges, refunds, posts or reconciles automatically.',
      links:[['Accounting','/admin/accounting/']]
    },
    'admin.release':{
      roles:['admin'],title:'Development, release and Production',
      summary:'Changes move through exact Development proof before protected Production promotion.',
      what:'Source, Development Preview, protected main and Production deployment proofs are separate release boundaries.',
      how:['Make the change in Development.','Require the exact Development checks to pass.','Promote that exact candidate through protected main.','Require exact Production deployment/runtime proof.'],
      changes:'Production business data remains Production-owned.',
      links:[['Release & Go-Live','/admin/prelaunch/'],['Online Help Centre','/admin/help/#help-release']]
    },
    'admin.infrastructure':{
      roles:['admin'],title:'D1, R2 and runtime diagnostics',
      summary:'D1 stores application data, R2 stores objects/media, and Pages/Workers run the application.',
      what:'A database warning, object-storage warning and browser/runtime incident are different failure classes.',
      how:['Start with I.T. diagnostics and the exact failing endpoint.','Use bounded read-only evidence before mutation.','Do not bulk-copy Development business data into Production.'],
      changes:'Help is explanatory and never performs a migration, delete or provider action.',
      links:[['I.T. operations','/admin/it/']]
    },
    'creator.workflow':{
      roles:['creator','admin'],title:'Creator workflow',
      summary:'Creator work moves from project evidence to reviewed content, then to deliberate public release.',
      what:'Creative Project, Content Studio, media evidence, public-use status and publication are separate stages.',
      how:['Keep source evidence attached to the project.','Choose approved media and factual notes.','Review public-use/privacy status.','Publish only from the owning release workflow.'],
      changes:'Drafting or packaging content does not publish it automatically.',
      links:[['Creator','/admin/creator/'],['Content Studio','/admin/content-studio/']]
    },
    'creator.public-use':{
      roles:['creator','admin'],title:'Public use, consent and privacy',
      summary:'An image or story can exist internally without being cleared for public use.',
      what:'Public-use status and consent evidence protect private/source media from accidental publication.',
      how:['Confirm media belongs to the intended Product or project.','Set public-use status from actual consent/evidence.','Do not mark unknown consent as approved.'],
      changes:'Changing public-use status can affect eligibility for Product pages and social content, so it requires deliberate review.',
      links:[['Product Media','/admin/catalog-media/'],['Content Studio','/admin/content-studio/']]
    },
    'creator.packaging':{
      roles:['creator','admin'],title:'Packaging Studio',
      summary:'Packaging Studio prepares labels and packaging layouts from reviewed Product, ingredient and claim evidence.',
      what:'A visual label preview is not a substitute for correct ingredients, claims, dimensions or compliance evidence.',
      how:['Choose the Product/template.','Confirm ingredients and claims.','Review artwork and text fit.','Save or reuse the approved layout.'],
      changes:'Packaging help does not alter Product inventory or publish a Product.',
      links:[['Packaging Studio','/admin/packaging-studio/']]
    }
  };

  var RULES=[
    [/today needs attention/i,'admin.today-attention'],
    [/product media|photo studio|product photography/i,'admin.product-media'],
    [/focal point|crop|recenter|re-cent/i,'admin.product-crop'],
    [/media .? content studio|media studio/i,'admin.media-studio'],
    [/advanced product search|search and filters/i,'user.shop-search'],
    [/shop by intent/i,'user.shop-intent'],
    [/product image|gallery image/i,'user.product-images'],
    [/inventory operations|reorder|stock count/i,'admin.inventory'],
    [/accounting|finance/i,'admin.finance'],
    [/release .? go-live|production promotion/i,'admin.release'],
    [/creator workflow|creative project/i,'creator.workflow'],
    [/public use|consent|privacy/i,'creator.public-use'],
    [/packaging studio/i,'creator.packaging']
  ];

  var lastFocus=null;
  function ensureCss(){
    if(document.querySelector('link[data-dd-context-help-css]')) return;
    var link=document.createElement('link');
    link.rel='stylesheet';link.href='/css/context-help.css?v=467b198';link.dataset.ddContextHelpCss='1';
    document.head.appendChild(link);
  }
  function allowed(article){
    var r=currentRole();
    return !Array.isArray(article.roles)||article.roles.indexOf(r)>=0;
  }
  function visibleArticles(){
    var r=currentRole();
    return Object.keys(HELP).filter(function(key){return allowed(HELP[key]);}).sort(function(a,b){
      var ap=a.indexOf(r+'.')===0?0:1,bp=b.indexOf(r+'.')===0?0:1;
      return ap-bp||HELP[a].title.localeCompare(HELP[b].title);
    });
  }
  function articleHtml(key,article){
    var steps=(article.how||[]).map(function(x){return '<li>'+esc(x)+'</li>';}).join('');
    var links=(article.links||[]).map(function(row){return '<a class="btn" href="'+esc(row[1])+'">'+esc(row[0])+'</a>';}).join('');
    return '<article class="dd-context-help-article" data-help-article="'+esc(key)+'">'
      +'<h3>'+esc(article.title)+'</h3><p>'+esc(article.summary||'')+'</p>'
      +(article.what?'<h4>What is this?</h4><p>'+esc(article.what)+'</p>':'')
      +(steps?'<h4>How do I use it?</h4><ol>'+steps+'</ol>':'')
      +(article.changes?'<h4>What happens if I change or use it?</h4><p>'+esc(article.changes)+'</p>':'')
      +(links?'<div class="dd-context-help-links">'+links+'</div>':'')+'</article>';
  }
  function ensureDialog(){
    var root=document.getElementById('ddContextHelpDialog');
    if(root) return root;
    root=document.createElement('div');
    root.id='ddContextHelpDialog';root.className='dd-context-help-dialog';root.hidden=true;
    root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','ddContextHelpTitle');
    root.innerHTML='<div class="dd-context-help-panel">'
      +'<div class="dd-context-help-head"><div><div class="small" id="ddContextHelpRole"></div><h2 id="ddContextHelpTitle">Help</h2></div><button class="dd-context-help-close" type="button" aria-label="Close help">×</button></div>'
      +'<div class="dd-context-help-search-row"><label><span class="small">Search help</span><input class="input" id="ddContextHelpSearch" type="search" placeholder="Search methods, processes, images, inventory…"></label><button class="btn" id="ddContextHelpShowAll" type="button">All help</button></div>'
      +'<div id="ddContextHelpBody" class="dd-context-help-body"></div></div>';
    document.body.appendChild(root);
    root.querySelector('.dd-context-help-close').addEventListener('click',close);
    root.addEventListener('click',function(event){if(event.target===root)close();});
    root.querySelector('#ddContextHelpShowAll').addEventListener('click',function(){openIndex(root.querySelector('#ddContextHelpSearch').value);});
    root.querySelector('#ddContextHelpSearch').addEventListener('input',function(event){openIndex(event.target.value,{preserveFocus:true});});
    document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!root.hidden)close();});
    return root;
  }
  function setHeader(title){
    var root=ensureDialog(),r=currentRole();
    root.querySelector('#ddContextHelpTitle').textContent=title;
    root.querySelector('#ddContextHelpRole').textContent=r==='creator'?'Creator help':r==='admin'?'Administrator help':'Site help';
  }
  function openTopic(key,trigger){
    var article=HELP[key];
    if(!article) return openIndex('',{trigger:trigger});
    ensureCss();
    var root=ensureDialog();lastFocus=trigger||document.activeElement;setHeader(article.title);
    root.querySelector('#ddContextHelpBody').innerHTML=articleHtml(key,article);
    root.hidden=false;document.documentElement.classList.add('dd-help-open');
    root.querySelector('.dd-context-help-close').focus();
  }
  function openIndex(query,options){
    query=query||'';options=options||{};ensureCss();
    var root=ensureDialog();if(options.trigger)lastFocus=options.trigger;setHeader('Online Help');
    var q=clean(query).toLowerCase();
    var keys=visibleArticles().filter(function(key){
      var a=HELP[key],hay=[key,a.title,a.summary,a.what].concat(a.how||[]).join(' ').toLowerCase();
      return !q||hay.indexOf(q)>=0;
    });
    var cards=keys.map(function(key){
      var a=HELP[key];
      return '<button type="button" class="dd-context-help-topic" data-open-help-topic="'+esc(key)+'"><strong>'+esc(a.title)+'</strong><span>'+esc(a.summary||'')+'</span></button>';
    }).join('');
    var deep=currentRole()==='user'?'<p class="small"><a href="/account-help/">Open account help</a></p>':'<p class="small"><a href="/admin/help/">Open the full Admin Help Centre</a></p>';
    root.querySelector('#ddContextHelpBody').innerHTML='<p class="small">Choose a topic or use the circled <strong>i</strong> beside a method, field or process. Help explains what it is, how to use it, and what changes when you act.</p><div class="dd-context-help-index">'+(cards||'<p>No help topics matched that search.</p>')+'</div>'+deep;
    root.querySelectorAll('[data-open-help-topic]').forEach(function(button){button.addEventListener('click',function(){openTopic(button.dataset.openHelpTopic,button);});});
    root.hidden=false;document.documentElement.classList.add('dd-help-open');
    if(!options.preserveFocus)root.querySelector('.dd-context-help-close').focus();
  }
  function close(){
    var root=document.getElementById('ddContextHelpDialog');
    if(!root||root.hidden)return;
    root.hidden=true;document.documentElement.classList.remove('dd-help-open');
    if(lastFocus&&lastFocus.focus)lastFocus.focus();lastFocus=null;
  }
  function makeTrigger(key,label){
    var b=document.createElement('button');
    b.type='button';b.className='dd-context-help-trigger';b.textContent='i';b.dataset.ddHelpKey=key;b.title='More information';
    b.setAttribute('aria-label','More information: '+(label||HELP[key].title||key));
    b.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();openTopic(key,b);});
    return b;
  }
  function inferKey(el){
    var explicit=clean(el&&el.dataset&&el.dataset.ddHelpKey);
    if(explicit&&HELP[explicit])return explicit;
    var value=clean(el&&(el.innerText||el.textContent));
    for(var i=0;i<RULES.length;i++){if(RULES[i][0].test(value)&&HELP[RULES[i][1]])return RULES[i][1];}
    return '';
  }
  function bindExplicit(root){
    (root||document).querySelectorAll('[data-dd-help-key]').forEach(function(el){
      if(el.classList.contains('dd-context-help-trigger')||el.dataset.ddHelpBound==='1')return;
      var key=inferKey(el);if(!key)return;
      el.insertAdjacentElement('afterend',makeTrigger(key,clean(el.innerText||el.textContent)));
      el.dataset.ddHelpBound='1';
    });
  }
  function bindSemantic(root){
    (root||document).querySelectorAll('h1,h2,h3,summary,label').forEach(function(el){
      if(el.dataset.ddContextHelpScanned==='1'||el.closest('#ddContextHelpDialog'))return;
      el.dataset.ddContextHelpScanned='1';
      var key=inferKey(el);if(!key)return;
      if(el.querySelector('.dd-context-help-trigger')||(el.nextElementSibling&&el.nextElementSibling.classList.contains('dd-context-help-trigger')))return;
      el.appendChild(makeTrigger(key,clean(el.innerText||el.textContent)));
    });
  }
  function ensureGlobalButton(){
    if(document.getElementById('ddContextHelpGlobal'))return;
    var b=document.createElement('button');
    b.id='ddContextHelpGlobal';b.className='dd-context-help-global';b.type='button';
    b.setAttribute('aria-label','Open online help');b.innerHTML='<span aria-hidden="true">i</span><span>Help</span>';
    b.addEventListener('click',function(){openIndex('',{trigger:b});});document.body.appendChild(b);
  }
  var queued=false;
  function scan(root){bindExplicit(root||document);bindSemantic(root||document);}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;scan(document);});}
  function init(){
    ensureCss();ensureDialog();ensureGlobalButton();scan(document);
    new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
  }
  window.DDContextHelp={open:openTopic,openIndex:openIndex,close:close,scan:scan,articles:HELP,role:currentRole};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();