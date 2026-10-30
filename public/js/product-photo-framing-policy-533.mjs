/* Build 533: explanatory photo rules and non-destructive square framing math.
 * 800 x 800 is a local minimum, never a mandatory Etsy crop size. */
export function photoSizeAdvice533(width,height){
 const w=Number(width),h=Number(height);
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1)return {meetsLocalMinimum:false,etsyRecommended:false,message:'Original dimensions have not been verified.'};
 const meetsLocalMinimum=w>=800&&h>=800,etsyRecommended=Math.min(w,h)>=2000;
 return {meetsLocalMinimum,etsyRecommended,message:meetsLocalMinimum?
  `${w} × ${h} passes our 800 × 800 minimum. No crop is required. ${etsyRecommended?'It also meets Etsy’s recommended 2000 px shortest side.':'Etsy recommends 2000 px on the shortest side for best quality; the current source is smaller, but this recommendation is not a reason to shrink to 800.'}`:
  `${w} × ${h} is below our 800 × 800 minimum. Use a larger original photograph.`};
}
export function squareSelection533(width,height,x=.5,y=.5){
 const w=Number(width),h=Number(height);
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)throw Error('Actual image dimensions are required.');
 const side=Math.min(w,h),clip=(value)=>Math.min(1,Math.max(0,Number.isFinite(Number(value))?Number(value):.5));
 const centerX=clip(x)*w,centerY=clip(y)*h;
 const sx=Math.max(0,Math.min(w-side,centerX-side/2)),sy=Math.max(0,Math.min(h-side,centerY-side/2));
 return {sx,sy,side,outputSize:Math.floor(side),left:sx/w*100,top:sy/h*100,width:side/w*100,height:side/h*100};
}
