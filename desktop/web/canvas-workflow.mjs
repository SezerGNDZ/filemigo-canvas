import {validateCanvas} from './canvas-core.mjs';
import {createBrief} from './canvas-brief.mjs';

// Analysis only: this module never executes tasks, conditions, code or network requests.
export function analyzeWorkflow(input,{lang='en'}={}) {
 const p=validateCanvas(input),brief=createBrief(p,{lang}),flow=brief.flow;
 return {format:'filemigo-workflow-review',version:1,title:p.title,description:p.description||'',
  supported:!!flow,summary:{steps:flow?.steps.length||0,annotations:p.nodes.filter(n=>n.role==='annotation').length,
   decisions:flow?.steps.filter(n=>n.operation==='decision').length||0,cycles:flow?.cycles.length||0,
   references:p.edges.filter(e=>e.kind==='reference').length,issues:brief.issues.length},
  entries:flow?.entryCandidates||[],terminals:flow?.terminalCandidates||[],steps:flow?.steps||[],cycles:flow?.cycles||[],issues:brief.issues,
  readingRules:brief.readingRules};
}

export function traceWorkflow(input,{startId,choices={},maxSteps=100,lang='en'}={}) {
 if(!Number.isInteger(maxSteps)||maxSteps<1||maxSteps>200)throw Error('maxSteps must be 1–200');
 if(!choices||typeof choices!=='object'||Array.isArray(choices)||Object.values(choices).some(x=>typeof x!=='string'))throw Error('choices must map node IDs to outgoing edge IDs');
 const review=analyzeWorkflow(input,{lang});
 const result={format:'filemigo-workflow-trace',version:1,executed:false,path:[],status:'unsupported',issues:review.issues};
 if(!review.supported)return result;
 const steps=new Map(review.steps.map(s=>[s.node,s]));
 if(startId!==undefined&&!steps.has(startId))throw Error('Unknown process startId');
 if(startId===undefined&&review.entries.length!==1)return {...result,status:'needs-start',candidates:review.entries};
 let id=startId??review.entries[0];const visited=new Set();
 for(let count=0;count<maxSteps;count++){
  if(visited.has(id))return {...result,status:'cycle',at:id};
  visited.add(id);const step=steps.get(id);
  result.path.push({node:id,text:step.text,operation:step.operation,owner:step.owner,purpose:step.purpose,input:step.input,output:step.output});
  const links=step.transitions;
  if(step.operation==='fork'||step.operation==='join')return {...result,status:'parallel-boundary',at:id,options:links};
  if(!links.length)return {...result,status:step.operation==='end'?'complete':'terminal-candidate',at:id};
  if(step.operation==='end')return {...result,status:'inconsistent-end',at:id,options:links};
  // A labeled condition or any decision must be explicitly chosen by its edge ID.
  const selected=Object.hasOwn(choices,id)?choices[id]:undefined;
  if(selected!==undefined&&!links.some(e=>e.edge===selected))throw Error('Choice is not an outgoing edge of '+id);
  let edge=selected?links.find(e=>e.edge===selected):null;
  if(!edge&&links.length===1&&step.operation!=='decision'&&links[0].kind==='transition')edge=links[0];
  if(!edge)return {...result,status:'needs-choice',at:id,options:links};
  result.path.at(-1).via=edge.edge;id=edge.to;
 }
 return {...result,status:'step-limit',at:id};
}

export const workflowThemes=Object.freeze({
 midnight:{name:'Midnight / Gece',background:'#0B1222',fill:'#16233D',stroke:'#4EDBC5',text:'#F1F6FF',decision:'#312753',accent:'#C6B2FF',annotation:'#9EB3D1',end:'#123F39',edge:'#72DCCF'},
 paper:{name:'Paper / Kağıt',background:'#F7F9FC',fill:'#FFFFFF',stroke:'#4168A8',text:'#142641',decision:'#F0E9FF',accent:'#7955BE',annotation:'#51657F',end:'#DDF5EA',edge:'#426A9C'},
 ember:{name:'Ember / Kor',background:'#19141B',fill:'#2E2430',stroke:'#F2AF65',text:'#FFF3E5',decision:'#492E39',accent:'#EEA2BE',annotation:'#CBB5BD',end:'#294237',edge:'#F2AF65'}
});

export function themePatch(input,theme='midnight') {
 const p=validateCanvas(input),t=workflowThemes[theme];if(!t)throw Error('Unknown theme');
 return {background:t.background,nodes:p.nodes.filter(n=>!n.locked&&n.type!=='image').map(n=>{
  const annotation=n.role==='annotation',decision=n.role==='decision'||(!n.role&&n.type==='diamond');
  return {id:n.id,fill:annotation?'none':decision?t.decision:n.role==='end'?t.end:t.fill,
   stroke:annotation?'none':decision?t.accent:t.stroke,color:annotation?t.annotation:t.text};
 }),edges:p.edges.filter(e=>![e.from,e.to].some(id=>p.nodes.find(n=>n.id===id)?.locked)).map(e=>({id:e.id,color:e.kind==='reference'?t.annotation:e.kind==='condition'?t.accent:t.edge}))};
}
