var express = require('express');
// var app = express();
var config = require('../config');
const db = require('../common/db');
// const cst  = require("../common/constant");
const accountService = require("./account_service");
const roomService = require('./room_service');
const serverService = require('./server_service');




exports.start = async(app) => {
    //设置跨域访问
    // app.all('*', function (req, res, next) {
    //     res.header("Access-Control-Allow-Origin", "*");
    //     res.header("Access-Control-Allow-Headers", "X-Requested-With");
    //     res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    //     res.header("X-Powered-By", ' 3.2.1');
    //     res.header("Content-Type", "application/json;charset=utf-8");
    //     next();
    // });

    global.App = app;
    global.ServerService = serverService;
    var cfg = {};
    //初始化设置
    // var ret = await db.query("select * from sys_config");
    // if(!ret){
    //     console.error("can't get system config");
    //     return false;
    // }
    // ret.forEach((item) => {
    //     cfg[item.name] = item.value;
    // });

    //开始服务器服务
    serverService.start();
    //开始账户服务
    accountService.start(app);
    //开始房间服务
    roomService.start(app, serverService);

    // app.listen(config.HALL_SERVER.port);
    // console.log("HALL_SERVER is listening " + config.HALL_SERVER.port);

    return true;
};

// exports.start(app);