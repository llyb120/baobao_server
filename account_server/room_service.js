const db = require("../common/db");
const utils = require('../common/utils');
const config = require('../config');


exports.start = (app) => {

    var serverService = global.ServerService;
    /**
     * 创建房间
     */
    app.get("/createRoom", async (req, res) => {
        var query = JSON.parse(req.query.query);

        //验证用户信息
        var userinfo = await utils.getUserInfoByToken(query.token);
        if (!userinfo || !userinfo.length) {
            return utils.sendFailed(res, {}, -1, "invalid user");
        }
        userinfo = userinfo[0];

        //如果该用户已经在房间里，那么禁止他再创建房间
        var roomid = serverService.getRoomNumberByUserId(userinfo.id);
        if (roomid) {
            var [socketId, server] = global.ServerService.getServerByRoomId(roomid);
            //if(server){
            return utils.sendSuccess(res, {
                roomId: roomid,
                gameType: server.rooms[roomid].gameType,
                gameServer: {
                    server: server.server,
                    port: server.port
                }
            });
            //}
            //return utils.sendFailed(res,{roomId : roomid},1,"user is in this room");
        }

        var gameConfig = query.gameConfig;

        var [socketId, server] = serverService.findServer(gameConfig.gameType);
        //如果没有找到可用的房间，那么断开连接
        if (!server) {
            return utils.sendFailed(res, {}, -3, "can't find server");
        }
        //如果找到了可用的服务器
        //创建房间
        var roomId;
        do {
            roomId = utils.rand(100000, 999999);
        } while (serverService.ifRoomExists(roomId));

        //验证人数
        var playerCount = gameConfig.playerCount || 0;
        if (playerCount < config.MIN_PLAYER || playerCount > config.MAX_PLAYER) {
            return utils.sendFailed(res, {}, -4, "player count error");
        }

        var costList = {
            8: 1,
            16: 2
        };
        var playCount = gameConfig.playcount || 8;
        if (userinfo.zuan < costList[playCount]) {
            return utils.sendFailed(res, {}, -5, "hasn't enough zuan");
        }

        //查找一个可用的房间号
        var roomInfo = {
            roomId: roomId,
            creator: userinfo.id,
            gameServer: {
                server: server.server,
                port: server.port
            },
            gameConfig: gameConfig,
            gameType: gameConfig.gameType

        };

        //通知游戏服务器准备房间
        if (serverService.onCreateRoom(socketId, roomInfo)) {
            return utils.sendSuccess(res, roomInfo);
        }
        return utils.sendFailed(res);

    });


    /**
     * 加入房间
     */
    app.get("/joinRoom", async (req, res) => {
        var query = JSON.parse(req.query.query),
            gameType = query.gameType,
            roomId = query.roomId,
            token = query.token;

        //验证用户信息
        var userinfo = await utils.getUserInfoByToken(token);
        if (!userinfo || !userinfo.length) {
            return utils.sendFailed(res, {}, -1, "invilid user");
        }
        userinfo = userinfo[0];

        //如果该用户已经在房间里，那么禁止他再加入房间
        var roomid = serverService.getRoomNumberByUserId(userinfo.id);
        if (roomid) {
            var [socketId, server] = serverService.getServerByRoomId(roomid);
            return utils.sendSuccess(res, {
                gameServer: {
                    server: server.server,
                    port: server.port
                },
                roomId: roomId,
                gameType: server.rooms[roomId].gameType
            });
        }

        //查找该房间所在服务器
        var [socketId, server] = serverService.getServerByRoomId(roomId);
        if (!server) {
            return utils.sendFailed(res, {}, -2, "server doesn't exist");
        }

        //检查游戏类型是否正确
        // if (gameType != server.rooms[roomId].gameType) {
        //     return utils.sendFailed(res, {}, -3, "加入房间失败，游戏类型错误！");
        // }

        //检查人数
        var maxPlayer = server.rooms[roomId].playerCount;
        if (server.rooms[roomId].players.size >= maxPlayer) {
            return utils.sendFailed(res, {}, -3, "加入房间失败，游戏人数已满！");
        }
        //var roomInfo = server.rooms[roomId].roomInfo;
        //通知游戏服务器用户加入
        if (serverService.onJoinRoom(socketId, roomId, userinfo.id)) {
            return utils.sendSuccess(res, {
                gameServer: {
                    server: server.server,
                    port: server.port
                },
                roomId: roomId,
                gameType: server.rooms[roomId].gameType
            });

        }

        return utils.sendFailed(res);

    });


    /**
     * 退出房间
     */
    app.get("/exitRoom", async (req, res) => {
        var query = JSON.parse(req.query.query)
        token = query.token;

        //验证用户信息
        var userinfo = await utils.getUserInfoByToken(token);
        if (!userinfo || !userinfo.length) {
            return utils.sendFailed(res, {}, -1, "invilid user");
        }
        userinfo = userinfo[0];

        //如果不在房间里，那么你退什么呢
        var [socketId, server] = serverService.getServerByUserId(userinfo.id);
        if (!server) {
            return utils.sendFailed(res, {}, 1, "you needn't quit");
        }
        if (serverService.onExitRoom(socketId, userinfo.id)) {
            console.error(server.rooms);
            console.error(server.users);
            return utils.sendSuccess(res);
        }

        return utils.sendFailed(res);
    });

    app.get("/searchRoom", async function (req, res) {
        var query = JSON.parse(req.query.query);

        //验证用户信息
        var userinfo = await utils.getUserInfoByToken(query.token);
        if (!userinfo || !userinfo.length) {
            return utils.sendFailed(res, {}, -1, "invilid user");
        }
        userinfo = userinfo[0];
        var roomid = serverService.getValidRoom(query.gameType);
        if (roomid) {
            var [socketId, server] = global.ServerService.getServerByRoomId(roomid);
            if (serverService.onJoinRoom(socketId, roomid, userinfo.id)) {
                return utils.sendSuccess(res, {
                    roomId: roomid,
                    gameType: server.rooms[roomid].gameType,
                    gameServer: {
                        server: server.server,
                        port: server.port
                    }
                });
            }
        }
        else {
            var [socketId, server] = serverService.findServer(gameConfig.gameType);
            //如果没有找到可用的房间，那么断开连接
            if (!server) {
                return utils.sendFailed(res, {}, -3, "can't find server");
            }
            //如果找到了可用的服务器
            //创建房间
            var roomId;
            do {
                roomId = utils.rand(100000, 999999);
            } while (serverService.ifRoomExists(roomId));

            var roomInfo = {
                roomId: roomId,
                creator: userinfo.id,
                gameServer: {
                    server: server.server,
                    port: server.port
                },
                gameConfig: gameConfig,
                gameType: gameConfig.gameType

            };

            //通知游戏服务器准备房间
            if (serverService.onCreateRoom(socketId, roomInfo)) {
                return utils.sendSuccess(res, roomInfo);
            }
        }
        return utils.sendFailed(res);

    });


    /**
     * 检查是否在游戏房间
     */
    app.get("/checkInGame", async function (req, res) {
        var token = req.query.token;
        if (!token) {
            return utils.sendFailed(res);
        }
        var userinfo = await utils.getUserInfoByToken(token);
        if (!userinfo || !userinfo.length) {
            return utils.sendFailed(res);
        }
        var roomId = global.ServerService.getRoomNumberByUserId(userinfo[0].id);
        var [socketId, server] = global.ServerService.getServerByRoomId(roomId);
        if (server) {
            return utils.sendSuccess(res, {
                roomId: roomId,
                gameType: server.rooms[roomId].gameType,
                gameServer: {
                    server: server.server,
                    port: server.port
                }
            });
        }
        return utils.sendFailed(res);


    });
};