import fs from 'node:fs';
import {createDiagram,exampleDiagram,exportDiagram} from '../src/index.mjs';
const {project,issues}=createDiagram(exampleDiagram);
// The example explicitly writes only these two named outputs in the current directory.
fs.writeFileSync('order.filemigo.json',exportDiagram(project,{format:'json'}));
fs.writeFileSync('order.svg',exportDiagram(project));
console.log('Saved order.filemigo.json and order.svg. Review warnings:',issues);
