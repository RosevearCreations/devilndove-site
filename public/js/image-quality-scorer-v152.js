// Release 467 Build 152 — shared read-only image quality scorer.
// Mirrors the existing Release 448 product-image 100-point Canvas rubric.
(function(){
  'use strict';
  if(window.DDImageQualityScorer)return;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const round=(value)=>Math.round(Number(value||0)*10)/10;
  const text=(value)=>String(value==null?'':value).trim();

  function category(score){
    const value=Number(score||0);
    return value>=85?'Excellent':value>=70?'Good':value>=55?'Usable / improve':value>=40?'Reshoot recommended':'Poor / reshoot';
  }

  function recommendations(row){
    const tips=[];
    if(Number(row?.lighting_score)<14)tips.push('Lighting: adjust exposure and reduce clipped highlights or crushed shadows. Use softer, more even light when possible.');
    if(Number(row?.clarity_score)<14)tips.push('Detail / clarity: check focus, camera movement and depth of field. More light, a stable camera and deliberate focus usually help.');
    if(Number(row?.background_score)<9)tips.push('Background: simplify visible borders, seams and distractions where a clean background is intended.');
    if(Number(row?.framing_score)<10)tips.push('Framing: re-centre the subject and avoid clipping important edges.');
    if(Number(row?.resolution_score)<10)tips.push('Resolution: use at least 1200 px on the shortest side for full points; avoid enlarging a small original.');
    if(Number(row?.color_balance_score)<6.5)tips.push('Colour: correct white balance and avoid mixed light sources that create a strong colour cast.');
    if(Number(row?.artifact_score)<3.5)tips.push('Artifacts: re-export from the best original at higher quality and avoid repeated JPEG recompression.');
    if(Number(row?.consistency_score)<3.5)tips.push('Consistency: crop closer to the intended or peer aspect ratio for this image set.');
    return tips.length?tips:['No major deterministic issue was detected. Artistic intent, styling, reflections and emotional appeal still require human review.'];
  }

  function loadImage(url){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.crossOrigin='anonymous';
      image.decoding='async';
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error('Image could not be loaded for Canvas scoring. Check the image URL or R2 CORS policy.'));
      image.src=url;
    });
  }

  function canvasMetrics(image){
    const maxSide=320;
    const scale=Math.min(1,maxSide/Math.max(image.naturalWidth,image.naturalHeight));
    const w=Math.max(1,Math.round(image.naturalWidth*scale));
    const h=Math.max(1,Math.round(image.naturalHeight*scale));
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(image,0,0,w,h);
    const data=ctx.getImageData(0,0,w,h).data;
    const lum=new Float32Array(w*h);
    let sum=0,sumSq=0,low=0,high=0,rSum=0,gSum=0,bSum=0;
    for(let i=0,p=0;i<data.length;i+=4,p+=1){
      const r=data[i],g=data[i+1],b=data[i+2];
      const y=(.2126*r+.7152*g+.0722*b)/255;
      lum[p]=y;sum+=y;sumSq+=y*y;rSum+=r;gSum+=g;bSum+=b;
      if(y<.035)low+=1;if(y>.965)high+=1;
    }
    const n=w*h;
    const mean=sum/n;
    const contrast=Math.sqrt(Math.max(0,sumSq/n-mean*mean));
    let edge=0,edgeN=0;
    for(let y=1;y<h-1;y+=1)for(let x=1;x<w-1;x+=1){
      const p=y*w+x;
      edge+=Math.abs(4*lum[p]-lum[p-1]-lum[p+1]-lum[p-w]-lum[p+w]);edgeN+=1;
    }
    const sharpness=edge/Math.max(1,edgeN);
    const border=[];
    const step=Math.max(1,Math.floor(Math.min(w,h)/80));
    for(let x=0;x<w;x+=step)border.push(lum[x],lum[(h-1)*w+x]);
    for(let y=1;y<h-1;y+=step)border.push(lum[y*w],lum[y*w+w-1]);
    const borderMean=border.reduce((a,b)=>a+b,0)/Math.max(1,border.length);
    const borderVar=border.reduce((a,b)=>a+(b-borderMean)**2,0)/Math.max(1,border.length);
    const threshold=Math.max(.09,Math.sqrt(borderVar)*2.4);
    let minX=w,minY=h,maxX=-1,maxY=-1,foreground=0;
    for(let y=0;y<h;y+=1)for(let x=0;x<w;x+=1){
      if(Math.abs(lum[y*w+x]-borderMean)>threshold){
        foreground+=1;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      }
    }
    const occupancy=foreground/n;
    let centerOffset=1;
    if(maxX>=0){
      const cx=(minX+maxX)/(2*w),cy=(minY+maxY)/(2*h);
      centerOffset=Math.hypot(cx-.5,cy-.5)/.7071;
    }
    const means=[rSum/n,gSum/n,bSum/n];
    const channelSpread=(Math.max(...means)-Math.min(...means))/255;
    let blocks=0,blockN=0;
    for(let y=8;y<h;y+=8)for(let x=1;x<w;x+=1){blocks+=Math.abs(lum[y*w+x]-lum[(y-1)*w+x]);blockN+=1;}
    for(let x=8;x<w;x+=8)for(let y=1;y<h;y+=1){blocks+=Math.abs(lum[y*w+x]-lum[y*w+x-1]);blockN+=1;}
    return {w,h,mean,contrast,low_clip:low/n,high_clip:high/n,sharpness,border_variance:borderVar,occupancy,center_offset:centerOffset,channel_spread:channelSpread,block_boundary_energy:blocks/Math.max(1,blockN)};
  }

  function scoreMetrics(image,metrics,ratios=[]){
    const lighting=clamp(20-(Math.abs(metrics.mean-.56)*30+(metrics.low_clip+metrics.high_clip)*80),0,20);
    const clarity=clamp((metrics.sharpness-.025)*170,0,20);
    const background=clamp(15-Math.sqrt(metrics.border_variance)*55,0,15);
    const framing=clamp(15-Math.abs(metrics.occupancy-.62)*22-metrics.center_offset*7,0,15);
    const minDim=Math.min(image.naturalWidth,image.naturalHeight);
    const resolution=minDim>=1200?10:minDim>=900?8:minDim>=700?6:minDim>=500?4:2;
    const color=clamp(10-metrics.channel_spread*22,0,10);
    const artifacts=clamp(5-Math.max(0,metrics.block_boundary_energy-.11)*18,0,5);
    const ratio=image.naturalWidth/Math.max(1,image.naturalHeight);
    const ordered=(Array.isArray(ratios)?ratios:[]).map(Number).filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
    const target=ordered.length?ordered[Math.floor(ordered.length/2)]:ratio;
    const consistency=clamp(5-Math.abs(Math.log(Math.max(.01,ratio/target)))*5,0,5);
    const scores={lighting_score:round(lighting),clarity_score:round(clarity),background_score:round(background),framing_score:round(framing),resolution_score:round(resolution),color_balance_score:round(color),artifact_score:round(artifacts),consistency_score:round(consistency)};
    return {...scores,total_score:round(Object.values(scores).reduce((a,b)=>a+b,0))};
  }

  async function scoreImage(image,{ratios=[]}={}){
    if(!image?.naturalWidth||!image?.naturalHeight)throw new Error('Image dimensions are unavailable for scoring.');
    const metrics=canvasMetrics(image);
    const scores=scoreMetrics(image,metrics,ratios);
    return {...scores,width_px:image.naturalWidth,height_px:image.naturalHeight,category:category(scores.total_score),recommendations:recommendations(scores),evidence:{algorithm:'Release 448 deterministic browser Canvas heuristic',scorer_version:'r448-browser-v1',objective_metrics:metrics}};
  }

  async function scoreUrl(url,options={}){
    const src=text(url);if(!src)throw new Error('Image URL is missing.');
    const image=await loadImage(src);
    return scoreImage(image,options);
  }

  window.DDImageQualityScorer=Object.freeze({rubric:'Release 448 deterministic browser Canvas heuristic',version:'r448-browser-v1',category,recommendations,scoreMetrics,scoreImage,scoreUrl});
})();