import { WORKER_LENGTH, HTTP_PORT } from './config';
import { fork } from 'child_process';
import * as path from 'path';
let workers = [];
for(let i = 0; i < WORKER_LENGTH; i++){
    workers.push(fork(path.resolve(__dirname,'./fork'),[HTTP_PORT + i + ""]));
}


