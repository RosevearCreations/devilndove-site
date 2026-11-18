// Build 734: functional one-time reset and safe forgotten account recovery.
document.addEventListener('DOMContentLoaded',()=>{
 const params=new URLSearchParams(location.search),mode=params.get('mode');
 const message=document.getElementById('accountHelpMessage'),first=document.getElementById('forgotPasswordForm'),
  account=document.getElementById('forgotEmailForm'),reminder=document.getElementById('accountReminder734Form'),
  reset=document.getElementById('reset734Form'),resetCard=document.getElementById('reset734Card');
 function note(text,error=false){if(!message)return;message.style.display=text?'':'none';
  message.textContent=text||'';message.style.color=error?'#c0392b':'';message.setAttribute('role','status');}
 const safe='If a matching active account exists and email delivery is available, instructions will arrive at its registered email.';
 async function send(url,payload){
  const r=await fetch(url,{method:'POST',credentials:'same-origin',
   headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok)throw Error(d.error||'This request could not be completed.');
  return d;
 }
 async function submit(form,payload,url){
  const button=form.querySelector('button[type="submit"]');
  if(button)button.disabled=true;
  note('Processing your request…');
  try{const data=await send(url,payload);note(data.message||safe);form.reset();}
  catch(e){note(e.message||'Request unavailable. Please try again later.',true);}
  finally{if(button)button.disabled=false;}
 }
 first?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(first);
  submit(first,{action:'reset_request',email:String(fd.get('email')||'').trim()},
   '/api/auth/recovery-734');});
 account?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(account);
  submit(account,{request_type:'forgot_email',contact_email:String(fd.get('contact_email')||''),
   display_name:String(fd.get('display_name')||''),note:String(fd.get('note')||'')},
   '/api/auth/account-help-request');});
 reminder?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(reminder);
  submit(reminder,{action:'account_reminder',email:String(fd.get('email')||'')},
   '/api/auth/recovery-734');});
 let resetToken='';
 if(mode==='reset'){
  const h=new URLSearchParams(location.hash.slice(1)),token=h.get('token')||'';
  if(/^[0-9a-f]{64}$/i.test(token)){
   resetToken=token;resetCard.hidden=false;
   // Remove sensitive fragment before rendering any clickable external link.
   history.replaceState(null,'',location.pathname+'?mode=reset');
   note('Enter a new password below. The link expires after 30 minutes.');
  }else note('Reset link is missing or invalid. Request a new password reset link.',true);
 }
 reset?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!resetToken){note('Request a new reset link first.',true);return;}
  const fd=new FormData(reset),password=String(fd.get('new_password')||''),
   confirm=String(fd.get('confirm_password')||'');
  if(password.length<12||password!==confirm){note('Passwords must match and contain at least 12 characters.',true);return;}
  const button=reset.querySelector('button[type="submit"]');button.disabled=true;
  try{
   const d=await send('/api/auth/recovery-734',{action:'reset_redeem',token:resetToken,
    new_password:password,confirm_password:confirm});
   resetToken='';reset.reset();resetCard.hidden=true;
   note(d.message||'Password updated. Please sign in again.');
  }catch(err){note(err.message||'Reset failed. Request a fresh link.',true);}
  finally{button.disabled=false;}
 });
 if(mode==='password')first?.scrollIntoView({behavior:'smooth',block:'center'});
 if(mode==='email'||mode==='account')account?.scrollIntoView({behavior:'smooth',block:'center'});
});
