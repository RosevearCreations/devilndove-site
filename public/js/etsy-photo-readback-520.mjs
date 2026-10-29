/* Build 520: distinguish live inventory, locally witnessed photo pairings, and
 * actual owner acceptance. A read-only diagnostic can never grant consent. */
import {ORIGINALS_519} from './etsy-photo-matching-519.mjs';

export function photoReadback520({receipt,verdict}={}){
  const originals=Array.isArray(receipt?.originals)?receipt.originals:[];
  const remote=Array.isArray(receipt?.etsy_photos)?receipt.etsy_photos:[];
  const matched=Array.isArray(receipt?.matched)?receipt.matched:[];
  const rows=ORIGINALS_519.map(original=>{
    const pair=matched.find(x=>Number(x.product_image_id)===original);
    const found=remote.find(x=>String(x.etsy_image_id)===String(pair?.etsy_image_id));
    const local=originals.find(x=>Number(x.product_image_id)===original);
    return {original,etsyImageId:pair&&found?String(pair.etsy_image_id):null,
      localPresent:!!local,remotePresent:!!found,
      paired:!!local&&!!pair&&!!found,
      note:!local?'Original not available in the saved gallery':
        !pair?'No owner-witnessed local pairing recorded':
          !found?'Earlier pairing is absent from the current Etsy inventory':
            'Local owner-witnessed pairing found in current Etsy inventory'};
  });
  const remoteIds=remote.map(x=>String(x.etsy_image_id));
  const uniqueRemote=new Set(remoteIds).size===remoteIds.length;
  const countMatch=remote.length===3&&uniqueRemote;
  return {rows,remoteCount:remote.length,remoteCountExactlyThree:countMatch,
    recordedPairs:rows.filter(x=>x.paired).length,
    unresolvedAttempts:Number(receipt?.unresolved_upload_attempts||0),
    localMatchingComplete:verdict?.readyForFinalRead===true&&countMatch&&rows.every(x=>x.paired),
    ownerAccepted:false,
    next:!countMatch?'Etsy photo count or distinct IDs are not exactly three. Inspect the existing listing before any upload.':
      rows.some(x=>!x.paired)?'Match only photographs we personally confirm are identical. Never automatically upload duplicates.':
        'All three local receipts appear in the current remote list. Complete the separate live draft and owner acceptance checks.'};
}

export function evidenceReadRows520(reads){
  if(!Array.isArray(reads?.entries)||reads.entries.length!==3)
    return [{name:'Final live draft verification',ok:false,message:'Not independently read in this session'}];
  return reads.entries.map(row=>({name:row.name,ok:row.ok===true,
    message:row.ok?'Read succeeded; content and photo verdict still checked separately':
      `HOLD — ${row.status?'HTTP '+row.status+' · ':''}${String(row.error||'Read unavailable').slice(0,180)}`}));
}
