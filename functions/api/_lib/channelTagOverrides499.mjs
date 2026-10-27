import {preparedEtsyTags497} from './etsyNativeTags497.mjs';

export const CHANNELS499=Object.freeze(['etsy','facebook','google','instagram','tiktok','pinterest','youtube']);
const text=value=>String(value??'').normalize('NFC').trim();
export function phraseList499(raw){
 const items=Array.isArray(raw)?raw:String(raw||'').split(','),out=[],seen=new Set();
 for(const item of items){const phrase=text(item).replace(/\s+/gu,' '),key=phrase.toLocaleLowerCase('en-CA');
  if(!phrase)continue;if(seen.has(key))throw Error('Duplicate tag: '+phrase);
  if([...phrase].length>60)throw Error('Tag exceeds 60 characters: '+phrase.slice(0,50));
  seen.add(key);out.push(phrase);
 }
 if(out.length>30)throw Error('At most 30 channel-specific phrases may be prepared.');
 return out;
}
export function parseOverride499(row,channel){
 let entry;try{entry=JSON.parse(row?.details_json||'null')}catch{return null;}
 if(!entry||entry.channel!==channel||!['shared','override'].includes(entry.mode)||!Array.isArray(entry.tags))return null;
 return {mode:entry.mode,tags:entry.mode==='override'?entry.tags:[],changed_at:row?.created_at||null};
}
export async function readOverride499(db,productId,channel){
 const row=await db.prepare("SELECT details_json,created_at FROM admin_action_audit WHERE action_type='product_channel_tags_499_changed' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1").bind(`${productId}:${channel}`).first();
 return parseOverride499(row,channel);
}
export function effectiveEtsyTags499(keywords,override){
 const raw=override?.mode==='override'?override.tags.join(','):String(keywords||'');
 return {...preparedEtsyTags497(raw),source:override?.mode==='override'?'etsy_override':'shared_product_seo'};
}
