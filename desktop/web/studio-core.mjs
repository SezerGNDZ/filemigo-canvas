import {studioTools,themes} from './studio-data.mjs';
export const escapeXML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function validateProject(value){
 if(!value||value.format!=='filemigo-studio'||value.version!==1||!studioTools.some(t=>t.id===value.tool))throw Error('project');
 if(typeof value.title!=='string'||!value.title.trim()||value.title.length>90||!themes[value.theme])throw Error('project');
 const p={format:value.format,version:1,tool:value.tool,title:value.title,theme:value.theme};
 if(['assignment-cover','weekly-planner'].includes(p.tool)){
  if(!value.fields||typeof value.fields!=='object')throw Error('project');p.fields={};
  const keys=p.tool==='assignment-cover'?['layout','institution','department','course','headline','subtitle','student','studentId','teacher','date','footer']:['subtitle','note','days'];
  for(const k of keys){if(typeof value.fields[k]!=='string'||value.fields[k].length>160)throw Error('project');p.fields[k]=value.fields[k];}
  if(p.tool==='assignment-cover'&&!['editorial','classic'].includes(p.fields.layout))throw Error('project');
  if(p.tool==='weekly-planner'){
   if(p.fields.days.split(',').length!==5||!Array.isArray(value.rows)||!value.rows.length||value.rows.length>10)throw Error('project');
   p.rows=value.rows.map(r=>{if(typeof r.time!=='string'||r.time.length>20||!Array.isArray(r.cells)||r.cells.length!==5||r.cells.some(c=>typeof c!=='string'||c.length>55))throw Error('project');return{time:r.time,cells:[...r.cells]};});
  }
 }else{if(typeof value.code!=='string')throw Error('project');validateDiagram(value.code,p.tool);p.code=value.code;}
 return p;
}
export function validateDiagram(code,tool){
 if(!code.trim()||code.length>12000||code.split('\n').length>160)throw Error('size');
 const prefix={'flowchart':/^\s*(flowchart|graph)\s+(TD|TB|BT|LR|RL)\b/,'uml-class':/^\s*classDiagram\b/,'sequence-diagram':/^\s*sequenceDiagram\b/,'er-diagram':/^\s*erDiagram\b/}[tool];
 if(!prefix?.test(code))throw Error('type');
 // Keep user definitions declarative: no config directives, links, HTML, images or remote resources.
 if(/%%\{|^\s*---|\b(?:click|href|linkStyle|classDef|style)\s|https?:|data:|javascript:|<\s*\/?\s*(?:script|img|iframe|svg|a|div|span|style|foreignObject)\b|@\{|url\s*\(/im.test(code))throw Error('unsafe');
 return code;
}
export function wrapText(text,max=35,maxLines=4){
 const words=String(text).trim().split(/\s+/),lines=[];let line='';
 for(let word of words){while(word.length>max){if(line){lines.push(line);line='';}lines.push(word.slice(0,max));word=word.slice(max);}if(line&&line.length+word.length+1>max){lines.push(line);line=word;}else line+=(line?' ':'')+word;}
 if(line)lines.push(line);if(lines.length>maxLines){lines.length=maxLines;lines[maxLines-1]=lines[maxLines-1].slice(0,max-1)+'…';}return lines;
}
const text=(s,x,y,size,color,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${escapeXML(s)}</text>`;
const block=(s,x,y,size,color,max,extra='',maxLines=4)=>wrapText(s,max,maxLines).map((l,i)=>text(l,x,y+i*size*1.3,size,color,extra+` data-fit-width="${max*size*.58}"`)).join('');
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Arial, sans-serif"><rect width="100%" height="100%" fill="#fff"/>${body}</svg>`;
export function renderCover(p,lang='en'){
 const f=p.fields,t=themes[p.theme],tr=lang==='tr',classic=f.layout==='classic';let b='';
 if(classic){b+=`<rect x="36" y="36" width="722" height="1051" rx="2" fill="none" stroke="${t.accent}" stroke-width="2"/><rect x="45" y="45" width="704" height="1033" fill="none" stroke="${t.soft}"/>`;
 b+=block(f.institution,397,115,19,t.ink,48,'text-anchor="middle" font-weight="700"',2)+block(f.department,397,173,15,t.ink,60,'text-anchor="middle"',2);
 b+=text(f.course,397,280,14,t.accent,'text-anchor="middle" font-weight="700"');
 b+=block(f.headline,397,375,36,t.ink,29,'text-anchor="middle" font-weight="700"',4)+block(f.subtitle,397,590,17,t.ink,55,'text-anchor="middle"',2);
 }else{b+=`<rect width="18" height="1123" fill="${t.accent}"/><rect x="594" y="0" width="200" height="240" fill="${t.soft}"/><circle cx="794" cy="0" r="200" fill="${t.accent}" opacity="0.12"/><path d="M66 258H728" stroke="${t.accent}" stroke-width="2"/>`;
 b+=block(f.institution,66,108,19,t.ink,42,'font-weight="700"',2)+block(f.department,66,168,15,t.ink,58,'',2)+text(f.course,66,229,14,t.accent,'font-weight="700"');
 b+=block(f.headline,66,370,44,t.ink,25,'font-weight="700"',4)+block(f.subtitle,66,621,18,t.ink,55,'',2);
 }
 const labels=tr?['HAZIRLAYAN','ÖĞRENCİ NUMARASI','DANIŞMAN / ÖĞRETİM ELEMANI']:['PREPARED BY','STUDENT ID','INSTRUCTOR / SUPERVISOR'];
 for(const [i,k]of ['student','studentId','teacher'].entries()){const y=740+i*83;b+=text(labels[i],66,y,10,t.accent,'letter-spacing="1.5" font-weight="700"')+block(f[k],66,y+29,19,t.ink,55,'',2);}
 b+=`<path d="M66 1016H728" stroke="${t.soft}" stroke-width="2"/>`+text(f.footer,66,1056,11,t.accent,'font-weight="700"')+text(f.date,728,1056,13,t.ink,'text-anchor="end"');return svg(794,1123,b);
}
export function renderPlanner(p,lang='en'){
 const t=themes[p.theme],days=p.fields.days.split(','),x=40,y=200,w=1043,label=95,cw=(w-label)/5,rh=450/p.rows.length;
 let b=`<rect width="1123" height="140" fill="${t.soft}"/><rect x="40" y="40" width="5" height="65" rx="2" fill="${t.accent}"/>`+block(p.title,62,72,28,t.ink,64,'font-weight="700"',1)+block(p.fields.subtitle,62,108,14,t.ink,110,'',1);
 b+=`<rect x="${x}" y="${y-44}" width="${w}" height="44" rx="8" fill="${t.ink}"/>`+text(lang==='tr'?'SAAT':'TIME',x+14,y-17,11,'#fff','font-weight="700"');
 days.forEach((d,i)=>{b+=text(d.trim().slice(0,18),x+label+cw*i+cw/2,y-17,12,'#fff','text-anchor="middle" font-weight="700"');});
 p.rows.forEach((r,i)=>{b+=`<rect x="${x}" y="${y+i*rh}" width="${w}" height="${rh}" fill="${i%2===0?'#fafafa':'#fff'}"/>`+text(r.time,x+12,y+i*rh+rh/2+5,12,t.ink);r.cells.forEach((c,j)=>{b+=block(c,x+label+cw*j+12,y+i*rh+19,rh<55?10:13,t.ink,rh<55?28:22,'',rh<55?2:3);});b+=`<path d="M${x} ${y+(i+1)*rh}H${x+w}" stroke="#e6e4e6"/>`;});
 for(let i=0;i<6;i++)b+=`<path d="M${x+label+cw*i} ${y}V650" stroke="#e6e4e6"/>`;
 b+=block(p.fields.note,40,706,14,t.accent,112,'',2)+text(lang==='tr'?'KENDİ RİTMİNİ BUL.':'FIND YOUR OWN RHYTHM.',40,763,10,t.accent,'letter-spacing="2"');return svg(1123,794,b);
}
export const fileSlug=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,65)||'filemigo-project';
