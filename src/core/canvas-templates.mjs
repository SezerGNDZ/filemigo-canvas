import {classRelation,erRelation} from './canvas-semantics.mjs';
import {studioTemplates,newProject,themes} from './studio-data.mjs';
import {blankCanvas,makeNode,clampNode,validateCanvas} from './canvas-core.mjs';
export function canvasFromStudio(p,lang='en'){
 const out=blankCanvas(p.title),theme=themes[p.theme]||themes.rose;let counter=0;out.sourceTool=p.tool;
 const node=(type,text,x,y,w=180,h=90)=>{const n=makeNode(type,'n'+(++counter),x,y);Object.assign(n,{text,w,h,fill:type==='text'?'none':theme.soft,stroke:type==='text'?'none':theme.accent,color:theme.ink});out.nodes.push(n);return n;};
 const link=(from,to,label='',extra={})=>out.edges.push({id:'e'+(out.edges.length+1),from:from.id,to:to.id,label,color:theme.accent,dashed:false,start:'none',end:'arrow',...extra});
 if(p.tool==='assignment-cover'){
  out.width=794;out.height=1123;const f=p.fields,classic=f.layout==='classic';if(classic){const border=node('rect','',32,32,730,1059);Object.assign(border,{fill:'none',locked:true});}else{const bar=node('rect','',0,0,24,1123);Object.assign(bar,{fill:theme.accent,stroke:'none',locked:true});const corner=node('ellipse','',584,24,180,180);Object.assign(corner,{fill:theme.soft,stroke:'none',locked:true});}
  for(const [text,x,y,w,h,font]of [[f.institution,60,74,650,62,23],[f.department,60,149,650,48,17],[f.course,60,225,650,45,16],[f.headline,60,325,660,205,42],[f.subtitle,60,566,660,84,19],[f.student,60,731,660,60,23],[f.studentId,60,807,660,46,18],[f.teacher,60,881,660,60,20],[f.footer,60,1010,450,48,14],[f.date,547,1010,185,48,16]]){const n=node('text',text,x,y,w,h);n.fontSize=font;n.align=classic?'center':'left';}return validateCanvas(out);
 }
 if(p.tool==='weekly-planner'){
  out.width=1123;out.height=794;const band=node('rect','',0,0,1123,132);Object.assign(band,{fill:theme.soft,stroke:'none',locked:true});const title=node('text',p.title,40,30,1000,55);title.align='left';title.fontSize=32;const sub=node('text',p.fields.subtitle,40,87,1000,35);sub.align='left';sub.fontSize=16;
  const labels=[lang==='tr'?'Saat':'Time',...p.fields.days.split(',')],widths=[95,189,189,189,189,192],rh=450/p.rows.length;
  let x=40;labels.forEach((label,i)=>{const h=node('rect',label,x,150,widths[i],44);h.fill=theme.ink;h.color='#ffffff';h.fontSize=13;x+=widths[i];});
  p.rows.forEach((row,i)=>{let xx=40;[row.time,...row.cells].forEach((s,j)=>{const n=node('rect',s,xx,194+i*rh,widths[j],rh);n.fill=i%2?'#ffffff':'#faf8fa';n.stroke='#ded8df';n.fontSize=rh<55?11:13;xx+=widths[j];});});const note=node('text',p.fields.note,40,680,1040,75);note.fontSize=16;note.align='left';return validateCanvas(out);
 }
 const code=(p.code||'').split('\n').filter(line=>!line.trim().startsWith('%%')).join('\n').trim(),map=new Map();
 const header=code.split('\n')[0].trim();if(p.tool==='flowchart'?!/^(flowchart|graph) (TD|TB|BT|LR|RL)$/.test(header):header!==({'uml-class':'classDiagram','er-diagram':'erDiagram','sequence-diagram':'sequenceDiagram'})[p.tool])throw Error('conversion');
 if(p.tool==='flowchart'){
  for(const m of code.matchAll(/\b([A-Za-z]\w*)\s*(?:\[([^\]]+)\]|\{([^}]+)\})/g)){if(map.has(m[1])&&(map.get(m[1]).text!==(m[2]||m[3])||map.get(m[1]).type!==(m[3]?'diamond':'rect')))throw Error('conversion');if(!map.has(m[1]))map.set(m[1],node(m[3]?'diamond':'rect',m[2]||m[3],0,0,210,m[3]?125:90));}
  for(const line of code.split('\n').slice(1)){const clean=line.replace(/\[[^\]]+\]|\{[^}]+\}/g,'').trim();if(!clean||clean.startsWith('%%'))continue;const m=clean.match(/^(\w+)\s*(?:--\s*(.*?)\s*)?-->\s*(\w+)$/);if(!m)throw Error('conversion');for(const id of [m[1],m[3]])if(!map.has(id))map.set(id,node('rect',id,0,0,210,90));link(map.get(m[1]),map.get(m[3]),m[2]||'');}
 }else if(['uml-class','er-diagram'].includes(p.tool)){
  for(const m of code.matchAll(/^\s*(?:class\s+)?(\w+)\s*\{([^}]+)\}/gm)){if(map.has(m[1]))throw Error('conversion');const fields=m[2].trim().split('\n').map(s=>s.trim());map.set(m[1],node('card',m[1]+'\n'+fields.join('\n'),0,0,270,Math.max(145,70+fields.length*23)));}
  const relationCode=code.replace(/^\s*(?:class\s+)?\w+\s*\{[^}]+\}/gm,'');for(const line of relationCode.split('\n').slice(1)){const s=line.trim();if(!s||s.startsWith('%%'))continue;
   let m=p.tool==='er-diagram'?s.match(/^(\w+)\s+([|o{}.\-]+)\s+(\w+)\s*:\s*(.*)$/):s.match(/^(\w+)\s*(?:"([^"]*)"\s*)?([<>|.*o\-]+)\s*(?:"([^"]*)"\s*)?(\w+)(?:\s*:\s*(.*))?$/);if(!m)throw Error('conversion');const from=m[1],to=p.tool==='er-diagram'?m[3]:m[5];for(const id of [from,to])if(!map.has(id))map.set(id,node('card',id,0,0,270,145));
   if(p.tool==='er-diagram')link(map.get(from),map.get(to),m[4],erRelation(m[2]));
   else link(map.get(from),map.get(to),m[6]||'',{...classRelation(m[3]),startLabel:m[2]||'',endLabel:m[4]||''});
  }
 }else if(p.tool==='sequence-diagram'){
  out.diagram='sequence';out.fragments=[];let active=null,lane=180;const declared=new Set();const ensure=(id,type='rect')=>{if(!map.has(id)){const n=node(type,id,80+map.size*310,40,180,type==='actor'?95:60);n.fontSize=17;n.lifeline=true;map.set(id,n);}return map.get(id);};
  for(const l of code.split('\n').slice(1)){const s=l.trim();if(!s||s.startsWith('%%'))continue;if(s==='end'){if(!active)throw Error('conversion');active=null;lane+=30;continue;}let m=s.match(/^(actor|participant)\s+(\w+)(?:\s+as\s+(.+))?$/);if(m){if(declared.has(m[2])||map.has(m[2]))throw Error('conversion');declared.add(m[2]);const n=ensure(m[2],m[1]==='actor'?'actor':'rect');if(m[3])n.text=m[3];continue;}
   m=s.match(/^(\w+)\s*(--?>>|--?>)\s*(\w+)\s*:\s*(.*)$/);if(m){link(ensure(m[1]),ensure(m[3]),m[4],{lane,dashed:m[2].startsWith('--'),end:m[2].endsWith('>>')?'arrow':'none'});if(active)active.branches.at(-1).edges.push(out.edges.at(-1).id);lane+=65;continue;}
   m=s.match(/^(alt|else|opt|loop)\s+(.+)$/);if(m){if(m[1]==='else'){if(!active||active.kind!=='alt')throw Error('conversion');active.branches.push({label:m[2],edges:[]});}else{if(active)throw Error('conversion');active={kind:m[1],branches:[{label:m[2],edges:[]}]};out.fragments.push(active);}lane+=50;continue;}throw Error('conversion');
  }if(active||!out.edges.length)throw Error('conversion');out.width=Math.max(1200,map.size*310+80);out.height=Math.max(800,lane+90);if(out.width>4000||out.height>4000)throw Error('conversion');return validateCanvas(out);
 }else throw Error('conversion');
 if(!map.size)throw Error('conversion');
 if(p.tool==='flowchart'){
  const all=[...map.values()],ranks=new Map([[all[0].id,0]]),queue=[all[0].id];
  for(let i=0;i<queue.length;i++){const current=queue[i];for(const e of out.edges.filter(e=>e.from===current))if(!ranks.has(e.to)){ranks.set(e.to,ranks.get(current)+1);queue.push(e.to);}}
  let max=Math.max(...ranks.values());for(const n of all)if(!ranks.has(n.id))ranks.set(n.id,++max);
  out.width=Math.max(1200,(max+1)*265+80);if(out.width>4000)throw Error('conversion');
  for(let rank=0;rank<=max;rank++){const column=all.filter(n=>ranks.get(n.id)===rank);out.height=Math.max(out.height,column.length*220+160);column.forEach((n,i)=>{n.x=45+rank*265;n.y=150+i*220;});}
  return validateCanvas(out);
 }
 if(map.size===3){const positions=[[110,110],[800,110],[455,410]];[...map.values()].forEach((n,i)=>{n.x=positions[i][0];n.y=positions[i][1];clampNode(n,out);});return validateCanvas(out);}
 const cols=Math.min(3,map.size),rows=Math.ceil(map.size/cols);out.width=1200;out.height=Math.max(800,rows*240+80);let i=0;for(const n of map.values()){n.x=80+(i%cols)*370;n.y=80+Math.floor(i/cols)*240;i++;clampNode(n,out);}return validateCanvas(out);
}
export function canvasTemplate(id,lang='en'){const t=studioTemplates.find(t=>t.id===id);return t?canvasFromStudio(newProject(t,lang),lang):blankCanvas(lang==='tr'?'Yeni tasarım':'Untitled canvas');}
