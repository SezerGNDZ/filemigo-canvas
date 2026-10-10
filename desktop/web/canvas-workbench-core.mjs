import {movable,expandGroups} from './canvas-geometry.mjs';
import {validateCanvas} from './canvas-core.mjs';
export const styleKeys=['fill','stroke','color','fontSize','align','radius','strokeWidth','bold','italic','dash','opacity','fontFamily','verticalAlign','padding'];
export const palettes=[
 {id:'rose',en:'Rose',tr:'Gül',fill:'#f8e8ee',stroke:'#b84970',color:'#482938'},
 {id:'ocean',en:'Ocean',tr:'Okyanus',fill:'#e6f1ff',stroke:'#3768b4',color:'#193b69'},
 {id:'mint',en:'Mint',tr:'Nane',fill:'#e5f4ec',stroke:'#338367',color:'#204a3c'},
 {id:'amber',en:'Amber',tr:'Kehribar',fill:'#fff3d7',stroke:'#b27c20',color:'#64450e'},
 {id:'violet',en:'Violet',tr:'Menekşe',fill:'#f0eaff',stroke:'#8061b7',color:'#453166'},
 {id:'ink',en:'Ink',tr:'Mürekkep',fill:'#ffffff',stroke:'#334155',color:'#1e293b'}
];
export function copyStyle(node){return Object.fromEntries(styleKeys.map(k=>[k,node[k]??({radius:0,strokeWidth:1.6,bold:false,italic:false,dash:'solid',opacity:1,fontFamily:'Arial',verticalAlign:'middle',padding:12}[k])]));}
export function applyStyle(p,selection,style){
 for(const n of movable(p,selection)){if(n.type==='image')continue;for(const k of styleKeys)if(style[k]!==undefined)n[k]=style[k];}
}
export function matchSize(p,selection,axis){
 const nodes=movable(p,selection);if(nodes.length<2)return;const reference=nodes[0];
 for(const n of nodes){if(axis==='width'||axis==='both')n.w=reference.w;if(axis==='height'||axis==='both')n.h=reference.h;}
}
export function relatedSelection(p,selection,direction='both'){
 const result=new Set(selection);for(const e of p.edges){if(direction!=='incoming'&&selection.has(e.from))result.add(e.to);if(direction!=='outgoing'&&selection.has(e.to))result.add(e.from);}return expandGroups(p,result);
}
export function searchObjects(p,query){const q=query.trim().toLocaleLowerCase();return p.nodes.filter(n=>!q||`${n.text} ${n.type} ${n.id}`.toLocaleLowerCase().includes(q));}
export const draftKey='filemigo-canvas-draft-v1';
export const connectionPresets=[
 {id:'flow',en:'Flow →',tr:'Akış →',start:'none',end:'arrow',dashed:false},
 {id:'association',en:'Association —',tr:'İlişki —',start:'none',end:'none',dashed:false},
 {id:'dependency',en:'Dependency ⇢',tr:'Bağımlılık ⇢',start:'none',end:'open-arrow',dashed:true},
 {id:'inheritance',en:'Inheritance → parent',tr:'Kalıtım → üst sınıf',start:'none',end:'triangle',dashed:false},
 {id:'realization',en:'Realization → interface',tr:'Gerçekleme → arayüz',start:'none',end:'triangle',dashed:true},
 {id:'aggregation',en:'Aggregation ◇ at source',tr:'Aggregation ◇ kaynakta',start:'hollow-diamond',end:'none',dashed:false},
 {id:'composition',en:'Composition ◆ at source',tr:'Composition ◆ kaynakta',start:'diamond',end:'none',dashed:false}
];
export function applyConnectionPreset(p,edgeId,presetId){
 const edge=p.edges.find(e=>e.id===edgeId),preset=connectionPresets.find(t=>t.id===presetId);
 if(!edge||!preset||edge.lane!==undefined)return;
 for(const key of ['start','end','dashed'])edge[key]=preset[key];
}
export function readDraft(storage){try{const raw=storage.getItem(draftKey);if(!raw)return null;const data=JSON.parse(raw);if(data.version!==1||!Number.isFinite(data.savedAt))return null;return {...data,project:validateCanvas(data.project)};}catch{return null;}}
export function writeDraft(storage,project,now=Date.now()){
 const data={version:1,savedAt:now,project:validateCanvas(project)};
 storage.setItem(draftKey,JSON.stringify(data));return data;
}
