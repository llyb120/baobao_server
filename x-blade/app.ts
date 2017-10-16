import * as express from 'express';
import {V} from 'x-engine';
import * as http from 'http';
import { HTTP_PORT, DATABASE } from './config';
import { X } from 'x-orm';
import { AccountController } from './ctrl/account';

let app = express();
let server = http.createServer(app);

/**
 * 注册控制器START
 */
AccountController;
/**
 * 注册控制器END
 */

V.startExpressServer({
    server,
    app,
    crossDomain:true
});
server.listen(HTTP_PORT);
console.log("游戏服务器在" + HTTP_PORT + '启动')

X.startORM(DATABASE);

let {start} = require("../account_server/app");
start(app);