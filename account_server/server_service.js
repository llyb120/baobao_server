const socketio = require("socket.io");
const config = require("../config");

var ServerList = {};
var io;


/**
 * 注册游戏服务器
 * @param socket
 * @param data
 */
function registerServer(socket,data) {
    if (data.auth != config.REGISTER_SERVER_SIGN) {
        return;
    }
    var cfg = JSON.parse(data.query);
    var uuid = cfg.server + ":" + cfg.port;

    //如果已经注册了个这个服务器，那么更新服务器的负载
    if(ServerList[socket.id]){
        cfg.currentPlayerCount = ServerList[socket.id].currentPlayerCount;
        cfg.currentRoomCount = ServerList[socket.id].currentRoomCount;
        cfg.rooms = ServerList[socket.id].rooms;
        cfg.users = ServerList[socket.id].users;
    }
    else{
        cfg.currentPlayerCount = 0;
        cfg.currentRoomCount = 0;
        cfg.rooms = {};
        cfg.users = {};
    }

    ServerList[socket.id] = (cfg);
    console.log(`registered server '${cfg.gameType}' on ${uuid}`);
}


/**
 * 查找一个负载较低的服务器
 */
exports.findServer = (gameType) => {
    var target,max = 0;
    for(var socketId in ServerList){
        var server = ServerList[socketId];
        if(server.gameType.indexOf(gameType) == -1 ) continue;

        if(max == 0 || server.currentRoomCount > max){
            target = socketId;
            max = server.currentRoomCount;
        }
    }
    return [target,ServerList[target]];
};


/**
 * 得到服务器的详细地址
 */
exports.getServerInfo = (socketId) =>{
    return ServerList[socketId];
};

/***************************************************************/

/**
 * 用户进入
 */
exports.onUserEnter = function (socketId,server,roomInfo,userId) {
    io.sockets.sockets[socketId].emit('user_enter_push',{
        roomId : roomInfo.roomId,
        userId : userId
    });
    //console.log(server.rooms[roomInfo.roomId].players.size)
    //console.log(roomInfo.gameConfig.playerCount)
    var serverRoom = server.rooms[roomInfo.roomId];
    if(serverRoom.players.size == roomInfo.gameConfig.playerCount){
        if(serverRoom.state == 'free'){
            io.sockets.sockets[socketId].emit("game_start_push",{
                roomId : roomInfo.roomId
            });
            serverRoom.state = 'gaming';
        }

    }
};


/**
 * 通知游戏服务器准备房间
 */
exports.onCreateRoom = (socketId,roomInfo) => {
    var server = exports.getServerInfo(socketId);
    if(!server){
        return false;
    }
    var set = server.rooms[roomInfo.roomId] = {
        players : new Set,
        gameType : roomInfo.gameConfig.gameType,
        playerCount : roomInfo.gameConfig.playerCount
    };
    set.players.add(roomInfo.creator);
    //
    // //存储房间号码以及用户状态
    // server.rooms[roomInfo.roomId] = {
    //     state : "free",
    //     //creator : roomInfo.creator,
    //     players : new Set,
    //     roomInfo : roomInfo
    // };
    // server.rooms[roomInfo.roomId].players.add(roomInfo.creator);
    //
    // server.users[roomInfo.creator] = {
    //     roomId : roomInfo.roomId,
    //     state : "ready"
    // };
    //子游戏服务器准备
    io.sockets.sockets[socketId].emit("prepare_room_order",roomInfo);

    //用户进入事件
    //exports.onUserEnter(socketId,server,roomInfo,roomInfo.creator);
    return true;
};

/**
 * 用户加入
 * @param socketId
 * @param userId
 */
exports.onJoinRoom = (socketId,roomId,userId) =>{
    var server = exports.getServerInfo(socketId);
    if(!server){
        return false;
    }

    // //更改玩家状态
    // server.users[userId] = {
    //     roomId : roomInfo.roomId,
    //     state : "ready"
    // };
    server.rooms[roomId].players.add(userId);
    // exports.onUserEnter(socketId,server,roomInfo,userId);
    return true;
};

/**
 * 退出或解散房间
 * @param socketId
 * @param userId
 * @returns {boolean}
 */
exports.onExitRoom = (socketId,userId) => {
    var server = exports.getServerInfo((socketId));
    if(!server){
        return false;
    }
    var roomid = server.users[userId].roomId;
    var roomInfo = server.rooms[roomid];
    //通常退出
    if(roomInfo.state == 'free'){
        if(roomInfo.creator == userId){
            //全体删除
            roomInfo.players.forEach(function (uid) {
                delete server.users[uid];
            });
            return delete server.rooms[roomid];
        }
        else{
            return delete server.users[userId];
        }
    }
    //游戏中申请解散房间
    else{

    }

    // if(room.state == 'free'){
    //
    // }
    return false;
};

/***************************************************************/

exports.ifRoomExists = (roomNumber) => {
    for(var socketId in ServerList){
        var server = ServerList[socketId];
        if(server.rooms[roomNumber]){
            return true;
        }
    }
    return false;
};

exports.getRoomNumberByUserId = (userId) => {
    for(var socketId in ServerList){
        var server = ServerList[socketId];
        for(var roomId in server.rooms){
            if(server.rooms[roomId].players.has(userId)){
                return roomId;
            }
        }
        // if(server.rooms.has(userId)){
        //     return
        // }
        // if(server.users[userId]){
        //     return server.users[userId].roomId;
        // }
    }
    return null;
};

exports.getValidRoom = function (gameType) {
    for(var socketId in ServerList){
        var server = ServerList[socketId];
        if(server.gameType.indexOf(gameType) === -1){
            continue;
        }
        for(var roomId in server.rooms){
            if(server.rooms[roomId].players.size < server.rooms[roomId].playerCount){
                return roomId;
            }
        }
    }
    return null;
};

exports.getServerByRoomId = (roomId) => {
    for(var socketId in ServerList){
        var server = ServerList[socketId];
        if(server.rooms[roomId]){
            var maxPlayer = server.rooms[roomId].gameType;
            if (server.rooms[roomId].players.size >= maxPlayer) {
                continue;
            }
            return [socketId,server];
        }
    }
    return [null,null];
};

exports.getServerByUserId = (userId) => {
    for(var socketId in ServerList){
        var server = ServerList[socketId];
        if(server.users[userId]){
            return [socketId,server];
        }
    }
    return [null,null];
};


exports.start = () => {
    io = socketio.listen(config.HALL_SERVER_SOCKET.port);
    io.on("connection",(socket) => {
        socket.on("registerServer",(data) => registerServer(socket,data));

        socket.on("disconnect",() => {
            if(ServerList[socket.id]){
                delete ServerList[socket.id];
            }
            // console.log(ServerList)
        });

        socket.on("clear_room",function (data) {
            if(ServerList[socket.id] && ServerList[socket.id].rooms[data.roomId]){
                delete ServerList[socket.id].rooms[data.roomId];
            }
        })

        socket.on("user_exit",function (data) {
            var room = ServerList[socket.id].rooms[data.roomId];
            room.players.delete(data.userId);
            delete ServerList[socket.id].users[data.userId];
        })


    });





    console.log("HALL_REGISTER_SERVER is listening " + config.HALL_SERVER_SOCKET.port);

};

