// A user-opened local window relays messages without public-to-loopback fetches.
export const relayHtml=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Filemigo local bridge</title><link rel="icon" href="data:,"><link rel="stylesheet" href="/relay.css"><body><p class="eyebrow">ON YOUR COMPUTER</p><h1>Filemigo · Live MCP</h1><p id="status" role="status">Waiting for your canvas…</p><p>Keep this window open while drawing. Closing it disconnects live editing. Return to your Filemigo canvas to continue.</p><button id="disconnect">Disconnect</button><script src="/relay.js" defer></script></body></html>`;
export const relayCss='body{font:14px/1.6 system-ui,sans-serif;background:#fff8fb;color:#503045;max-width:560px;margin:32px auto;padding:0 24px}h1{font-size:24px;letter-spacing:-.8px}.eyebrow{font-size:10px;letter-spacing:2px;color:#a04470}#status{padding:12px;border:1px solid #e1c5d4;border-radius:8px;background:white}button{background:#914468;border:0;border-radius:8px;padding:10px 20px;color:white;font:inherit;cursor:pointer}button:focus-visible{outline:3px solid #3b8260;outline-offset:3px}';
export function relayScript(origins){return `
const allowed=new Set(${JSON.stringify([...origins])});
let parentOrigin=null,stopped=false,clientId=null,token=null;
const parent=window.opener;
const status=document.querySelector('#status');
const tell=(id,body)=>parent?.postMessage({type:'filemigo-relay-result',id,...body},parentOrigin);
window.addEventListener('message',async event=>{
 if(stopped||event.source!==parent||!allowed.has(event.origin)||event.data?.type!=='filemigo-relay-request')return;
 if(parentOrigin&&parentOrigin!==event.origin)return;parentOrigin=event.origin;
 const {id,path,body,token:secret}=event.data;
 if(typeof id!=='string'||!['/connect','/sync','/disconnect'].includes(path)||typeof secret!=='string'||!/^[a-f0-9]{64}$/.test(secret))return;
 try{
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+secret},body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Connection rejected');
  if(path==='/connect'){clientId=body.clientId;token=secret;status.textContent='Connected to '+event.origin+'. Return to your canvas.';}
  if(path==='/disconnect'){status.textContent='Disconnected. You can close this window.';token=null;clientId=null;}
  tell(id,{data});
 }catch(error){tell(id,{error:error.message});}
});
document.querySelector('#disconnect').onclick=()=>{if(token&&clientId)fetch('/disconnect',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({clientId}),keepalive:true}).catch(()=>{});stopped=true;token=null;status.textContent='Disconnected. You can close this window.';};
if(parent)parent.postMessage({type:'filemigo-relay-ready'},'*');
else status.textContent='Open this connection window using Live MCP in your Filemigo canvas.';
`;}
