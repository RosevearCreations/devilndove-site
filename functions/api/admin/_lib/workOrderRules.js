// Build 379 — no automatic completion or inferred approval.
export const NEXT=Object.freeze({not_started:['ready','blocked','cancelled'],ready:['in_progress','blocked','cancelled'],in_progress:['paused','blocked','completed'],paused:['in_progress','blocked','cancelled'],blocked:['ready','cancelled'],completed:[],cancelled:[]});
export const canTransition=(from,to,predecessors=[],milestones=0)=>{
 if(!Object.prototype.hasOwnProperty.call(NEXT,from)||!NEXT[from].includes(to))return 'INVALID_TRANSITION';
 if(['ready','in_progress','completed'].includes(to)&&predecessors.some(x=>x!=='completed'))return 'DEPENDENCIES_INCOMPLETE';
 if(to==='completed'&&Number(milestones)<1)return 'REAL_MILESTONE_REQUIRED';
 return null;
};
export const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
export const dateValid=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
