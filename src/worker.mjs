import {parentPort,workerData} from 'node:worker_threads';
import * as canvas from './index.mjs';
try{parentPort.postMessage({value:canvas[workerData.method](...workerData.args)});}catch(error){parentPort.postMessage({error:error.message});}
