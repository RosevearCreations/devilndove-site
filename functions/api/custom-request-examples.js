// Release 467 Build 16 — public evidence-backed candle/soap example reader.
// Read-only: never creates schema, invents facts, or exposes admin/private fields.

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=120','X-Content-Type-Options':'nosniff'}});}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function clean(value,limit=800){const text=String(value||'').trim();return text.length>limit?text.slice(0,limit).trim():text;}
function familyFor(row={}){
  const haystack=[row.product_category,row.category,row.product_type,row.name,row.scent_profile,row.wax_or_base,row.soap_base].map(v=>String(v||'').toLowerCase()).join(' ');
  if(haystack.includes('soap')) return 'soap';
  if(haystack.includes('candle')||haystack.includes('wax')) return 'candle';
  return '';
}
function publicStatus(row={}){
  const status=String(row.status||'active').toLowerCase();
  const review=String(row.review_status||'published').toLowerCase();
  if(['archived','deleted','draft','private','inactive'].includes(status)) return false;
  if(['blocked','rejected','draft','private'].includes(review)) return false;
  return ['active','published','available','ready'].includes(status)||['approved','published','ready_for_release'].includes(review);
}
function factsFor(row={},spec={}){
  const facts=[
    ['Scent',row.scent_profile||spec.scent_profile],
    ['Wax / base',row.soap_base||row.wax_or_base||spec.wax_or_base],
    ['Colour',row.colour_recipe||spec.colour_notes],
    ['Batch',row.batch_number||spec.batch_number],
    ['Ingredients',row.ingredient_notes||spec.ingredient_notes],
    ['Safety / allergen note',row.allergen_safety_notes||spec.allergen_safety_notes],
    ['Cure / ready date',row.cure_ready_date||spec.cure_ready_date]
  ];
  return facts.map(([label,value])=>({label,value:clean(value,600)})).filter(item=>item.value);
}

export async function onRequestGet(context){
  const db=context.env.DB||context.env.DD_DB;
  if(!db)return json({ok:true,authority:'fallback_empty',examples:[],summary:{example_count:0}});
  try{
    const productRows=rows(await db.prepare(`SELECT * FROM products ORDER BY datetime(updated_at) DESC, product_id DESC LIMIT 180`).all());
    const specRows=rows(await db.prepare(`SELECT * FROM custom_candle_soap_product_specs ORDER BY datetime(updated_at) DESC LIMIT 240`).all().catch(()=>({results:[]})));
    const specsByProduct=new Map();
    for(const spec of specRows){const id=Number(spec.product_id||0);if(id&&!specsByProduct.has(id))specsByProduct.set(id,spec);}
    const examples=[];
    for(const row of productRows){
      if(!publicStatus(row))continue;
      const spec=specsByProduct.get(Number(row.product_id||0))||{};
      const family=String(spec.product_family||familyFor(row)).toLowerCase();
      if(!['candle','soap'].includes(family))continue;
      const image=clean(row.featured_image_url||row.og_image_url,1200);
      const facts=factsFor(row,spec);
      if(!image||!facts.length)continue;
      examples.push({
        product_id:Number(row.product_id||0)||null,
        family,
        name:clean(row.name||`${family} example`,180),
        slug:clean(row.slug,180),
        image_url:image,
        description:clean(row.short_description||row.description,500),
        facts,
        source:'approved_existing_product_data'
      });
      if(examples.length>=6)break;
    }
    return json({ok:true,authority:'products_plus_custom_candle_soap_product_specs',examples,summary:{example_count:examples.length,families:[...new Set(examples.map(x=>x.family))],invented_claims:false,read_only:true}});
  }catch(error){
    return json({ok:true,authority:'fallback_empty',examples:[],summary:{example_count:0,read_only:true},warning:'Approved candle/soap examples are temporarily unavailable.'});
  }
}
