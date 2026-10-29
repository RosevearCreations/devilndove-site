/* Build 518 — independent read-only evidence status. A successful response from
 * one endpoint must never mask another failed endpoint or authorize a write. */
export const OWNER_READ_NAMES_518=Object.freeze(['Etsy photo inventory','Draft and original-photo receipts','Item description, tags and saved ID']);

export function summarizeOwnerReads518(results){
  if(!Array.isArray(results)||results.length!==OWNER_READ_NAMES_518.length)
    throw Error('Exactly three independent evidence reads are required.');
  const entries=results.map((result,index)=>{
    const ok=result?.status==='fulfilled'&&result.value?.ok===true;
    const value=ok?result.value:null;
    const error=ok?'':String(result?.reason?.message||result?.value?.error||'Read did not return an explicit success.').slice(0,400);
    const status=Number(result?.reason?.httpStatus||0);
    return {name:OWNER_READ_NAMES_518[index],ok,value,error,
      status:Number.isSafeInteger(status)&&status>=100&&status<=599?status:null};
  });
  return {complete:entries.every(entry=>entry.ok),entries,
    unavailable:entries.filter(entry=>!entry.ok).map(entry=>({name:entry.name,error:entry.error,status:entry.status})),
    // Partial successful reads are diagnostic evidence, NEVER final acceptance.
    readyForAssessment:entries.every(entry=>entry.ok)};
}
