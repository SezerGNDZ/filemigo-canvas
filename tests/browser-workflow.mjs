// Optional Windows Edge integration check: node tests/browser-workflow.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createDiagram,exampleDiagram} from '../src/index.mjs';
import {makeNode} from '../src/core/canvas-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),web=path.join(root,'desktop/web'),out=path.join(root,'out/qa');
await fs.mkdir(out,{recursive:true});
const project=createDiagram(exampleDiagram).project;project.title='Filemigo / Workflow Intelligence';project.description='Siparişin doğrulanması, stok kararı ve müşteriye sonuç iletimi.';
project.nodes[0].role='start';project.nodes[0].owner='Operasyon';project.nodes[0].purpose='İsteği doğrula';project.nodes[0].input='Sipariş formu';project.nodes[0].output='Doğrulanmış sipariş';
project.nodes[1].role='decision';project.nodes[2].role=project.nodes[3].role='end';
project.nodes.push({...makeNode('text','heading',80,-90),text:'SİPARİŞ / ONAY AKIŞI',w:650,fontSize:30});
project.edges[1].kind=project.edges[2].kind='condition';project.edges[1].branch='yes';project.edges[2].branch='no';
project.nodes[0].text='Siparişi al';project.nodes[1].text='Stok var mı?';project.nodes[2].text='Siparişi onayla';project.nodes[3].text='Müşteriyi bilgilendir';project.edges[1].label='Evet';project.edges[2].label='Hayır';
const server=http.createServer(async(req,res)=>{try{
 if(req.url==='/qa-project.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(project));return;}
 let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname.endsWith('/'))pathname+='index.html';
 const file=path.resolve(web,'.'+pathname);if(!file.startsWith(web+path.sep)){res.writeHead(403);res.end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'filemigo-ui-'));
const edge=spawn(process.env.EDGE_BIN||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;const errors=[];edge.on('error',e=>errors.push(e.message));
try{
 let port;for(let i=0;i<100;i++){try{port=Number((await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await new Promise(r=>setTimeout(r,100));}}
 assert.ok(port,'Edge did not start: '+errors.join());
 const targets=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json(),target=targets.find(t=>t.type==='page');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 let sequence=0;const pending=new Map();
 ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},10000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1100,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/tr/canvas/'});
 for(let i=0;i<100;i++){if(await run("!!document.querySelector('#canvas-workflow-review')"))break;await new Promise(r=>setTimeout(r,100));}
 assert.ok(await run("!!document.querySelector('#canvas-workflow-review')"),'Workflow button missing: '+errors.join('\n'));
 await run(`(async()=>{const data=await (await fetch('/qa-project.json')).text(),dt=new DataTransfer();dt.items.add(new File([data],'demo.json',{type:'application/json'}));const input=document.querySelector('#canvas-file');input.files=dt.files;await input.onchange({target:input});})()`);
 assert.equal(await run("document.querySelector('#canvas-title').value"),project.title);
 await run("document.querySelector('[data-theme=midnight]').click()");
 assert.equal(await run("document.querySelector('#canvas-background').value"),'#0b1222');
 await run("document.querySelector('#canvas-undo').click()");assert.equal(await run("document.querySelector('#canvas-background').value"),'#ffffff');
 await run("document.querySelector('#canvas-redo').click()");assert.equal(await run("document.querySelector('#canvas-background').value"),'#0b1222');
 await run("document.querySelector('#canvas-workflow-review').click()");
 assert.equal(await run("document.querySelector('.workflow-dialog').open"),true);
 assert.equal(await run("document.querySelectorAll('.workflow-trace li').length"),2);
 assert.equal(await run("document.querySelectorAll('[data-choice]').length"),2);
 await run("document.querySelectorAll('[data-choice]')[0].click()");
 assert.equal(await run("document.querySelectorAll('.workflow-trace li').length"),3);
 assert.match(await run("document.querySelector('.workflow-state').textContent"),/bitişe/);
 await fs.writeFile(path.join(out,'workflow-review.png'),Buffer.from((await cdp('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await run("document.querySelector('[data-close]').click()");
 await run("document.querySelector('[data-node=n1]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))");
 assert.equal(await run("document.querySelector('[data-semantic=owner]').value"),'Operasyon');
 await run("(()=>{const el=document.querySelector('[data-semantic=owner]');el.value='Görev kontrolü';el.dispatchEvent(new Event('change',{bubbles:true}));})()");
 assert.equal(await run("document.querySelector('[data-semantic=owner]').value"),'Görev kontrolü');
 await run("document.querySelector('#canvas-undo').click()");
 await run("document.querySelector('[data-node=n1]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))");
 assert.equal(await run("document.querySelector('[data-semantic=owner]').value"),'Operasyon');
 await fs.writeFile(path.join(out,'workflow-editor.png'),Buffer.from((await cdp('Page.captureScreenshot',{format:'png'})).data,'base64'));
 // Verify that the recovery draft preserves semantic fields.
 await new Promise(r=>setTimeout(r,900));
 const draft=await run("JSON.parse(localStorage.getItem('filemigo-canvas-draft-v1'))");
 assert.equal(draft.project.nodes.find(n=>n.id==='n1').owner,'Operasyon');assert.equal(draft.project.nodes.find(n=>n.id==='heading').role,'annotation');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:['import','themes','theme undo/redo','analysis','branch walk','metadata edit','metadata undo','draft persistence','no runtime errors'],screenshots:out}));
 await cdp('Browser.close').catch(()=>{});
}finally{ws?.close();edge.kill();await new Promise(r=>server.close(r));}
