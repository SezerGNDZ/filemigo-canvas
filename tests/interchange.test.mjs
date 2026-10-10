import test from 'node:test';import assert from 'node:assert/strict';
import {deflateSync,strToU8} from 'fflate';
import {getTemplate,exportDiagram,importDrawio,readEditableSvg,compareDiagrams,previewChanges,importDiagram} from '../src/index.mjs';
test('editable SVG retains all Filemigo semantics, including sequence fragments',()=>{
 for(const id of ['library-class','login-sequence']){const p=getTemplate(id).project,svg=exportDiagram(p,{format:'editable-svg'});assert.deepEqual(readEditableSvg(svg).project,p);}
 assert.throws(()=>readEditableSvg('<svg xmlns="http://www.w3.org/2000/svg"/>'),/no editable/);
});
test('draw.io roundtrip keeps IDs, labels, endpoint markers and multiplicities',()=>{
 const p=getTemplate('library-class').project;const out=importDrawio(exportDiagram(p,{format:'drawio'}));assert.equal(out.project.title,p.title);assert.deepEqual(out.project.nodes.map(n=>[n.id,n.text]),p.nodes.map(n=>[n.id,n.text]));assert.deepEqual(out.project.edges.map(e=>[e.id,e.from,e.to,e.start,e.end,e.startLabel,e.endLabel]),p.edges.map(e=>[e.id,e.from,e.to,e.start,e.end,e.startLabel,e.endLabel]));
});
test('compressed draw.io supports selecting a page and reports the boundary',()=>{
 const source=exportDiagram(getTemplate('library-class').project,{format:'drawio'}),model=source.match(/<mxGraphModel[\s\S]*<\/mxGraphModel>/)[0],encoded=Buffer.from(deflateSync(strToU8(encodeURIComponent(model)))).toString('base64');const data=`<mxfile><diagram name="One">${encoded}</diagram><diagram name="Two">${encoded}</diagram></mxfile>`;const got=importDrawio(data,{page:1});assert.equal(got.project.title,'Two');assert.match(got.warnings[0],/page 2 of 2/);assert.throws(()=>importDrawio(data,{page:2}),/valid draw.io page/);
});
test('unsupported relationships and external entities fail without approximating meaning',()=>{
 const source=exportDiagram(getTemplate('library-class').project,{format:'drawio'});assert.throws(()=>importDrawio(source.replace('endArrow=open','endArrow=ERmany')),/marker/);assert.throws(()=>importDrawio('<!DOCTYPE x [<!ENTITY a SYSTEM "file:///secret">]>'+source),/DTD/);assert.throws(()=>importDrawio(source.replace('rounded=0;','shape=mxgraph.aws4.ec2;')),/shape/);assert.throws(()=>exportDiagram(getTemplate('login-sequence').project,{format:'drawio'}),/Sequence/);
});
test('preview changes never mutates the original and reports semantic and geometry edits',()=>{
 const p=getTemplate('library-class').project,before=JSON.stringify(p),r=previewChanges(p,{nodes:[{id:'n1',x:150,text:'Book\n+reserve()'}]});assert.equal(JSON.stringify(p),before);assert.equal(r.applied,false);assert.equal(r.summary.modified,1);assert.equal(r.summary.semanticChanges,1);const layout=previewChanges(p,{nodes:[{id:'n1',x:150}]});assert.equal(layout.summary.semanticChanges,0);assert.equal(layout.summary.modified,1);assert.throws(()=>importDiagram('',{format:'html'}),/Supported imports/);
});
test('compressed oversized input is bounded before XML parsing',()=>{
 const encoded=Buffer.from(deflateSync(strToU8('x'.repeat(1100000)))).toString('base64');assert.throws(()=>importDrawio(`<mxfile><diagram>${encoded}</diagram></mxfile>`),/exceeds 1 MB/);
});
