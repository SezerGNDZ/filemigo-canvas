import {shapeAnchor} from './canvas-shape-library.mjs';
export const ports=['auto','top','right','bottom','left'];
export function bounds(nodes){if(!nodes.length)return null;const x=Math.min(...nodes.map(n=>n.x)),y=Math.min(...nodes.map(n=>n.y));return{x,y,w:Math.max(...nodes.map(n=>n.x+n.w))-x,h:Math.max(...nodes.map(n=>n.y+n.h))-y};}
export function expandGroups(p,ids){const groups=new Set(p.nodes.filter(n=>ids.has(n.id)&&n.group).map(n=>n.group));return new Set(p.nodes.filter(n=>ids.has(n.id)||groups.has(n.group)).map(n=>n.id));}
export function areaSelection(p,a,b,contain=false){const box={x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)};return expandGroups(p,new Set(p.nodes.filter(n=>contain?n.x>=box.x&&n.y>=box.y&&n.x+n.w<=box.x+box.w&&n.y+n.h<=box.y+box.h:n.x<box.x+box.w&&n.x+n.w>box.x&&n.y<box.y+box.h&&n.y+n.h>box.y).map(n=>n.id)));}
export function movable(p,ids){const blocked=new Set(p.nodes.filter(n=>n.locked&&n.group).map(n=>n.group));return p.nodes.filter(n=>ids.has(n.id)&&!n.locked&&!blocked.has(n.group));}
export function moveNodes(nodes,originals,dx,dy,p){const b=bounds(originals);if(!b)return;if(!p.infinite){dx=Math.max(-b.x,Math.min(dx,p.width-b.x-b.w));dy=Math.max(-b.y,Math.min(dy,p.height-b.y-b.h));}const map=new Map(originals.map(n=>[n.id,n]));for(const n of nodes){const old=map.get(n.id);if(old){n.x=old.x+dx;n.y=old.y+dy;}}}
function arrangeItems(nodes,kind){const b=bounds(nodes);if(!b||nodes.length<2)return;if(kind.startsWith('distribute')){if(nodes.length<3)return;const axis=kind.endsWith('x')?'x':'y',size=axis==='x'?'w':'h';nodes.sort((a,b)=>a[axis]-b[axis]);const first=nodes[0],last=nodes.at(-1),space=(last[axis]+last[size]-first[axis]-nodes.reduce((sum,n)=>sum+n[size],0))/(nodes.length-1);if(space<0)throw Error('distribution-space');let at=first[axis];for(const n of nodes){n[axis]=at;at+=n[size]+space;}return;}for(const n of nodes){if(kind==='left')n.x=b.x;if(kind==='right')n.x=b.x+b.w-n.w;if(kind==='center')n.x=b.x+(b.w-n.w)/2;if(kind==='top')n.y=b.y;if(kind==='bottom')n.y=b.y+b.h-n.h;if(kind==='middle')n.y=b.y+(b.h-n.h)/2;}}
export function arrange(p,ids,kind){const nodes=movable(p,ids),units=new Map();for(const n of nodes){const key=n.group||n.id;if(!units.has(key))units.set(key,[]);units.get(key).push(n);}const boxes=[...units.values()].map(members=>({...bounds(members),members})),before=new Map(boxes.map(b=>[b,{x:b.x,y:b.y}]));arrangeItems(boxes,kind);boxes.forEach((b,i)=>b.members.forEach(n=>{n.x+=b.x-before.get(b).x;n.y+=b.y-before.get(b).y;}));}
export function resizeSelection(originals,box,handle,dx,dy,p,aspect=false){const east=handle.includes('e'),west=handle.includes('w'),north=handle.includes('n'),south=handle.includes('s');let w=box.w+(east?dx:west?-dx:0),h=box.h+(south?dy:north?-dy:0);const minW=Math.max(...originals.map(n=>24*box.w/n.w)),minH=Math.max(...originals.map(n=>24*box.h/n.h));w=Math.max(minW,w);h=Math.max(minH,h);if(aspect){const ratio=Math.max(w/box.w,h/box.h);w=box.w*ratio;h=box.h*ratio;}const maxW=p.infinite?Math.min(...originals.map(n=>4000*box.w/n.w)):west?box.x+box.w:p.width-box.x,maxH=p.infinite?Math.min(...originals.map(n=>4000*box.h/n.h)):north?box.y+box.h:p.height-box.y;if(aspect){const ratio=Math.min(w/box.w,maxW/box.w,maxH/box.h);w=box.w*ratio;h=box.h*ratio;}else{w=Math.min(w,maxW);h=Math.min(h,maxH);}const x=west?box.x+box.w-w:box.x,y=north?box.y+box.h-h:box.y;return originals.map(n=>({...n,x:x+(n.x-box.x)*w/box.w,y:y+(n.y-box.y)*h/box.h,w:n.w*w/box.w,h:n.h*h/box.h}));}
export function smartSnap(p,originals,dx,dy,tolerance=6){const moving=new Set(originals.map(n=>n.id)),box=bounds(originals);let bestX=tolerance,bestY=tolerance,gx=null,gy=null,ox=dx,oy=dy;const stationary=p.nodes.filter(n=>!moving.has(n.id));for(const n of stationary){for(const x of [n.x,n.x+n.w/2,n.x+n.w])for(const own of [box.x,box.x+box.w/2,box.x+box.w]){const d=x-(own+dx);if(Math.abs(d)<bestX){bestX=Math.abs(d);ox=dx+d;gx=x;}}for(const y of [n.y,n.y+n.h/2,n.y+n.h])for(const own of [box.y,box.y+box.h/2,box.y+box.h]){const d=y-(own+dy);if(Math.abs(d)<bestY){bestY=Math.abs(d);oy=dy+d;gy=y;}}}return{dx:ox,dy:oy,guides:[...(gx===null?[]:[{axis:'x',value:gx}]),...(gy===null?[]:[{axis:'y',value:gy}])]};}
export function portPoint(n,side){return shapeAnchor(n,side==='left'?-1:side==='right'?1:0,side==='top'?-1:side==='bottom'?1:0);}
const direction={top:{x:0,y:-1},bottom:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
export function segmentHits(a,b,n,pad=8){const l=n.x-pad,r=n.x+n.w+pad,t=n.y-pad,d=n.y+n.h+pad;if(a.x===b.x)return a.x>l&&a.x<r&&Math.max(a.y,b.y)>t&&Math.min(a.y,b.y)<d;if(a.y===b.y)return a.y>t&&a.y<d&&Math.max(a.x,b.x)>l&&Math.min(a.x,b.x)<r;return false;}
function simplify(points){const out=[];for(const pt of points){if(out.length&&out.at(-1).x===pt.x&&out.at(-1).y===pt.y)continue;while(out.length>1){const a=out.at(-2),b=out.at(-1);if((a.x===b.x&&b.x===pt.x)||(a.y===b.y&&b.y===pt.y))out.pop();else break;}out.push(pt);}return out;}
export function polyline(points){let total=0;const lengths=[];for(let i=1;i<points.length;i++){const l=Math.abs(points[i].x-points[i-1].x)+Math.abs(points[i].y-points[i-1].y);lengths.push(l);total+=l;}let remaining=total/2,label=points[0];for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]){const a=points[i],b=points[i+1],t=lengths[i]?remaining/lengths[i]:0;label={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};break;}remaining-=lengths[i];}return{points,path:points.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(''),x:label.x,y:label.y-10};}
const routePlans=new Map();
let previousPlan=null;
export function refreshRoutes(){routePlans.clear();previousPlan=null;}
const near=(a,b)=>Math.abs(a-b)<.01;
const between=(v,a,b)=>v>=Math.min(a,b)-.01&&v<=Math.max(a,b)+.01;
export function segmentContact(a,b,c,d){
 const ah=near(a.y,b.y),ch=near(c.y,d.y);
 if(ah===ch){const axis=ah?'x':'y',fixed=ah?'y':'x';if(!near(a[fixed],c[fixed]))return null;const lo=Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis])),hi=Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis]));if(hi<lo-.01)return null;return{kind:hi-lo>.01?'overlap':'touch',length:Math.max(0,hi-lo),x:ah?lo:a.x,y:ah?a.y:lo};}
 const h=ah?[a,b]:[c,d],v=ah?[c,d]:[a,b],x=v[0].x,y=h[0].y;if(!between(x,h[0].x,h[1].x)||!between(y,v[0].y,v[1].y))return null;
 const interior=!near(x,h[0].x)&&!near(x,h[1].x)&&!near(y,v[0].y)&&!near(y,v[1].y);
 return{kind:interior?'cross':'touch',x,y};
}
const segments=points=>points.slice(1).map((b,i)=>({a:points[i],b}));
function portLead(n,side,p){
 const pt=portPoint(n,side),d=direction[side],inset=side==='left'?pt.x-n.x:side==='right'?n.x+n.w-pt.x:side==='top'?pt.y-n.y:n.y+n.h-pt.y;let room=inset+26;
 for(const other of p.nodes){if(other===n)continue;let gap=Infinity;
  if(d.x&&pt.y>=other.y-8&&pt.y<=other.y+other.h+8)gap=d.x>0?other.x-pt.x:pt.x-other.x-other.w;
  if(d.y&&pt.x>=other.x-8&&pt.x<=other.x+other.w+8)gap=d.y>0?other.y-pt.y:pt.y-other.y-other.h;
  if(gap>0)room=Math.min(room,gap/2);
 }return Math.max(inset+6,room);
}
function routingBounds(p){if(!p.infinite)return{x:0,y:0,w:p.width,h:p.height};const b=bounds(p.nodes)||{x:0,y:0,w:1200,h:800};return{x:b.x-200,y:b.y-200,w:b.w+400,h:b.h+400};}
function endpointExit(a,b,n){const outside=b.x<n.x-.01||b.x>n.x+n.w+.01||b.y<n.y-.01||b.y>n.y+n.h+.01;return outside&&((b.x-a.x)*(a.x-n.x-n.w/2)+(b.y-a.y)*(a.y-n.y-n.h/2))>0;}
function routeProblems(points,e,p,reserved){const area=routingBounds(p);
 const a=p.nodes.find(n=>n.id===e.from),b=p.nodes.find(n=>n.id===e.to);let invalid=0,crossings=0;
 for(let i=1;i<points.length;i++){
  const q=points[i-1],r=points[i];if(Math.min(q.x,r.x)<area.x||Math.min(q.y,r.y)<area.y||Math.max(q.x,r.x)>area.x+area.w||Math.max(q.y,r.y)>area.y+area.h)invalid++;
  for(const n of p.nodes){if((n===a&&i===1&&endpointExit(q,r,n))||(n===b&&i===points.length-1&&endpointExit(r,q,n)))continue;if(segmentHits(q,r,n,n===a||n===b?0:8))invalid++;}
  for(const seg of reserved){const hit=segmentContact(q,r,seg.a,seg.b);if(hit){if(hit.kind==='cross')crossings++;else invalid++;}}
 }
 return{invalid,crossings};
}
function endpointKey(e,p){return[e.from,e.to,e.fromPort,e.toPort,...p.nodes.filter(n=>n.id===e.from||n.id===e.to).flatMap(n=>[n.id,n.type,n.x,n.y,n.w,n.h])].join('|');}
export function orthogonalEdge(e,p){return routePlan(p).get(e.id)||null;}
export function routePlan(p){
 const key=JSON.stringify([p.infinite,p.width,p.height,p.nodes.map(n=>[n.id,n.type,n.x,n.y,n.w,n.h]),p.edges.map(e=>[e.id,e.from,e.to,e.routing,e.fromPort,e.toPort,e.lane,e.label,e.strokeWidth])]);
 if(routePlans.has(key))return routePlans.get(key);
 const plan=new Map(),reserved=[];
 const outgoing=new Map();for(const e of p.edges)outgoing.set(e.from,(outgoing.get(e.from)||0)+1);
 const ordered=p.edges.slice().sort((a,b)=>Number(outgoing.get(b.from)>1)-Number(outgoing.get(a.from)>1));
 for(const e of ordered){if(e.lane!==undefined||e.routing==='straight')continue;
  const old=previousPlan?.get(e.id),signature=endpointKey(e,p);let g;
  if(old?.signature===signature&&routeProblems(old.points,e,p,reserved).invalid===0)g={...old,points:old.points.map(pt=>({...pt})),crossings:[],warning:false};
  else g=routeEdge(e,p,reserved);
  if(!g)continue;g.signature=signature;g.crossings=[];g.warning=routeProblems(g.points,e,p,reserved).invalid>0;plan.set(e.id,g);reserved.push(...segments(g.points).map(s=>({...s,id:e.id})));
 }
 // A crossing is not a junction: cut a small gap in the earlier path only.
 const entries=[...plan.entries()];for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++)for(const a of segments(entries[i][1].points))for(const b of segments(entries[j][1].points)){
  const hit=segmentContact(a.a,a.b,b.a,b.b);if(hit?.kind==='cross'){const first=entries[i][1],second=entries[j][1],clear=g=>[g.points[0],g.points.at(-1)].every(pt=>Math.hypot(pt.x-hit.x,pt.y-hit.y)>14);if(clear(first))first.crossings.push({x:hit.x,y:hit.y});else if(clear(second))second.crossings.push({x:hit.x,y:hit.y});else first.warning=second.warning=true;}
 }
 const labels=[];for(const e of p.edges){const g=plan.get(e.id);if(g&&e.label){const pos=placeLabel(e,g,p,reserved,labels);Object.assign(g,pos);labels.push(pos.box);}}
 if(routePlans.size>=8)routePlans.delete(routePlans.keys().next().value);routePlans.set(key,plan);previousPlan=plan;return plan;
}
function placeLabel(e,g,p,reserved,labels){
 const w=Math.max(24,e.label.length*7.2+12),h=22,candidates=[];
 for(const {a,b}of segments(g.points)){
  const horizontal=near(a.y,b.y),length=Math.hypot(b.x-a.x,b.y-a.y);
  for(const t of [.5,.25,.75]){const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
   if(horizontal){for(const offset of [-11,23])candidates.push({x,y:y+offset,penalty:Math.max(0,w-length)*5+(t===.5?0:8)});}
   else for(const offset of [-w/2-12,w/2+12])candidates.push({x:x+offset,y:y+4,penalty:30+(t===.5?0:8)});
  }
 }
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 let best=null,score=Infinity;for(const c of candidates){const box={x:c.x-w/2,y:c.y-16,w,h};let cost=c.penalty;
  if(!p.infinite&&(box.x<0||box.y<0||box.x+w>p.width||box.y+h>p.height))cost+=100000;
  for(const n of p.nodes)if(overlap(box,n))cost+=100000;
  for(const b of labels)if(overlap(box,b))cost+=100000;
  for(const seg of reserved)if(segmentHits(seg.a,seg.b,box,2))cost+=1000;
  if(cost<score){score=cost;best={x:c.x,y:c.y,box};}
 }
 return best||{x:g.x,y:g.y,box:{x:g.x-w/2,y:g.y-16,w,h}};
}
function routeEdge(e,p,reserved){
 const a=p.nodes.find(n=>n.id===e.from),b=p.nodes.find(n=>n.id===e.to);if(!a||!b)return null;
 const dx=b.x+b.w/2-a.x-a.w/2,dy=b.y+b.h/2-a.y-a.h/2,preferred=Math.abs(dx)>Math.abs(dy)?[dx>=0?'right':'left',dx>=0?'left':'right']:[dy>=0?'bottom':'top',dy>=0?'top':'bottom'];
 const starts=e.fromPort&&e.fromPort!=='auto'?[e.fromPort]:[preferred[0],...ports.slice(1).filter(x=>x!==preferred[0])],ends=e.toPort&&e.toPort!=='auto'?[e.toPort]:[preferred[1],...ports.slice(1).filter(x=>x!==preferred[1])];let best=null,score=Infinity;
 const pad=26,area=routingBounds(p);
 for(const sa of starts)for(const sb of ends){if(a===b&&sa===sb)continue;
  const start=portPoint(a,sa),end=portPoint(b,sb),da=direction[sa],db=direction[sb],leadA=portLead(a,sa,p),leadB=portLead(b,sb,p),u={x:start.x+da.x*leadA,y:start.y+da.y*leadA},v={x:end.x+db.x*leadB,y:end.y+db.y*leadB};
  const midX=(u.x+v.x)/2,midY=(u.y+v.y)/2,candidates=[[u,{x:v.x,y:u.y},v],[u,{x:u.x,y:v.y},v],[u,{x:midX,y:u.y},{x:midX,y:v.y},v],[u,{x:u.x,y:midY},{x:v.x,y:midY},v]];
  const xs=new Set([area.x+12,area.x+area.w-12]),ys=new Set([area.y+12,area.y+area.h-12]);
  for(const n of [a,b,...p.nodes.filter(n=>n!==a&&n!==b&&n.x<Math.max(u.x,v.x)+80&&n.x+n.w>Math.min(u.x,v.x)-80&&n.y<Math.max(u.y,v.y)+80&&n.y+n.h>Math.min(u.y,v.y)-80)].slice(0,16)){
   xs.add(n.x-pad);xs.add(n.x+n.w+pad);ys.add(n.y-pad);ys.add(n.y+n.h+pad);
  }
  for(const s of reserved){if(near(s.a.x,s.b.x)){xs.add(s.a.x-18);xs.add(s.a.x+18);}else{ys.add(s.a.y-18);ys.add(s.a.y+18);}}
  // Nearest free corridors are enough for ordinary diagrams; bounded for large projects.
  const xv=[...xs].filter(x=>x>=area.x+8&&x<=area.x+area.w-8).sort((x,y)=>Math.abs(x-midX)-Math.abs(y-midX)).slice(0,22),yv=[...ys].filter(y=>y>=area.y+8&&y<=area.y+area.h-8).sort((x,y)=>Math.abs(x-midY)-Math.abs(y-midY)).slice(0,22);
  for(const x of xv)candidates.push([u,{x,y:u.y},{x,y:v.y},v]);
  for(const y of yv)candidates.push([u,{x:u.x,y},{x:v.x,y},v]);
  for(const middle of candidates){const points=simplify([start,...middle,end]);if(points.length<2)continue;
   let cost=(points.length-2)*18+(sa!==preferred[0]?28:0)+(sb!==preferred[1]?28:0);for(let i=1;i<points.length;i++)cost+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
   if(cost>=score)continue;const problems=routeProblems(points,e,p,reserved);cost+=problems.invalid*1000000+problems.crossings*160;
   if(cost<score){score=cost;best=points;}
  }
 }
 if(!best){const start=portPoint(a,e.fromPort||'right'),end=portPoint(b,e.toPort||'right');best=[start,{x:start.x+26,y:start.y},{x:start.x+26,y:start.y-40},{x:end.x,y:start.y-40},end];}
 return polyline(best);
}
