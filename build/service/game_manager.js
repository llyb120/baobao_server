"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let SDGame = require('../../game_server/majiang/henmj_game');
class GameManager {
    addNewGame(gameType, roomInfo) {
        let controller;
        switch (gameType) {
            case 'henanmajiang':
                controller = new SDGame(roomInfo);
                break;
        }
        controller.game = {
            players: [],
            sockets: [],
            controller: controller,
            roomInfo: roomInfo
        };
        this.games[roomInfo.roomId] = controller;
    }
    hasGame(roomId) {
        return this.games[roomId];
    }
}
exports.gameManagerService = new GameManager;
