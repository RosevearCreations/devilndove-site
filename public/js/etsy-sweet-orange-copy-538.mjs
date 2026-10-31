/* Build 538: one honest Sweet Orange soap listing draft. Do not invent
 * ingredients, net weight, therapeutic claims or product attributes. */
export const SWEET_ORANGE_TAGS_538=Object.freeze([
 'sweet orange soap','orange bar soap','handmade bar soap','artisan soap',
 'babs bubbles','orange bath soap','soap gift','bath bar soap',
 'small batch soap','handcrafted soap','ontario handmade','orange scented soap',
 'gift soap'
]);

export function sweetOrangeListing538({ingredients='',netWeightGrams=''}={}){
 const ingredientsText=String(ingredients||'').trim().replace(/\s+/g,' ');
 const weight=String(netWeightGrams||'').trim();
 const validWeight=/^\d{1,4}(?:\.\d{1,2})?$/.test(weight)&&Number(weight)>0&&Number(weight)<=5000;
 const validIngredients=ingredientsText.length>=12&&ingredientsText.length<=1500&&
  !/\[(?:enter|add|unknown|placeholder)/i.test(ingredientsText);
 const ready=validWeight&&validIngredients;
 const title='Bar Soap Sweet Orange';
 const short='Sweet Orange bar soap from Bab’s Bubbles, our Devil n Dove handmade soap collection. Made in Ontario, Canada.';
 const description=[
  'Sweet Orange Bar Soap — Bab’s Bubbles by Devil n Dove',
  '',
  'A small-batch handmade bar soap from our Ontario workshop. Each bar may have its own variations in colour, texture and finish; please look at the product photographs for its appearance.',
  '',
  `Net weight of soap (without packaging): ${validWeight?weight+' g':'[Confirm the actual net soap weight before public sale]'}`,
  `Ingredients (exact INCI names from our soap label): ${validIngredients?ingredientsText:'[Enter the actual label ingredient list before public sale]'}`,
  '',
  'Use as a regular wash-off soap. Keep dry between uses. Check the full ingredient label for sensitivities before use.',
  'Made by Devil n Dove in Ontario, Canada. Shipping is limited to destinations authorized by our Canada-only Etsy delivery profile.',
  '',
  'The photos are our actual Product gallery originals; Etsy listing images may be cropped for display without changing the soap.'
 ].join('\n');
 return {title,short,description,tags:[...SWEET_ORANGE_TAGS_538],ready,
  blockers:[!validIngredients?'Enter the exact ingredient list shown on our soap label (INCI names).':null,
   !validWeight?'Enter the true NET soap weight in grams; 180 g packed shipping weight is not proof of soap net weight.':null].filter(Boolean)};
}
