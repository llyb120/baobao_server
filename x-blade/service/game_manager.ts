import { redisService } from './redis';
import { userService } from './user_manager';
import { QGameBase } from '../logic/game_base';

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
        [roomid : number] : QGameBase 
    } = {};

    async addNewGame(gameType:string,roomInfo : IRoomInfo){
        console.log("create new game");
        // console.log(Object.keys(this.games));
        // let lock = await redisService.lock.lock("game_controller_lock:" + roomInfo.roomId,1000);
        // await redisService.setWithLock("game_controller_lock:" + roomInfo.roomId,"yes");
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
        controller.data.roomId = roomInfo.roomId;
// console.log(123);
        this.games[roomInfo.roomId] = controller;
        this.games[roomInfo.roomId].redisService = redisService;
        this.games[roomInfo.roomId].userService = userService;

        await redisService.sub.subscribe("game_controller:" + roomInfo.roomId);
        // await redisService.lock.unlock(lock);
    }

    hasGame(roomId : number){
        return this.games[roomId];
    }


    

}
export const gameManagerService = new GameManager;