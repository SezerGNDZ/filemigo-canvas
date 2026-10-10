import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {randomBytes} from 'node:crypto';
import {createDesktopSession} from '../src/desktop-session.mjs';
import {createDesktopClient,startDesktopTransport} from '../src/desktop-transport.mjs';
import {createRevisionGuard} from '../src/live-client.mjs';
import * as api from '../src/index.mjs';
const execute=async(method,args)=>api[method](...args);
test('new MCP client refuses writes to an older desktop before sending a change',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'filemigo-legacy-test-')),sessionFile=path.join(dir,'session.json'),token=randomBytes(32).toString('hex'),id=randomBytes(16).toString('hex');
 const endpoint=process.platform==='win32'?'\\\\.\\pipe\\filemigo-'+id:path.join(os.tmpdir(),'filemigo-'+id+'.sock');let changes=0;
 const server=net.createServer(socket=>{let text='';socket.on('data',chunk=>{text+=chunk;if(!text.includes('\n'))return;const message=JSON.parse(text.trim());if(message.method==='change')changes++;socket.end(JSON.stringify({value:{connected:true,desktop:true,revision:1}})+'\n');});});
 await new Promise(r=>server.listen(endpoint,r));
 t.after(async()=>{await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});});
 await fs.writeFile(sessionFile,JSON.stringify({version:1,endpoint,token}));const client=await createDesktopClient({sessionFile});
 await assert.rejects(client.change({expectedRevision:1,method:'updateDiagram',argument:{description:'test'}}),/Update Filemigo Desktop/);assert.equal(changes,0);
});
function fixture(){let project=api.createDiagram(api.exampleDiagram).project;let busy=false;const guard=createRevisionGuard({read:()=>project,apply:p=>{project=p;return true;},busy:()=>busy});const session=createDesktopSession({execute});const sync=(ack)=>session.sync({...guard.capture(),paused:false,ack});sync();return {session,guard,sync,edit:()=>{project.title+=' manual';},lock:()=>{project.nodes[0].locked=true;},busy:v=>busy=v};}
test('desktop is off by default and revokes pending writes when disabled',async()=>{const f=fixture();assert.throws(()=>f.session.read(),/Enable AI/);f.session.enable(true);const promise=f.session.change({expectedRevision:0,method:'arrangeDiagram',argument:{direction:'LR'}});await new Promise(r=>setImmediate(r));f.session.enable(false);await assert.rejects(promise,/disconnected/);f.session.close();});
test('desktop writes require real renderer acknowledgement and preserve undo boundary',async()=>{const f=fixture();f.session.enable(true);let done=false;const promise=f.session.change({expectedRevision:0,method:'arrangeDiagram',argument:{direction:'TB'}}).then(r=>{done=true;return r;});await new Promise(r=>setImmediate(r));assert.equal(done,false);const response=f.sync();const ack=f.guard.accept(response.command);f.sync(ack);const result=await promise;assert.equal(result.applied,true);assert.equal(result.revision,1);assert.equal(result.comparison.unchanged,true);f.session.close();});
test('manual changes, locked objects and semantic gates reject stale or unsafe desktop edits',async()=>{const f=fixture();f.session.enable(true);f.edit();f.sync();await assert.rejects(f.session.change({expectedRevision:0,method:'arrangeDiagram',argument:{direction:'LR'}}),/Revision conflict/);const state=f.session.read();await assert.rejects(f.session.change({expectedRevision:state.revision,method:'updateDiagram',argument:{nodes:[{id:state.project.nodes[0].id,text:'changed'}]}}),/Semantic/);f.lock();f.sync();const s=f.session.read();await assert.rejects(f.session.change({expectedRevision:s.revision,method:'updateDiagram',allowSemanticChanges:true,argument:{nodes:[{id:s.project.nodes[0].id,text:'changed'}]}}),/Locked/);f.session.close();});
test('local desktop pipe authenticates and is removed on exit',async t=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'filemigo-desktop-test-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const sessionFile=path.join(dir,'session.json'),f=fixture();const transport=await startDesktopTransport({session:f.session,sessionFile});t.after(()=>transport.close());const client=await createDesktopClient({sessionFile});await assert.rejects(client.read(),/Enable AI/);f.session.enable(true);assert.equal((await client.connection()).desktop,true);assert.equal((await client.read()).revision,0);const saved=await fs.readFile(sessionFile,'utf8');await fs.writeFile(sessionFile,JSON.stringify({...JSON.parse(saved),token:'a'.repeat(64)}));await assert.rejects(client.read(),/authentication/);await fs.writeFile(sessionFile,saved);});

test('desktop theme patches are acknowledged while semantic metadata requires authorization',async()=>{const f=fixture();f.session.enable(true);const state=f.session.read();await assert.rejects(f.session.change({expectedRevision:state.revision,method:'updateDiagram',argument:{nodes:[{id:'n1',owner:'Operations'}]}}),/Semantic/);const styled=api.styleDiagram(state.project,{theme:'midnight'});const promise=f.session.change({expectedRevision:state.revision,method:'updateDiagram',argument:styled.patch});await new Promise(r=>setImmediate(r));const command=f.sync().command;assert.equal(command.project.background,'#0B1222');const ack=f.guard.accept(command);f.sync(ack);assert.equal((await promise).applied,true);assert.equal(f.session.read().project.background,'#0B1222');f.session.close();});
