import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/index.mjs';
import {makeNode,validateCanvas} from '../src/core/canvas-core.mjs';

function fixture(){
 const p=api.createDiagram(api.exampleDiagram).project;
 p.description='Order approval, with explicit responsibilities.';
 p.nodes[0].role='start';p.nodes[0].owner='Sales';p.nodes[0].purpose='Validate the incoming request';p.nodes[0].input='Order';p.nodes[0].output='Validated order';
 p.nodes[1].role='decision';p.nodes[2].role=p.nodes[3].role='end';
 p.nodes.push({...makeNode('text','heading',60,10),text:'Order approval'});
 p.edges[0].label='Validated request';p.edges[0].kind='transition';
 p.edges[1].kind=p.edges[2].kind='condition';p.edges[1].branch='yes';p.edges[2].branch='no';
 p.edges[1].label='Inventory available';p.edges[2].label='Backorder';
 return p;
}
test('explicit process roles guide inference without overriding a declared UML category',()=>{
 const p=fixture();delete p.sourceTool;p.nodes[0].type='card';
 assert.equal(api.analyzeWorkflow(p).supported,true);
 p.sourceTool='uml-class';assert.equal(api.analyzeWorkflow(p).supported,false);
});
test('annotations and descriptive labels do not create false process warnings',()=>{
 const p=fixture(),r=api.analyzeWorkflow(p);assert.equal(r.summary.steps,4);assert.equal(r.summary.annotations,1);
 assert.deepEqual(r.entries,['n1']);assert.equal(r.issues.length,0);assert.equal(r.steps[1].if.then.to,'n3');
 const d=JSON.parse(api.exportDiagram(p,{format:'brief'}));assert.equal(d.nodes.find(n=>n.id==='heading').role,'annotation');
 const round=api.createDiagram(d).project;assert.equal(round.description,p.description);assert.equal(round.nodes[0].owner,'Sales');assert.equal(api.compareDiagrams(p,round).unchanged,true);
});
test('reference relationships are preserved without becoming execution links',()=>{
 const p=fixture();p.edges.push({id:'e_ref',from:'heading',to:'n2',label:'Explains',kind:'reference',start:'none',end:'none',color:'#555555'});
 const r=api.analyzeWorkflow(p);assert.equal(r.summary.references,1);assert.equal(r.issues.length,0);assert.equal(api.traceWorkflow(p).path.length,2);
 p.edges.at(-1).kind='transition';assert.ok(api.analyzeWorkflow(p).issues.some(i=>i.code==='annotation-link'));
});
test('editable SVG and draw.io preserve roles, conditions and responsibility metadata',()=>{
 const p=fixture();p.nodes[0].purpose='Read <orders> & validate "customer"\nKeep the exact requirements';
 for(const format of ['editable-svg','drawio']){
  const exported=api.exportDiagram(p,{format}),round=api.importDiagram(exported,{format}).project;
  assert.equal(api.compareDiagrams(p,round).unchanged,true,format);
  assert.equal(round.nodes[0].purpose,p.nodes[0].purpose);
 }
});
test('walkthrough stops at unknown choices and only follows selected explicit branches',()=>{
 const p=fixture(),r=api.traceWorkflow(p);assert.equal(r.executed,false);assert.equal(r.status,'needs-choice');assert.equal(r.at,'n2');
 assert.deepEqual(r.path.map(n=>n.node),['n1','n2']);
 assert.deepEqual(api.traceWorkflow(p,{choices:{n2:'e2'}}).path.map(n=>n.node),['n1','n2','n3']);
 assert.equal(api.traceWorkflow(p,{choices:{n2:'e3'}}).status,'complete');
 assert.throws(()=>api.traceWorkflow(p,{choices:{n2:'e1'}}),/outgoing/);
 assert.throws(()=>api.traceWorkflow(p,{startId:'heading'}),/startId/);
 assert.throws(()=>api.traceWorkflow(p,{maxSteps:201}));assert.equal(api.traceWorkflow(p,{maxSteps:1}).status,'step-limit');
});
test('walkthrough does not pretend to execute loops, parallel work or inconsistent ends',()=>{
 const p=fixture();p.nodes[3].role='step';p.edges.push({id:'e_loop',from:'n4',to:'n2',label:'Try again',kind:'transition',start:'none',end:'arrow',color:'#555555'});
 assert.equal(api.traceWorkflow(p,{choices:{n2:'e3'}}).status,'cycle');
 p.nodes[1].role='fork';assert.equal(api.traceWorkflow(p,{choices:{n2:'e2'}}).status,'parallel-boundary');
 p.nodes[1].role='end';assert.equal(api.traceWorkflow(p).status,'inconsistent-end');
 assert.ok(api.analyzeWorkflow(p).issues.some(i=>i.code==='end-outgoing'));
});
test('metadata validation is strict and semantic edits cannot pass as styling',()=>{
 const p=fixture(),original=JSON.stringify(p);
 for(const update of [{role:'admin'},{owner:{}},{output:'x'.repeat(1201)}])assert.throws(()=>api.updateDiagram(p,{nodes:[{id:'n1',...update}]}));
 assert.throws(()=>api.updateDiagram(p,{edges:[{id:'e1',branch:'yes'}]}));
 for(const update of [{role:'step'},{owner:'Operations'},{purpose:'Different intent'}])assert.equal(api.updateDiagram(p,{nodes:[{id:'n1',...update}]}).comparison.unchanged,false);
 assert.equal(api.updateDiagram(p,{description:'A new process'}).comparison.unchanged,false);
 assert.equal(JSON.stringify(p),original);
 const changed=api.updateDiagram(p,{edges:[{id:'e2',kind:'transition'}]});assert.equal(changed.project.edges[1].branch,undefined);
});
test('canvas settings and themes are atomic, preserve meaning, and respect locks',()=>{
 const p=fixture();p.nodes[0].locked=true;
 for(const {id} of api.listThemes()){
  const styled=api.styleDiagram(p,{theme:id});assert.equal(styled.comparison.unchanged,true);assert.notEqual(styled.project.background,p.background);
  assert.deepEqual(styled.project.nodes[0],p.nodes[0]);assert.deepEqual(styled.project.edges[0],p.edges[0]);
  assert.equal(api.analyzeWorkflow(styled.project).issues.length,0);
 }
 assert.throws(()=>api.styleDiagram(p,{theme:'unknown'}));
 const changed=api.updateDiagram(p,{background:'#0B1222',width:1600,height:1000,infinite:true});assert.equal(changed.comparison.unchanged,true);
 assert.throws(()=>api.updateDiagram(p,{background:'url(evil)',nodes:[{id:'n2',text:'lost'}]}));assert.equal(p.nodes[1].text,'In stock?');
 assert.equal(validateCanvas(changed.project).background,'#0B1222');
});
