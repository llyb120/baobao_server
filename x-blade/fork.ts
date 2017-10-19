import * as express from 'express';
import {V} from 'x-engine';
import * as http from 'http';
import { HTTP_PORT, DATABASE } from './config';
import { X } from 'x-orm';
import { AccountController } from './ctrl/account';
import { GameGateController } from './ctrl/gate';

// let app = express();
export let app = express();

let server = http.createServer(app);

/**
 * 注册控制器START
 */
AccountController;
GameGateController;

/**
 * 注册控制器END
 */

V.startExpressServer({
    server,
    app,
    crossDomain:true
});

let port = parseInt(process.argv[2]);
if(port !== port || port <= 0){
    port = HTTP_PORT;
}
server.listen(port);
console.log("游戏服务器在" + port + '启动')

X.startORM(DATABASE);

let {start} = require("../account_server/app");
start(app);
