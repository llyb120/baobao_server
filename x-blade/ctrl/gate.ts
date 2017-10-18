import { V, Connection } from 'x-engine';
import { gameManagerService, IRoomInfo } from '../service/game_manager';
import { User } from '../ml/user';
import * as WebSocket from 'ws';
import { X } from 'x-orm';
import { redisService } from '../service/redis';
import { userService } from '../service/user_manager';

let SocketMap = new WeakMap<WebSocket, number>();

@V.Controller({
    type: Connection.WebSocket,
    url: "/game",
})
export class GameGateController {
    onConnect() {
    }

    onClose(ws: WebSocket) {
        SocketMap.delete(ws);
    }
    onError(ws: WebSocket) {
        SocketMap.delete(ws);
    }

    async onMessage(ws: WebSocket, message) {
        try {
            let data = JSON.parse(message);
            let _data = data.data;
            if (!data.event) {
                return;
            }
            //如果在这个服务器并且通过了校验，那么不再重新取用户信息
            let user: User;
            if (SocketMap.has(ws)) {
                let uid = SocketMap.get(ws);
                user = userService.getUser(uid);
            }
            //没有通过校验的，必须使用令牌来进行校验
            else if (_data.token) {
                user = await X.of(User).findOne({
                    where: {
                        token: _data.token
                    }
                });
                if (!user) {
                    return;
                }
                SocketMap.set(ws, user.id);
                userService.setUser(user.id,user);
            }
            else {
                return;
            }

            switch (data.event) {
                case 'register_token_pull':
                    return;

                //还没有绑定任何逻辑控制器的时候，处理用户的注册事件
                case 'enter_room_pull':
                    //查找当前用户所在位置

                    let roomId = await redisService.get("user_in_room:" + user.id);
                    if (!roomId) {
                        return;
                    }

                    // let {roomId} = data;
                    return await this.rpcCall(roomId, 'onUserEnter', [user.id]);
                    // break;

                //事件分发
                default:
                    // if(gameManagerService.hasGame())
                    break;
            }

            // return this.rpcCall(roomId,)
        }
        catch (e) {

        }
        console.log(message);
    }

    /**
         * 分布式调用
         * @param roomId 
         */
    async rpcCall(roomId: number, method: string, args: any) {
        console.log("rpc call");
        //如果在本机，则直接调用
        let game;
        if (game = gameManagerService.hasGame(roomId)) {
            console.log("in self");
            await game[roomId][method].apply(game[roomId], args);
        }
        else {
            let option = {};
            let count = await redisService.pub.publish("game_controller:" + roomId, JSON.stringify(option));
            //如果没有任何节点接受这个事件，那么自行创建该游戏
            if (count === 0) {
                let roomInfo: IRoomInfo = await redisService.get("room:" + roomId);
                if (roomInfo) {
                    gameManagerService.addNewGame(roomInfo.gameType, roomInfo);
                    game = gameManagerService.hasGame(roomId);
                    await game[roomId][method].apply(game[roomId], args);
                }
            }
        }

    }

}