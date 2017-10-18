
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

        this.games[roomInfo.roomId] = controller;
    }

    hasGame(roomId : number){
        return this.games[roomId];
    }

}
export const gameManagerService = new GameManager;