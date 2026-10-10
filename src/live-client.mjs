// Transport-independent revision guard, shared with regression tests.
export function createRevisionGuard({read,apply,busy}){
 let revision=0,last=JSON.stringify(read());
 function capture(){const project=read(),json=JSON.stringify(project);if(json!==last){revision++;last=json;}return {revision,project:structuredClone(project),busy:!!busy()};}
 return {capture,accept(command){
  const current=capture();
  if(current.busy||current.revision!==command.expectedRevision||Date.now()>=command.expiresAt)return {id:command.id,status:'rejected',error:'revision conflict, editing in progress, or expired command'};
  try{if(!apply(command.project))throw Error('Validation failed');const next=capture();if(next.revision===current.revision){revision++;last=JSON.stringify(read());}return {id:command.id,status:'applied',revision};}
  catch(error){return {id:command.id,status:'rejected',error:error.message};}
 }};
}
