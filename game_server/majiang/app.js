const config = require("../../config");
const serverConfig = require('./config');
// const request = require('../../common/http');
const gameServer = require("./server");
const client = require("socket.io-client");
const prepare = require("./room");

/**
 向服务端注册服务器
 *
 */
function registerServer(){
    io.emit("registerServer",{
        auth : config.REGISTER_SERVER_SIGN,
        query : JSON.stringify(serverConfig.SERVER)
    });
}

var Games = {
    rooms : {

    },
    sockets : {

    },
    players : {

    }
    /**
     * rooms : {
     *      roomId : {
     *          players : [],
     *          controller : MJGame
     *      }
     * },
     * players : {
     *
     * },
     * sockets : {
     * }
     *
     */
};



var io = client("http://" + config.HALL_SERVER_SOCKET.server + ":" + config.HALL_SERVER_SOCKET.port);
io.on("connect",() => {
    console.log("HALL SERVER CONNECTED")
    registerServer();
});
io.on("disconnect",() => {
    console.error("HALL SERVER DISCONNECTED")
    Games.rooms = {};
    Games.players = {};
});


global.GameServer = gameServer;
global.Games = Games;
global.RoomServer = io;

/**
 * 杂项处理器
 */
prepare.start();

/**
 * 游戏服务器开始
 */
try{
    gameServer.start();
}
catch(e){
    console.log(e);
}

console.log("registering server " + `http://${config.HALL_SERVER.server}:${config.HALL_SERVER.port}/registerServer`);


