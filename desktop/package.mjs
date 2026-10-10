import {packager} from '@electron/packager';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const result=await packager({dir:root,name:'Filemigo',executableName:'Filemigo',platform:'win32',arch:'x64',out:path.join(root,'out'),overwrite:true,asar:true,prune:true,ignore:[/^\/out(?:\/|$)/,/^\/tests(?:\/|$)/,/^\/examples(?:\/|$)/,/^\/\.git(?:\/|$)/],appVersion:'0.4.0',appCopyright:'Late Cafe Games · SezerGNDZ contributors',win32metadata:{CompanyName:'Late Cafe Games',FileDescription:'Filemigo Desktop',ProductName:'Filemigo Desktop'}});
console.log(result.join('\n'));
