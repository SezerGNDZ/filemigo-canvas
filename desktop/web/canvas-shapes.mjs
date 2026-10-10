import {extraShapes,extraShapeBody} from './canvas-shape-library.mjs';
// The same catalogue drives the library, quick-add and the LLM contract.
export const shapeCatalog = [
 ['rect','basic','Rectangle','Dikdörtgen'], ['rounded','basic','Rounded rectangle','Yuvarlak köşeli'],
 ['ellipse','basic','Ellipse','Elips'], ['text','basic','Text','Metin'], ['note','basic','Sticky note','Yapışkan not'],
 ['diamond','flow','Decision','Karar'], ['terminator','flow','Start / end','Başlangıç / bitiş'],
 ['document','flow','Document','Belge'], ['subprocess','flow','Subprocess','Alt süreç'], ['hexagon','flow','Preparation','Hazırlık'],
 ['card','systems','UML / ER card','UML / ER kartı'], ['actor','systems','Actor','Aktör'],
 ['database','systems','Database','Veritabanı'], ['package','systems','Package','Paket']
].map(([type,category,en,tr])=>({type,category,en,tr})).concat(extraShapes);
export function shapeBody(type,w,h,attributes){
 const a=attributes,line=a.replace(/fill="[^"]*"/g,'fill="none"');
 const extra=extraShapeBody(type,w,h,attributes);if(extra)return extra;
 if(type==='rounded'||type==='terminator')return `<rect x="1" y="1" width="${w-2}" height="${h-2}" rx="${type==='terminator'?Math.min(w,h)/2:Math.min(14,h/4)}" ${a}/>`;
 if(type==='database'){const r=Math.min(14,h/6);return `<path d="M1 ${r}A${w/2-1} ${r-1} 0 0 1 ${w-1} ${r}V${h-r}A${w/2-1} ${r-1} 0 0 1 1 ${h-r}Z" ${a}/><ellipse cx="${w/2}" cy="${r}" rx="${w/2-1}" ry="${r-1}" ${a}/>`;}
 if(type==='document')return `<path d="M1 1H${w-1}V${h-12}Q${w/2} ${h+10} 1 ${h-12}Z" ${a}/>`;
 if(type==='hexagon')return `<path d="M${w*.18} 1H${w*.82}L${w-1} ${h/2}L${w*.82} ${h-1}H${w*.18}L1 ${h/2}Z" ${a}/>`;
 if(type==='subprocess')return `<rect x="1" y="1" width="${w-2}" height="${h-2}" ${a}/><path d="M${w*.09} 1V${h-1}M${w*.91} 1V${h-1}" ${line}/>`;
 if(type==='package')return `<path d="M1 1H${w*.65}V${h*.18}H${w-1}V${h-1}H1Z" ${a}/><path d="M1 ${h*.18}H${w*.65}" ${line}/>`;
 return null;
}
export function shapeIcon(type){
 let body=shapeBody(type,44,30,'fill="currentColor" fill-opacity=".08" stroke="currentColor" stroke-width="1.4"');
 if(!body)body=type==='ellipse'?'<ellipse cx="22" cy="15" rx="21" ry="14"/>':type==='diamond'?'<path d="M22 1L43 15L22 29L1 15Z"/>':type==='actor'?'<circle cx="22" cy="6" r="4"/><path d="M22 10V21M12 15H32M22 21L14 29M22 21L30 29"/>':type==='text'?'<path d="M10 3H34M22 3V28M15 28H29"/>':type==='card'?'<rect x="1" y="1" width="42" height="28"/><path d="M1 10H43M1 19H43"/>':type==='note'?'<path d="M1 1H43V22L35 29H1Z M35 29V22H43"/>':'<rect x="1" y="1" width="42" height="28"/>';
 return `<svg viewBox="0 0 44 30" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4">${body}</svg>`;
}
