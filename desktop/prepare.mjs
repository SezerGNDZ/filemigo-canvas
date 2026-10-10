import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),source=path.resolve(process.argv[2]||path.join(here,'../../../dist')),dest=path.join(here,'web');
fs.mkdirSync(dest,{recursive:true});
const copied=new Set();
function copy(relative){if(copied.has(relative))return;copied.add(relative);const input=path.resolve(source,relative);if(!input.startsWith(source+path.sep))throw Error('Unsafe asset');const output=path.join(dest,relative);fs.mkdirSync(path.dirname(output),{recursive:true});fs.copyFileSync(input,output);if(relative.endsWith('.mjs'))fs.writeFileSync(output,fs.readFileSync(output,'utf8').replaceAll('bu tarayıcıda','bu uygulamada').replaceAll('Bu tarayıcıda','Bu uygulamada').replaceAll('this browser','this app'));if(/\.(mjs|js|css)$/.test(relative)){const text=fs.readFileSync(input,'utf8');for(const m of text.matchAll(/(?:from\s*|import\s*\(?\s*)['"]([^'"]+)['"]/g)){if(m[1].startsWith('./')||m[1].startsWith('/'))copy(m[1].startsWith('/')?m[1].slice(1):path.posix.normalize(path.posix.join(path.posix.dirname(relative),m[1])));}}}
for(const file of ['canvas.mjs','canvas.css','filemigo.css','filemigo-icon.png','filemigo-logo.webp','vendor/pdf-lib.mjs','canvas-developer-sdk.mjs'])if(fs.existsSync(path.join(source,file)))copy(file);
for(const language of ['tr','en']){
 const relative=language==='tr'?'tr/canvas/index.html':'canvas/index.html';let html=fs.readFileSync(path.join(source,relative),'utf8');
 html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,tag=>tag.includes('src="/canvas.mjs"')?tag:'').replace(/<meta\b[^>]*(?:google-adsense|property="og:|twitter:)[^>]*>/g,'').replace(/<link\b[^>]*(?:rel="canonical"|rel="alternate"|href="\/measurement.css"|href="\/seo.css")[^>]*>/g,'');
 html=html.replace('</head>',`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'"><link rel="stylesheet" href="/desktop.css"></head>`);
 html=html.replace(/<section class="seo-section seo-tool-help[\s\S]*?<\/main>/,'</main>').replaceAll('bu tarayıcıda','bu uygulamada').replaceAll('Bu tarayıcıda','Bu uygulamada').replaceAll('this browser','this app');
 html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>Filemigo Desktop</title>');
 fs.mkdirSync(path.dirname(path.join(dest,relative)),{recursive:true});fs.writeFileSync(path.join(dest,relative),html);
}
fs.copyFileSync(path.join(here,'desktop.css'),path.join(dest,'desktop.css'));
console.log(`Desktop assets: ${copied.size} local assets + 2 canvas pages. No analytics or remote runtime.`);
