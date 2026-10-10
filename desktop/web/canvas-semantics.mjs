import {escapeXML} from './studio-core.mjs';

export const lifelineEnd=p=>p.infinite?Math.max(260,...p.edges.map(e=>(e.lane||0)+80),...p.nodes.filter(n=>n.lifeline).map(n=>n.y+n.h+100)):p.height-30;
export const markerTypes=['none','arrow','open-arrow','triangle','diamond','hollow-diamond'];
export function classRelation(token){
 const m=token.match(/^(<\||<|\*|o)?(--|\.\.)(\|>|>|\*|o)?$/);
 if(!m)throw Error('conversion');
 const markers={'<|':'triangle','|>':'triangle','<':'open-arrow','>':'open-arrow','*':'diamond',o:'hollow-diamond'};
 return{start:markers[m[1]]||'none',end:markers[m[3]]||'none',dashed:m[2]==='..'};
}
export function erRelation(token){
 const m=token.match(/^(\|o|\|\||\}o|\}\|)(--|\.\.)(o\||\|\||o\{|\|\{)$/);
 if(!m)throw Error('conversion');
 const cardinality={'||':'1','|o':'0..1','o|':'0..1','}o':'0..*','o{':'0..*','}|':'1..*','|{':'1..*'};
 return{start:'none',end:'none',startLabel:cardinality[m[1]],endLabel:cardinality[m[3]],dashed:m[2]==='..'};
}

// Geometry edits may change presentation, never the temporal order or branch membership.
export function validateSequence(v,out){
 if(v.diagram!==undefined&&v.diagram!=='sequence')throw Error('project');
 if(v.fragments!==undefined&&!Array.isArray(v.fragments))throw Error('project');
 if(v.diagram!=='sequence'){if(v.fragments?.length)throw Error('project');return;}
 out.diagram='sequence';
 const messages=out.edges.filter(e=>e.lane!==undefined),byId=new Map(messages.map(e=>[e.id,e]));
 const participants=out.nodes.filter(n=>n.lifeline),ids=new Set(participants.map(n=>n.id));
 let previous=0;
 for(const e of messages){if(e.lane<previous+45||!out.infinite&&e.lane>out.height-40||!ids.has(e.from)||!ids.has(e.to)||e.startLabel||e.endLabel)throw Error('sequence-order');previous=e.lane;}
 const first=messages[0]?.lane??(out.infinite?1000000:out.height);
 for(const n of participants)if(n.y+n.h+20>first||!out.infinite&&(n.x<25||n.x+n.w>out.width-25))throw Error('sequence-layout');
 for(let i=0;i<participants.length;i++)for(let j=i+1;j<participants.length;j++){
  const a=participants[i],b=participants[j];if(a.x<b.x+b.w+20&&b.x<a.x+a.w+20)throw Error('sequence-layout');
 }
 const used=new Set();let lastFrameEnd=-1;
 if((v.fragments||[]).length>30)throw Error('project');
 out.fragments=(v.fragments||[]).map(f=>{
  if(!['alt','opt','loop'].includes(f.kind)||!Array.isArray(f.branches)||!f.branches.length||f.branches.length>20||(f.kind!=='alt'&&f.branches.length!==1))throw Error('sequence-fragment');
  let last=-1;
  const branches=f.branches.map(b=>{
   if(typeof b.label!=='string'||b.label.length>160||!Array.isArray(b.edges)||!b.edges.length)throw Error('sequence-fragment');
   const edges=b.edges.map(id=>{const e=byId.get(id),index=messages.indexOf(e);if(!e||used.has(id)||index<=last)throw Error('sequence-fragment');used.add(id);last=index;return id;});
   return{label:b.label,edges};
  });
  const indexes=branches.flatMap(b=>b.edges.map(id=>messages.indexOf(byId.get(id))));
  if(indexes[0]<=lastFrameEnd||indexes.at(-1)-indexes[0]+1!==indexes.length)throw Error('sequence-fragment');
  lastFrameEnd=indexes.at(-1);
  // Reserve space above each branch for its guard and below self messages.
  for(const b of branches){const at=messages.indexOf(byId.get(b.edges[0])),e=messages[at];if(at>0&&e.lane-messages[at-1].lane<80)throw Error('sequence-order');}
  return{kind:f.kind,branches};
 });
}
export function pruneSequence(p){
 if(!p.fragments)return;const ids=new Set(p.edges.map(e=>e.id));
 p.fragments=p.fragments.map(f=>({...f,branches:f.branches.map(b=>({...b,edges:b.edges.filter(id=>ids.has(id))}))})).filter(f=>f.branches.some(b=>b.edges.length));
}
export function renderFragments(p){
 if(!p.fragments?.length)return '';
 const participants=p.nodes.filter(n=>n.lifeline),left=Math.min(...participants.map(n=>n.x))-20,right=Math.max(...participants.map(n=>n.x+n.w))+20;
 const byId=new Map(p.edges.map(e=>[e.id,e]));
 return p.fragments.map(f=>{
  const lanes=f.branches.flatMap(b=>b.edges.map(id=>byId.get(id)?.lane).filter(Number.isFinite));if(!lanes.length)return '';
  const top=Math.min(...lanes)-50,bottom=Math.max(...lanes)+32;
  return `<g data-fragment="${f.kind}" pointer-events="none"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" fill="none" stroke="#857282" stroke-width="1.3"/><path d="M${left} ${top+25}h48l12 -12v-13" fill="none" stroke="#857282"/><text x="${left+8}" y="${top+17}" font-size="13" font-weight="bold" fill="#51404c">${f.kind}</text>${f.branches.map((b,i)=>{const lane=byId.get(b.edges[0])?.lane;if(lane===undefined)return '';const y=lane-50;return `${i?`<path d="M${left} ${y}H${right}" stroke="#857282" stroke-dasharray="6 4"/>`:''}<text x="${left+70}" y="${y+18}" font-size="13" fill="#51404c" stroke="${p.background}" stroke-width="4" paint-order="stroke">[${escapeXML(b.label)}]</text>`;}).join('')}</g>`;
 }).join('');
}

export function endpointLabelPosition(points,start){
 if(!points?.length)return null;const pts=start?points:[...points].reverse();let distance=32;
 for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(!length)continue;if(distance<=length||i===pts.length-1){const d=Math.min(distance,length/2),dx=(b.x-a.x)/length,dy=(b.y-a.y)/length;return{x:a.x+dx*d-dy*13,y:a.y+dy*d+dx*13};}distance-=length;}
 return pts[0];
}
