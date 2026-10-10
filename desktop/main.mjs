import {app,BrowserWindow,protocol,ipcMain,dialog,Menu,shell,session} from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Worker} from 'node:worker_threads';
import {createDesktopSession} from '../src/desktop-session.mjs';
import {startDesktopTransport} from '../src/desktop-transport.mjs';
import {validateCanvas} from '../src/core/canvas-core.mjs';

app.setName('FilemigoDesktop');
const root=path.dirname(fileURLToPath(import.meta.url)),web=path.join(root,'web');
if(!app.requestSingleInstanceLock()){app.quit();}else{startDesktop().catch(error=>{console.error(error);app.exit(1);});}
async function startDesktop(){
 protocol.registerSchemesAsPrivileged([{scheme:'filemigo',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
 let window,transport,dirty=false,closing=false,currentFile=null,lastDisk=null,fileBusy=false;
 const run=(method,args)=>new Promise((resolve,reject)=>{const worker=new Worker(new URL('../src/worker.mjs',import.meta.url),{workerData:{method,args},resourceLimits:{maxOldGenerationSizeMb:128}});const timer=setTimeout(()=>{worker.terminate();reject(Error('Diagram operation timed out.'));},10000);worker.once('message',m=>{clearTimeout(timer);worker.terminate();m.error?reject(Error(m.error)):resolve(m.value);});worker.once('error',e=>{clearTimeout(timer);reject(e);});});
 const canvas=createDesktopSession({execute:run});
 function trusted(event){if(!window||event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame||!event.senderFrame.url.startsWith('filemigo://app/'))throw Error('Untrusted renderer.');}
 function handle(name,fn){ipcMain.handle('desktop:'+name,(event,arg)=>{trusted(event);return fn(arg);});}
 function action(name){window?.webContents.send('desktop:action',name);}
 const fileFilters=[{name:'Filemigo project',extensions:['json']}];
 handle('info',()=>({version:app.getVersion(),platform:process.platform,config:{mcpServers:{filemigo:{command:process.execPath,args:[path.join(root,'..','src','mcp.mjs')],env:{ELECTRON_RUN_AS_NODE:'1',FILEMIGO_DESKTOP_SESSION:path.join(app.getPath('userData'),'mcp-session.json')}}}}}));
 handle('enable',value=>canvas.enable(value));handle('sync',state=>canvas.sync(state));
 ipcMain.on('desktop:dirty',(event,value)=>{trusted(event);dirty=value===true;window?.setDocumentEdited(dirty);});
 handle('open',async()=>{if(fileBusy)return {cancelled:true};fileBusy=true;try{const choice=await dialog.showOpenDialog(window,{title:'Open Filemigo project',properties:['openFile'],filters:fileFilters});if(choice.canceled)return {cancelled:true};const file=choice.filePaths[0],stat=await fs.stat(file);if(stat.size>12000000)throw Error('Project exceeds 12 MB.');const text=await fs.readFile(file,'utf8'),project=validateCanvas(JSON.parse(text));currentFile=file;lastDisk=text;return {project,path:file};}finally{fileBusy=false;}});
 handle('save',async({project,saveAs})=>{if(fileBusy)return {cancelled:true};fileBusy=true;let temp;try{const clean=validateCanvas(project),text=JSON.stringify(clean,null,2);if(text.length>12000000)throw Error('Project exceeds 12 MB.');let target=saveAs?null:currentFile;if(!target){const result=await dialog.showSaveDialog(window,{title:'Save Filemigo project',defaultPath:currentFile||'Untitled.canvas.json',filters:fileFilters});if(result.canceled)return {cancelled:true};target=result.filePath;}
  if(target===currentFile&&lastDisk!==null){const disk=await fs.readFile(target,'utf8').catch(()=>null);if(disk!==lastDisk){const result=await dialog.showMessageBox(window,{type:'warning',message:'This file changed outside Filemigo.',detail:'Choose Save As to keep both versions.',buttons:['Cancel','Save As'],defaultId:1,cancelId:0});if(result.response===0)return {cancelled:true};const save=await dialog.showSaveDialog(window,{defaultPath:target,filters:fileFilters});if(save.canceled)return {cancelled:true};target=save.filePath;}}
  temp=target+'.'+process.pid+'.tmp';await fs.writeFile(temp,text,{flag:'wx'});await fs.rename(temp,target);temp=null;currentFile=target;lastDisk=text;return {saved:true,path:target};
 }finally{if(temp)await fs.unlink(temp).catch(()=>{});fileBusy=false;}});
 app.on('second-instance',()=>{if(window?.isMinimized())window.restore();window?.focus();});
 await app.whenReady();
 protocol.handle('filemigo',async request=>{const url=new URL(request.url);if(url.host!=='app')return new Response('Forbidden',{status:403});let relative;try{relative=decodeURIComponent(url.pathname);}catch{return new Response('Bad path',{status:400});}if(relative.endsWith('/'))relative+='index.html';const file=path.resolve(web,'.'+relative);if(!file.startsWith(web+path.sep))return new Response('Forbidden',{status:403});try{return new Response(await fs.readFile(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'}});}catch{return new Response('Not found',{status:404});}});
 session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));session.defaultSession.setPermissionCheckHandler(()=>false);
 session.defaultSession.webRequest.onBeforeRequest((details,callback)=>{callback({cancel:!['filemigo:','blob:','data:','devtools:'].some(prefix=>details.url.startsWith(prefix))});});
 window=new BrowserWindow({width:1440,height:950,minWidth:1000,minHeight:680,title:'Filemigo Desktop',icon:path.join(web,'filemigo-icon.png'),backgroundColor:'#fcfaf9',show:false,webPreferences:{preload:path.join(root,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true,backgroundThrottling:false}});
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',(event,url)=>{const target=new URL(url);if(target.protocol!=='filemigo:'||target.host!=='app'||!['/tr/canvas/','/canvas/'].includes(target.pathname))event.preventDefault();});
 window.webContents.on('did-start-navigation',(_e,_url,isInPlace,isMainFrame)=>{if(isMainFrame&&!isInPlace)canvas.reset();});
 window.webContents.on('will-prevent-unload',event=>event.preventDefault());
 window.on('close',event=>{if(closing)return;event.preventDefault();(async()=>{if(dirty){const result=await dialog.showMessageBox(window,{type:'question',message:'Kaydedilmemiş değişikliklerin var.',detail:'Dosyaya kaydetmek için geri dön. Yerel kurtarma taslağı ayrıca korunur.',buttons:['Tuvale dön','Kaydetmeden kapat'],defaultId:0,cancelId:0});if(result.response!==1)return;}closing=true;await transport?.close();window.destroy();app.quit();})();});
 session.defaultSession.on('will-download',(_event,item)=>{item.setSaveDialogOptions({title:'Export drawing',defaultPath:path.join(app.getPath('downloads'),path.basename(item.getFilename()))});});
 const help=()=>shell.openExternal('https://github.com/latecafe-tech/filemigo-canvas/blob/main/docs/desktop.md');
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Dosya',submenu:[{label:'Aç…',accelerator:'CmdOrCtrl+O',click:()=>action('open')},{label:'Kaydet',accelerator:'CmdOrCtrl+S',click:()=>action('save')},{label:'Farklı kaydet…',accelerator:'CmdOrCtrl+Shift+S',click:()=>action('saveAs')},{type:'separator'},{role:'quit',label:'Çıkış'}]},{label:'Düzenle',submenu:[{label:'Geri al',accelerator:'CmdOrCtrl+Z',click:()=>action('undo')},{label:'Yinele',accelerator:'CmdOrCtrl+Shift+Z',click:()=>action('redo')},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},{label:'Görünüm',submenu:[{role:'togglefullscreen',label:'Tam ekran'},{label:'Tuvale sığdır',click:()=>action('fit')}]},{label:'Yardım',submenu:[{label:'MCP kurulumu',click:()=>action('config')},{label:'Kullanım rehberi',click:help},{label:'Filemigo hakkında',click:()=>dialog.showMessageBox(window,{message:'Filemigo Desktop '+app.getVersion(),detail:'Late Cafe Games · Contributors: SezerGNDZ\nMIT · Offline canvas and local MCP.'})}]}]));
 transport=await startDesktopTransport({session:canvas,sessionFile:path.join(app.getPath('userData'),'mcp-session.json')});
 await window.loadURL('filemigo://app/tr/canvas/');window.show();
 app.on('window-all-closed',()=>app.quit());
}
