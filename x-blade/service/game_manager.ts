import { redisService } from './redis';
import { userService } from './user_manager';

let SDGame = require('../../game_server/majiang/henmj_game');

export interface IRoomInfo{
    roomId : number;
    creator : number;
    gameServer?;
    gameConfig : {
        playerCount? : number
    };
    gameType : string;
    players : number[];
}


class GameManager{
    private games : {
        [roomid : number] : any
    } = {};

    addNewGame(gameType:string,roomInfo : IRoomInfo){
        let controller;
        switch(gameType){
            case 'henanmajiang':
                controller = new SDGame(roomInfo);
                break;
        }

        controller.game = {
            players : [],
            sockets : [],
            controller : controller,
            roomInfo : roomInfo
        }
        controller._data.roomId = roomInfo.roomId;

        this.games[roomInfo.roomId] = controller;
        this.games[roomInfo.roomId].redisService = redisService;
        controller.userService = userService;

        redisService.sub.subscribe("game_controller:" + roomInfo.roomId);
    }

    hasGame(roomId : number){
        return this.games[roomId];
    }


    

}
export const gameManagerService = new GameManager;