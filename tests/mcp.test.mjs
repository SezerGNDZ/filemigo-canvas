import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {exampleDiagram} from '../src/index.mjs';
import {Script} from 'node:vm';
test('real stdio client negotiates, discovers tools, creates, edits and exports',async()=>{
 const client=new Client({name:'filemigo-test',version:'1.0.0'});
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../src/mcp.mjs',import.meta.url))],stderr:'pipe'});
 try{
  await client.connect(transport);const tools=await client.listTools();assert.equal(tools.tools.length,18);
  const call=(name,args={})=>client.callTool({name:'filemigo_'+name,arguments:args});
  const shapes=await call('list_shapes');assert.equal(JSON.parse(shapes.content[0].text).length,54);
  assert.match((await call('instructions')).content[0].text,/filemigo-diagram v1/);
  const created=await call('create_diagram',{diagramJson:JSON.stringify(exampleDiagram)});assert.ok(!created.isError,created.content[0].text);
  const diagramJson=JSON.stringify(JSON.parse(created.content[0].text).project);
  const arranged=await call('arrange_diagram',{diagramJson});assert.equal(JSON.parse(arranged.content[0].text).comparison.unchanged,true);
  const changed=await call('update_diagram',{diagramJson,patchJson:JSON.stringify({nodes:[{id:'n1',text:'Receive paid order'}]})});assert.equal(JSON.parse(changed.content[0].text).comparison.changes[0].id,'n1');
  const exported=await call('export_diagram',{diagramJson,format:'svg'});assert.match(exported.content[0].text,/<svg /);
  assert.equal((await call('create_diagram',{diagramJson:'{}'})).isError,true);
  assert.equal((await call('create_diagram',{diagramJson:'x'.repeat(1000001)})).isError,true);
  assert.ok(!(await call('list_templates')).isError);
  const shown=await call('show_diagram',{diagramJson});assert.equal(shown.structuredContent.project.format,'filemigo-canvas');assert.equal(tools.tools.find(t=>t.name==='filemigo_show_diagram')._meta.ui.resourceUri,'ui://filemigo/diagram.html');
  const resources=await client.listResources();assert.ok(resources.resources.some(r=>r.uri==='ui://filemigo/diagram.html'));const view=await client.readResource({uri:'ui://filemigo/diagram.html'});assert.match(view.contents[0].text,/Open in Filemigo/);assert.equal(view.contents[0].mimeType,'text/html;profile=mcp-app');
  assert.doesNotThrow(()=>new Script(view.contents[0].text.match(/<script>([\s\S]*)<\/script>/)[1]));
  const preview=await call('preview_changes',{diagramJson,patchJson:JSON.stringify({nodes:[{id:'n1',text:'Proposed'}]})});assert.equal(preview.structuredContent.applied,false);assert.ok(preview.structuredContent.summary.semanticChanges>0);assert.ok((await client.listPrompts()).prompts.some(p=>p.name==='filemigo_design_review'));
 }finally{await client.close();}
});
