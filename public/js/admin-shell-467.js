/* Build 467 — no-fetch, no-write optional Admin utility shell and contextual help. */
import {ADMIN_THEMES_467,ADMIN_SHELL_LINKS_467,ADMIN_SHELL_PAGES_467,adminHelpFor467,adminPageHelp467,normalizeAdminTheme467} from './admin-shell-policy-467.mjs?v=467';
const KEY='devilndove.admin.theme.467';
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function readTheme(){try{return normalizeAdminTheme467(window.localStorage.getItem(KEY));}catch{return 'standard';}}
function saveTheme(value){try{window.localStorage.setItem(KEY,value);return true;}catch{return false;}}
function addCardHelp(section,page){
 if(section.dataset.dd467Help==='1'||section.querySelector(':scope > details'))return;
 section.dataset.dd467Help='1';
 const title=section.querySelector('h2,h3,strong')?.textContent?.trim()||'Admin workspace';
 const details=make('details');details.className='dd-as-467-card-help';
 const summary=make('summary','ⓘ Help for '+title.slice(0,72));
 const detail=make('p',adminHelpFor467(title,page));
 details.append(summary,detail);section.append(details);
}
function decorateHomeCards(){
 const cards=document.querySelectorAll('#ddBrandV3AdminWorkspaces > a.dd-brand-v3-admin-card');
 for(const link of [...cards].slice(0,60)){
  if(link.dataset.dd467Help)return;
  link.dataset.dd467Help='1';
  const title=link.querySelector('strong')?.textContent||'Admin workspace';
  const hint=adminHelpFor467(title,link.getAttribute('href')||'');
  const id='dd-as-467-card-'+[...cards].indexOf(link);
  const icon=make('span','ⓘ');icon.className='dd-as-467-help-glyph';icon.setAttribute('aria-hidden','true');
  icon.title='Contextual help is described for assistive technology';
  const description=make('span','Help: '+hint);description.className='dd-as-467-screen-reader';description.id=id;
  link.setAttribute('aria-describedby',id);link.append(icon,description);
 }
}
function init(){
 const body=document.body,page=body?.dataset?.adminPage||'';
 if(!body||!ADMIN_SHELL_PAGES_467.includes(page)||body.dataset.ddAdminShell467==='loaded')return;
 body.dataset.ddAdminShell467='loaded';
 const shell=make('nav');shell.id='dd-as-467-shell';shell.className='dd-as-467-shell';shell.setAttribute('aria-label','Admin workspace and appearance');
 const brand=make('span','Devil n Dove · Admin');brand.className='dd-as-467-brand';
 const links=make('div');links.className='dd-as-467-links';
 for(const item of ADMIN_SHELL_LINKS_467){
  const a=make('a',item.label);a.href=item.href;
  if(location.pathname===item.href)a.setAttribute('aria-current','page');
  links.append(a);
 }
 const settings=make('div');settings.className='dd-as-467-settings';
 const appearanceLabel=make('label','Appearance');appearanceLabel.htmlFor='dd-as-467-theme';
 const select=make('select');select.id='dd-as-467-theme';select.setAttribute('aria-label','Admin appearance');
 for(const theme of ADMIN_THEMES_467){const option=make('option',theme.label);option.value=theme.key;select.append(option);}
 select.value=readTheme();body.dataset.ddAdminTheme=select.value;
 const status=make('span');status.className='dd-as-467-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 select.addEventListener('change',()=>{
  const value=normalizeAdminTheme467(select.value);body.dataset.ddAdminTheme=value;
  const remembered=saveTheme(value);
  status.textContent=(value==='purple'?'Purple':'Standard')+' appearance applied'+(remembered?' for this browser.':' for this tab only.')+' No business records changed.';
 });
 const help=make('details');help.id='dd-as-467-help';help.className='dd-as-467-help';
 const helpSummary=make('summary','ⓘ Help');help.append(helpSummary,make('p',adminPageHelp467(page)));
 const helpSafe=make('p','Theme preference is stored only in this browser; changing it never saves, shares, publishes, bills or modifies workshop work.');
 help.append(helpSafe);
 settings.append(appearanceLabel,select,help);
 shell.append(brand,links,settings,status);
 const skip=body.querySelector(':scope > a[class*="-skip"]');
 if(skip)skip.insertAdjacentElement('afterend',shell);else body.insertBefore(shell,body.firstChild);
 if(page==='home')decorateHomeCards();
 const cards=document.querySelectorAll('.mw-card,.pc-panel,.md-panel,.trial-card,.ps-panel,section.card');
 for(const section of [...cards].slice(0,60))addCardHelp(section,page);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
