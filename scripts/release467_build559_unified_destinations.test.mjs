import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DESTINATIONS_559,destinationProjection559} from '../public/js/product-destinations-559.mjs';
import {onRequestGet as destinationsGet559} from '../functions/api/admin/product-destinations-559.js';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const product={product_id:54,name:'Bar Soap Sweet Orange',status:'draft'};
const etsyLinked={listing_id:'4601705477',receipt_id:'872',saved_link_readback_confirmed:true};
const get=(view,key)=>view.destinations.find(row=>row.key===key);

test('Build 559 distinguishes local Product save, unique Etsy draft link and remote publication',()=>{
  const first=destinationProjection559({product});
  assert.equal(first.saved,true);
  assert.deepEqual(first.destinations.map(row=>row.key),DESTINATIONS_559.map(row=>row.key));
  assert.equal(get(first,'etsy').remote_id,null);
  assert.equal(get(first,'etsy').draft_update_allowed,false);
  const linked=destinationProjection559({product,etsy:etsyLinked,intent:{etsy:true,facebook:true}});
  assert.equal(get(linked,'etsy').remote_id,'4601705477');
  assert.equal(get(linked,'etsy').draft_update_allowed,true);
  assert.match(get(linked,'etsy').remote_state,/Live Etsy status not checked/);
  assert.equal(linked.saved_intent.etsy,true);
  assert.equal(linked.provider_contacted,false);
  assert.equal(linked.publication_performed,false);
  assert.equal(linked.destinations.every(row=>row.publication_available===false),true);
});

test('Build 559 never trusts wrong or ambiguous Etsy IDs and never invents social remote IDs',()=>{
  for(const etsy of [{...etsyLinked,receipt_id:null},{...etsyLinked,conflict:true},
    {...etsyLinked,saved_link_readback_confirmed:false},{...etsyLinked,listing_id:'0'}]){
    const view=destinationProjection559({product,etsy});
    assert.equal(get(view,'etsy').remote_id,null);
    assert.equal(get(view,'etsy').draft_update_allowed,false);
  }
  const oauth=[{provider_key:'instagram',connection_status:'connected',access_expires_at:'2027-01-01T00:00:00Z'},
    {provider_key:'tiktok',connection_status:'connected',access_expires_at:'2026-01-01T00:00:00Z'},
    {provider_key:'facebook',connection_status:'connected',access_expires_at:null}];
  const view=destinationProjection559({product,connections:oauth,now:Date.parse('2026-10-31T00:00:00Z')});
  assert.match(get(view,'instagram').connection,/Local OAuth record only/);
  assert.match(get(view,'tiktok').connection,/expired/);
  assert.match(get(view,'facebook_marketplace').connection,/not authorized/);
  assert.equal(view.destinations.filter(row=>row.mode==='manual').every(row=>row.remote_id===null&&row.publication_available===false),true);
});

test('Build 559 endpoint refuses unauthenticated Product details and never contacts providers',async()=>{
  const response=await destinationsGet559({request:new Request('https://devilndove.com/api/admin/product-destinations-559?product_id=54'),env:{}});
  const body=await response.json();
  assert.equal(response.status,401);assert.equal(body.ok,false);
  assert.equal(body.provider_contacted,false);assert.equal(body.publication_performed,false);
});

test('Build 559 primary-D1 endpoint returns exactly claimed Etsy ID without a provider request',async()=>{
  const readSql=[];
  const db={withSession:()=>db,prepare(sql){
    readSql.push(sql);
    const bound=args=>({
      async first(){
        if(sql.includes('FROM products'))return {...product,sku:'DND-01131'};
        if(sql.includes('FROM admin_action_audit'))return {details_json:JSON.stringify({etsy:true,facebook:false})};
        return null;
      },
      async all(){
        if(sql.includes('WHERE channel_key=')&&sql.includes('external_reference=?'))return {results:[{id:872,product_id:54,external_reference:'4601705477'}]};
        if(sql.includes('FROM marketplace_syndication_drafts'))return {results:[{id:872,product_id:54,external_reference:'4601705477'}]};
        if(sql.includes('FROM oauth_provider_connections'))return {results:[{provider_key:'instagram',connection_status:'connected',access_expires_at:null}]};
        throw Error('Unexpected D1 query '+sql+' '+args.join(','));
      }
    });
    return {...bound([]),bind(...args){return bound(args);}};
  }};
  const response=await destinationsGet559({
    request:new Request('https://devilndove.com/api/admin/product-destinations-559?product_id=54'),
    env:{DB:db},data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7}}}
  });
  const body=await response.json();
  assert.equal(response.status,200,JSON.stringify({body,readSql}));assert.equal(body.ok,true);
  assert.equal(get(body,'etsy').remote_id,'4601705477');
  assert.equal(get(body,'facebook_marketplace').remote_id,null);
  assert.equal(body.provider_contacted,false);assert.equal(body.publication_performed,false);
  assert.ok(readSql.every(sql=>/^\s*SELECT\b/i.test(sql)));
});

test('Build 559 editor is one admin-only destination dashboard and local evidence GET with manual handoff',()=>{
  const page=file('admin/product-editor/index.html'),ui=file('public/js/product-destinations-559.mjs');
  const api=file('functions/api/admin/product-destinations-559.js'),etsycli=file('public/js/product-editor-etsy-544.mjs');
  assert.match(page,/Devil n Dove • Build (?:561|562|563|567|568|569)/);
  assert.match(page,/dd559EtsyTools/);
  assert.match(page,/admin-product-destinations-559\.css\?v=559/);
  assert.match(ui,/Where do we want to share this Product/);
  for(const label of ['Save Product','Update a draft','Prepare a handoff','Publish externally'])assert.match(ui,new RegExp(label));
  for(const key of ['etsy','facebook_marketplace','instagram','tiktok','x','facebook','pinterest','youtube'])
    assert.match(ui,new RegExp(`key:'${key}'`));
  assert.match(ui,/product-destinations-559\?product_id=/);
  assert.match(ui,/dd540UpdateDraft/);
  assert.match(ui,/manual handoff/i);
  assert.match(api,/verifiedAdminFromModule\(c\)/);
  assert.match(api,/withSession\('first-primary'\)/);
  assert.match(api,/linkedReceipt506/);
  assert.match(api,/publication_performed:false/);
  assert.doesNotMatch(api,/fetch\(|method:'POST'|access_token_ciphertext|decryptOAuthSecret/);
  assert.match(etsycli,/ownerEtsyTools\?\.addEventListener\('toggle'/);
  assert.doesNotMatch(etsycli,/get\('tab'\)==='publishing'\)void load\(\)/);
  assert.match(file('.github/workflows/production-pages-deploy-current.yml'),/"build":56[123456789]/);
  assert.match(file('.github/workflows/current-application-quality.yml'),/release467_build559_unified_destinations\.test\.mjs/);
});
