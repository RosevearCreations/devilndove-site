/* Owner-reported historical IDs are leads for a LIVE check, never proof that
 * a remote draft currently exists. Only a verified saved primary D1 receipt
 * can enable an update; a known older draft must never trigger a new create. */
const ownerReports=Object.freeze({
  54:Object.freeze({listingId:'4601705477',productName:'Bar Soap Sweet Orange',sku:'DND-01131'})
});

export function ownerDraftHistory534(productId){
  return ownerReports[Number(productId)]||null;
}

export function ownerDraftDecision534(productId,verifiedLinkedId){
  const report=ownerDraftHistory534(productId),linked=String(verifiedLinkedId||'');
  return {report,requiresExistingDraftCheck:Boolean(report&&!linked),
    action:linked?'update':report?'verify_existing':'create'};
}
