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
}
if(typeof document!=='undefined')init614();
