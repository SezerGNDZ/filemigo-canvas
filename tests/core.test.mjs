import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../src/index.mjs';
test('shapes and templates are real, independent copies with strict IDs',()=>{
 assert.equal(c.listShapes().length,54);assert.ok(c.listShapes({query:'karar',lang:'tr'}).some(x=>x.id==='diamond'));
 assert.throws(()=>c.getTemplate('missing'),/Unknown/);
 for(const t of c.listTemplates()){const value=c.getTemplate(t.id);assert.equal(c.validateDiagram(value.project).valid,true,t.id);}
});
test('create, layout, SVG and native roundtrip keep explicit branch meaning',()=>{
 const p=c.createDiagram(c.exampleDiagram).project,before=JSON.stringify(p),arranged=c.arrangeDiagram(p,{direction:'TB'});
 assert.equal(arranged.comparison.unchanged,true);assert.equal(JSON.stringify(p),before);
 assert.equal(c.compareDiagrams(p,JSON.parse(c.exportDiagram(p,{format:'json'}))).unchanged,true);
 const svg=c.exportDiagram(p);assert.match(svg,/<svg /);assert.match(svg,/Yes/);assert.match(svg,/No/);
 const unsafe=structuredClone(p);unsafe.nodes[0].text='<script>alert(1)</script>';assert.ok(!c.exportDiagram(unsafe).includes('<script>'));
});
test('updates are atomic, reject dangling links and report endpoint changes',()=>{
 const p=c.createDiagram(c.exampleDiagram).project,original=JSON.stringify(p);
 assert.throws(()=>c.updateDiagram(p,{removeNodes:['n2']}));assert.equal(JSON.stringify(p),original);
 assert.throws(()=>c.updateDiagram(p,{nodes:[{id:'missing',text:'bad'}]}));
 assert.throws(()=>c.updateDiagram(p,{nodes:[{id:'n1',src:'https://example.com'}]}));
 const updated=c.updateDiagram(p,{edges:[{id:'e2',label:'Approved',end:'triangle'}]});
 assert.equal(updated.comparison.unchanged,false);assert.equal(updated.comparison.changes[0].id,'e2');
 assert.equal(JSON.stringify(p),original);
 const removed=c.updateDiagram(p,{removeNodes:['n4'],removeEdges:['e3']});assert.equal(removed.project.nodes.length,3);
});
test('sequence message order and fragment scopes survive layout',()=>{
 const p=c.getTemplate('login-sequence').project;
 assert.equal(c.arrangeDiagram(p).comparison.unchanged,true);
 const changed=structuredClone(p);changed.edges[0].to='missing';assert.equal(c.validateDiagram(changed).valid,false);
});
test('invalid input fails closed without executing labels or accepting unsafe keys',()=>{
 assert.equal(c.validateDiagram('{').valid,false);
 assert.throws(()=>c.createDiagram('{"__proto__":{}}'));
 const p=structuredClone(c.exampleDiagram);p.edges[0].to='missing';assert.throws(()=>c.createDiagram(p));
 p.edges[0].to='n2';p.nodes[1].id='n1';assert.throws(()=>c.createDiagram(p));
 assert.throws(()=>c.createDiagram(' '.repeat(1000001)));
});
