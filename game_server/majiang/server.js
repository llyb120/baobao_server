const socketio = require("socket.io");
const config = require('./config');
const utils = require("../../common/utils");
const WebSocket = require('ws');

var io;
// var Users = {
//     /**
//      * userId : socketId
//      */
// };
// var Sockets = {
//     /**
//      * socketId : userId
//      */
// };

// function getSocketId(userId) {
//     return Users[userId] || null;
// }
//
// function onConnect(socket) {
//     console.log("onConnect");
//     socket.on("disconnect",onDisconnect);
//     socket.on("error",onError);
//     socket.on("news",(data) => onNews(socket,data))
//     socket.on("test",function () {
//         console.log(12332132131231231)
//     })
// }
//
// function onDisconnect(socket) {
//     console.error(socket);
//     console.log("onDisconnect");
// }

// function onError(socket) {
//     console.log("onError");
// }
//
// function onNews(socket,data) {
//     socket.emit("Fuck")
// }

/**
 * 得到用户所在房间的信息
 * @param userId
 * @returns {*}
 */
function getUserInRoom(Games,userId) {
    for(var i = 0; i < Games.rooms.length; i++){
        var index = -1;
        if((index = Games.rooms[i].players.indexOf(userId)) > -1){
            return [i,index];
        }
    }
    return [0,0];
}

/**
 * 得到游戏的控制器
 * @param socketId
 * @returns {*|null}
 */
function getGameInfo(socketId) {
    return Games.sockets[socketId] || null;
}



exports.start = () => {

    const wss = new WebSocket.Server({port : config.SERVER.port});
    wss.on('connection', function connection(ws) {

        var enterRoom = async function (data) {
            var token = data.token,
                roomId = data.roomId;
            var games = global.Games;
            if(!token){
                return;
            }
            var userInfo = await utils.getUserInfoByToken(token);
            if(!userInfo || !userInfo.length){
                return;
            }
            userInfo = userInfo[0];
            if(!games.rooms[roomId]){
                return;
            }

            var index = games.rooms[roomId].players.indexOf(userInfo.id);

            //已经进入 需要同步
            if(index > -1){
                games.rooms[roomId].sockets[index] = ws;
                var controller = games.rooms[roomId].controller;
                if(controller._state == 'free'){
                    games.rooms[roomId].controller._ready[index] = 'ready';
                    controller.sendToRoom('user_ready_push',{chairId:index});
                    if(controller._ready.filter(function (item) {
                            return item == 'ready'
                        }).length == controller._roomInfo.gameConfig.playerCount){
                        controller.start();
                    }
                    else{
                        games.rooms[roomId].controller.sync(index);
                    }
                }
                else{
                    games.rooms[roomId].controller.sync(index);
                }
            }
            //第一次进入
            else{
                var index = -1;
                for(var i = 0; i < games.rooms[roomId].players.length; i++){
                    if(games.rooms[roomId].players[i] === null){
                        index = i;
                        break;
                    }
                }
                if(index == -1) index = games.rooms[roomId].players.length;
                games.rooms[roomId].players[index] = userInfo.id;
                games.rooms[roomId].sockets[index] = ws;

                // games.rooms[roomId].players.push(userInfo.id);
                // games.rooms[roomId].sockets.push(socket.id);
                // games.players[userInfo.id] = {
                //     controller : games.rooms[roomId].controller
                // }
                games.rooms[roomId].controller.onUserEnter(index,userInfo);
                // games.rooms[roomId].controller.sendToRoom("enter_success_push",{
                //     roomInfo : games.rooms[roomId].roomInfo,
                //     chairId : games.rooms[roomId].players.length - 1
                // });
                // socket.emit("enter_success_push",{
                //
                // });
                var roomInfo = games.rooms[roomId].roomInfo;
                if(games.rooms[roomId].players.filter(function (item) {
                        return item !== null;
                    }).length == roomInfo.gameConfig.playerCount){
                    var gameMgr = games.rooms[roomId].controller;
                    gameMgr.start();
                }
            }
        };

        ws.on('message', function incoming(message) {
            var data = JSON.parse(message);
            if(!data.event){
                return;
            }
            var _data = data.data || {};
            if(!_data.roomId){
                return;
            }
            var room = global.Games.rooms[_data.roomId];
            if(!room){
                ws.send(JSON.stringify({
                    event : "error_room_push"
                }))
                return;
            }
            //用户进入房间的特殊事件
            if(data.event == 'enter_room_pull'){
                return enterRoom(_data);
            }
            else if(data.event == 'dismiss_room_pull'){
                var chairId = room.sockets.indexOf(ws);
                if(!room.controller._isBegin){
                    if(chairId == 0){
                        room.controller.sendToRoom("dismiss_room_success_push");
                        room.controller.forceDismissRoom();
                    }
                    else if(chairId > -1){
                        room.controller.onUserExit(chairId);
                        room.controller.sendToChair(chairId,"dismiss_room_success_push");
                        room.sockets[chairId] = null;
                        room.players[chairId] = null;

                    }
                }
                else{
                    if(chairId > -1){
                        room.controller.onDismissRoom(chairId,_data.agree);
                    }
                }
            }
            else if(data.event == 'chat_msg_pull'){
                var chairId = room.sockets.indexOf(ws);
                if(chairId > -1){
                    _data.chairId = chairId;
                    room.controller.sendToRoom("chat_msg_push",_data);
                }
            }
            // else if(data.event == 'ready_pull'){
            //     return setReady(_data);
            // }

            var socketIndex = room.sockets.indexOf(ws);
            if(socketIndex == -1){
                return;
            }
            room.controller.onMessage(socketIndex,data.event,_data);
        });

    });

    console.log(`gameServer is listening on ${config.SERVER.server}:${config.SERVER.port}`)

    return;



    // global.IO = io = socketio.listen(config.SERVER.port);
    //
    // /**
    //  * 连接服务器
    //  */
    // io.on("connection",function (socket) {
    //     // socket.emit("message",{
    //     //     fuck : 1
    //     // });
    //     console.log(socket.id)
    //     /**
    //      * 验证用户
    //      */
    //     // socket.on("enter_room_push",async function (data) {
    //     //
    //     //
    //     // });
    //
    //     var enterRoom = async function (data) {
    //         var token = data.token,
    //             roomId = data.roomId;
    //         var games = global.Games;
    //         if(!token){
    //             return;
    //         }
    //         var userInfo = await utils.getUserInfoByToken(token);
    //         if(!userInfo || !userInfo.length){
    //             return;
    //         }
    //         userInfo = userInfo[0];
    //         if(!games.rooms[roomId]){
    //             return;
    //         }
    //
    //         var index = games.rooms[roomId].players.indexOf(userInfo.id);
    //
    //         //已经进入 需要同步
    //         if(index > -1){
    //             games.rooms[roomId].sockets[index] = socket.id;
    //             var controller = games.rooms[roomId].controller;
    //             if(controller._state == 'free'){
    //                 games.rooms[roomId].controller._ready[index] = 'ready';
    //                 if(controller._ready.filter(function (item) {
    //                         return item == 'ready'
    //                     }).length == controller._roomInfo.gameConfig.playerCount){
    //                     controller.start();
    //                 }
    //                 else{
    //                     games.rooms[roomId].controller.sync();
    //                 }
    //             }
    //             else{
    //                 games.rooms[roomId].controller.sync();
    //             }
    //         }
    //         //第一次进入
    //         else{
    //             var index = -1;
    //             for(var i = 0; i < games.rooms[roomId].players.length; i++){
    //                 if(games.rooms[roomId].players[i] === null){
    //                     index = i;
    //                     break;
    //                 }
    //             }
    //             if(index == -1) index = games.rooms[roomId].players.length;
    //             games.rooms[roomId].players[index] = userInfo.id;
    //             games.rooms[roomId].sockets[index] = socket.id;
    //
    //             // games.rooms[roomId].players.push(userInfo.id);
    //             // games.rooms[roomId].sockets.push(socket.id);
    //             // games.players[userInfo.id] = {
    //             //     controller : games.rooms[roomId].controller
    //             // }
    //             games.rooms[roomId].controller.onUserEnter(index,userInfo);
    //             // games.rooms[roomId].controller.sendToRoom("enter_success_push",{
    //             //     roomInfo : games.rooms[roomId].roomInfo,
    //             //     chairId : games.rooms[roomId].players.length - 1
    //             // });
    //             // socket.emit("enter_success_push",{
    //             //
    //             // });
    //             var roomInfo = games.rooms[roomId].roomInfo;
    //             if(games.rooms[roomId].players.filter(function (item) {
    //                     return item !== null;
    //                 }).length == roomInfo.gameConfig.playerCount){
    //                 var gameMgr = games.rooms[roomId].controller;
    //                 gameMgr.start();
    //             }
    //         }
    //     };
    //
    //     // var setReady = function (data) {
    //     //     var roomId = data.roomId;
    //     //     var controller = games.rooms[roomId].controller;
    //     //     var roomInfo = games.rooms[roomId].roomInfo;
    //     //
    //     //     var readyCount = controller._ready.filter(function (item) {
    //     //         return item == 'ready'
    //     //     }).length;
    //     //     var socketIndex = room.sockets.indexOf(socket.id);
    //     //     if(socketIndex == -1){
    //     //         return;
    //     //     }
    //     //     if(readyCount == roomInfo.gameConfig.playerCount){
    //     //         controller.start();
    //     //     }
    //     //     else{
    //     //         controller.sync();
    //     //     }
    //     // };
    //     /**
    //      * 出牌
    //      */
    //     // socket.on("action_pull",function (data) {
    //     //     var info = getGameInfo(socket.id);
    //     //     if(!info){
    //     //         return;
    //     //     }
    //     //     info.controller.onUserAction(info.chairId,data);
    //     // });
    //
    //     /**
    //      * 游戏自定义事件
    //      */
    //     socket.on("message",function (data) {
    //         if(typeof data == 'string'){
    //             data = JSON.parse(data);
    //         }
    //         if(!data.event){
    //             return;
    //         }
    //         var _data = data.data || {};
    //         if(!_data.roomId){
    //             return;
    //         }
    //         var room = global.Games.rooms[_data.roomId];
    //         if(!room){
    //             socket.send({
    //                 event : "error_room_push"
    //             })
    //             return;
    //         }
    //         //用户进入房间的特殊事件
    //         if(data.event == 'enter_room_pull'){
    //             return enterRoom(_data);
    //         }
    //         else if(data.event == 'dismiss_room_pull'){
    //             var chairId = room.sockets.indexOf(socket.id);
    //             if(!room.controller._isBegin){
    //                 if(chairId == 0){
    //                     room.controller.sendToRoom("dismiss_room_success_push");
    //                     room.controller.forceDismissRoom();
    //                 }
    //                 else if(chairId > -1){
    //                     room.controller.onUserExit(chairId);
    //                     room.controller.sendToChair(chairId,"dismiss_room_success_push");
    //
    //                 }
    //             }
    //             else{
    //                 if(chairId > -1){
    //                     room.controller.onDismissRoom(chairId,_data.agree);
    //                 }
    //             }
    //         }
    //         else if(data.event == 'chat_msg_pull'){
    //             var chairId = room.sockets.indexOf(socket.id);
    //             if(chairId > -1){
    //                 _data.chairId = chairId;
    //                 room.controller.sendToRoom("chat_msg_push",_data);
    //             }
    //         }
    //         // else if(data.event == 'ready_pull'){
    //         //     return setReady(_data);
    //         // }
    //
    //         var socketIndex = room.sockets.indexOf(socket.id);
    //         if(socketIndex == -1){
    //             return;
    //         }
    //         room.controller.onMessage(socketIndex,data.event,_data);
    //         // room.controller.onUserAction(socketIndex,data.data);
    //         // console.log("Get message!!!");
    //     });
    //
    //
    // });
    //
    //
    // console.log(`gameServer is listening on ${config.SERVER.server}:${config.SERVER.port}`)
};



