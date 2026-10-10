import {createHash,randomBytes} from 'node:crypto';
import * as api from './index.mjs';

const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const id=()=>randomBytes(12).toString('hex');
function put(map,key,value,limit){map.delete(key);map.set(key,value);while(map.size>limit)map.delete(map.keys().next().value);}
function delta(before,after){
 const set={},unset=[],result={set,unset};
 for(const key of new Set([...Object.keys(before),...Object.keys(after)])){
  if(['nodes','edges'].includes(key))continue;
  if(!(key in after))unset.push(key);else if(JSON.stringify(before[key])!==JSON.stringify(after[key]))set[key]=after[key];
 }
 for(const key of ['nodes','edges'])if(before[key]||after[key]){
  const old=new Map((before[key]||[]).map(x=>[x.id,x])),next=new Map((after[key]||[]).map(x=>[x.id,x]));
  result[key]={upsert:[...next.values()].filter(n=>JSON.stringify(old.get(n.id))!==JSON.stringify(n)),remove:[...old.keys()].filter(k=>!next.has(k))};
 }
 return result;
}

export function createAgentSession({live,execute=async(method,args)=>api[method](...args)}={}){
 const docs=new Map(),snapshots=new Map(),previews=new Map();let liveId;
 function get(document){const d=docs.get(document);if(!d)throw Error('Document expired; reopen with diagramJson or the live canvas.');put(docs,document,d,16);return d;}
 async function state(d){return d.live?live.read():{project:d.project,revision:d.revision,busy:false,paused:false};}
 async function read({document,diagramJson,view='overview',ids=[],depth=1,since}={}){
  if(document&&diagramJson!==undefined)throw Error('Use document or diagramJson, not both');
  if(!document){
   if(diagramJson!==undefined){const {project}=await execute('createDiagram',[diagramJson]);document=id();put(docs,document,{project,revision:0,live:false},16);}
   else {if(!live)throw Error('Desktop connection unavailable');if(!liveId||!docs.has(liveId)){liveId=id();put(docs,liveId,{live:true},16);}document=liveId;}
  }
  const d=get(document),s=await state(d),context=await execute('agentContext',[s.project,{view,ids,depth}]);
  const query=JSON.stringify({view,ids:[...new Set(ids)].sort(),depth}),snapshot=hash([document,query,context]);
  const previous=since?snapshots.get(since):null;
  const envelope={document,revision:s.revision,target:d.live?'desktop':'memory',busy:s.busy,paused:s.paused,snapshot};
  // Bind future preview to the exact state observed by this client, even across desktop reloads.
  d.observed={revision:s.revision,hash:hash(s.project)};
  put(snapshots,snapshot,{document,query,context},64);
  if(previous?.document===document&&previous.query===query){
   if(snapshot===since)return {...envelope,unchanged:true};
   return {...envelope,base:since,delta:delta(previous.context,context)};
  }
  return {...envelope,...(since?{reset:true}:{}),context};
 }
 async function patch({document,expectedRevision,patchJson,workflowJson,previewId,apply=false,allowSemanticChanges=false}){
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('expectedRevision must be a nonnegative integer');
  const d=get(document);if(d.writing)throw Error('Another operation is pending for this document');
  d.writing=true;
  try{
   const s=await state(d);
   if(s.busy||s.paused)throw Error('Canvas is busy or paused');
   if(s.revision!==expectedRevision)throw Error('Revision conflict; read again');
   if(!d.observed||d.observed.revision!==s.revision||d.observed.hash!==hash(s.project))throw Error('Document changed since last read; read again');
   if(!apply){
    if(previewId||(typeof patchJson==='string')===(typeof workflowJson==='string'))throw Error('Preview requires exactly one of patchJson or workflowJson');
    if(workflowJson!==undefined){
     if(s.project.nodes.length||s.project.edges.length)throw Error('workflowJson requires an empty canvas; existing work is preserved');
     const empty=await execute('agentContext',[s.project]);if(!empty.canCreate)throw Error('Canvas does not support workflow creation');
     const {project:p}=await execute('createWorkflow',[workflowJson]);
     patchJson=JSON.stringify({title:p.title,description:p.description||'',sourceTool:'flowchart',background:p.background,width:p.width,height:p.height,infinite:p.infinite,addNodes:p.nodes,addEdges:p.edges});
    }
    const result=await execute('previewChanges',[s.project,patchJson]);
    for(const node of s.project.nodes)if(node.locked&&JSON.stringify(node)!==JSON.stringify(result.project.nodes.find(n=>n.id===node.id)))throw Error('Locked object cannot be changed by AI');
    const after=await state(d);if(after.revision!==s.revision||hash(after.project)!==hash(s.project)||after.busy||after.paused)throw Error('Document changed during preview; read again');
    const token=id();put(previews,token,{document,revision:s.revision,before:hash(s.project),patchJson,result},16);
    // The request already contains proposed wording. Return changed IDs and field names, not duplicate full graphs.
    const changes=result.comparison.changes.map(c=>({type:c.type,target:c.target,...(c.id?{id:c.id}:{}),...(c.type==='changed'&&c.id?{fields:[...new Set([...Object.keys(c.before),...Object.keys(c.after)])].filter(k=>JSON.stringify(c.before[k])!==JSON.stringify(c.after[k]))}:{})}));
    return {document,revision:s.revision,applied:false,previewId:token,summary:result.summary,...(workflowJson!==undefined?{creation:true}:{changes}),issues:result.issues};
   }
   if(patchJson!==undefined||workflowJson!==undefined||!previewId)throw Error('Apply requires previewId only; patchJson and workflowJson must be omitted');
   const p=previews.get(previewId);
   if(!p||p.document!==document||p.revision!==s.revision||p.before!==hash(s.project))throw Error('Preview expired or stale; read and preview again');
   if(!allowSemanticChanges&&!p.result.comparison.unchanged)throw Error('Semantic change requires user authorization and allowSemanticChanges');
   previews.delete(previewId); // Consume before sending: uncertain writes cannot be replayed.
   let ack;
   if(d.live)ack=await live.change({expectedRevision,method:'updateDiagram',argument:p.patchJson,allowSemanticChanges});
   else {d.project=p.result.project;d.revision++;ack={applied:true,revision:d.revision};}
   if(!ack.applied)throw Error('Write was not acknowledged; read before deciding what remains');
   let after;try{after=await state(d);}catch{return {document,applied:true,revision:ack.revision,verified:false,readRequired:true};}
   const verified=after.revision===ack.revision&&hash(after.project)===hash(p.result.project);
   d.observed={revision:after.revision,hash:hash(after.project)};
   return {document,applied:true,revision:ack.revision,currentRevision:after.revision,verified,readRequired:!verified,summary:p.result.summary,issues:ack.issues||p.result.issues};
  }finally{d.writing=false;}
 }
 return {read,patch};
}
