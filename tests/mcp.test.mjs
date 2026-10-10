import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {exampleDiagram} from '../src/index.mjs';
import {Script} from 'node:vm';
import {blankCanvas} from '../src/core/canvas-core.mjs';
test('real stdio client negotiates, discovers tools, creates, edits and exports',async()=>{
 const client=new Client({name:'filemigo-test',version:'1.0.0'});
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../src/mcp.mjs',import.meta.url))],stderr:'pipe'});
 try{
  await client.connect(transport);const tools=await client.listTools();assert.equal(tools.tools.length,26);
  const call=(name,args={})=>client.callTool({name:'filemigo_'+name,arguments:args});
  const shapes=await call('list_shapes');assert.equal(JSON.parse(shapes.content[0].text).length,54);
  assert.match((await call('instructions')).content[0].text,/filemigo-diagram v1/);
  const created=await call('create_diagram',{diagramJson:JSON.stringify(exampleDiagram)});assert.ok(!created.isError,created.content[0].text);
  const diagramJson=JSON.stringify(JSON.parse(created.content[0].text).project);
  const caps=JSON.parse((await call('capabilities')).content[0].text);assert.equal(caps.version,'0.6.1');assert.equal(caps.executesWorkflow,false);assert.equal(caps.agentProtocol,1);
  const analysis=JSON.parse((await call('analyze_workflow',{diagramJson})).content[0].text);assert.equal(analysis.summary.decisions,1);
  const trace=JSON.parse((await call('trace_workflow',{diagramJson,choices:{n2:'e2'}})).content[0].text);assert.deepEqual(trace.path.map(n=>n.node),['n1','n2','n3']);assert.equal(trace.executed,false);
  const themed=JSON.parse((await call('style_diagram',{diagramJson,theme:'midnight'})).content[0].text);assert.equal(themed.comparison.unchanged,true);assert.equal(themed.patch.background,'#0B1222');
  assert.equal(JSON.parse((await call('list_themes')).content[0].text).length,3);
  assert.equal((await call('trace_workflow',{diagramJson,choices:{n2:'missing'}})).isError,true);
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

test('agent-only profile exposes three tools and completes a cached preview/apply/delta exchange',async()=>{
 const client=new Client({name:'filemigo-agent-test',version:'1.0.0'});
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../src/mcp.mjs',import.meta.url))],env:{...process.env,FILEMIGO_MCP_PROFILE:'agent'},stderr:'pipe'});
 try{
  await client.connect(transport);const tools=await client.listTools();assert.deepEqual(tools.tools.map(t=>t.name),['filemigo_agent_contract','filemigo_agent_read','filemigo_agent_patch']);
  const call=async(name,args={})=>{const r=await client.callTool({name:'filemigo_agent_'+name,arguments:args});assert.ok(!r.isError,r.content[0].text);return JSON.parse(r.content[0].text);};
  assert.equal((await call('contract')).version,1);
  const empty=await call('read',{diagramJson:JSON.stringify(blankCanvas())});assert.equal(empty.context.canCreate,true);
  const creation=await call('patch',{document:empty.document,expectedRevision:empty.revision,workflowJson:JSON.stringify({title:'From scratch',nodes:[{id:'start',role:'start',text:'Start'},{id:'end',role:'end',text:'Finish'}],edges:[{from:'start',to:'end'}]})});
  const created=await call('patch',{document:empty.document,expectedRevision:empty.revision,previewId:creation.previewId,apply:true,allowSemanticChanges:true});assert.equal(created.verified,true);
  assert.equal((await call('read',{document:empty.document,view:'graph'})).context.nodes.length,2);
  const a=await call('read',{diagramJson:JSON.stringify(exampleDiagram),view:'graph'});
  const p=await call('patch',{document:a.document,expectedRevision:a.revision,patchJson:JSON.stringify({nodes:[{id:'n1',owner:'Research agent'}]})});
  assert.equal(p.applied,false);assert.equal(p.project,undefined);
  const ack=await call('patch',{document:a.document,expectedRevision:a.revision,previewId:p.previewId,apply:true,allowSemanticChanges:true});assert.equal(ack.verified,true);
  const b=await call('read',{document:a.document,view:'graph',since:a.snapshot});assert.equal(b.delta.nodes.upsert.length,1);assert.equal(b.delta.nodes.upsert[0].owner,'Research agent');
  assert.equal((await call('read',{document:a.document,view:'graph',since:b.snapshot})).unchanged,true);
  const invalid=await client.callTool({name:'filemigo_agent_read',arguments:{document:a.document,depth:10}});assert.equal(invalid.isError,true);
 }finally{await client.close();}
});
