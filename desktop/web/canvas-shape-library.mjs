// Normalized polygons are shared by drawing and connector anchoring.
export const extraShapes=[
 ['triangle','basic','Triangle','Üçgen'],['pentagon','basic','Pentagon','Beşgen'],['octagon','basic','Octagon','Sekizgen'],['star','basic','Star','Yıldız'],['cross','basic','Cross','Artı'],
 ['data','flow','Input / output','Girdi / çıktı'],['manual-input','flow','Manual input','Elle giriş'],['manual-operation','flow','Manual operation','Elle işlem'],['delay','flow','Delay','Gecikme'],['stored-data','flow','Stored data','Saklanan veri'],['multidocument','flow','Multiple documents','Çoklu belge'],['offpage','flow','Off-page connector','Sayfa dışı bağlantı'],['merge','flow','Merge','Birleştirme'],['extract','flow','Extract','Ayırma'],
 ['component','systems','Component','Bileşen'],['interface','systems','Interface','Arayüz'],['entity','systems','Entity','Varlık'],['uml-object','systems','Object instance','Nesne örneği'],['uml-state','systems','State','Durum'],['initial-state','systems','Initial state','Başlangıç durumu'],['final-state','systems','Final state','Son durum'],['join','systems','Fork / join bar','Çatallanma / birleşme'],
 ['server','network','Server','Sunucu'],['rack','network','Server rack','Sunucu rafı'],['desktop','network','Desktop','Masaüstü bilgisayar'],['laptop','network','Laptop','Dizüstü bilgisayar'],['mobile','network','Mobile device','Mobil cihaz'],['router','network','Router','Yönlendirici'],['switch','network','Network switch','Ağ anahtarı'],['firewall','network','Firewall','Güvenlik duvarı'],['cloud','network','Cloud','Bulut'],['storage','network','Storage','Depolama'],['queue','network','Message queue','Mesaj kuyruğu'],['service','network','Service / API','Servis / API'],
 ['arrow-right','arrows','Right arrow','Sağ ok'],['arrow-left','arrows','Left arrow','Sol ok'],['arrow-up','arrows','Up arrow','Yukarı ok'],['arrow-down','arrows','Down arrow','Aşağı ok'],['arrow-both','arrows','Two-way arrow','Çift yönlü ok'],['chevron','arrows','Chevron','Şerit ok']
].map(([type,category,en,tr])=>({type,category,en,tr}));
export const networkTypes=new Set(extraShapes.filter(t=>t.category==='network').map(t=>t.type));
export const circularTypes=new Set(['interface','initial-state','final-state']);
const arrow=[[0,.3],[.62,.3],[.62,0],[1,.5],[.62,1],[.62,.7],[0,.7]];
const regular=(count,start=-Math.PI/2)=>Array.from({length:count},(_,i)=>[.5+.5*Math.cos(start+i*2*Math.PI/count),.5+.5*Math.sin(start+i*2*Math.PI/count)]);
const polygons={
 'stored-data':[[.12,0],[1,0],...Array.from({length:33},(_,i)=>{const t=i/32;return[1-.48*t*(1-t),t];}),[.12,1],...Array.from({length:33},(_,i)=>{const t=i/32;return[.12-.48*t*(1-t),1-t];})],
 triangle:[[.5,0],[1,1],[0,1]],pentagon:regular(5),octagon:[[.3,0],[.7,0],[1,.3],[1,.7],[.7,1],[.3,1],[0,.7],[0,.3]],
 star:Array.from({length:10},(_,i)=>{const r=i%2?.22:.5,a=-Math.PI/2+i*Math.PI/5;return[.5+r*Math.cos(a),.5+r*Math.sin(a)];}),
 cross:[[.32,0],[.68,0],[.68,.32],[1,.32],[1,.68],[.68,.68],[.68,1],[.32,1],[.32,.68],[0,.68],[0,.32],[.32,.32]],
 data:[[.2,0],[1,0],[.8,1],[0,1]],'manual-input':[[0,.2],[1,0],[1,1],[0,1]],'manual-operation':[[0,0],[1,0],[.8,1],[.2,1]],
 delay:[[0,0],[.5,0],...Array.from({length:25},(_,i)=>[.5+.5*Math.cos(-Math.PI/2+i*Math.PI/24),.5+.5*Math.sin(-Math.PI/2+i*Math.PI/24)]),[0,1]],
 offpage:[[0,0],[1,0],[1,.65],[.5,1],[0,.65]],merge:[[0,0],[1,0],[.5,1]],extract:[[.5,0],[1,1],[0,1]],
 'arrow-right':arrow,'arrow-left':arrow.map(([x,y])=>[1-x,y]),'arrow-up':arrow.map(([x,y])=>[y,1-x]),'arrow-down':arrow.map(([x,y])=>[y,x]),
 'arrow-both':[[0,.5],[.25,0],[.25,.3],[.75,.3],[.75,0],[1,.5],[.75,1],[.75,.7],[.25,.7],[.25,1]],chevron:[[0,0],[.7,0],[1,.5],[.7,1],[0,1],[.3,.5]]
};
export function shapePolygon(type,w,h){return polygons[type]?.map(([x,y])=>({x:x*w,y:y*h}))||null;}
export function shapeAnchor(n,dx,dy){
 const cx=n.w/2,cy=n.h/2;if(!dx&&!dy)dx=1;
 if(circularTypes.has(n.type)||n.type==='ellipse'){const t=1/Math.hypot(dx/cx,dy/cy);return{x:n.x+cx+dx*t,y:n.y+cy+dy*t};}
 const component=[[.12,0],[1,0],[1,1],[.12,1],[.12,.53],[0,.53],[0,.35],[.12,.35],[.12,.28],[0,.28],[0,.1],[.12,.1]];
 const points=shapePolygon(n.type,n.w,n.h)||(n.type==='component'?component.map(([x,y])=>({x:x*n.w,y:y*n.h})):n.type==='diamond'?[{x:cx,y:0},{x:n.w,y:cy},{x:cx,y:n.h},{x:0,y:cy}]:null);
 if(points){let best=Infinity;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ex=b.x-a.x,ey=b.y-a.y,den=dx*ey-dy*ex;if(Math.abs(den)<1e-10)continue;const ax=a.x-cx,ay=a.y-cy,t=(ax*ey-ay*ex)/den,u=(ax*dy-ay*dx)/den;if(t>=0&&u>=-1e-9&&u<=1+1e-9)best=Math.min(best,t);}if(Number.isFinite(best))return{x:n.x+cx+dx*best,y:n.y+cy+dy*best};}
 const t=1/Math.max(Math.abs(dx)/cx,Math.abs(dy)/cy);return{x:n.x+cx+dx*t,y:n.y+cy+dy*t};
}
export function shapeTextBox(n){
 const pad=n.padding??12,w=n.w,h=n.h,base={x:pad,y:5,w:Math.max(4,w-2*pad),h:Math.max(4,h-10)};
 if(networkTypes.has(n.type))return{x:pad,y:h*.62,w:Math.max(4,w-2*pad),h:Math.max(4,h*.35)};
 if(['triangle','extract'].includes(n.type))return{x:w*.26,y:h*.5,w:w*.48,h:h*.4};
 if(n.type==='merge')return{x:w*.26,y:h*.12,w:w*.48,h:h*.4};
 if(['star','cross'].includes(n.type))return{x:w*.32,y:h*.32,w:w*.36,h:h*.36};
 if(['diamond','hexagon'].includes(n.type))return{x:w*.22,y:h*.12,w:w*.56,h:h*.76};
 if(n.type.startsWith('arrow-')||n.type==='chevron')return{x:w*.28,y:h*.3,w:w*.42,h:h*.4};
 if(['data','manual-operation','offpage','delay'].includes(n.type))return{x:w*.23,y:h*.2,w:w*.54,h:h*.6};
 if(['component','package','multidocument'].includes(n.type))return{...base,y:h*.3,h:h*.6};
 if(n.type==='document')return{...base,h:h*.76};
 if(n.type==='database'||n.type==='stored-data')return{...base,y:h*.25,h:h*.5};
 return base;
}
export function extraShapeBody(type,w,h,a){
 const line=a.replace(/fill="[^"]*"/g,'fill="none"'),points=shapePolygon(type,w,h);
 if(points)return `<path d="${points.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join('')}Z" ${a}/>`;
 if(circularTypes.has(type)){const outer=`<ellipse cx="${w/2}" cy="${h/2}" rx="${w/2-1}" ry="${h/2-1}" ${a}/>`;return type==='final-state'?outer+`<ellipse cx="${w/2}" cy="${h/2}" rx="${w*.34}" ry="${h*.34}" ${line}/>`:type==='initial-state'?outer+`<ellipse cx="${w/2}" cy="${h/2}" rx="${w*.34}" ry="${h*.34}" ${a}/>`:outer;}
 if(type==='entity'||type==='uml-object')return `<rect width="${w}" height="${h}" ${a}/>${type==='entity'?`<path d="M0 ${h*.3}H${w}" ${line}/>`:`<path d="M${w*.2} ${h*.7}H${w*.8}" ${line}/>`}`;
 if(type==='uml-state')return `<rect width="${w}" height="${h}" rx="${Math.min(18,h/4)}" ${a}/>`;
 if(type==='join')return `<rect width="${w}" height="${h}" ${a}/><rect x="${w*.08}" y="${h*.18}" width="${w*.84}" height="${h*.12}" ${a}/>`;
 if(type==='component')return `<rect x="${w*.12}" width="${w*.88}" height="${h}" ${a}/><rect x="0" y="${h*.1}" width="${w*.24}" height="${h*.18}" ${a}/><rect x="0" y="${h*.35}" width="${w*.24}" height="${h*.18}" ${a}/>`;
 if(type==='multidocument')return `<rect x="${w*.12}" width="${w*.88}" height="${h*.85}" ${a}/><rect x="${w*.06}" y="${h*.07}" width="${w*.88}" height="${h*.85}" ${a}/><path d="M0 ${h*.14}H${w*.88}V${h*.89}Q${w*.44} ${h*1.1} 0 ${h*.89}Z" ${a}/>`;
 if(type==='stored-data')return `<path d="M${w*.12} 0H${w}Q${w*.76} ${h/2} ${w} ${h}H${w*.12}Q${-w*.12} ${h/2} ${w*.12} 0Z" ${a}/>`;
 if(networkTypes.has(type)){
  const icons={
   server:'<rect x="6" y="2" width="28" height="23" rx="2"/><path d="M6 10H34M6 18H34M10 6H12M10 14H12M10 22H12"/>',
   rack:'<rect x="5" y="0" width="30" height="28"/><path d="M8 4H32V9H8ZM8 12H32V17H8ZM8 20H32V25H8Z"/>',
   desktop:'<rect x="2" y="1" width="36" height="21" rx="2"/><path d="M20 22V28M12 28H28"/>',
   laptop:'<path d="M6 2H34V22H6ZM6 22L1 27H39L34 22"/>',mobile:'<rect x="12" y="0" width="16" height="28" rx="3"/><path d="M17 4H23M18 24H22"/>',
   router:'<ellipse cx="20" cy="17" rx="18" ry="9"/><path d="M9 9V0M31 9V0M10 15H30M15 11L10 15L15 19M25 11L30 15L25 19"/>',
   switch:'<rect x="1" y="7" width="38" height="18" rx="2"/><path d="M5 13H10V19H5ZM14 13H19V19H14ZM23 13H28V19H23ZM32 13H35V19H32Z"/>',
   firewall:'<path d="M2 1H38V28H2ZM2 10H38M2 19H38M14 1V10M27 1V10M8 10V19M22 10V19M32 19V28M14 19V28"/>',
   cloud:'<path d="M9 25C-4 24 0 8 11 10C9-3 31-3 31 10C43 7 45 25 33 25Z"/>',
   storage:'<path d="M3 12L9 2H31L37 12V26H3ZM3 12H37M28 20H32"/>',
   queue:'<path d="M1 4H11V24H1ZM15 4H25V24H15ZM29 4H39V24H29ZM4 9H8M18 9H22M32 9H36"/>',
   service:'<rect x="2" y="1" width="36" height="27" rx="4"/><path d="M14 7L7 14L14 21M26 7L33 14L26 21M23 6L17 23"/>'
  };
  const scale=Math.min(w*.62/40,h*.48/28);return `<rect width="${w}" height="${h}" rx="10" ${a}/><g transform="translate(${w/2-20*scale} ${h*.08}) scale(${scale})" ${line.replace(/stroke-width="[^"]*"/g,'')} stroke-width="${1.5/scale}" stroke-linejoin="round">${icons[type]}</g>`;
 }
 return null;
}
