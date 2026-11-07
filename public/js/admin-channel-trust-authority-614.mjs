/* Build 614 owner-facing server readback. No local persistence, no provider operation. */
export function init614(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd613Title')||!doc.querySelector('main'))return;
  const section=doc.createElement('section');
  section.className='dd569-panel';
  section.setAttribute('aria-label','35. Server-side authority and exact scoped decisions');
  const add=(tag,text,parent=section)=>{
    const el=doc.createElement(tag);if(text)el.textContent=text;parent.append(el);return el;
  };
  add('h2','35. Trusted authority enrollment and exact scoped decision ledger — Build 614');
  add('p','Server-side verification is fail-closed. Public keys first enter a PENDING queue. Only independently verified and separately provisioned trusted roots can validate signatures. No signature or decision authorizes Etsy/Meta actions.');
  const status=add('p','Checking server readiness · external HOLD.');
  status.setAttribute('role','status');
  const result=add('textarea');result.rows=8;result.readOnly=true;
  result.setAttribute('aria-label','Server-side trust and ledger readback');
  const button=(name,handler)=>{const b=add('button',name);b.type='button';
    b.className='dd569-button';b.addEventListener('click',handler);return b;};
  const field=(label,tag='input',type='text')=>{
    const box=add('label',label),el=doc.createElement(tag);
    if(tag==='input')el.type=type;
    el.style.display='block';el.style.maxWidth='100%';
    box.append(el);return el;
  };
  const endpoint='/api/admin/trust-authority-614';
  const read=async()=>{try{
    const res=await win.fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await res.json();
    result.value=JSON.stringify(data,null,2);
    status.textContent=res.ok?'Server readback available · provider operations remain HOLD.':
      'Trust registry unavailable or unauthorized · external HOLD.';
  }catch{status.textContent='Server trust check unavailable · external HOLD.';}};
  button('Refresh server proof and ledger status',read);
  add('h3','Submit a pending public-key enrollment (never an approval)');
  const id=field('Authority ID'),role=field('Role: ISSUER, WITNESS or OWNER');
  const key=field('Ed25519 public key (base64url; never a private key)');
  const source=field('Official original-source HTTPS reference');
  const review=field('Independent review reference');
  const password=field('Confirm admin password','input','password');
  button('Submit pending enrollment only',async()=>{const confirm_password=password.value;
    password.value='';
    try{
      const res=await win.fetch(endpoint,{method:'POST',credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'enroll_pending',candidate:{
          authority_id:id.value.trim(),role:role.value.trim().toUpperCase(),
          public_key:key.value.trim(),original_source_ref:source.value.trim(),
          independent_review_ref:review.value.trim()},confirm_password})});
      const data=await res.json();result.value=JSON.stringify(data,null,2);
      status.textContent=data.status==='PENDING_EXTERNAL_VERIFICATION'?
        'Pending only. Independently verified authority and explicit owner authorization still required.':
        'No authority enrolled · external HOLD.';
    }catch{status.textContent='Pending enrollment failed · external HOLD.';}
  });
  add('h3','Verify three independently signed exact-scope proofs and record an owner decision');
  add('p','Advanced controlled intake: provide an array of exactly three signed proof objects (issuer, separate witness, owner). The signed source digest, shop, product, action and dates must all match. This never enables a provider operation.');
  const proofs=field('Signed proof JSON array','textarea');
  proofs.rows=7;
  const proofPassword=field('Confirm admin password for signed decision','input','password');
  button('Verify and record signed decision (no provider action)',async()=>{
    const confirm_password=proofPassword.value;proofPassword.value='';
    let signed;try{signed=JSON.parse(proofs.value);}catch{
      status.textContent='Invalid proof JSON · external HOLD.';return;}
    try{
      const res=await win.fetch(endpoint,{method:'POST',credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'verify_and_record',proofs:signed,confirm_password})});
      const data=await res.json();result.value=JSON.stringify(data,null,2);
      status.textContent=data.signed_owner_decision_recorded?
        'Cryptographic decision receipt recorded; provider still HOLD.':
        'Signature verification or recording rejected · external HOLD.';
    }catch{status.textContent='Trust verification unavailable · external HOLD.';}
  });
  doc.querySelector('main').append(section);
  read();
  const ceremony=doc.createElement('section');ceremony.className='dd569-panel';
  ceremony.setAttribute('aria-label','36. Independent authority activation and custody audit');
  const item=(tag,text)=>{const el=doc.createElement(tag);
    if(text)el.textContent=text;ceremony.append(el);return el;};
  item('h2','36. Independent activation ceremony, original custody and ledger audit — Build 615');
  item('p','First obtain the original issuer source and independent custody evidence through approved official channels. Only the independently approved authority registrar can activate keys. This page can stage untrusted custody notes, verify three distinct pinned signatures, and audit the decision chain; it cannot activate keys or publish.');
  const state=item('p','Original custody and activation remain HOLD.');
  state.setAttribute('role','status');
  const out=item('textarea');out.rows=9;out.readOnly=true;
  out.setAttribute('aria-label','Build 615 independent ledger and custody audit');
  const endpoint615='/api/admin/trust-ceremony-615';
  const run=async(action,part,pass)=>{
    try{
      const res=await win.fetch(endpoint615,{method:'POST',credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action,...part,confirm_password:pass})});
      const data=await res.json();out.value=JSON.stringify(data,null,2);
      state.textContent=data.ok?'Receipt accepted for separate independent review. Authority and providers remain HOLD.':
        'Ceremony not verified or schema unavailable · HOLD.';
    }catch{state.textContent='Independent ceremony not available · HOLD.';}
  };
  const refresh=async()=>{try{
    const res=await win.fetch(endpoint615,{credentials:'same-origin',cache:'no-store'});
    const data=await res.json();out.value=JSON.stringify(data,null,2);
    state.textContent=data.ledger_audit?.chain_consistent?
      'Local chain recomputed; independent external anchor still required · HOLD.':
      'Complete custody/ledger verification not available · HOLD.';
  }catch{state.textContent='Readback not available · HOLD.';}};
  const b=(label,fn)=>{const btn=item('button',label);btn.type='button';
    btn.className='dd569-button';btn.addEventListener('click',fn);};
  b('Audit complete decision chain and original custody status',refresh);
  const ceremonyField=(label,rows=5,secret=false)=>{const caption=item('label',label);
    const t=doc.createElement(secret?'input':'textarea');if(secret)t.type='password';else t.rows=rows;
    t.style.display='block';t.style.maxWidth='100%';caption.append(t);return t;};
  const custodyJSON=ceremonyField('Original custody documentary candidate JSON (no tokens or private keys)');
  const custodyPass=ceremonyField('Admin password confirmation (not saved)',1,true);
  custodyPass.setAttribute('autocomplete','off');
  b('Stage original custody note — UNVERIFIED',()=>{
    const password=custodyPass.value;custodyPass.value='';
    try{run('stage_original_custody',{candidate:JSON.parse(custodyJSON.value)},password);}
    catch{state.textContent='Invalid custody JSON · HOLD.';}
  });
  const ceremonyJSON=ceremonyField('Three-party signed activation ceremony JSON (public signatures only)');
  const ceremonyPass=ceremonyField('Confirm admin password (not saved)',1,true);
  ceremonyPass.setAttribute('autocomplete','off');
  b('Verify independent ceremony — never activate provider',()=>{
    const password=ceremonyPass.value;ceremonyPass.value='';
    try{run('verify_activation_ceremony',{ceremony:JSON.parse(ceremonyJSON.value)},password);}
    catch{state.textContent='Invalid signed ceremony JSON · HOLD.';}
  });
  doc.querySelector('main').append(ceremony);
  refresh();
  const checkpoint=doc.createElement('section');checkpoint.className='dd569-panel';
  checkpoint.setAttribute('aria-label','37. External checkpoint, protective revocation and recovery drill');
  const put=(tag,content)=>{const e=doc.createElement(tag);if(content)e.textContent=content;
    checkpoint.append(e);return e;};
  put('h2','37. Independent checkpoint, key quarantine and recovery drill — Build 616');
  put('p','Only independent custodians can verify original external anchors. Signing or staging a checkpoint does not prove external publication. Quarantining a compromised key blocks older verification paths; rotation evidence stays pending. No live activation or marketplace actions occur here.');
  const stage=put('p','External checkpoint and authority remain HOLD.');stage.setAttribute('role','status');
  const receipt=put('textarea');receipt.rows=10;receipt.readOnly=true;
  receipt.setAttribute('aria-label','Build 616 external checkpoint and quarantine readback');
  const url616='/api/admin/trust-checkpoint-616';
  const fetch616=async(action,part={},pass='')=>{
    try{
      const opts=action?{method:'POST',credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action,...part,confirm_password:pass})}:
        {credentials:'same-origin',cache:'no-store'};
      const res=await win.fetch(url616,opts),json=await res.json();
      receipt.value=JSON.stringify(json,null,2);
      stage.textContent=json.ok?'Receipt/drill read back; independent activation still HOLD.':
        'Independent anchor, schema or signed proof unavailable · HOLD.';
    }catch{stage.textContent='Build 616 external readback unavailable · HOLD.';}
  };
  const button616=(label,handler)=>{const b=put('button',label);b.type='button';
    b.className='dd569-button';b.addEventListener('click',handler);};
  const input616=(label,secret=false)=>{const box=put('label',label);
    const x=doc.createElement(secret?'input':'textarea');
    if(secret){x.type='password';x.setAttribute('autocomplete','off');}
    else x.rows=5;
    x.style.display='block';x.style.maxWidth='100%';box.append(x);return x;};
  button616('Refresh signed checkpoint, quarantines and rotations',()=>fetch616());
  const drillPassword=input616('Confirm admin password for recovery simulation',true);
  button616('Run READ-ONLY controlled recovery simulation',()=>{
    const pass=drillPassword.value;drillPassword.value='';
    fetch616('run_recovery_drill',{},pass);
  });
  const quarantineJSON=input616('Protective quarantine JSON: authority_id, key_sha256, reason, evidence_ref and evidence_sha256');
  const quarantinePassword=input616('Confirm admin password for irreversible quarantine',true);
  button616('Quarantine key — deny only; cannot undo here',()=>{
    const pass=quarantinePassword.value;quarantinePassword.value='';
    try{fetch616('quarantine_key',{candidate:JSON.parse(quarantineJSON.value)},pass);}
    catch{stage.textContent='Invalid quarantine JSON · HOLD.';}
  });
  const checkpointJSON=input616('Signed external checkpoint JSON: exact payload and independent witness/owner signatures');
  const checkpointPassword=input616('Confirm admin password for checkpoint intake',true);
  button616('Verify signed checkpoint — external readback still pending',()=>{
    const pass=checkpointPassword.value;checkpointPassword.value='';
    try{fetch616('record_signed_checkpoint',{checkpoint:JSON.parse(checkpointJSON.value)},pass);}
    catch{stage.textContent='Invalid checkpoint JSON · HOLD.';}
  });
  const rotationJSON=input616('Key rotation JSON: old/new issuer proofs and independent witness/owner signatures');
  const rotationPassword=input616('Confirm admin password for pending rotation',true);
  button616('Stage key rotation evidence — never activate replacement',()=>{
    const pass=rotationPassword.value;rotationPassword.value='';
    try{fetch616('stage_rotation',{rotation:JSON.parse(rotationJSON.value)},pass);}
    catch{stage.textContent='Invalid rotation JSON · HOLD.';}
  });
  doc.querySelector('main').append(checkpoint);
  fetch616();
  const external=doc.createElement('section');external.className='dd569-panel';
  external.setAttribute('aria-label','38. Original external anchor readback and witnessed TEST approval');
  const output=(tag,content)=>{const el=doc.createElement(tag);
    if(content)el.textContent=content;external.append(el);return el;};
  output('h2','38. Original external anchor, quarantine recovery and witnessed provider TEST — Build 617');
  output('p','An approved independent custodian must host an exact, independently signed HTTPS receipt and be enrolled by a separately authorized operator. This page fetches and verifies its real bytes; it cannot approve custodians, restore quarantined keys, execute a TEST or publish. Independent original issuer and explicit owner consent remain necessary.');
  const externalStatus=output('p','Original custodian and signed TEST authority remain HOLD.');
  externalStatus.setAttribute('role','status');
  const externalRead=output('textarea');externalRead.rows=10;externalRead.readOnly=true;
  externalRead.setAttribute('aria-label','Build 617 externally retrieved anchor and TEST preflight status');
  const address='/api/admin/trust-readback-617';
  const externalField=(label,secret=false)=>{const holder=output('label',label);
    const el=doc.createElement(secret?'input':'textarea');
    if(secret){el.type='password';el.setAttribute('autocomplete','off');}
    else el.rows=6;
    el.style.display='block';el.style.maxWidth='100%';holder.append(el);return el;};
  const externalButton=(label,fn)=>{const el=output('button',label);
    el.type='button';el.className='dd569-button';el.addEventListener('click',fn);};
  const externalRequest=async(action,data={},password='')=>{
    try{
      const req=action?{method:'POST',credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action,...data,confirm_password:password})}:
        {credentials:'same-origin',cache:'no-store'};
      const response=await win.fetch(address,req),json=await response.json();
      externalRead.value=JSON.stringify(json,null,2);
      externalStatus.textContent=json.ok?'Readback or pending packet recorded; original authority still HOLD.':
        'Original custody or signed owner/witness evidence not verified · HOLD.';
    }catch{externalStatus.textContent='Independent external origin unavailable · HOLD.';}
  };
  externalButton('Refresh independently read back anchors and pending TEST packets',()=>externalRequest());
  const checkpointId=externalField('Signed Build 616 checkpoint SHA-256 (not a credential)');
  const anchorPassword=externalField('Admin password to independently fetch original HTTPS receipt',true);
  externalButton('Fetch approved external anchor and verify independent signatures',()=>{
    const password=anchorPassword.value;anchorPassword.value='';
    externalRequest('read_external_anchor',{checkpoint_sha256:checkpointId.value.trim()},password);
  });
  const recoveryJSON=externalField('Quarantine recovery packet JSON (two independent signatures; never a private key)');
  const recoveryPassword=externalField('Admin password for recovery packet intake',true);
  externalButton('Stage independently signed recovery packet — quarantine stays',()=>{
    const password=recoveryPassword.value;recoveryPassword.value='';
    try{externalRequest('stage_recovery_packet',{packet:JSON.parse(recoveryJSON.value)},password);}
    catch{externalStatus.textContent='Invalid recovery packet JSON · HOLD.';}
  });
  const preflightJSON=externalField('TEST_CONNECTION_READBACK scope signed by separate witness and owner (JSON)');
  const preflightPassword=externalField('Admin password for witnessed TEST preflight',true);
  externalButton('Verify provider TEST preflight — NO TEST EXECUTION',()=>{
    const password=preflightPassword.value;preflightPassword.value='';
    try{externalRequest('preflight_witnessed_test',{preflight:JSON.parse(preflightJSON.value)},password);}
    catch{externalStatus.textContent='Invalid TEST signature JSON · HOLD.';}
  });
  doc.querySelector('main').append(external);
  externalRequest();
  const issuer618=doc.createElement('section');issuer618.className='dd569-panel';
  issuer618.setAttribute('aria-label','39. Original issuer custody and genuine Etsy TEST challenge');
  const append618=(tag,content)=>{const el=doc.createElement(tag);
    if(content)el.textContent=content;issuer618.append(el);return el;};
  append618('h2','39. Original issuer, witnessed backup and first genuine provider TEST — Build 618');
  append618('p','Independent original-source registration and a separate owner-authorized migration/backup decision are required. This page cannot grant itself authority. A specially approved one-time Etsy TEST performs exactly one authenticated GET /users/me (never a listing write), then requires separate signed witness/owner acceptance of the real response digest. Other providers remain HOLD.');
  const issuerStatus=append618('p','Original issuer, backup and live TEST remain HOLD.');
  issuerStatus.setAttribute('role','status');
  const issuerResult=append618('textarea');issuerResult.rows=10;issuerResult.readOnly=true;
  issuerResult.setAttribute('aria-label','Build 618 original custody, backup and TEST receipt readback');
  const issuerField=(label,secret=false)=>{const wrapper=append618('label',label);
    const el=doc.createElement(secret?'input':'textarea');
    if(secret){el.type='password';el.setAttribute('autocomplete','off');}
    else el.rows=6;
    el.style.display='block';el.style.maxWidth='100%';wrapper.append(el);return el;};
  const issuerButton=(label,run)=>{const el=append618('button',label);
    el.type='button';el.className='dd569-button';el.addEventListener('click',run);};
  const run618=async(action,payload={},password='')=>{
    try{const opts=action?{method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action,...payload,confirm_password:password})}:
      {credentials:'same-origin',cache:'no-store'};
      const response=await win.fetch('/api/admin/trust-issuer-618',opts);
      const data=await response.json();issuerResult.value=JSON.stringify(data,null,2);
      issuerStatus.textContent=data.ok?'Readback/receipt recorded; provider publishing and global authority remain HOLD.':
        'Required original independent custody, consent, migration or TEST grant absent · HOLD.';
    }catch{issuerStatus.textContent='Original issuer trust readback unavailable · HOLD.';}
  };
  issuerButton('Read original issuer, backup, one-use grant and TEST status',()=>run618());
  const issuerJSON=issuerField('Original issuer signed CANDIDATE/WITNESS/OWNER custody attestation JSON');
  const issuerPassword=issuerField('Admin password to stage original issuer attestation',true);
  issuerButton('Stage authenticated issuer proof — no activation',()=>{
    const password=issuerPassword.value;issuerPassword.value='';
    try{run618('attest_original_issuer',{attestation:JSON.parse(issuerJSON.value)},password);}
    catch{issuerStatus.textContent='Invalid issuer proof JSON · HOLD.';}
  });
  const backupJSON=issuerField('Witness/owner signed backup hash and exact migration-manifest review JSON');
  const backupPassword=issuerField('Admin password for witnessed backup packet',true);
  issuerButton('Record witnessed backup — never apply D1 migrations',()=>{
    const password=backupPassword.value;backupPassword.value='';
    try{run618('witness_backup_migration',{packet:JSON.parse(backupJSON.value)},password);}
    catch{issuerStatus.textContent='Invalid backup packet JSON · HOLD.';}
  });
  const grant618=issuerField('Separately approved original TEST grant ID (not a token)');
  const challengePassword=issuerField('Admin password for one-time real Etsy GET',true);
  issuerButton('Execute SINGLE authorized real Etsy identity GET — no write or automatic retry',()=>{
    const password=challengePassword.value;challengePassword.value='';
    run618('execute_single_etsy_identity_get',{grant_id:grant618.value.trim()},password);
  });
  const acceptanceJSON=issuerField('Independent witness/owner signed exact genuine Etsy receipt JSON');
  const acceptancePassword=issuerField('Admin password to accept TEST receipt (not publication)',true);
  issuerButton('Verify and record genuine GET acceptance — never publish',()=>{
    const password=acceptancePassword.value;acceptancePassword.value='';
    try{run618('accept_witnessed_etsy_receipt',
      {acceptance:JSON.parse(acceptanceJSON.value)},password);}
    catch{issuerStatus.textContent='Invalid witnessed GET receipt JSON · HOLD.';}
  });
  doc.querySelector('main').append(issuer618);
  run618();
  const reconcile619=doc.createElement('section');reconcile619.className='dd569-panel';
  reconcile619.setAttribute('aria-label','40. Genuine Etsy TEST receipt reconciliation and Meta read-only local preflight');
  const add619=(tag,value)=>{const el=doc.createElement(tag);
    if(value)el.textContent=value;reconcile619.append(el);return el;};
  add619('h2','40. Genuine Etsy receipt ledger, spent nonce failure custody and Meta READ-only preflight — Build 619');
  add619('p','Read existing immutable Etsy TEST attempt/outcome/witness receipts. Any spent nonce is final, even after a timeout; conflicting or missing evidence stays on HOLD. Meta permission checks inspect only saved local OAuth metadata and never call Meta or authorize publishing. Original issuer/operator and owner consent are still required.');
  const status619=add619('p','Receipt audit and Meta source credentials not yet independently accepted · HOLD.');
  status619.setAttribute('role','status');
  const read619=add619('textarea');read619.rows=11;read619.readOnly=true;
  read619.setAttribute('aria-label','Build 619 source-owned TEST receipt and Meta capability readback');
  const endpoint619='/api/admin/trust-reconciliation-619';
  const request619=async(action=null,extra={},password='')=>{
    try{const options=action?{method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action,...extra,confirm_password:password})}:
      {credentials:'same-origin',cache:'no-store'};
      const response=await win.fetch(endpoint619,options),result=await response.json();
      read619.value=JSON.stringify(result,null,2);
      status619.textContent=response.ok?'Immutable local readback available; provider, publication and original authority remain HOLD.':
        'Witnessed receipts or proposed D1 schema unavailable · HOLD.';
    }catch{status619.textContent='Source-owned receipt readback unavailable · HOLD.';}
  };
  const button619=(label,fn)=>{const el=add619('button',label);el.type='button';
    el.className='dd569-button';el.addEventListener('click',fn);};
  const field619=(label,secret=false)=>{const wrapper=add619('label',label);
    const el=doc.createElement(secret?'input':'textarea');
    if(secret){el.type='password';el.setAttribute('autocomplete','off');}else el.rows=6;
    el.style.display='block';el.style.maxWidth='100%';wrapper.append(el);return el;};
  button619('Reconcile actual stored Etsy one-use GET receipts and inspect Meta READ-only permissions',()=>request619());
  const failurePacket=field619('Signed independent WITNESS/OWNER spent-nonce failure acknowledgement JSON');
  const failurePassword=field619('Admin password for witnessed failure acknowledgement',true);
  button619('Record independent spent Etsy nonce disposition — NO RETRY',()=>{
    const password=failurePassword.value;failurePassword.value='';
    try{request619('witness_spent_etsy_failure',
      {disposition:JSON.parse(failurePacket.value)},password);}
    catch{status619.textContent='Malformed exact failure evidence · HOLD.';}
  });
  doc.querySelector('main').append(reconcile619);
  request619();
  const audit620=doc.createElement('section');audit620.className='dd569-panel';
  audit620.setAttribute('aria-label','41. Full-history Etsy audit and original Meta read-only TEST');
  const add620=(tag,value)=>{const element=doc.createElement(tag);
    if(value)element.textContent=value;audit620.append(element);return element;};
  add620('h2','41. Full-history Etsy receipt audit and controlled Meta Page identity — Build 620');
  add620('p','The server scans ALL immutable Etsy grant/attempt/outcome/witness/failure tables for counts, source links and conflicts, not just 100 recent records. These are database consistency findings, not an external cryptographic witness. Meta can execute only an independently approved single-use GET for the exact saved Facebook Page ID. No Marketplace, Instagram or posting rights are inferred. Original authority and independent signed consent remain mandatory.');
  const state620=add620('p','Full source history and original Meta test remain on HOLD.');
  state620.setAttribute('role','status');
  const results620=add620('textarea');results620.rows=12;results620.readOnly=true;
  results620.setAttribute('aria-label','Full-history Etsy integrity and Meta genuine provider TEST evidence');
  const request620=async(action=null,extra={},password='')=>{
    try{const options=action?{method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action,...extra,confirm_password:password})}:
      {credentials:'same-origin',cache:'no-store'};
      const response=await win.fetch('/api/admin/trust-audit-meta-620',options);
      const data=await response.json();results620.value=JSON.stringify(data,null,2);
      state620.textContent=data.ok?'Local full-history audit/guarded receipt readback returned; publishing and independent final witness remain HOLD.':
        'Exact original custody, D1, account, or independent owner consent not verified · HOLD.';
    }catch{state620.textContent='Full Etsy audit or Meta original provider readback unavailable · HOLD.';}
  };
  const button620=(label,fn)=>{const button=add620('button',label);button.type='button';
    button.className='dd569-button';button.addEventListener('click',fn);};
  button620('Run full-history immutable Etsy SQL consistency audit (NO provider call)',()=>request620());
  const grantLabel=add620('label','Separately approved original Meta Page GET grant ID (never a token)');
  const metaGrant=doc.createElement('input');metaGrant.type='text';metaGrant.style.display='block';
  metaGrant.style.maxWidth='100%';grantLabel.append(metaGrant);
  const passLabel=add620('label','Admin password for independently authorized SINGLE Meta Page GET');
  const metaPassword=doc.createElement('input');metaPassword.type='password';
  metaPassword.setAttribute('autocomplete','off');metaPassword.style.display='block';
  metaPassword.style.maxWidth='100%';passLabel.append(metaPassword);
  button620('Run ONE pre-approved Meta Page ID GET — NO RETRY / NO PUBLISH',()=>{
    const password=metaPassword.value;metaPassword.value='';
    request620('execute_one_meta_page_id_get',{grant_id:metaGrant.value.trim()},password);
  });
  doc.querySelector('main').append(audit620);
  request620();
  const review621=doc.createElement('section');review621.className='dd569-panel';
  review621.setAttribute('aria-label','42. Independent full-history checkpoint and witnessed original Meta GET');
  const add621=(tag,value)=>{const element=doc.createElement(tag);
    if(value)element.textContent=value;review621.append(element);return element;};
  add621('h2','42. Original Etsy audit checkpoint and genuine Meta provider TEST witness — Build 621');
  add621('p','A complete row-by-row digest may be independently signed only by already verified original ISSUER, WITNESS and OWNER keys. The original Meta issuer must separately enroll outside this application. A genuine signed Meta GET witness is accepted only after the one-use provider GET receipt actually exists. No activation, publication, automatic migration, or simulated provider approval.');
  const state621=add621('p','Original external authority and genuine TEST witness are on HOLD.');
  state621.setAttribute('role','status');
  const result621=add621('textarea');result621.readOnly=true;result621.rows=15;
  result621.setAttribute('aria-label','Full Etsy history checkpoint and original Meta signed evidence results');
  const button621=(label,callback)=>{const b=add621('button',label);b.type='button';
    b.className='dd569-button';b.addEventListener('click',callback);return b;};
  const field621=(label,secret=false)=>{const l=add621('label',label);
    const el=doc.createElement(secret?'input':'textarea');
    if(secret){el.type='password';el.autocomplete='off';}else el.rows=8;
    el.style.display='block';el.style.maxWidth='100%';l.append(el);return el;};
  const request621=async (full=false,action=null,bundle=null,password='')=>{
    state621.textContent=full?'Hashing every immutable source receipt row (no provider call)…':
      'Reviewing independently signed source evidence · HOLD…';
    try{const response=await win.fetch('/api/admin/trust-history-meta-621'+
      (full?'?full_history=1':''),action?{method:'POST',credentials:'same-origin',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({action,
          signed_bundle:bundle,confirm_password:password})}:
      {credentials:'same-origin',cache:'no-store'});
      const data=await response.json();result621.value=JSON.stringify(data,null,2);
      state621.textContent=data.ok?'Independent handoff evidence readback received; production provider permissions remain HOLD.':
        'Independent original signatures, full-history readback or actual provider TEST receipt missing · HOLD.';
    }catch{state621.textContent='Independent history or Meta source evidence unavailable · HOLD.';}
  };
  button621('Review original Meta issuer enrollment handoff and actual GET receipts (NO provider call)',()=>request621());
  button621('Compute COMPLETE immutable Etsy history SHA-256 checkpoint (NO provider call)',
    ()=>request621(true));
  const historyProof621=field621('Externally signed ORIGINAL ISSUER / independent WITNESS / OWNER complete Etsy checkpoint JSON');
  const historyPassword621=field621('Admin password to record signed complete-history evidence',true);
  button621('Record three-party signed COMPLETE Etsy history checkpoint — NO D1 MIGRATION',()=>{
    const password=historyPassword621.value;historyPassword621.value='';
    try{request621(false,'witness_complete_etsy_history',JSON.parse(historyProof621.value),password);}
    catch{state621.textContent='Malformed independently signed Etsy source bundle · HOLD.';}
  });
  const metaProof621=field621('Externally signed three-party witness acceptance of ACTUAL Meta Page GET receipt JSON');
  const metaPassword621=field621('Admin password to witness an existing one-use real Meta GET receipt',true);
  button621('Witness existing genuine Meta Page GET receipt — NO REPLAY / NO PUBLICATION',()=>{
    const password=metaPassword621.value;metaPassword621.value='';
    try{request621(false,'accept_actual_meta_page_get',JSON.parse(metaProof621.value),password);}
    catch{state621.textContent='Malformed independent original Meta receipt witness · HOLD.';}
  });
  doc.querySelector('main').append(review621);
  request621();
  const closure622=doc.createElement('section');closure622.className='dd569-panel';
  closure622.setAttribute('aria-label','43. External archive original readback and witnessed Meta TEST closure');
  const add622=(tag,value)=>{const el=doc.createElement(tag);
    if(value)el.textContent=value;closure622.append(el);return el;};
  add622('h2','43. Verified external original archive and single Meta TEST closure — Build 622');
  add622('p','A genuine independent archive readback is a single, issuer/witness/owner-approved HTTPS GET from the already pinned external custodian, with a spent nonce and exact all-history SHA-256 match. Meta TEST closure then requires that real archive receipt plus the already witnessed one-use original Page-ID GET. No account connection, posting, new authority key or D1 migration is activated here.');
  const status622=add622('p','Independent original archive and real Meta TEST closure · HOLD.');
  status622.setAttribute('role','status');
  const result622=add622('textarea');result622.readOnly=true;result622.rows=14;
  result622.setAttribute('aria-label','Verified original archive and real Meta provider TEST closure readback');
  const button622=(label,callback)=>{const el=add622('button',label);el.type='button';
    el.className='dd569-button';el.addEventListener('click',callback);return el;};
  const field622=(label,password=false)=>{const el=add622('label',label);
    const input=doc.createElement(password?'input':'textarea');
    if(password){input.type='password';input.autocomplete='off';}else input.rows=8;
    input.style.display='block';input.style.maxWidth='100%';el.append(input);return input;};
  const request622=async(action=null,bundle=null,password='')=>{
    status622.textContent=action?'Validating separately signed exact-source original evidence…':
      'Reviewing original external archive and Meta authority · HOLD…';
    try{const res=await win.fetch('/api/admin/trust-archive-meta-622',
      action?{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action,signed_bundle:bundle,confirm_password:password})}:
        {credentials:'same-origin',cache:'no-store'});
      const data=await res.json();result622.value=JSON.stringify(data,null,2);
      status622.textContent=data.ok?'Exact source proof readback completed. No provider publishing or automatic connected state.':
        'Original external custody or actual provider TEST evidence not verified · HOLD.';
    }catch{status622.textContent='External custodian or original Meta source evidence unavailable · HOLD.';}
  };
  button622('Read back original Meta authority and archive status (NO NETWORK TEST)',()=>request622());
  const archiveBundle622=field622('Separately approved three-party ORIGINAL archive GET signed JSON (ONE NONCE)');
  const archivePassword622=field622('Admin password for one exact verified external archive GET',true);
  button622('Execute ONE independently approved original archive HTTPS GET — NO RETRY',()=>{
    const pw=archivePassword622.value;archivePassword622.value='';
    try{request622('one_exact_original_archive_readback',JSON.parse(archiveBundle622.value),pw);}
    catch{status622.textContent='Malformed independent external readback signatures · HOLD.';}
  });
  const closureBundle622=field622('Three-party signed original closure for an ALREADY witnessed real Meta Page GET JSON');
  const closurePassword622=field622('Admin password to record actual TEST closure',true);
  button622('Record original genuine Meta Page GET TEST closure — NO PUBLISH / NO CONNECTION',()=>{
    const pw=closurePassword622.value;closurePassword622.value='';
    try{request622('close_one_witnessed_meta_page_get',JSON.parse(closureBundle622.value),pw);}
    catch{status622.textContent='Malformed independent Meta TEST closure evidence · HOLD.';}
  });
  doc.querySelector('main').append(closure622);
  request622();
  const activation623=doc.createElement('section');activation623.className='dd569-panel';
  activation623.setAttribute('aria-label','44. Original Meta owner completion and archive continuity');
  const add623=(tag,value)=>{const el=doc.createElement(tag);
    if(value)el.textContent=value;activation623.append(el);return el;};
  add623('h2','44. Owner-supervised Meta identity and independent archive continuity — Build 623');
  add623('p','Three independently signed stages: complete ORIGINAL Meta authority for the already witnessed single GET; witness two distinct genuine historical archive GET receipts; approve a ten-minute stored Page-ID receipt view. The status is computed from current original pins, immutable source receipts and saved OAuth Page ID/scopes. Nothing here calls Meta, grants new OAuth scopes, publishes, or connects a channel. Original source migrations 0052–0061 are separate owner-supervised work.');
  const status623=add623('p','Original authority and independent archive continuity · HOLD.');
  status623.setAttribute('role','status');
  const result623=add623('textarea');result623.readOnly=true;result623.rows=15;
  result623.setAttribute('aria-label','Original signed Meta authority and stored Page identity read-only view status');
  const button623=(label,callback)=>{const el=add623('button',label);el.type='button';
    el.className='dd569-button';el.addEventListener('click',callback);return el;};
  const field623=(label,password=false)=>{const el=add623('label',label);
    const input=doc.createElement(password?'input':'textarea');
    if(password){input.type='password';input.autocomplete='off';}else input.rows=8;
    input.style.display='block';input.style.maxWidth='100%';el.append(input);return input;};
  const request623=async(action=null,bundle=null,password='')=>{
    status623.textContent='Rechecking original signatures, source continuity and exact read-only scope · HOLD…';
    try{const response=await win.fetch('/api/admin/trust-activation-623',
      action?{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action,signed_bundle:bundle,confirm_password:password})}:
        {credentials:'same-origin',cache:'no-store'});
      const data=await response.json();result623.value=JSON.stringify(data,null,2);
      status623.textContent=data.derived_readonly_page_identity_window?.verified===true?
        'Original stored Page-ID TEST view independently verified; never connected or publishing.':
        data.ok?'Evidence recorded for separate independent review. Provider integration remains HOLD.':
        'Original issuer, independent witness, owner or exact archive/Meta receipt missing · HOLD.';
    }catch{status623.textContent='Original Meta or historical external archive evidence unavailable · HOLD.';}
  };
  button623('Read back independently verified Meta Page-ID receipt view (NO provider request)',()=>request623());
  for(const [action,label,description] of [
    ['record_original_meta_completion','Complete original Meta authority with THREE original signatures',
      'Externally signed ORIGINAL Meta ISSUER / independent WITNESS / OWNER original authority completion JSON'],
    ['witness_two_original_archives','Witness TWO genuine separate complete-history archive receipts',
      'Three-party signed TWO real external archive GET receipts, separate nonces, original history JSON'],
    ['record_one_readonly_meta_test_window','Approve ONE ten-minute STORED Meta Page-ID receipt view',
      'Three-party signed exact Page-ID / OAuth-scope / original-ledger read-only test window JSON']]){
    const signed=field623(description),password=field623('Admin password — owner-supervised '+action,true);
    button623(label+' — NO PUBLISHING / NO PROVIDER CALL',()=>{
      const pw=password.value;password.value='';
      try{request623(action,JSON.parse(signed.value),pw);}
      catch{status623.textContent='Malformed separately signed original evidence · HOLD.';}
    });
  }
  doc.querySelector('main').append(activation623);
  request623();
  const live624=doc.createElement('section');live624.className='dd569-panel';
  live624.setAttribute('aria-label','45. Original encrypted Meta credential and one-use live read-only recheck');
  const add624=(tag,value)=>{const e=doc.createElement(tag);
    if(value)e.textContent=value;live624.append(e);return e;};
  add624('h2','45. Original Meta encrypted credential, expiring one-use live identity and witness — Build 624');
  add624('p','Requires an already verified Build 623 signed Page-ID window and separately signed ORIGINAL ISSUER / WITNESS / OWNER decisions. Enrollment only attests the SAVED encrypted Meta credential — never paste access tokens here. Each new live Page-ID GET requires a fresh ten-minute original authorization, unique nonce, admin password and explicit operator click. The nonce is spent BEFORE the external read. An independent signed receipt witness follows. No token refresh, Meta posting, OAuth account connection or automatic recheck. Proposed migrations 0052–0062 remain separately supervised.');
  const status624=add624('p','Original encrypted Meta custody and actual single-use provider GET · HOLD.');
  status624.setAttribute('role','status');
  const result624=add624('textarea');result624.readOnly=true;result624.rows=14;
  result624.setAttribute('aria-label','Original Meta encrypted credential, genuine provider GET and witness readback');
  const button624=(label,callback)=>{const e=add624('button',label);e.type='button';
    e.className='dd569-button';e.addEventListener('click',callback);return e;};
  const field624=(label,password=false,single=false)=>{const e=add624('label',label);
    const input=doc.createElement(password||single?'input':'textarea');
    if(password){input.type='password';input.autocomplete='off';}
    if(single)input.autocomplete='off';if(!password&&!single)input.rows=8;
    input.style.display='block';input.style.maxWidth='100%';e.append(input);return input;};
  const request624=async(action=null,bundle=null,password='',authorizationId=null)=>{
    status624.textContent='Verifying original Meta authority, encrypted token fingerprint and expiring one-use scope…';
    try{const response=await win.fetch('/api/admin/trust-meta-live-624',
      action?{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action,signed_bundle:bundle,authorization_id:authorizationId,
          confirm_password:password})}:{credentials:'same-origin',cache:'no-store'});
      const data=await response.json();result624.value=JSON.stringify(data,null,2);
      status624.textContent=data.latest_verified_original_get===
        'ORIGINAL_ONE_GENUINE_META_GET_WITNESSED_READ_ONLY_NO_CONNECTION'?
        'Genuine original Meta Page-ID GET independently witnessed; no publication or connection.':
        data.actual_provider_get_performed===true?
          'One real Meta identity GET recorded. Original independent witness acceptance STILL REQUIRED.':
        data.ok?'Original read-only evidence received; live Meta acceptance requires separate verification.':
          'Original issuer, witness, owner, encrypted OAuth token or real receipt missing · HOLD.';
    }catch{status624.textContent='Original Meta authority or independent signed evidence unavailable · HOLD.';}
  };
  button624('Review original encrypted Meta enrollment and witnessed actual GET (NO provider call)',()=>request624());
  for(const [action,label,description] of [
    ['enroll_existing_encrypted_credential','Attest SAVED encrypted Meta credential',
      'Original three-party signed exact encrypted-token fingerprint and current Page-ID window JSON'],
    ['approve_one_live_meta_recheck','Authorize ONE expiring original Page-ID GET',
      'Fresh original three-party signed exact Page GET authorization, unique nonce and expiry JSON'],
    ['accept_one_genuine_meta_receipt','Witness existing ACTUAL Meta GET receipt',
      'Independent three-party signed genuine saved Meta Page-ID GET receipt JSON']]){
    const signed=field624(description),password=field624('Admin password for '+action,true);
    button624(label+' — OWNER SUPERVISED / NO PUBLISH',()=>{
      const pw=password.value;password.value='';
      try{request624(action,JSON.parse(signed.value),pw);}
      catch{status624.textContent='Malformed external original signature bundle · HOLD.';}
    });
  }
  const singleGrant624=field624('Previously signed exact authorization ID for ONE genuine Meta Page-ID GET',false,true);
  const singlePassword624=field624('Admin password for irreversible one-use provider GET',true);
  button624('EXECUTE ONE ORIGINAL APPROVED META PAGE-ID GET — NONCE SPENT / NEVER RETRY',()=>{
    const pw=singlePassword624.value;singlePassword624.value='';
    if(!win.confirm('Perform ONE real Meta Page-ID GET under this independently signed original authorization? The nonce is spent even on failure. No retry or publication.'))return;
    request624('execute_one_live_meta_recheck',null,pw,singleGrant624.value.trim());
  });
  doc.querySelector('main').append(live624);
  request624();
  const help625=doc.createElement('section');help625.className='dd569-panel';
  help625.setAttribute('aria-label','46. Original-owner Meta activation assistant and D1 migration readback');
  const add625=(tag,value,parent=help625)=>{const el=doc.createElement(tag);
    if(value)el.textContent=value;parent.append(el);return el;};
  add625('h2','46. Original-owner Meta activation assistant and first genuine TEST closure — Build 625');
  add625('p','This assistant checks which source D1 tables are visible and which original custody receipts exist. Table presence does not prove a migration was approved or applied by its original operator; receipt counts do not prove signatures. Only sections 44/45 verify original signatures and the real single-use Meta Page GET. This screen never migrates, signs, decrypts, contacts Meta or connects an account.');
  const status625=add625('p','Checking original owner and first genuine live GET witness · HOLD.');
  status625.setAttribute('role','status');
  const steps625=add625('ol');steps625.setAttribute('aria-label','Original Meta activation checklist');
  const result625=add625('textarea');result625.rows=13;result625.readOnly=true;
  result625.setAttribute('aria-label','Original D1 table presence and genuine TEST readback, redacted');
  const button625=(label,fn)=>{const b=add625('button',label);b.type='button';
    b.className='dd569-button';b.addEventListener('click',fn);return b;};
  const read625=async()=>{
    status625.textContent='Checking D1 table visibility, original signed custody and live witness · HOLD…';
    try{const response=await win.fetch('/api/admin/trust-activation-assistant-625',
      {credentials:'same-origin',cache:'no-store'}),data=await response.json();
      result625.value=JSON.stringify(data,null,2);steps625.replaceChildren();
      for(const check of data.assistant?.checks||[]){const item=doc.createElement('li');
        item.textContent=(check.complete?'Verified readback: ':'HOLD: ')+check.id+' — '+
          (check.complete?'Evidence present; existing signature checks remain authoritative.':check.next);
        steps625.append(item);}
      const missing=(data.original_database_readback?.migration_tables||[])
        .filter(group=>!group.schema_present).map(group=>group.migration).join(', ');
      status625.textContent=!response.ok?'Original D1 readback inaccessible · HOLD.':
        data.assistant?.source_proof_verified?
        'Original source window and actual one-use GET witness verified — READ-ONLY TEST ONLY; account connection still HOLD.':
        'Original evidence incomplete · HOLD. Missing proposed schema groups: '+(missing||'none; check signed source proofs below')+'.';
    }catch{status625.textContent='Original D1 or signed evidence readback unavailable · HOLD.';}
  };
  button625('Refresh original D1 migration and live TEST evidence (READ ONLY)',read625);
  for(const [id,label] of [['44','Go to original-owner authority and archive continuity (section 44)'],
    ['45','Go to single-use Meta GET and independent witness (section 45)']]){
    button625(label,()=>{
      const target=doc.querySelector(`section[aria-label^="${id}."]`);
      target?.scrollIntoView?.({behavior:'smooth',block:'start'});
      target?.querySelector('button')?.focus?.({preventScroll:true});
    });
  }
  doc.querySelector('main').append(help625);
  read625();
  const owner626=doc.createElement('section');owner626.className='dd569-panel';
  owner626.setAttribute('aria-label','47. Original Meta owner evidence walkthrough, renewal and read-only TEST acceptance');
  const add626=(tag,value,parent=owner626)=>{const el=doc.createElement(tag);
    if(value)el.textContent=value;parent.append(el);return el;};
  add626('h2','47. Original Meta owner walkthrough, expiring approvals and independent read-only TEST acceptance — Build 626');
  add626('p','Owner-supervised steps only. Every refresh rechecks real source evidence, saved credential expiry, signed ten-minute windows, spent nonces and the original independent witness of an actual one-time Meta Page GET. An expiring approval is never silently extended, and a spent nonce can never be reused. Accepted means ONE independently witnessed read-only TEST — not an operational channel connection, publication or automatic token renewal.');
  const status626=add626('p','Original Meta READ-ONLY TEST acceptance · HOLD.');
  status626.setAttribute('role','status');
  const expiry626=add626('p','Original authorization expiry: not verified.');
  const steps626=add626('ol');steps626.setAttribute('aria-label','Original owner supervised activation steps and renewal decisions');
  const output626=add626('textarea');output626.readOnly=true;output626.rows=13;
  output626.setAttribute('aria-label','Original signed TEST acceptance and renewal evidence readback (no secrets)');
  const btn626=(name,fn)=>{const btn=add626('button',name);btn.type='button';
    btn.className='dd569-button';btn.addEventListener('click',fn);return btn;};
  const read626=async()=>{
    status626.textContent='Independently rechecking original authority, one-use GET, current expiries and signed witness · HOLD…';
    try{const response=await win.fetch('/api/admin/trust-owner-walkthrough-626',
      {credentials:'same-origin',cache:'no-store'}),data=await response.json();
      output626.value=JSON.stringify(data,null,2);steps626.replaceChildren();
      for(const stage of data.walkthrough?.checklist||[]){const row=doc.createElement('li');
        row.textContent=(stage.complete?'✓ VERIFIED — ':'HOLD — ')+stage.id+
          ' (Admin '+stage.section+'): '+stage.action;
        steps626.append(row);}
      const renewal=data.walkthrough?.renewal;
      expiry626.textContent=renewal?
        'Owner window: '+renewal.source_window.state+
        ' · latest one-use grant: '+renewal.most_recent_one_use_grant.state+
        ' · saved encrypted credential: '+renewal.saved_meta_credential.state+
        ' · last nonce spent: '+(renewal.most_recent_nonce_spent?'YES — NEVER RETRY':'no matching claim observed')+
        '. Any expired or expiring approval needs fresh original signatures.':
        'No current original owner renewal evidence can be read · HOLD.';
      status626.textContent=!response.ok?'Original evidence readback unavailable · HOLD.':
        data.walkthrough?.accepted_for_readonly_test_only===true?
          'VERIFIED: one genuine original Meta Page GET independently witnessed — READ-ONLY TEST ACCEPTED; channel NOT connected.':
          'HOLD: original owner/signed source/actual Meta GET evidence incomplete. Next: '+
            (data.walkthrough?.next_action||'review section 46') ;
    }catch{status626.textContent='Original source/witness readback unavailable · HOLD.';}
  };
  btn626('Refresh current owner approval expiry and VERIFIED single-GET TEST (NO provider request)',read626);
  for(const id of ['46','44','45'])btn626('Go to original owner evidence section '+id,()=>{
    const el=doc.querySelector(`section[aria-label^="${id}."]`);
    el?.scrollIntoView?.({behavior:'smooth',block:'start'});
    el?.querySelector('button')?.focus?.({preventScroll:true});
  });
  doc.querySelector('main').append(owner626);
  read626();
  const decision627=doc.createElement('section');decision627.className='dd569-panel';
  decision627.setAttribute('aria-label','48. Original Meta evidence gap resolution and three-party read-only channel decision');
  const add627=(tag,value,parent=decision627)=>{const el=doc.createElement(tag);
    if(value)el.textContent=value;parent.append(el);return el;};
  add627('h2','48. Original Meta evidence gaps, independently signed ceremony and READ-ONLY channel decision — Build 627');
  add627('p','This is a decision about ONE genuine historical Meta Page-ID GET, not activation of a Meta connection. The original issuer, separate witness and owner must each sign the exact same fresh ten-minute decision tied to the already independently verified original GET receipt. Unverified external evidence, expired windows, mismatched keys and changed source identity remain HOLD. We never generate signatures, apply migrations, refresh credentials, send another provider request or enable publication. The signed decision is evaluated only; keep the original signed packet privately.');
  const status627=add627('p','Original Meta signed read-only decision · HOLD.');
  status627.setAttribute('role','status');
  const gaps627=add627('ol');gaps627.setAttribute('aria-label','Original independent evidence gaps still needing resolution');
  const out627=add627('textarea');out627.readOnly=true;out627.rows=12;
  out627.setAttribute('aria-label','Current independent Meta authority decision and gap readback');
  const templateLabel627=add627('label','Original current source-pinned UNSIGNED decision template (copy to separate original signers; not a signature)');
  const template627=doc.createElement('textarea');template627.readOnly=true;template627.rows=8;
  template627.setAttribute('aria-label','Unsigned actual original GET witness-bound decision template');
  templateLabel627.append(template627);
  const signedLabel627=add627('label','Three independently signed ORIGINAL source decision JSON (ISSUER / WITNESS / OWNER; no private keys or tokens)');
  const signed627=doc.createElement('textarea');signed627.rows=9;
  signed627.setAttribute('aria-label','Three separate authentic original read-only decision signatures');
  signedLabel627.append(signed627);
  const passLabel627=add627('label','Admin password — original owner-supervised evidence-only decision');
  const password627=doc.createElement('input');password627.type='password';
  password627.autocomplete='off';passLabel627.append(password627);
  const btn627=(name,fn)=>{const b=add627('button',name);b.type='button';
    b.className='dd569-button';b.addEventListener('click',fn);return b;};
  const read627=async()=>{
    try{const response=await win.fetch('/api/admin/trust-channel-decision-627',
      {credentials:'same-origin',cache:'no-store'}),data=await response.json();
      out627.value=JSON.stringify(data,null,2);gaps627.replaceChildren();
      for(const id of data.original_evidence_pending||[]){const item=doc.createElement('li');
        item.textContent='HOLD original source gap: '+id;gaps627.append(item);}
      template627.value=data.unsigned_original_ceremony_template?
        JSON.stringify(data.unsigned_original_ceremony_template,null,2):'';
      status627.textContent=response.ok&&data.ceremony_ready?
        'ONE genuine original Page-ID GET independently verified. Obtain three new signatures for the exact template. No operational channel connection.':
        'Original evidence HOLD. '+(data.next_owner_step||'Complete sections 44–47 and refresh.');
    }catch{status627.textContent='Original source or current signed GET evidence unavailable · HOLD.';}
  };
  btn627('Read exact original GET, missing evidence and unsigned decision template (NO provider call)',read627);
  btn627('Verify ORIGINAL signed evidence-only read-only channel decision — NO CONNECTION',async()=>{
    const confirm_password=password627.value;password627.value='';
    let signed_bundle;try{signed_bundle=JSON.parse(signed627.value);}catch{
      status627.textContent='Malformed signed original three-party decision · HOLD.';return;}
    try{const response=await win.fetch('/api/admin/trust-channel-decision-627',
      {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'evaluate_original_read_only_decision',
          signed_bundle,confirm_password})}),data=await response.json();
      out627.value=JSON.stringify(data,null,2);
      status627.textContent=response.ok&&data.original_owner_signed_decision_verified===true?
        'Original issuer, witness and owner signed decision VERIFIED for ONE historic read-only GET only. Evidence not persisted; no Meta channel connected.':
        'Independent original signature, current receipt or admin authorization failed · HOLD.';
    }catch{status627.textContent='Original owner-supervised decision validation failed · HOLD.';}
  });
  for(const id of ['47','46','44','45'])btn627('Go to original evidence section '+id,()=>{
    const el=doc.querySelector(`section[aria-label^="${id}."]`);
    el?.scrollIntoView?.({behavior:'smooth',block:'start'});
    el?.querySelector('button')?.focus?.({preventScroll:true});
  });
  doc.querySelector('main').append(decision627);
  read627();
  const custody628=doc.createElement('section');custody628.className='dd569-panel';
  custody628.setAttribute('aria-label','49. Original Meta signed decision custody and owner-only handoff');
  const add628=(tag,value,parent=custody628)=>{const el=doc.createElement(tag);
    if(value)el.textContent=value;parent.append(el);return el;};
  add628('h2','49. Original signed Meta decision custody, independent eligibility and owner-controlled handoff — Build 628');
  add628('p','The three ORIGINAL roles must sign a fresh custody statement for the exact Build 627 signed decision. The two listed archives must be on distinct HTTPS domains; a signed claim does not prove the archived bytes were remotely read back. Signed originals may be stored only in an owner-approved append-only D1 table (proposed migration 0063). The resulting handoff is REVIEW-ONLY, never an activated Meta channel or permission to publish.');
  const status628=add628('p','Original Meta decision custody · HOLD.');
  status628.setAttribute('role','status');
  const out628=add628('textarea');out628.readOnly=true;out628.rows=12;
  out628.setAttribute('aria-label','Original Meta signed custody and eligibility readback');
  const bundleLabel628=add628('label','Original three-signature decision JSON from section 48 (public signatures only)');
  const decisionBundle628=doc.createElement('textarea');decisionBundle628.rows=7;
  decisionBundle628.setAttribute('aria-label','Exact signed Build 627 original decision');
  bundleLabel628.append(decisionBundle628);
  const unsignedLabel628=add628('label','Unsigned original custody template, for separate original signers');
  const unsigned628=doc.createElement('textarea');unsigned628.rows=8;unsigned628.readOnly=true;
  unsigned628.setAttribute('aria-label','Unsigned Build 628 exact original custody packet');
  unsignedLabel628.append(unsigned628);
  const custodyLabel628=add628('label','Three original ISSUER/WITNESS/OWNER signatures over final custody template (never private keys)');
  const custodyBundle628=doc.createElement('textarea');custodyBundle628.rows=8;
  custodyBundle628.setAttribute('aria-label','Original three-signature signed custody JSON');
  custodyLabel628.append(custodyBundle628);
  const receiptLabel628=add628('label','Immutable original custody SHA-256 for review-only handoff');
  const receipt628=doc.createElement('input');receipt628.type='text';
  receipt628.setAttribute('aria-label','Saved original custody SHA-256');
  receiptLabel628.append(receipt628);
  const passwordLabel628=add628('label','Confirm admin password for original-owner action');
  const password628=doc.createElement('input');password628.type='password';
  password628.autocomplete='off';passwordLabel628.append(password628);
  const btn628=(name,fn)=>{const b=add628('button',name);b.type='button';
    b.className='dd569-button';b.addEventListener('click',fn);return b;};
  const endpoint628='/api/admin/trust-custody-handoff-628';
  const read628=async()=>{try{
    const res=await win.fetch(endpoint628,{credentials:'same-origin',cache:'no-store'});
    const data=await res.json();out628.value=JSON.stringify(data,null,2);
    if(data.latest_original_owner_custody?.custody_sha256)
      receipt628.value=data.latest_original_owner_custody.custody_sha256;
    status628.textContent=data.owner_custody_schema_present&&data.signed_original_single_get_current?
      'Original read-only GET and custody table available; separate signatures and independent external readback still required. NO CONNECTION.':
      'HOLD · '+(data.next_owner_action||'Original source, owner signatures or proposed D1 custody table missing.');
  }catch{status628.textContent='Original signed custody readback unavailable · HOLD.';}};
  const post628=async action=>{
    const confirm_password=password628.value;password628.value='';
    let original_signed_decision,signed_custody;
    if(action!=='prepare_owner_review_handoff'){
      try{original_signed_decision=JSON.parse(decisionBundle628.value||signed627.value);
        if(action==='archive_signed_original_custody')signed_custody=JSON.parse(custodyBundle628.value);
      }catch{status628.textContent='Exact signed original decision or custody JSON missing · HOLD.';return;}}
    try{const res=await win.fetch(endpoint628,{method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({action,
        original_signed_decision,signed_custody,custody_sha256:receipt628.value.trim(),
        confirm_password})});
      const data=await res.json();out628.value=JSON.stringify(data,null,2);
      if(data.unsigned_original_custody_template)
        unsigned628.value=JSON.stringify(data.unsigned_original_custody_template,null,2);
      if(data.original_owner_signed_custody_recorded)receipt628.value=data.custody_sha256;
      status628.textContent=res.ok?
        'Original custody evidence prepared or verified. EXTERNAL READBACK / GO-LIVE remain HOLD; Meta is NOT connected.':
        'Original custody or signed owner handoff rejected · HOLD.';
    }catch{status628.textContent='Original signed custody verification failed · HOLD.';}
  };
  btn628('Refresh original signed custody and eligibility (READ ONLY)',read628);
  btn628('Prepare exact UNSIGNED original custody template (NO WRITE)',()=>post628('prepare_custody_template'));
  btn628('Archive three-party SIGNED original decision custody (APPEND ONLY)',()=>post628('archive_signed_original_custody'));
  btn628('Prepare independently checked OWNER REVIEW handoff — NO META CONNECTION',()=>post628('prepare_owner_review_handoff'));
  btn628('Go to original signed decision section 48',()=>{
    const el=doc.querySelector('section[aria-label^="48."]');
    el?.scrollIntoView?.({behavior:'smooth',block:'start'});
    el?.querySelector('button')?.focus?.({preventScroll:true});
  });
  doc.querySelector('main').append(custody628);
  read628();
}
if(typeof document!=='undefined')init614();
