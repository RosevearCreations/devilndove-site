// Build 417 — explicit local closure approval receipt policy. Does not close a provider case.
export const TYPE='provider_escalation_417_owner_approval';
export const validKey=k=>typeof k==='string'&&/^[A-Za-z0-9_-]{16,100}$/.test(k);
export function mayApprove({packet,viewer,assignee,body}={}){
 const errors=[];
 if(packet?.local_closure_review_ready!==true||packet?.scan_complete!==true)errors.push('LOCAL_EVIDENCE_NOT_READY');
 if(!Number.isSafeInteger(Number(viewer))||Number(viewer)<1||Number(viewer)!==Number(assignee))errors.push('CURRENT_ASSIGNEE_REQUIRED');
 if(body?.action!=='approve_local_closure'||body?.confirm_local_only!==true||
 body?.confirm_no_provider_closure!==true||body?.confirm_no_publication!==true||
 body?.confirm_us_shipping_suspended!==true)errors.push('EXPLICIT_OWNER_APPROVAL_REQUIRED');
 if(typeof body?.owner_note!=='string'||body.owner_note.trim().length<20||body.owner_note.trim().length>600)errors.push('SUBSTANTIVE_OWNER_NOTE_REQUIRED');
 if(!validKey(body?.request_key))errors.push('REQUEST_KEY_REQUIRED');
 if(typeof body?.expected_source_signature!=='string'||!/^[0-9a-f]{8}$/.test(body.expected_source_signature))errors.push('SOURCE_SIGNATURE_REQUIRED');
 const actual=packet?.evidence_receipts||{},expected=body?.expected_receipts||{};
 for(const k of ['escalation','assignment','handoff','followup','completion','route','governance'])
 if(Number(actual[k]||0)!==Number(expected[k]||0)||!Number.isSafeInteger(Number(expected[k]||0)))errors.push('STALE_RECEIPT_'+k.toUpperCase());
 return {approved:errors.length===0,reasons:errors};
}
