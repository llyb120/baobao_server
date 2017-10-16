const MJGame = require("./mj_game");
const SDGame = require("./sd_game");
const PDKGame = require("./pdk_game");
const HENMJGame = require("./henmj_game");
const DDZGame = require('./ddz_game');


exports.start = function () {

    var io = global.RoomServer;
    var gameServer = global.GameServer;
    var Games = global.Games;

    /**
     * 准备游戏房间
     */
    io.on("prepare_room_order", function (roomInfo) {
        var controller;
        switch (roomInfo.gameConfig.gameType) {
            case 'sandai':
                controller = new SDGame(roomInfo);
                break;

            case 'shanximajiang':
                controller = new MJGame((roomInfo));
                break;

            case 'henanmajiang':
                controller = new HENMJGame(roomInfo);
                break;

            case 'doudizhu':
                controller = new DDZGame(roomInfo);
                break;

            case 'paodekuai':
                controller = new PDKGame(roomInfo);

                break;
        }
        // if (roomInfo.gameConfig.gameType == 'sandai') {

        // }
        // else if (roomInfo.gameConfig.gameType == 'shanximajiang') {
        //     controller = new MJGame((roomInfo));
        // }
        // else if (roomInfo.gameConfig.gameType == "henanmajiang") {
        //     controller = new HENMJGame(roomInfo);
        // }
        // else if (roomInfo.gameConfig.gameType == 'doudizhu') {
        //     controller = new DDZGame(roomInfo);
        // }
        // else if (roomInfo.gameConfig.gameType == 'paodekuai') {
        //     controller = new PDKGame(roomInfo);
        // }
        controller.game = Games.rooms[roomInfo.roomId] = {
            players: [],
            sockets: [],
            controller: controller,
            roomInfo: roomInfo
        }
    });
    //
    //
    /**
     * 游戏房间解散
     */
    io.on("dismiss_room_push", function (data) {
        gameServer.dismissRoom(data);
    });


    /**
     * 用户进入
     */
    // io.on("user_enter_push",function (data) {
    //     var roomId = data.roomId,
    //         userId = data.userId;
    //     /**
    //      * 不存在的情况
    //      */
    //     if(!Games.rooms[roomId]){
    //         Games.rooms[roomId] = {
    //             players : new Set
    //         };
    //         Games.rooms[roomId].controller = new MJGame(roomId,Games.rooms[roomId]);
    //     }
    //
    //     Games.rooms[roomId].players.add(userId);
    //
    // });


    /**
     * 开始游戏
     */
    // io.on("game_start_push",function (data) {
    //     if(data.roomId <= 0){
    //         return;
    //     }
    //     gameServer.startGame(data.roomId);
    // });

};