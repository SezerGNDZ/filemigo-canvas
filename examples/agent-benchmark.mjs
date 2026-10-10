// node examples/agent-benchmark.mjs [native-project.json] [output.json]
// Offline documents only. No desktop edits, model calls or workflow execution.
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import * as api from '../src/index.mjs';
import {createAgentSession} from '../src/agent-session.mjs';
const source=process.argv[2]||fileURLToPath(new URL('./orbit-workflow.filemigo.json',import.meta.url));
const p=api.createDiagram(await fs.readFile(source,'utf8')).project;
const session=createAgentSession(),overview=await session.read({diagramJson:JSON.stringify(p)}),document=overview.document;
const graph=await session.read({document,view:'graph'}),focusId=graph.context.nodes.find(n=>n.role==='decision')?.id||graph.context.nodes[0].id;
const focus=await session.read({document,view:'focus',ids:[focusId],depth:0});
const node=graph.context.nodes.find(n=>!n.locked),patchJson=JSON.stringify({nodes:[{id:node.id,owner:'Benchmark agent'}]});
const preview=await session.patch({document,expectedRevision:0,patchJson});
const receipt=await session.patch({document,expectedRevision:0,apply:true,previewId:preview.previewId,allowSemanticChanges:true});
const delta=await session.read({document,view:'graph',since:graph.snapshot});
const unchanged=await session.read({document,view:'graph',since:delta.snapshot});
const payloads={native:JSON.stringify(p),brief:JSON.stringify(JSON.parse(api.exportDiagram(p,{format:'brief'}))),contract:JSON.stringify(api.agentContract()),overview:JSON.stringify(overview),graph:JSON.stringify(graph),focus:JSON.stringify(focus),preview:JSON.stringify(preview),receipt:JSON.stringify(receipt),delta:JSON.stringify(delta),unchanged:JSON.stringify(unchanged)};
for(const profile of ['full','agent']){
 const client=new Client({name:'filemigo-benchmark',version:'1.0'});
 try{await client.connect(new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../src/mcp.mjs',import.meta.url))],env:{...process.env,FILEMIGO_MCP_PROFILE:profile}}));payloads[profile+'Tools']=JSON.stringify(await client.listTools());}finally{await client.close();}
}
const report={fixture:p.title,nodes:p.nodes.length,edges:p.edges.length,focusId,modifiedId:node.id,payloads};
if(process.argv[3])await fs.writeFile(process.argv[3],JSON.stringify(report,null,2));
console.log(JSON.stringify({fixture:report.fixture,characters:Object.fromEntries(Object.entries(payloads).map(([k,v])=>[k,v.length]))},null,2));
