import fs from 'node:fs/promises';
import {build} from 'esbuild';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Keep the desktop renderer, standalone browser SDK and MCP App on the same model.
for(const name of await fs.readdir(path.join(root,'src/core'))){
 if(name.endsWith('.mjs'))await fs.copyFile(path.join(root,'src/core',name),path.join(root,'desktop/web',name));
}
await build({entryPoints:[path.join(root,'src/index.mjs')],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:path.join(root,'desktop/web/developer-sdk.mjs')});
const bundle=await build({entryPoints:[path.join(root,'src/app-view.mjs')],bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,write:false});
const template=await fs.readFile(path.join(root,'src/app-view.html'),'utf8');
await fs.writeFile(path.join(root,'src/app.html'),template.replace('<!--APP_SCRIPT-->',()=>'<script>'+bundle.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script>'));
console.log('Desktop core, browser SDK and MCP App rebuilt from one source.');
