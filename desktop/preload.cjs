const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('filemigoDesktop',Object.freeze({
 info:()=>ipcRenderer.invoke('desktop:info'),
 open:()=>ipcRenderer.invoke('desktop:open'),
 save:(project,saveAs=false)=>ipcRenderer.invoke('desktop:save',{project,saveAs}),
 sync:state=>ipcRenderer.invoke('desktop:sync',state),
 enable:value=>ipcRenderer.invoke('desktop:enable',value),
 setDirty:value=>ipcRenderer.send('desktop:dirty',value),
 onAction:callback=>{const listener=(_event,action)=>callback(action);ipcRenderer.on('desktop:action',listener);return ()=>ipcRenderer.removeListener('desktop:action',listener);}
}));
