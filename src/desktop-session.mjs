import {randomUUID} from 'node:crypto';
import {validateCanvas} from './core/canvas-core.mjs';

// The renderer owns the document. A write succeeds only after its revision guard acknowledges it.
export function createDesktopSession({execute,timeoutMs=12000,now=Date.now}={}){
 let state=null,pending=null,enabled=false,closed=false;
 const reject=message=>{if(pending){clearTimeout(pending.timer);pending.reject(Error(message));pending=null;}};
 function read(){if(closed||!enabled)throw Error('Enable AI in Filemigo Desktop first.');if(!state||now()-state.seen>5000)throw Error('Desktop canvas is not responding.');return structuredClone({revision:state.revision,project:state.project,busy:state.busy,paused:state.paused});}
 return {
  enable(value){enabled=value===true;if(!enabled)reject('Desktop AI disconnected.');return {enabled};},
  read,
  sync(input){
   if(closed)throw Error('Desktop session closed.');
   if(!Number.isSafeInteger(input.revision)||input.revision<0||typeof input.busy!=='boolean'||typeof input.paused!=='boolean')throw Error('Invalid desktop state.');
   const project=validateCanvas(input.project),json=JSON.stringify(project);
   if(json.length>1000000)throw Error('Live canvas limit is 1,000,000 characters.');
   if(state&&(input.revision<state.revision||(input.revision===state.revision&&json!==state.json)))throw Error('Non-monotonic desktop revision.');
   state={revision:input.revision,project,json,busy:input.busy,paused:input.paused,seen:now()};
   if(pending&&input.ack?.id===pending.id){const command=pending;pending=null;clearTimeout(command.timer);if(input.ack.status==='applied'&&input.ack.revision===command.expectedRevision+1&&state.revision>=input.ack.revision)command.resolve({applied:true,revision:input.ack.revision,currentRevision:state.revision,comparison:command.result.comparison,issues:command.result.issues});else command.reject(Error('Desktop rejected change: '+String(input.ack.error||'revision conflict').slice(0,200)));}
   if(pending&&(state.revision!==pending.expectedRevision||state.busy||state.paused))reject('Canvas changed, paused or is being edited. Read the latest revision.');
   return {enabled,command:enabled&&pending?{id:pending.id,expectedRevision:pending.expectedRevision,project:pending.result.project,expiresAt:pending.expiresAt}:null};
  },
  async change({expectedRevision,method,argument,allowSemanticChanges=false,lang='en'}){
   if(!['updateDiagram','arrangeDiagram'].includes(method))throw Error('Unsupported desktop operation.');
   if(pending)throw Error('Another edit is awaiting desktop acknowledgement.');
   const before=read();if(before.busy||before.paused)throw Error('Canvas is paused or being edited.');if(before.revision!==expectedRevision)throw Error('Revision conflict. Read the canvas again.');
   const result=await execute(method,[before.project,argument,{lang}]);
   for(const node of before.project.nodes)if(node.locked&&JSON.stringify(node)!==JSON.stringify(result.project.nodes.find(n=>n.id===node.id)))throw Error('Locked object cannot be changed by AI.');
   if(!allowSemanticChanges&&!result.comparison.unchanged)throw Error('Semantic change rejected. Set allowSemanticChanges only for the user-requested text or relation change.');
   const after=read();if(after.revision!==expectedRevision||after.busy||after.paused||pending)throw Error('Canvas changed during calculation. Read again.');
   return new Promise((resolve,rejectPromise)=>{const id=randomUUID(),expiresAt=now()+timeoutMs;pending={id,expiresAt,expectedRevision,result,resolve,reject:rejectPromise,timer:setTimeout(()=>reject('Desktop acknowledgement timed out. Read before retrying; outcome may be unknown.'),timeoutMs)};});
  },
  reset(){reject('Document reloaded.');state=null;enabled=false;},
  close(){closed=true;enabled=false;reject('Desktop closed.');state=null;}
 };
}
