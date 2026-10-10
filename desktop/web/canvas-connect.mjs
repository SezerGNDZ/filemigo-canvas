import {makeNode,validateCanvas,nodeTypes} from './canvas-core.mjs';

export const connectedTypes=nodeTypes.filter(t=>t!=='image');
// One immutable transaction: cancelling the chooser cannot leave a dangling edge.
export function connectedShape(input,{from,fromPort='auto',type,at,nodeId,edgeId,routing='orthogonal',snap=false,lang='en'}){
 const p=structuredClone(input),source=p.nodes.find(n=>n.id===from),sequence=p.diagram==='sequence';
 if(!source||!connectedTypes.includes(type)||sequence&&(!source.lifeline||!['rect','actor'].includes(type)))throw Error('sequence-connect');
 if(p.nodes.length>=150||p.edges.length>=200)throw Error('connection-limit');
 const n=makeNode(type,nodeId),round=v=>snap?Math.round(v/20)*20:v;
 n.text=lang==='tr'?(type==='card'?'Sınıf\n+ özellik: String\n+ yöntem()':type==='text'?'Metnini yaz':type==='actor'?'Kullanıcı':'Yeni fikir'):n.text;
 const dx=at.x-source.x-source.w/2,dy=at.y-source.y-source.h/2;
 const side=Math.abs(dx)>=Math.abs(dy)?dx>=0?'left':'right':dy>=0?'top':'bottom';
 n.x=round(at.x-(side==='right'?n.w:side==='left'?0:n.w/2));n.y=round(at.y-(side==='bottom'?n.h:side==='top'?0:n.h/2));
 const edge={id:edgeId,from,to:nodeId,label:'',color:source.stroke==='none'?'#b84970':source.stroke,dashed:false,start:'none',end:'arrow',routing,fromPort,toPort:'auto'};
 if(sequence){
  const participants=p.nodes.filter(n=>n.lifeline);n.lifeline=true;n.text=lang==='tr'?(type==='actor'?'Kullanıcı':'Katılımcı'):(type==='actor'?'User':'Participant');
  n.h=Math.min(...participants.map(n=>n.h));n.y=Math.min(...participants.map(n=>n.y));n.x=round(at.x-n.w/2);
  for(let i=0;i<=participants.length;i++){const hits=participants.filter(m=>n.x<m.x+m.w+40&&m.x<n.x+n.w+40);if(!hits.length)break;n.x=round(Math.max(...hits.map(m=>m.x+m.w))+60);}
  edge.lane=Math.max(180,...p.edges.map(e=>(e.lane||0)+80),...participants.map(n=>n.y+n.h+80));
 }
 p.nodes.push(n);p.edges.push(edge);return validateCanvas(p);
}
