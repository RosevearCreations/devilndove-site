// Build 758: click-only, read-only original production browser source and private certificate readback.
import {validPublicMarker758,evaluateBuild758} from './admin-production-audit-verdict-758.mjs';
const $=id=>document.getElementById(id);
const btnSource=$('a758Verify'),btnAudit=$('a758Read');
if(btnSource&&btnAudit){
  let marker=null,busy=false;
  const say=(id,v)=>{const n=$(id);if(n)n.textContent=String(v??'');};
  function setBusy(value){busy=value;btnSource.disabled=value;btnAudit.disabled=value;}
  function resetAudit(){for(const id of ['a758Digest','a758Prior'])if($(id))$(id).value='';}
  async function readOnly(url){
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
    try{
      const target=new URL(url,location.origin);
      if(target.origin!==location.origin)throw Error('HOLD_CROSS_ORIGIN');
      const response=await fetch(target.pathname+target.search,{
        method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',
        headers:{Accept:'application/json'},signal:ctrl.signal});
      if(!response.ok)throw Error('HTTP_'+response.status);
      const data=await response.json();
      if(!data||typeof data!=='object')throw Error('HOLD_INVALID_JSON');
      return data;
    }finally{clearTimeout(timer);}
  }
  async function verify(){
    if(busy)return;setBusy(true);marker=null;resetAudit();if($('a758Sha'))$('a758Sha').value='';
    say('a758Status','Checking live main release marker, without writing any evidence.');
    try{
      const value=await readOnly('/release-version.json');
      if(!validPublicMarker758(value))throw Error('INVALID_MAIN_RELEASE_MARKER');
      marker=value;$('a758Sha').value=String(value.source_sha).toLowerCase();
      say('a758Status','Public main marker matches a valid release format. Select original Build 756 evidence, then use the separate private readback. No human approval is implied.');
    }catch(e){say('a758Status','HOLD: '+String(e?.message||e).slice(0,110));}
    finally{setBusy(false);}
  }
  async function readAudit(){
    if(busy)return;
    if(!marker){say('a758Status','HOLD: Verify the public production marker first.');return;}
    const task=String($('a756Task')?.value||''),code=String($('a756Code')?.value||'');
    if(!/^[a-f0-9-]{36}$/i.test(task)||!/^[A-Z_]{3,80}$/.test(code)){
      say('a758Status','HOLD: Load and select a genuine original Build 755 certificate in section 16 first.');return;
    }
    setBusy(true);resetAudit();say('a758Status','Independently reading authenticated private D1 continuity evidence. No writes or exports.');
    try{
      const q=new URLSearchParams({continuity756:'1',task_id:task,exception_code:code});
      const doc=await readOnly('/api/admin/customer-care-retention-ops-752?'+q.toString());
      if($('a756Task')?.value!==task||$('a756Code')?.value!==code)throw Error('SELECTION_CHANGED');
      const verdict=evaluateBuild758(marker,doc);
      if(verdict.outcome!=='PRIVATE_D1_CONTINUITY_RECORDED')throw Error(verdict.code);
      $('a758Digest').value=verdict.digest;$('a758Prior').value=verdict.previous_sha;
      say('a758Status','PRIVATE D1 CONTINUITY RECORDED: release SHA and SHA-256 match the server-verified original source. Independent physical-human field certification remains separately evidence-dependent.');
    }catch(e){say('a758Status','HOLD: '+String(e?.message||e).slice(0,110)+'. No certificate was created or renewed.');}
    finally{setBusy(false);}
  }
  btnSource.addEventListener('click',()=>void verify());
  btnAudit.addEventListener('click',()=>void readAudit());
}
