// Release 464 Update 3 — Storefront collection, collage, membership and scheduled-rule editor.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';

const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const clean=(v,n=1200)=>normalizeText(v).slice(0,n);
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const slug=(v)=>clean(v,180).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const STATUSES=new Set(['draft','published','archived']);
const KINDS=new Set(['curated','origin','category','seasonal','campaign']);
const KEYS=new Set(['merchandise_origin','product_category','product_type','sale_channel','primary_material','making_process','locality_label']);
const OPS=new Set(['equals','not_equals','contains','in']);
const EFFECTS=new Set(['include','exclude']);
const RULE_STATUS=new Set(['active','paused','archived']);
const LAYOUTS=new Set(['mosaic','feature_grid','story_strip']);
const json=(d,s=200)=>jsonResponse({release:CURRENT_RELEASE,...d},s,{'Cache-Control':'no-store'});

async function tableNames(db){
  const required=['storefront_collections','storefront_collection_products','storefront_collage_presets','storefront_merchandising_rules'];
  const placeholders=required.map(()=>'?').join(',');
  const found=rows(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`).bind(...required).all().catch(()=>({results:[]})));
  const set=new Set(found.map((r)=>String(r.name||''))); return {ready:required.every((n)=>set.has(n)),missing:required.filter((n)=>!set.has(n))};
}
async function access(request,env){
  const user=await getAdminUserFromRequest(request,env); if(!user)return{response:json({ok:false,error:'Unauthorized.'},401)};
  const db=getDb(env);if(!db)return{response:json({ok:false,error:'Database binding is not configured.'},500)};return{user,db};
}
async function audit(context,user,type,targetId,details){await auditAdminAction(context.env,context.request,user,{action_type:type,target_type:'storefront_merchandising',target_id:targetId||null,details}).catch(()=>null);}

export async function onRequestGet(context){
  const a=await access(context.request,context.env);if(a.response)return a.response;const schema=await tableNames(a.db);
  if(!schema.ready)return json({ok:true,schema_ready:false,missing_tables:schema.missing,collections:[],memberships:[],collages:[],rules:[]});
  try{
    const [c,m,g,r]=await Promise.all([
      a.db.prepare('SELECT * FROM storefront_collections ORDER BY sort_order,LOWER(name),storefront_collection_id').all(),
      a.db.prepare('SELECT scp.*,p.name AS product_name,p.slug AS product_slug FROM storefront_collection_products scp LEFT JOIN products p ON p.product_id=scp.product_id ORDER BY scp.storefront_collection_id,scp.sort_order,scp.product_id').all(),
      a.db.prepare('SELECT cp.*,sc.name AS collection_name FROM storefront_collage_presets cp LEFT JOIN storefront_collections sc ON sc.storefront_collection_id=cp.storefront_collection_id ORDER BY cp.sort_order,LOWER(cp.name),cp.storefront_collage_preset_id').all(),
      a.db.prepare('SELECT r.*,sc.name AS collection_name FROM storefront_merchandising_rules r JOIN storefront_collections sc ON sc.storefront_collection_id=r.storefront_collection_id ORDER BY r.storefront_collection_id,r.priority DESC,r.storefront_merchandising_rule_id').all()
    ]);
    return json({ok:true,schema_ready:true,collections:rows(c),memberships:rows(m),collages:rows(g),rules:rows(r)});
  }catch(e){return json({ok:false,error:e?.message||'Could not load Storefront merchandising.'},500);}
}

export async function onRequestPost(context){
  const a=await access(context.request,context.env);if(a.response)return a.response;const schema=await tableNames(a.db);
  if(!schema.ready)return json({ok:false,code:'update3_schema_not_ready',error:`Release 464 Update 3 merchandising schema is not ready: ${schema.missing.join(', ')}`},409);
  let b={};try{b=await context.request.json();}catch{return json({ok:false,error:'Valid JSON is required.'},400)}
  const action=clean(b.action,60).toLowerCase();
  try{
    if(action==='save_collection'){
      const cid=id(b.storefront_collection_id),name=clean(b.name,180),s=slug(b.slug||name);
      if(!name||!s)return json({ok:false,error:'Collection name and slug are required.'},400);
      const status=STATUSES.has(clean(b.status,30))?clean(b.status,30):'draft',kind=KINDS.has(clean(b.collection_kind,30))?clean(b.collection_kind,30):'curated';
      const legacyKey=clean(b.rule_key,60);if(legacyKey&&!KEYS.has(legacyKey))return json({ok:false,error:'Unsupported legacy rule key.'},400);
      if(cid){
        await a.db.prepare(`UPDATE storefront_collections SET slug=?,name=?,short_description=?,public_heading=?,public_body=?,hero_image_url=?,status=?,collection_kind=?,rule_key=?,rule_value=?,sort_order=?,seo_title=?,seo_description=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE storefront_collection_id=?`)
          .bind(s,name,clean(b.short_description,1000)||null,clean(b.public_heading,300)||null,clean(b.public_body,4000)||null,clean(b.hero_image_url,1200)||null,status,kind,legacyKey||null,clean(b.rule_value,500)||null,Number(b.sort_order||0),clean(b.seo_title,300)||null,clean(b.seo_description,1000)||null,a.user.user_id||null,cid).run();
        await audit(context,a.user,'storefront_collection_saved',cid,{status,kind});return json({ok:true,action,id:cid});
      }
      const r=await a.db.prepare(`INSERT INTO storefront_collections(slug,name,short_description,public_heading,public_body,hero_image_url,status,collection_kind,rule_key,rule_value,sort_order,seo_title,seo_description,created_by_user_id,updated_by_user_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(s,name,clean(b.short_description,1000)||null,clean(b.public_heading,300)||null,clean(b.public_body,4000)||null,clean(b.hero_image_url,1200)||null,status,kind,legacyKey||null,clean(b.rule_value,500)||null,Number(b.sort_order||0),clean(b.seo_title,300)||null,clean(b.seo_description,1000)||null,a.user.user_id||null,a.user.user_id||null).run();
      const newId=Number(r?.meta?.last_row_id||0);await audit(context,a.user,'storefront_collection_saved',newId,{status,kind});return json({ok:true,action,id:newId});
    }
    if(action==='save_membership'){
      const collectionId=id(b.storefront_collection_id),productId=id(b.product_id);if(!collectionId||!productId)return json({ok:false,error:'Collection and Product are required.'},400);
      const status=['included','excluded'].includes(clean(b.membership_status,30))?clean(b.membership_status,30):'included';
      await a.db.prepare(`INSERT INTO storefront_collection_products(storefront_collection_id,product_id,membership_status,sort_order,note,created_by_user_id,updated_by_user_id) VALUES(?,?,?,?,?,?,?) ON CONFLICT(storefront_collection_id,product_id) DO UPDATE SET membership_status=excluded.membership_status,sort_order=excluded.sort_order,note=excluded.note,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`)
        .bind(collectionId,productId,status,Number(b.sort_order||0),clean(b.note,1000)||null,a.user.user_id||null,a.user.user_id||null).run();
      await audit(context,a.user,'storefront_membership_saved',productId,{collection_id:collectionId,status});return json({ok:true,action});
    }
    if(action==='remove_membership'){
      const collectionId=id(b.storefront_collection_id),productId=id(b.product_id);if(!collectionId||!productId)return json({ok:false,error:'Collection and Product are required.'},400);
      await a.db.prepare('DELETE FROM storefront_collection_products WHERE storefront_collection_id=? AND product_id=?').bind(collectionId,productId).run();
      await audit(context,a.user,'storefront_membership_removed',productId,{collection_id:collectionId});return json({ok:true,action});
    }
    if(action==='save_collage'){
      const gid=id(b.storefront_collage_preset_id),name=clean(b.name,180),s=slug(b.slug||name);if(!name||!s)return json({ok:false,error:'Collage name and slug are required.'},400);
      const status=STATUSES.has(clean(b.status,30))?clean(b.status,30):'draft',layout=LAYOUTS.has(clean(b.layout_kind,30))?clean(b.layout_kind,30):'mosaic',collectionId=id(b.storefront_collection_id)||null,max=Math.max(3,Math.min(12,Number(b.max_items||6)||6));
      if(gid){
        await a.db.prepare(`UPDATE storefront_collage_presets SET slug=?,name=?,storefront_collection_id=?,layout_kind=?,max_items=?,status=?,heading=?,body_text=?,sort_order=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE storefront_collage_preset_id=?`).bind(s,name,collectionId,layout,max,status,clean(b.heading,300)||null,clean(b.body_text,2500)||null,Number(b.sort_order||0),a.user.user_id||null,gid).run();
        await audit(context,a.user,'storefront_collage_saved',gid,{status,layout});return json({ok:true,action,id:gid});
      }
      const r=await a.db.prepare(`INSERT INTO storefront_collage_presets(slug,name,storefront_collection_id,layout_kind,max_items,status,heading,body_text,sort_order,created_by_user_id,updated_by_user_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(s,name,collectionId,layout,max,status,clean(b.heading,300)||null,clean(b.body_text,2500)||null,Number(b.sort_order||0),a.user.user_id||null,a.user.user_id||null).run();
      const newId=Number(r?.meta?.last_row_id||0);await audit(context,a.user,'storefront_collage_saved',newId,{status,layout});return json({ok:true,action,id:newId});
    }
    if(action==='save_rule'){
      const rid=id(b.storefront_merchandising_rule_id),collectionId=id(b.storefront_collection_id),ruleKey=clean(b.rule_key,60),operator=clean(b.operator,30),effect=clean(b.effect,30),status=clean(b.rule_status,30),value=clean(b.rule_value,600);
      if(!collectionId||!KEYS.has(ruleKey)||!OPS.has(operator)||!EFFECTS.has(effect)||!RULE_STATUS.has(status)||!value)return json({ok:false,error:'Collection, rule field, operator, effect, status and value are required.'},400);
      const from=clean(b.active_from,80)||null,until=clean(b.active_until,80)||null;if(from&&until&&Date.parse(until)<Date.parse(from))return json({ok:false,error:'Rule end must be on or after its start.'},400);
      if(rid){
        await a.db.prepare(`UPDATE storefront_merchandising_rules SET storefront_collection_id=?,rule_key=?,operator=?,rule_value=?,effect=?,priority=?,active_from=?,active_until=?,rule_status=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE storefront_merchandising_rule_id=?`).bind(collectionId,ruleKey,operator,value,effect,Number(b.priority||0),from,until,status,a.user.user_id||null,rid).run();
        await audit(context,a.user,'storefront_rule_saved',rid,{collection_id:collectionId,rule_key:ruleKey,operator,effect,status});return json({ok:true,action,id:rid});
      }
      const r=await a.db.prepare(`INSERT INTO storefront_merchandising_rules(storefront_collection_id,rule_key,operator,rule_value,effect,priority,active_from,active_until,rule_status,created_by_user_id,updated_by_user_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(collectionId,ruleKey,operator,value,effect,Number(b.priority||0),from,until,status,a.user.user_id||null,a.user.user_id||null).run();
      const newId=Number(r?.meta?.last_row_id||0);await audit(context,a.user,'storefront_rule_saved',newId,{collection_id:collectionId,rule_key:ruleKey,operator,effect,status});return json({ok:true,action,id:newId});
    }
    if(action==='remove_rule'){
      const rid=id(b.storefront_merchandising_rule_id);if(!rid)return json({ok:false,error:'Rule id is required.'},400);
      await a.db.prepare('DELETE FROM storefront_merchandising_rules WHERE storefront_merchandising_rule_id=?').bind(rid).run();
      await audit(context,a.user,'storefront_rule_removed',rid,{});return json({ok:true,action});
    }
    return json({ok:false,error:'Unsupported Storefront merchandising action.'},400);
  }catch(e){return json({ok:false,error:e?.message||'Could not save Storefront merchandising.'},500);}
}
