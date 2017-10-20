"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const x_engine_1 = require("x-engine");
const http = require("http");
const config_1 = require("./config");
const x_orm_1 = require("x-orm");
const account_1 = require("./ctrl/account");
const gate_1 = require("./ctrl/gate");
// let app = express();
exports.app = express();
let server = http.createServer(exports.app);
/**
 * 注册控制器START
 */
account_1.AccountController;
gate_1.GameGateController;
/**
 * 注册控制器END
 */
x_engine_1.V.startExpressServer({
    server,
    app: exports.app,
    crossDomain: true
});
let port = parseInt(process.argv[2]);
if (port !== port || port <= 0) {
    port = config_1.HTTP_PORT;
}
server.listen(port);
console.log("游戏服务器在" + port + '启动');
x_orm_1.X.startORM(config_1.DATABASE);
let { start } = require("../account_server/app");
start(exports.app);
