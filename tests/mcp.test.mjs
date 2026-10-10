import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {exampleDiagram} from '../src/index.mjs';
test('real stdio client negotiates, discovers tools, creates, edits and exports',async()=>{
 const client=new Client({name:'filemigo-test',version:'1.0.0'});
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../src/mcp.mjs',import.meta.url))],stderr:'pipe'});
 try{
  await client.connect(transport);const tools=await client.listTools();assert.equal(tools.tools.length,10);
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
 }finally{await client.close();}
});
