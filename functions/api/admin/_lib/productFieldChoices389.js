// Build 389: finite, published Product category and shipping-code choices; existing DB values remain valid.
export const BASE_CATEGORIES=Object.freeze(['Jewelry','Earrings','Necklaces','Bracelets','Rings','Pendants','Charms','Keychains','Accessories','Candles','Home Decor','Artwork','Collectibles','Craft Supplies','Tools','Other']);
export const BASE_SHIPPING_CODES=Object.freeze(['standard','tracked','letter_mail','local_pickup','oversize','digital_delivery']);
export function validChoice(value,existing,base,allowBlank=false){
 const v=String(value??'').trim();
 if(!v)return allowBlank;
 return [...base,...existing].some(x=>String(x).toLowerCase()===v.toLowerCase());
}
