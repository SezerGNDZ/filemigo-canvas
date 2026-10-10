import {bounds,refreshRoutes} from './canvas-geometry.mjs';
import {edgeGeometry,validateCanvas} from './canvas-core.mjs';
import {lifelineEnd,endpointLabelPosition} from './canvas-semantics.mjs';

export function screenToWorld(camera,zoom,x,y){return{x:camera.x+x/zoom,y:camera.y+y/zoom};}
export function zoomCamera(camera,zoom,next,x,y){const world=screenToWorld(camera,zoom,x,y);return{x:world.x-x/next,y:world.y-y/next};}
export function fitCamera(box,width,height,maxZoom=1){const zoom=Math.max(.0001,Math.min(maxZoom,Math.max(1,width-80)/Math.max(1,box.w),Math.max(1,height-80)/Math.max(1,box.h)));return{zoom,x:box.x+box.w/2-width/(2*zoom),y:box.y+box.h/2-height/(2*zoom)};}
export function contentBounds(p,padding=32){
 const boxes=p.nodes.map(n=>({x:n.x-6,y:n.y-6,w:n.w+12,h:n.h+12}));
 for(const n of p.nodes)if(n.lifeline)boxes.push({x:n.x+n.w/2-2,y:n.y+n.h,w:4,h:Math.max(0,lifelineEnd(p)-n.y-n.h)});
 for(const e of p.edges){const g=edgeGeometry(e,p);if(!g)continue;
  for(const pt of g.points||[]){boxes.push({x:pt.x-12,y:pt.y-12,w:24,h:24});}
  if(e.lane!==undefined){const a=p.nodes.find(n=>n.id===e.from),b=p.nodes.find(n=>n.id===e.to);boxes.push({x:Math.min(a.x+a.w/2,b.x+b.w/2)-12,y:e.lane-12,w:Math.abs(a.x+a.w/2-b.x-b.w/2)+(a===b?75:24),h:a===b?50:24});}
  if(e.label)boxes.push({x:g.x-e.label.length*3.8-8,y:g.y-18,w:e.label.length*7.6+16,h:26});
  for(const side of ['start','end'])if(e[side+'Label']){const pt=endpointLabelPosition(g.points,side==='start');if(pt)boxes.push({x:pt.x-e[side+'Label'].length*4-8,y:pt.y-16,w:e[side+'Label'].length*8+16,h:24});}
 }
 for(const f of p.fragments||[]){const ns=p.nodes.filter(n=>n.lifeline),es=f.branches.flatMap(b=>b.edges.map(id=>p.edges.find(e=>e.id===id)));if(!ns.length||!es.length)continue;const left=Math.min(...ns.map(n=>n.x))-20,right=Math.max(...ns.map(n=>n.x+n.w))+20,top=Math.min(...es.map(e=>e.lane))-50,bottom=Math.max(...es.map(e=>e.lane))+32;boxes.push({x:left-2,y:top-2,w:right-left+4,h:bottom-top+4});for(const b of f.branches){const e=p.edges.find(e=>e.id===b.edges[0]);boxes.push({x:left+66,y:e.lane-52,w:b.label.length*7.6+28,h:30});}}
 const b=bounds(boxes)||{x:0,y:0,w:800,h:500};return{x:Math.floor(b.x-padding),y:Math.floor(b.y-padding),w:Math.ceil(b.w+padding*2+1),h:Math.ceil(b.h+padding*2+1)};
}
export function exportSpec(p,{scale=2,padding=32}={}){
 if(![1,2,4].includes(scale)||!Number.isFinite(padding)||padding<0||padding>256)throw Error('export-settings');
 const area=contentBounds(p,padding),effective=Math.min(scale,8000/area.w,8000/area.h,Math.sqrt(16000000/(area.w*area.h)));
 return{area,width:Math.max(1,Math.floor(area.w*effective)),height:Math.max(1,Math.floor(area.h*effective)),scale:effective,limited:effective<scale-.001};
}
const overlaps=(a,b,gap=40)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
function unitsFor(p){const map=new Map();for(const n of p.nodes){const key=n.group||n.id;if(!map.has(key))map.set(key,[]);map.get(key).push(n);}return[...map].map(([id,nodes])=>({id,nodes,...bounds(nodes),locked:nodes.some(n=>n.locked)}));}
function place(unit,x,y,occupied,axis='y'){
 const box={x,y,w:unit.w,h:unit.h};for(let i=0;i<500;i++){const hits=occupied.filter(b=>overlaps(box,b));if(!hits.length)break;box[axis]=Math.max(...hits.map(b=>b[axis]+b[axis==='y'?'h':'w']))+80;}
 for(const n of unit.nodes){n.x+=box.x-unit.x;n.y+=box.y-unit.y;}Object.assign(unit,box);occupied.push(box);
}
export function autoLayout(input,{direction='LR'}={}){
 if(!['LR','TB'].includes(direction))throw Error('layout');const p=structuredClone(input);p.infinite=true;
 const units=unitsFor(p),occupied=units.filter(u=>u.locked).map(u=>({x:u.x,y:u.y,w:u.w,h:u.h}));
 if(p.diagram==='sequence'){
  const participants=units.filter(u=>u.nodes.some(n=>n.lifeline));let x=80;
  for(const u of participants){if(!u.locked)place(u,x,80,occupied,'x');x=Math.max(x,u.x+u.w+100);}
  const headers=p.nodes.filter(n=>n.lifeline);let lane=Math.max(180,...headers.map(n=>n.y+n.h+80));const branchStarts=new Set((p.fragments||[]).flatMap(f=>f.branches.map(b=>b.edges[0])));
  for(const e of p.edges)if(e.lane!==undefined){if(branchStarts.has(e.id))lane+=40;e.lane=lane;lane+=80;}
  let y=lane+80;for(const u of units.filter(u=>!participants.includes(u)&&!u.locked)){place(u,80,y,occupied);y=u.y+u.h+80;}
 }else if(!p.edges.length){
  const cols=Math.max(1,Math.ceil(Math.sqrt(units.filter(u=>!u.locked).length))),w=Math.max(180,...units.map(u=>u.w))+90,h=Math.max(90,...units.map(u=>u.h))+90;let i=0;
  for(const u of units)if(!u.locked){place(u,80+i%cols*w,80+Math.floor(i/cols)*h,occupied);i++;}
 }else{
  const owner=new Map(units.flatMap(u=>u.nodes.map(n=>[n.id,u.id]))),adj=new Map(units.map(u=>[u.id,[]]));
  for(const e of p.edges){const a=owner.get(e.from),b=owner.get(e.to);if(a!==b&&!adj.get(a).includes(b))adj.get(a).push(b);}
  // Remove DFS back edges only from the layout constraints. The project keeps every edge.
  const state=new Map(),dag=new Map(units.map(u=>[u.id,[]]));function visit(a){state.set(a,1);for(const b of adj.get(a)){if(state.get(b)===1)continue;dag.get(a).push(b);if(!state.has(b))visit(b);}state.set(a,2);}for(const u of units)if(!state.has(u.id))visit(u.id);
  const rank=new Map(units.map(u=>[u.id,0])),degree=new Map(units.map(u=>[u.id,0]));for(const targets of dag.values())for(const b of targets)degree.set(b,degree.get(b)+1);const queue=units.filter(u=>!degree.get(u.id)).map(u=>u.id);
  for(let i=0;i<queue.length;i++)for(const b of dag.get(queue[i])){rank.set(b,Math.max(rank.get(b),rank.get(queue[i])+1));degree.set(b,degree.get(b)-1);if(!degree.get(b))queue.push(b);}
  const max=Math.max(0,...rank.values()),layers=Array.from({length:max+1},(_,i)=>units.filter(u=>rank.get(u.id)===i));
  let main=80;for(const layer of layers){let cross=80;for(const u of layer){if(!u.locked)place(u,direction==='LR'?main:cross,direction==='LR'?cross:main,occupied,direction==='LR'?'y':'x');cross+=u[direction==='LR'?'h':'w']+90;}main+=Math.max(0,...layer.map(u=>u[direction==='LR'?'w':'h']))+150;}
 }
 refreshRoutes();return validateCanvas(p);
}
