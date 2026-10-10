import {validateCanvas,renderCanvas} from './core/canvas-core.mjs';
import {autoLayout,contentBounds} from './core/canvas-board.mjs';
import {readLlmDiagram,systemPrompt,exampleDiagram} from './core/canvas-llm-import.mjs';
import {createBrief,briefMarkdown} from './core/canvas-brief.mjs';
import {shapeCatalog} from './core/canvas-shapes.mjs';
import {studioTemplates} from './core/studio-data.mjs';
import {canvasTemplate} from './core/canvas-templates.mjs';
import {routePlan,refreshRoutes} from './core/canvas-geometry.mjs';

export const version='0.2.2';
export {systemPrompt,exampleDiagram};
const clone=v=>structuredClone(v);
function parse(input){
 const text=typeof input==='string'?input:JSON.stringify(input);
 if(typeof text!=='string'||text.length>1000000)throw Error('Diagram must contain at most 1,000,000 characters.');
 return JSON.parse(text,(k,v)=>{if(['__proto__','constructor','prototype'].includes(k))throw Error('Unsafe object key.');return v;});
}
function project(input){const value=parse(input);return value.format==='filemigo-canvas'?validateCanvas(value):readLlmDiagram(JSON.stringify(value)).project;}
function issues(p,lang='en'){
 refreshRoutes();const result=createBrief(p,{lang}).issues;
 for(const [id,route]of routePlan(p))if(route.warning)result.push({code:'route-space',ids:[id],message:'Connection needs more space. Rearrange before SVG export.'});
 return result;
}
function result(p,lang){return {project:p,issues:issues(p,lang)};}
export function listShapes({query='',category,lang='en'}={}){
 const normalize=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll('ı','i');
 return shapeCatalog.filter(s=>(!category||s.category===category)&&normalize([s.type,s.en,s.tr].join(' ')).includes(normalize(query))).map(s=>({id:s.type,category:s.category,label:lang==='tr'?s.tr:s.en}));
}
export function listTemplates({lang='en'}={}){return studioTemplates.filter(t=>!['assignment-cover','weekly-planner'].includes(t.tool)).map(t=>({id:t.id,kind:t.tool,title:t[lang==='tr'?'tr':'en']}));}
export function getTemplate(id,{lang='en'}={}){if(!listTemplates().some(t=>t.id===id))throw Error('Unknown diagram template: '+id);return result(canvasTemplate(id,lang),lang);}
export function createDiagram(input,{direction='LR',lang='en'}={}){
 const data=parse(input);if(data.format==='filemigo-canvas')return result(validateCanvas(data),lang);
 return readLlmDiagram(JSON.stringify(data),{direction,lang});
}
export function validateDiagram(input,{lang='en'}={}){try{const p=project(input);const warnings=issues(p,lang);return {valid:true,exportable:!warnings.some(i=>i.code==='route-space'),nodeCount:p.nodes.length,edgeCount:p.edges.length,issues:warnings};}catch(error){return {valid:false,exportable:false,issues:[{code:'invalid-diagram',ids:[],message:error.message}]};}}
function meaning(p){const b=createBrief(p);return {title:p.title,kind:b.diagram.kind,nodes:b.nodes,edges:b.edges,fragments:p.fragments||[]};}
function diff(a,b){
 const changes=[];
 for(const key of ['title','kind','fragments'])if(JSON.stringify(a[key])!==JSON.stringify(b[key]))changes.push({type:'changed',target:key,before:a[key],after:b[key]});
 for(const key of ['nodes','edges']){const left=new Map(a[key].map(x=>[x.id,x])),right=new Map(b[key].map(x=>[x.id,x]));for(const [id,value]of left){if(!right.has(id))changes.push({type:'removed',target:key,id,before:value});else if(JSON.stringify(value)!==JSON.stringify(right.get(id)))changes.push({type:'changed',target:key,id,before:value,after:right.get(id)});}for(const [id,value]of right)if(!left.has(id))changes.push({type:'added',target:key,id,after:value});}
 return {unchanged:changes.length===0,changes};
}
export function compareDiagrams(before,after){return diff(meaning(project(before)),meaning(project(after)));}
export function arrangeDiagram(input,{direction='LR',lang='en'}={}){
 const before=project(input),after=autoLayout(before,{direction}),comparison=diff(meaning(before),meaning(after));
 if(!comparison.unchanged)throw Error('Layout changed diagram meaning; result rejected.');
 return {...result(after,lang),comparison};
}
export function updateDiagram(input,patch,{lang='en'}={}){
 const before=project(input),p=clone(before),change=parse(patch);
 if(!change||Array.isArray(change)||typeof change!=='object')throw Error('Patch must be an object.');
 const allowed=['title','nodes','edges','addNodes','addEdges','removeNodes','removeEdges'];
 for(const k of Object.keys(change))if(!allowed.includes(k))throw Error('Unknown patch field: '+k);
 const nodeFields=['text','type','x','y','w','h','fill','stroke','color','fontSize','align','locked','group','bold','italic'];
 const edgeFields=['from','to','label','start','end','dashed','startLabel','endLabel','routing','fromPort','toPort','color'];
 for(const [key,fields]of [['nodes',nodeFields],['edges',edgeFields]]){
  const list=change[key]||[];if(!Array.isArray(list))throw Error(key+' must be an array.');const used=new Set();
  for(const update of list){if(!update||typeof update!=='object'||used.has(update.id))throw Error('Invalid or duplicate patch ID.');used.add(update.id);const target=p[key].find(n=>n.id===update.id);if(!target)throw Error('Unknown '+key+' ID: '+update.id);for(const k of Object.keys(update))if(k!=='id'&&!fields.includes(k))throw Error('Unsupported '+key+' patch field: '+k);Object.assign(target,update);}
 }
 for(const key of ['Nodes','Edges']){
  const list=key.toLowerCase(),removed=change['remove'+key]||[],added=change['add'+key]||[];
  if(!Array.isArray(removed)||!Array.isArray(added)||new Set(removed).size!==removed.length)throw Error('Invalid add/remove array.');
  for(const id of removed)if(!p[list].some(n=>n.id===id))throw Error('Unknown removal ID: '+id);
  p[list]=p[list].filter(n=>!removed.includes(n.id)).concat(added);
 }
 if(change.title!==undefined)p.title=change.title;
 const checked=validateCanvas(p);return {...result(checked,lang),comparison:diff(meaning(before),meaning(checked))};
}
export function exportDiagram(input,{format='svg',lang='en',padding=32}={}){
 const p=project(input);if(format==='json')return JSON.stringify(p,null,2);
 if(format==='brief')return JSON.stringify(createBrief(p,{lang,includeLayout:true}),null,2);
 if(format==='markdown')return briefMarkdown(createBrief(p,{lang}));
 if(format!=='svg')throw Error('Supported exports: svg, json, brief, markdown.');
 if(!Number.isFinite(padding)||padding<0||padding>256)throw Error('Padding must be 0–256.');
 if(issues(p,lang).some(i=>i.code==='route-space'))throw Error('Connection routing conflict; rearrange before SVG export.');
 return renderCanvas(p,{viewport:contentBounds(p,padding)});
}
