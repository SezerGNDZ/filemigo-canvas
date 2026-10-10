import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiveBridge} from '../src/live-bridge.mjs';
import {createRevisionGuard} from '../src/live-client.mjs';
import * as api from '../src/index.mjs';
import {request as httpRequest} from 'node:http';
import {Script} from 'node:vm';

async function fixture(t,options={}){
 const bridge=await createLiveBridge({execute:async(method,args)=>api[method](...args),...options});t.after(()=>bridge.close());
 const [port,token]=bridge.connection().pairingCode.split('.');
 const state={clientId:'test-browser-123',revision:0,project:api.createDiagram(api.exampleDiagram).project,busy:false,paused:false};
 const request=async(path,data=state,headers={})=>fetch(`http://127.0.0.1:${port}${path}`,{method:'POST',headers:{Origin:'https://filemigo.com',Authorization:'Bearer '+token,'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
 const sync=async(data=state)=>(await request('/sync',data)).json();
 assert.equal((await request('/connect')).status,200);return {bridge,state,request,sync,port};
}
test('live bridge rejects wrong origins, credentials, host names and competing tabs',async t=>{
 const {request,state,port}=await fixture(t);
 assert.equal((await request('/sync',state,{Origin:'https://evil.example'})).status,403);
 assert.equal((await request('/sync',state,{Authorization:'Bearer wrong'})).status,401);
 const badHost=await new Promise(resolve=>{const req=httpRequest({hostname:'127.0.0.1',port,path:'/sync',method:'POST',headers:{Host:'evil.example',Origin:'https://filemigo.com'}},res=>{res.resume();resolve(res.statusCode);});req.end();});assert.equal(badHost,403);
 assert.equal((await request('/connect',{...state,clientId:'second-browser'})).status,409);
 assert.equal((await request('/sync',{...state,clientId:'second-browser'})).status,409);
});
test('AI patch applies atomically only after browser ack, then stale writes fail',async t=>{
 const {bridge,state,sync}=await fixture(t);let p=state.project;const guard=createRevisionGuard({read:()=>p,apply:next=>{p=next;return true;},busy:()=>false});
 const changed=bridge.change({expectedRevision:0,method:'updateDiagram',argument:{nodes:[{id:'n1',x:1000}]}});
 await new Promise(r=>setImmediate(r));const command=(await sync()).command;assert.ok(command);
 const ack=guard.accept(command);assert.equal(ack.status,'applied');await sync({...state,...guard.capture(),ack});
 const result=await changed;assert.equal(result.revision,1);assert.equal(result.comparison.unchanged,true);assert.equal(bridge.read().project.nodes[0].x,1000);
 await assert.rejects(bridge.change({expectedRevision:0,method:'updateDiagram',argument:{title:'stale'}}),/Revision conflict/);
});
test('manual edit wins a race after command delivery; user change is not overwritten',async t=>{
 const {bridge,state,sync}=await fixture(t);let p=structuredClone(state.project);const guard=createRevisionGuard({read:()=>p,apply:next=>{p=next;return true;},busy:()=>false});
 const changed=bridge.change({expectedRevision:0,method:'updateDiagram',argument:{nodes:[{id:'n1',x:1000}]}});const rejected=assert.rejects(changed,/rejected/);
 await new Promise(r=>setImmediate(r));const command=(await sync()).command;p.nodes[0].text='My manual edit';
 const ack=guard.accept(command);assert.equal(ack.status,'rejected');await sync({...state,...guard.capture(),ack});await rejected;assert.equal(p.nodes[0].text,'My manual edit');
});
test('semantic gate, dangling edges and sequence preservation',async t=>{
 const {bridge,state,request}=await fixture(t);
 await assert.rejects(bridge.change({expectedRevision:0,method:'updateDiagram',argument:{edges:[{id:state.project.edges[0].id,to:state.project.nodes.at(-1).id}]}}),/Semantic change/);
 await assert.rejects(bridge.change({expectedRevision:0,method:'updateDiagram',argument:{removeNodes:['n1']},allowSemanticChanges:true}));
 state.project=api.getTemplate('login-sequence').project;state.revision++;await request('/sync');
 const arranged=api.arrangeDiagram(state.project,{direction:'TB'});assert.equal(arranged.comparison.unchanged,true);assert.deepEqual(arranged.project.fragments,state.project.fragments);
});
test('pause, busy, disconnect and timeout fail without false success',async t=>{
 const {bridge,state,request}=await fixture(t,{timeoutMs:50});
 for(const key of ['paused','busy']){state[key]=true;await request('/sync');await assert.rejects(bridge.change({expectedRevision:0,method:'arrangeDiagram',argument:{direction:'LR'}}),/paused|edited/);state[key]=false;await request('/sync');}
 await assert.rejects(bridge.change({expectedRevision:0,method:'arrangeDiagram',argument:{direction:'LR'}}),/acknowledgement/);
 await request('/disconnect');assert.throws(()=>bridge.read(),/disconnected/);
});
test('browser guard rejects busy and expired commands; undo creates a new revision',()=>{
 let p={title:'before'},busy=true;const guard=createRevisionGuard({read:()=>p,apply:n=>{p=n;return true;},busy:()=>busy});
 const command={id:'1',expectedRevision:0,project:{title:'after'},expiresAt:Date.now()+10000};
 assert.equal(guard.accept(command).status,'rejected');busy=false;assert.equal(guard.accept({...command,expiresAt:0}).status,'rejected');
 assert.equal(guard.accept(command).revision,1);p={title:'before'};assert.equal(guard.capture().revision,2);assert.equal(guard.accept(command).status,'rejected');
});
test('AI cannot move, rename or remove a locked object',async t=>{
 const {bridge,state,request}=await fixture(t);state.project.nodes[0].locked=true;state.revision++;await request('/sync');
 await assert.rejects(bridge.change({expectedRevision:1,method:'updateDiagram',argument:{nodes:[{id:state.project.nodes[0].id,x:900}]} }),/Locked object/);
});
test('revision changed while worker calculates rejects the completed result',async t=>{
 let finish;const calculated=new Promise(resolve=>{finish=resolve;});
 const {bridge,state,request}=await fixture(t,{execute:async(method,args)=>{await calculated;return api[method](...args);}});
 const pending=bridge.change({expectedRevision:0,method:'updateDiagram',argument:{nodes:[{id:'n1',x:900}]}});const rejected=assert.rejects(pending,/changed during calculation/);
 state.project.title='Human edit';state.revision++;await request('/sync');finish();await rejected;assert.equal(bridge.read().project.title,'Human edit');
});
test('local relay serves no credentials and still authenticates local-origin operations',async t=>{
 const {bridge,port,request,state}=await fixture(t);const origin=`http://127.0.0.1:${port}`;
 const response=await fetch(origin+'/bridge');assert.equal(response.status,200);assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 const html=await response.text(),script=await (await fetch(origin+'/relay.js')).text();assert.doesNotThrow(()=>new Script(script));
 assert.ok(!html.includes(bridge.connection().pairingCode));assert.ok(!script.includes(bridge.connection().pairingCode));
 assert.equal((await request('/sync',state,{Origin:origin,Authorization:'Bearer invalid'})).status,401);
 await request('/disconnect');assert.equal((await request('/connect',state,{Origin:origin})).status,200);
});
