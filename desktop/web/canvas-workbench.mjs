import {installSelectionOptions} from './canvas-options.mjs';
import {shapeCatalog,shapeIcon} from './canvas-shapes.mjs';
import {palettes,copyStyle,applyStyle,matchSize,relatedSelection,searchObjects,readDraft,writeDraft,draftKey,connectionPresets,applyConnectionPreset} from './canvas-workbench-core.mjs';
import {movable} from './canvas-geometry.mjs';
import {escapeXML} from './studio-core.mjs';

export function installWorkbench(api){
 const {lang,getProject,getSelection,commit,select,addShape,center,status,restore}=api;
 const s=(en,tr)=>lang==='tr'?tr:en,$=selector=>document.querySelector(selector),esc=escapeXML;
 let favorites=new Set(),recent=[];try{const saved=JSON.parse(localStorage.getItem('filemigo-shape-favorites')||'[]');if(Array.isArray(saved))favorites=new Set(saved.filter(t=>shapeCatalog.some(s=>s.type===t)));}catch{}
 let styleClipboard=null,timer=null,inline=null,category='all',pending=null,storage=null,paused=false,lastSaved='';
 const preferenceKey='filemigo-canvas-draft-enabled';
 try{storage=window.localStorage;pending=readDraft(storage);paused=storage.getItem(preferenceKey)==='0';}catch{storage=null;}
 const draftStatus=$('#canvas-draft-status'),recovery=$('#canvas-recovery');
 for(const [id,cls] of [['canvas-library-toggle','canvas-mobile-library'],['canvas-commands-toggle','canvas-mobile-commands']])$('#'+id).onclick=()=>{const open=document.body.classList.toggle(cls);$('#'+id).setAttribute('aria-expanded',String(open));};
 const setDraftStatus=text=>draftStatus.textContent=text;
 function flush(){
  clearTimeout(timer);if(!storage||paused||pending)return;
  try{const data=writeDraft(storage,getProject());lastSaved=JSON.stringify(data.project);setDraftStatus(s('✓ Draft saved here','✓ Taslak burada kayıtlı'));}
  catch{setDraftStatus(s('Draft not saved · download JSON','Taslak kaydedilemedi · JSON indir'));}
 }
 function changed(){
  if(pending){setDraftStatus(s('Previous draft awaits your choice','Önceki taslak için seçimin bekleniyor'));return;}
  if(paused){setDraftStatus(s('Draft saving paused','Taslak kaydı duraklatıldı'));return;}
  if(!storage){setDraftStatus(s('Browser storage unavailable · save JSON','Tarayıcı kaydı kullanılamıyor · JSON kaydet'));return;}
  if(JSON.stringify(getProject())===lastSaved)return;
  setDraftStatus(s('Saving draft…','Taslak kaydediliyor…'));clearTimeout(timer);timer=setTimeout(flush,700);
 }
 function showRecovery(){
  if(!pending)return;clearTimeout(timer);recovery.hidden=false;
  recovery.innerHTML=`<div><strong>${s('A local draft is waiting','Bu uygulamada bir taslak var')}</strong><span>${esc(pending.project.title)} · ${new Date(pending.savedAt).toLocaleString(lang==='tr'?'tr-TR':'en-US')} · ${pending.project.nodes.length} ${s('objects','nesne')}</span></div><button id="draft-restore">${s('Restore draft','Taslağı geri yükle')}</button><button id="draft-dismiss">${s('Use current canvas','Mevcut tuvalle devam et')}</button>`;
  $('#draft-restore').onclick=()=>{const data=pending;pending=null;recovery.hidden=true;if(restore(data.project))changed();else{pending=data;showRecovery();}};
  $('#draft-dismiss').onclick=()=>{pending=null;recovery.hidden=true;changed();};
  setDraftStatus(s('Recovery available','Taslak kurtarılabilir'));
 }
 showRecovery();if(!pending)setDraftStatus(s('Drafts stay in this app','Taslaklar bu uygulamada tutulur'));
 const draftDetails=document.createElement('details');draftDetails.className='canvas-draft-settings';
 draftDetails.innerHTML=`<summary>${s('Local draft & privacy','Yerel taslak ve gizlilik')}</summary><p>${s('One recovery draft is stored on this device, including embedded images. It is not a cloud backup. Clearing browser data removes it. On a shared device, pause saving and delete your draft when finished.','Gömülü görseller dahil tek kurtarma taslağı bu cihazda saklanır. Bulut yedeği değildir. Tarayıcı verilerini silmek taslağı da siler. Ortak cihazda kaydı duraklatıp işin bitince taslağını sil.')}</p><label class="canvas-check"><input id="canvas-draft-enabled" type="checkbox" checked>${s('Save recovery draft','Kurtarma taslağı tut')}</label><button id="canvas-draft-delete">${s('Delete local draft','Yerel taslağı sil')}</button>`;
 $('.canvas-inspector').append(draftDetails);
 $('#canvas-draft-enabled').checked=!paused;
 if(paused&&!pending)setDraftStatus(s('Draft saving paused','Taslak kaydı duraklatıldı'));
 $('#canvas-draft-enabled').onchange=e=>{paused=!e.target.checked;try{storage?.setItem(preferenceKey,paused?'0':'1');}catch{}clearTimeout(timer);if(paused)setDraftStatus(s('Draft saving paused','Taslak kaydı duraklatıldı'));else changed();};
 $('#canvas-draft-delete').onclick=()=>{try{storage?.removeItem(draftKey);storage?.setItem(preferenceKey,'0');pending=null;paused=true;lastSaved='';clearTimeout(timer);recovery.hidden=true;$('#canvas-draft-enabled').checked=false;setDraftStatus(s('Draft deleted · saving paused','Taslak silindi · kayıt duraklatıldı'));}catch{setDraftStatus(s('Could not delete local draft','Yerel taslak silinemedi'));}};
 window.addEventListener('pagehide',()=>{if(timer)flush();});
 window.addEventListener('storage',e=>{if(e.key!==draftKey||!e.newValue)return;clearTimeout(timer);paused=true;$('#canvas-draft-enabled').checked=false;setDraftStatus(s('Another tab saved · saving paused here','Başka sekme kaydetti · burada kayıt duraklatıldı'));});

 const fold=value=>value.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('ı','i');
 function filterLibrary(){const q=fold($('#canvas-shape-search').value.trim());let count=0;document.querySelectorAll('[data-shape]').forEach(b=>{b.hidden=!(category==='all'||category==='favorites'&&favorites.has(b.dataset.shape)||category==='recent'&&recent.includes(b.dataset.shape)||b.dataset.category===category)||!fold(b.dataset.search).includes(q);const tile=b.closest('.canvas-shape-tile');if(tile)tile.hidden=b.hidden;if(!b.hidden)count++;});$('#canvas-image').hidden=category!=='all'||!!q;$('#canvas-library-empty').hidden=!!count;}
 document.querySelectorAll('[data-favorite]').forEach(b=>{const paint=()=>{b.textContent=favorites.has(b.dataset.favorite)?'★':'☆';b.setAttribute('aria-pressed',String(favorites.has(b.dataset.favorite)));};paint();b.onclick=()=>{favorites.has(b.dataset.favorite)?favorites.delete(b.dataset.favorite):favorites.add(b.dataset.favorite);try{localStorage.setItem('filemigo-shape-favorites',JSON.stringify([...favorites]));}catch{}paint();filterLibrary();};});
 const empty=document.createElement('p');empty.id='canvas-library-empty';empty.hidden=true;empty.textContent=s('No matching shapes. Try another search.','Eşleşen şekil yok. Başka sözcük dene.');$('.canvas-shapes').after(empty);
 $('#canvas-shape-search').oninput=filterLibrary;
 document.querySelectorAll('[data-shape-category]').forEach(b=>b.onclick=()=>{category=b.dataset.shapeCategory;document.querySelectorAll('[data-shape-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filterLibrary();});
 function copyCurrentStyle(){const nodes=getProject().nodes.filter(n=>getSelection().has(n.id));if(nodes.length!==1||nodes[0].type==='image')return;styleClipboard=copyStyle(nodes[0]);sync(false);status(s('Style copied. Select objects and paste it.','Biçim kopyalandı. Nesneleri seçip yapıştır.'));}
 function pasteStyle(){if(!styleClipboard)return;commit(()=>applyStyle(getProject(),getSelection(),styleClipboard));}
 $('#canvas-style-copy').onclick=copyCurrentStyle;$('#canvas-style-paste').onclick=pasteStyle;
 function inspectorExtras(){
  const p=getProject(),ids=getSelection(),ns=p.nodes.filter(n=>ids.has(n.id)),editable=movable(p,ids).filter(n=>n.type!=='image');
  if(!ns.length){const edge=p.edges.find(e=>e.id===api.getEdge());if(edge&&edge.lane===undefined){const section=document.createElement('section');section.className='canvas-style-studio';section.innerHTML=`<h3>${s('Relationship presets','Hazır ilişki türleri')}</h3><label>${s('Choose a relationship','İlişki seç')}<select id="canvas-relationship"><option value="">${s('Custom / choose…','Özel / seç…')}</option>${connectionPresets.map(t=>`<option value="${t.id}">${esc(t[lang])}</option>`).join('')}</select></label><p>${s('Changes arrowheads and dashes only. The triangle points to the target; the diamond stays at the source. Endpoints, labels and multiplicities are preserved.','Yalnızca ok uçları ve çizgi biçimi değişir. Üçgen hedefte, elmas kaynakta olur. Bağ uçları, etiketler ve çokluklar korunur.')}</p>`;$('#canvas-properties').append(section);$('#canvas-relationship').onchange=e=>{if(e.target.value)commit(()=>applyConnectionPreset(getProject(),edge.id,e.target.value));};}return;}
  const first=editable[0]||ns[0],box=document.createElement('section');box.className='canvas-style-studio';
  box.innerHTML=`<h3>${s('Selection studio','Seçim stüdyosu')} <span>${ns.length}</span></h3><p>${s('Presets change selected shapes only. Text and connections stay intact.','Hazır biçimler seçili şekillere uygulanır. Metin ve bağlantılar korunur.')}</p><div class="canvas-palettes">${palettes.map(t=>`<button data-palette="${t.id}" title="${esc(t[lang])}" aria-label="${esc(t[lang])}" style="--swatch:${t.fill};--swatch-line:${t.stroke}"><span></span>${esc(t[lang])}</button>`).join('')}</div><div class="canvas-font-actions"><button data-font="bold" aria-pressed="${editable.length>0&&editable.every(n=>n.bold)}"><b>B</b> ${s('Bold','Kalın')}</button><button data-font="italic" aria-pressed="${editable.length>0&&editable.every(n=>n.italic)}"><i>I</i> ${s('Italic','İtalik')}</button></div>${ns.length>1?`<div class="canvas-field-pair"><label>${s('Border','Kenar')}<input type="color" data-batch="stroke" value="${first.stroke==='none'?'#334155':first.stroke}"></label><label>${s('Font size','Yazı boyutu')}<input type="number" data-batch="fontSize" min="8" max="80" value="${first.fontSize}"></label></div><label>${s('Text alignment','Metin hizası')}<select data-batch="align">${[['left',s('Left','Sol')],['center',s('Center','Orta')],['right',s('Right','Sağ')]].map(([v,t])=>`<option value="${v}" ${first.align===v?'selected':''}>${t}</option>`).join('')}</select></label><label>${s('Match first selected object in layer order','Katman sırasındaki ilk seçili nesneyle eşitle')}<select id="canvas-match-size"><option value="">${s('Match size…','Boyutları eşitle…')}</option><option value="width">${s('Width','Genişlik')}</option><option value="height">${s('Height','Yükseklik')}</option><option value="both">${s('Width & height','Genişlik ve yükseklik')}</option></select></label>`:''}<div class="canvas-neighbors"><button data-neighbors="incoming">← ${s('Link sources','Bağ kaynakları')}</button><button data-neighbors="outgoing">${s('Link targets','Bağ hedefleri')} →</button><button data-neighbors="both">${s('Select connected neighbors','Bağlı komşuları seç')}</button></div>`;
  $('#canvas-properties').append(box);
  box.querySelectorAll('[data-palette]').forEach(b=>{const preset=palettes.find(t=>t.id===b.dataset.palette);b.style.setProperty('--swatch',preset.fill);b.style.setProperty('--swatch-line',preset.stroke);b.disabled=!editable.length;b.onclick=()=>commit(()=>applyStyle(getProject(),getSelection(),preset));});
  box.querySelectorAll('[data-font]').forEach(b=>{b.disabled=!editable.length;b.onclick=()=>{const key=b.dataset.font,value=!editable.every(n=>n[key]);commit(()=>applyStyle(getProject(),getSelection(),{[key]:value}));};});
  box.querySelectorAll('[data-batch]').forEach(el=>{el.disabled=!editable.length;el.onchange=()=>{if(!el.checkValidity())return;commit(()=>applyStyle(getProject(),getSelection(),{[el.dataset.batch]:el.type==='number'?Number(el.value):el.value}));};});
  const size=box.querySelector('#canvas-match-size');if(size){size.disabled=editable.length<2;size.onchange=()=>{if(size.value)commit(()=>matchSize(getProject(),getSelection(),size.value));};}
  box.querySelectorAll('[data-neighbors]').forEach(b=>b.onclick=()=>select(relatedSelection(getProject(),getSelection(),b.dataset.neighbors)));
 }
 function sync(inspect=true){
  const ns=getProject().nodes.filter(n=>getSelection().has(n.id));$('#canvas-style-copy').disabled=ns.length!==1||ns[0].type==='image';$('#canvas-style-paste').disabled=!styleClipboard||!movable(getProject(),getSelection()).some(n=>n.type!=='image');
  if(inspect){$('.canvas-style-studio')?.remove();inspectorExtras();installSelectionOptions(api);}
 }

 const dialog=document.createElement('dialog');dialog.className='canvas-command-dialog';dialog.setAttribute('aria-label',s('Command palette and object finder','Komut paleti ve nesne bulucu'));
 dialog.innerHTML=`<div class="command-search"><span aria-hidden="true">⌕</span><input id="canvas-command-query" aria-label="${s('Search commands and objects','Komut ve nesne ara')}" role="combobox" aria-expanded="true" aria-controls="canvas-command-results" aria-autocomplete="list" autocomplete="off" placeholder="${s('Search commands, shapes, or type @ to find objects…','Komut, şekil ara; nesne bulmak için @ yaz…')}"><button id="canvas-command-close" aria-label="${s('Close','Kapat')}">Esc</button></div><div id="canvas-command-results" role="listbox" aria-label="${s('Results','Sonuçlar')}"></div><footer><span>↑ ↓ ${s('navigate','gezin')} · Enter ${s('run','uygula')}</span><span>Ctrl / ⌘ K</span></footer>`;
 document.body.append(dialog);const commandInput=$('#canvas-command-query'),results=$('#canvas-command-results');let current=[],active=0;
 const commands=[['canvas-undo','Undo','Geri al','Ctrl Z'],['canvas-redo','Redo','Yinele','Ctrl Shift Z'],['canvas-auto-layout','Auto arrange','Otomatik düzenle',''],['canvas-select-all','Select all','Tümünü seç','Ctrl A'],['canvas-group','Group selection','Seçimi grupla','Ctrl G'],['canvas-ungroup','Ungroup selection','Grubu çöz','Ctrl Shift G'],['canvas-duplicate','Duplicate selection','Seçimi çoğalt','Ctrl D'],['canvas-delete','Delete selection','Seçimi sil','Delete'],['canvas-lock','Lock selection','Seçimi kilitle',''],['canvas-unlock','Unlock selection','Seçimin kilidini aç',''],['canvas-distribute-x','Distribute horizontally','Yatay eşit dağıt',''],['canvas-distribute-y','Distribute vertically','Dikey eşit dağıt',''],['canvas-fit','Fit drawing','Çizime sığdır',''],['canvas-fit-selection','Focus selection','Seçime odaklan',''],['canvas-focus','Toggle focus mode','Odak modunu değiştir',''],['canvas-style-copy','Copy style','Biçimi kopyala',''],['canvas-style-paste','Paste style','Biçimi yapıştır',''],['canvas-save','Save project JSON','Proje JSON indir','Ctrl S'],['canvas-open','Open project','Proje aç',''],['canvas-svg','Export SVG','SVG indir',''],['canvas-png','Export PNG','PNG indir',''],['canvas-llm','Export LLM brief','LLM dökümü hazırla',''],['canvas-llm-draw','Draw with LLM','LLM ile çiz','']];
 function updateActive(){results.querySelectorAll('[role=option]').forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));if(current.length)commandInput.setAttribute('aria-activedescendant','canvas-command-result-'+active);else commandInput.removeAttribute('aria-activedescendant');results.children[active]?.scrollIntoView({block:'nearest'});}
 function renderResults(){
  const raw=commandInput.value.trim(),find=raw.startsWith('@'),q=(find?raw.slice(1):raw).toLocaleLowerCase();
  current=find?searchObjects(getProject(),q).map(n=>({title:n.text.split('\n')[0]||s('Untitled object','Adsız nesne'),hint:(shapeCatalog.find(t=>t.type===n.type)?.[lang]||n.type)+(n.locked?' · '+s('Locked','Kilitli'):''),run:()=>select(new Set([n.id]),true)})):
   [...commands.filter(([id,en,tr])=>$( '#'+id)&&!$('#'+id).disabled&&`${en} ${tr}`.toLocaleLowerCase().includes(q)).map(([id,en,tr,key])=>({title:s(en,tr),hint:key||s('Command','Komut'),run:()=>$('#'+id).click()})),...shapeCatalog.filter(t=>`${t.en} ${t.tr} ${t.type}`.toLocaleLowerCase().includes(q)).map(t=>({title:s('Add ','Ekle: ')+t[lang],hint:s('Shape','Şekil'),run:()=>addShape(t.type,center())}))];
  if(!find&&!q)current.unshift({title:s('Find an object…','Bir nesne bul…'),hint:'@',run:()=>open('@')});
  active=0;results.innerHTML=current.map((r,i)=>`<div role="option" id="canvas-command-result-${i}" data-result="${i}" aria-selected="${i===0}"><span>${esc(r.title)}</span><small>${esc(r.hint)}</small></div>`).join('')||`<p class="command-empty">${s('No results. Try a different search.','Sonuç yok. Başka bir sözcük dene.')}</p>`;
  results.querySelectorAll('[data-result]').forEach(el=>el.onclick=()=>run(Number(el.dataset.result)));updateActive();
 }
 function run(index){const action=current[index];if(!action)return;dialog.close();action.run();}
 function open(query=''){api.beforeOpen();commandInput.value=query;renderResults();if(!dialog.open)dialog.showModal();commandInput.focus();}
 $('#canvas-command-palette').onclick=()=>open();$('#canvas-find').onclick=()=>open('@');$('#canvas-command-close').onclick=()=>dialog.close();commandInput.oninput=renderResults;
 dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
 commandInput.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','Enter'].includes(e.key)){e.preventDefault();if(e.key==='Enter')run(active);else if(current.length){active=(active+(e.key==='ArrowDown'?1:-1)+current.length)%current.length;updateActive();}}});
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){if(document.querySelector('dialog[open]')&&!dialog.open)return;e.preventDefault();dialog.open?dialog.close():open();}});

 function editText(nodeId){
  const n=getProject().nodes.find(n=>n.id===nodeId);if(!n||n.locked||n.type==='image')return;
  finishInline(true);const el=$(`#canvas-paper [data-node="${nodeId}"]`),stage=$('#canvas-stage');if(!el)return;
  const b=el.getBoundingClientRect(),sb=stage.getBoundingClientRect(),editor=document.createElement('div');editor.className='canvas-inline-editor';
  const width=Math.min(Math.max(b.width,210),Math.max(210,sb.width-20)),height=Math.min(Math.max(b.height,110),260);
  editor.style.left=Math.max(5,Math.min(b.left-sb.left,sb.width-width-5))+'px';editor.style.top=Math.max(5,Math.min(b.top-sb.top,sb.height-height-35))+'px';editor.style.width=width+'px';
  editor.innerHTML=`<textarea aria-label="${s('Edit object text','Nesne metnini düzenle')}" maxlength="1200" style="height:${height}px"></textarea><div><span>Ctrl / ⌘ Enter · Esc</span><button>${s('Done','Tamam')}</button></div>`;
  stage.append(editor);const input=editor.querySelector('textarea');input.style.height=height+'px';input.value=n.text;inline={editor,input,id:nodeId};
  editor.addEventListener('pointerdown',e=>e.stopPropagation());editor.addEventListener('dblclick',e=>e.stopPropagation());editor.addEventListener('wheel',e=>e.stopPropagation());
  editor.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();finishInline(false);}else if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();finishInline(true);}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();finishInline(true);$('#canvas-save').click();}});
  editor.querySelector('button').onclick=()=>finishInline(true);input.focus();input.select();
 }
 function finishInline(save){if(!inline)return;const current=inline;inline=null;current.editor.remove();if(save)commit(()=>{const n=getProject().nodes.find(n=>n.id===current.id);if(n&&!n.locked)n.text=current.input.value;});$('#canvas-stage').focus({preventScroll:true});}
 document.addEventListener('pointerdown',e=>{if(inline&&!inline.editor.contains(e.target))finishInline(true);},true);
 window.addEventListener('resize',()=>finishInline(true));
 return {sync,changed,editText,finishInline,remember:type=>{recent=[type,...recent.filter(t=>t!==type)].slice(0,10);if(category==='recent')filterLibrary();}};
}
