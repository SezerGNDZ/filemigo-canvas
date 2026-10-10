import net from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomBytes,timingSafeEqual} from 'node:crypto';

const MAX=2200000;
export function defaultDesktopSessionFile(){return process.env.FILEMIGO_DESKTOP_SESSION||path.join(process.platform==='win32'?process.env.APPDATA||path.join(os.homedir(),'AppData','Roaming'):process.platform==='darwin'?path.join(os.homedir(),'Library','Application Support'):process.env.XDG_CONFIG_HOME||path.join(os.homedir(),'.config'),'FilemigoDesktop','mcp-session.json');}
export async function startDesktopTransport({session,sessionFile}){
 const token=randomBytes(32).toString('hex'),id=randomBytes(16).toString('hex');
 const endpoint=process.platform==='win32'?'\\\\.\\pipe\\filemigo-'+id:path.join(os.tmpdir(),'filemigo-'+id+'.sock');
 const sockets=new Set();
 const server=net.createServer(socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));socket.on('error',()=>{});socket.setTimeout(20000,()=>socket.destroy());let body='',handled=false;socket.on('data',chunk=>{if(handled)return;body+=chunk.toString('utf8');if(Buffer.byteLength(body)>MAX){socket.destroy();return;}if(!body.includes('\n'))return;handled=true;(async()=>{
  try{const data=JSON.parse(body.slice(0,body.indexOf('\n'))),a=Buffer.from(String(data.token||'')),b=Buffer.from(token);if(a.length!==b.length||!timingSafeEqual(a,b))throw Error('Desktop authentication failed.');
   let value;if(data.method==='read')value=session.read();else if(data.method==='change')value=await session.change(data.argument);else if(data.method==='status'){const s=session.read();value={connected:true,revision:s.revision,desktop:true,instructions:'The open Filemigo Desktop canvas is connected. Read before every edit. Edits require desktop acknowledgement and can be undone. Files are saved only by the user.'};}else throw Error('Unsupported desktop request.');
   socket.end(JSON.stringify({value})+'\n');
  }catch(e){socket.end(JSON.stringify({error:e.message})+'\n');}
 })();});});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(endpoint,resolve);});
 if(process.platform!=='win32')await fs.chmod(endpoint,0o600);
 await fs.mkdir(path.dirname(sessionFile),{recursive:true});await fs.writeFile(sessionFile,JSON.stringify({version:1,endpoint,token}),{mode:0o600});
 return {async close(){session.close();for(const socket of sockets)socket.destroy();await new Promise(resolve=>server.close(resolve));try{const saved=JSON.parse(await fs.readFile(sessionFile,'utf8'));if(saved.token===token)await fs.unlink(sessionFile);}catch{}if(process.platform!=='win32')await fs.unlink(endpoint).catch(()=>{});}};
}
export async function createDesktopClient({sessionFile=defaultDesktopSessionFile()}={}){
 async function request(method,argument){let saved;try{saved=JSON.parse(await fs.readFile(sessionFile,'utf8'));}catch{throw Error('Open Filemigo Desktop and enable AI. No active desktop session was found.');}
  if(saved.version!==1||typeof saved.endpoint!=='string'||!(/^[a-f0-9]{64}$/.test(saved.token)))throw Error('Invalid desktop session. Restart Filemigo Desktop.');
  if(process.platform==='win32'?!/^\\\\\.\\pipe\\filemigo-[a-f0-9]{32}$/.test(saved.endpoint):!saved.endpoint.startsWith(path.join(os.tmpdir(),'filemigo-')))throw Error('Invalid local desktop endpoint.');
  return new Promise((resolve,reject)=>{const socket=net.createConnection(saved.endpoint);let body='';socket.setTimeout(18000,()=>socket.destroy(Error('Desktop timed out. Read the canvas before retrying.')));socket.on('error',()=>reject(Error('Desktop disconnected or timed out. Open it, enable AI, and read the canvas again.')));socket.on('connect',()=>socket.write(JSON.stringify({token:saved.token,method,argument})+'\n'));socket.on('data',chunk=>{body+=chunk.toString('utf8');if(Buffer.byteLength(body)>MAX)socket.destroy(Error('Oversized desktop response'));});socket.on('end',()=>{try{const result=JSON.parse(body);result.error?reject(Error(result.error)):resolve(result.value);}catch{reject(Error('Invalid desktop response'));}});});
 }
 return {connection:()=>request('status'),read:()=>request('read'),change:argument=>request('change',argument),close:async()=>{}};
}
