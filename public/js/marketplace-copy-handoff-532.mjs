/* Build 532: copy already prepared local listing fields on an actual click.
 * No Meta credentials, provider request or automatic publication. */
const button=document.getElementById('dd532CopyMarketplace');
const status=document.getElementById('dd532CopyMarketplaceStatus');
if(button&&status){
 button.addEventListener('click',async()=>{
  const box=document.getElementById('dd523MarketplaceCopy');
  if(!box||box.hidden){status.textContent='Prepare the current saved Product first.';return;}
  const title=document.getElementById('dd523MarketplaceTitle')?.value||'';
  const price=document.getElementById('dd523MarketplacePrice')?.value||'';
  const description=document.getElementById('dd523MarketplaceDescription')?.value||'';
  const links=[...document.querySelectorAll('#dd524MarketplacePhotos a[href]')]
   .filter(a=>a.href.startsWith('https://')).map(a=>a.href);
  if(!title.trim()||!description.trim()||!links.length){
   status.textContent='The saved Product text or approved photo links are incomplete. Check preparation again.';return;
  }
  const content=`Title: ${title}\nPrice (CAD): ${price}\nDescription:\n${description}\n\nApproved original image links (manual download):\n${links.join('\n')}`;
  try{await navigator.clipboard.writeText(content);
   status.textContent=`Copied listing fields and ${links.length} approved original image link(s). Open each image to save it for manual Facebook upload. No listing was sent.`;
  }catch{status.textContent='Clipboard permission was unavailable. Select the prepared fields above and copy them manually. Nothing was sent to Facebook.';}
 });
}
