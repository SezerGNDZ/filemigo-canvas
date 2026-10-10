import {createServer} from 'node:http';
import {randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {validateCanvas} from './core/canvas-core.mjs';

const origins=new Set(['https://filemigo.com','https://www.filemigo.com','https://filemigo.sezergndz.chatgpt.site','http://localhost:4173','http://127.0.0.1:4173']);
const fail=message=>{throw Error(message);};
export async function createLiveBridge({execute,timeoutMs=15000}={}){
 const token=randomBytes(32).toString('hex');let session=null,pending=null,closed=false;
 const rejectPending=message=>{if(pending){clearTimeout(pending.timer);pending.reject(Error(message));pending=null;}};
 const fresh=()=>{if(!session||Date.now()-session.seen>10000)fail('Canvas disconnected or inactive. Reconnect, then read it again.');return session;};
 const snapshot=()=>{const s=fresh();return {clientId:s.clientId,revision:s.revision,project:structuredClone(s.project),busy:s.busy,paused:s.paused};};
 const server=createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const origin=req.headers.origin;
  if(req.headers.host!==`127.0.0.1:${server.address()?.port}`||!origins.has(origin)){res.writeHead(403);res.end();return;}
  res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','POST');res.setHeader('Access-Control-Allow-Headers','authorization,content-type');res.setHeader('Access-Control-Allow-Private-Network','true');res.writeHead(204);res.end();return;}
  const auth=Buffer.from(req.headers.authorization||''),expected=Buffer.from('Bearer '+token);
  if(auth.length!==expected.length||!timingSafeEqual(auth,expected)){res.writeHead(401);res.end();return;}
  if(req.method!=='POST'||!['/connect','/sync','/disconnect'].includes(req.url)||req.headers['content-type']!=='application/json'){res.writeHead(400);res.end();return;}
  const send=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  try{
   let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>2000000){send(413,{error:'Canvas exceeds live transfer limit (2 MB).'});return;}chunks.push(chunk);}
   const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(!data||typeof data.clientId!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(data.clientId))fail('Invalid client ID.');
   if(req.url==='/disconnect'){if(session?.clientId!==data.clientId||session.origin!==origin)fail('Canvas is not paired.');session=null;rejectPending('Canvas disconnected.');send(200,{ok:true});return;}
   if(!Number.isSafeInteger(data.revision)||data.revision<0||typeof data.busy!=='boolean'||typeof data.paused!=='boolean')fail('Invalid canvas state.');
   const project=validateCanvas(data.project),json=JSON.stringify(project);
   if(json.length>1000000)fail('Live canvas supports at most 1,000,000 characters.');
   if(req.url==='/connect'){
    if(session&&Date.now()-session.seen<30000)fail('Another canvas is already paired. Disconnect it first.');
    rejectPending('Canvas session changed.');session={clientId:data.clientId,origin,revision:data.revision,project,json,busy:data.busy,paused:data.paused,seen:Date.now()};send(200,{connected:true});return;
   }
   if(!session||session.clientId!==data.clientId||session.origin!==origin)fail('Canvas is not paired.');
   if(data.revision<session.revision||(data.revision===session.revision&&json!==session.json))fail('Non-monotonic canvas revision. Reconnect.');
   Object.assign(session,{revision:data.revision,project,json,busy:data.busy,paused:data.paused,seen:Date.now()});
   if(pending&&data.ack?.id===pending.id){
    const command=pending;pending=null;clearTimeout(command.timer);
    if(data.ack.status==='applied'&&data.ack.revision===command.expectedRevision+1&&data.revision>=data.ack.revision)command.resolve({applied:true,revision:data.ack.revision,currentRevision:data.revision,comparison:command.result.comparison,issues:command.result.issues});
    else command.reject(Error('Canvas rejected change: '+String(data.ack.error||'revision conflict').slice(0,200)));
   }
   if(pending&&(session.revision!==pending.expectedRevision||session.busy||session.paused))rejectPending('Canvas changed, is being edited, or is paused. Read the current revision before retrying.');
   send(200,{command:pending?{id:pending.id,expectedRevision:pending.expectedRevision,project:pending.result.project,expiresAt:pending.expiresAt}:null});
  }catch(error){send(409,{error:error.message});}
 });
 server.requestTimeout=5000;server.headersTimeout=5000;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const port=server.address().port;
 return {
  connection:()=>({pairingCode:`${port}.${token}`,canvasUrl:'https://filemigo.com/canvas/',instructions:'Open Live MCP in the canvas and paste pairingCode. Connecting shares this canvas with your MCP client and permits edits. Never put the code in a URL or commit it. Pair one tab only. Browser loopback permission may be required.'}),
  read:snapshot,
  async change({expectedRevision,method,argument,allowSemanticChanges=false,lang='en'}){
   if(closed)fail('Bridge closed.');if(pending)fail('Another AI change is awaiting acknowledgement.');
   const before=snapshot();if(before.busy||before.paused)fail('Canvas is paused or being edited.');
   if(before.revision!==expectedRevision)fail('Revision conflict. Read the canvas again; do not overwrite user changes.');
   const result=await execute(method,[before.project,argument,{lang}]);
   for(const node of before.project.nodes)if(node.locked&&JSON.stringify(node)!==JSON.stringify(result.project.nodes.find(n=>n.id===node.id)))fail('Locked object cannot be changed by AI. Unlock it in the canvas first.');
   if(!allowSemanticChanges&&!result.comparison.unchanged)fail('Semantic change rejected. Use allowSemanticChanges only for a user-requested change to text or relations.');
   const after=snapshot();if(after.clientId!==before.clientId||after.revision!==expectedRevision||after.busy||after.paused||pending)fail('Canvas changed during calculation. Read it again.');
   return new Promise((resolve,reject)=>{
    const id=randomUUID(),expiresAt=Date.now()+timeoutMs;
    const timer=setTimeout(()=>rejectPending('No browser acknowledgement. Outcome may be unknown; read the canvas before another edit.'),timeoutMs);
    pending={id,expectedRevision,result,expiresAt,resolve,reject,timer};
   });
  },
  async close(){closed=true;rejectPending('Live bridge stopped.');session=null;server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 };
}
