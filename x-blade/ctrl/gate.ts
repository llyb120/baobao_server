import { V, Connection } from 'x-engine';
import { gameManagerService, IRoomInfo } from '../service/game_manager';
import { User } from '../ml/user';
import * as WebSocket from 'ws';
import { X } from 'x-orm';
import { redisService } from '../service/redis';
import { userService } from '../service/user_manager';
import { SERVER_ID } from '../config';
import { sleep } from '../utils';

let SocketMap = new WeakMap<WebSocket, number>();

@V.Controller({
    type: Connection.WebSocket,
    url: "/game",
})
export class GameGateController {
    onConnect() {
        // console.log("connected on server " + SERVER_ID);
    }

    onClose(ws: WebSocket) {
        if (SocketMap.has(ws)) {
            let uid = SocketMap.get(ws);
            userService.deleteUserInServer(uid);
            userService.deleteUserClient(uid);
            SocketMap.delete(ws);
        }

    }
    onError(ws: WebSocket) {
        if (SocketMap.has(ws)) {
            let uid = SocketMap.get(ws);
            userService.deleteUserInServer(uid);
            userService.deleteUserClient(uid);
            SocketMap.delete(ws);
        }
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
                //该用户在当前服务器上
                userService.setUser(user.id, user);
                userService.setUserInServer(user.id, SERVER_ID);
                userService.setUserClient(user.id, ws);
            }
            else {
                return;
            }

            //消息转发
            let roomId = await redisService.get("user:in_room:" + user.id);
            if (!roomId) {
                return;
            }
            GameGateController.rpcCall(user.id, roomId, 'onRpcCall', [user.id, data.event, _data]);

            // switch (data.event) {
            //     case 'register_token_pull':
            //         return;

            //     //还没有绑定任何逻辑控制器的时候，处理用户的注册事件
            //     case 'enter_room_pull':
            //         //查找当前用户所在位置

            //         let roomId = await redisService.get("user_in_room:" + user.id);
            //         if (!roomId) {
            //             return;
            //         }

            //         // let {roomId} = data;
            //         return await this.rpcCall(user.id, roomId, 'onUserEnter', [user.id]);
            //     // break;

            //     //事件分发
            //     default:
            //         // if(gameManagerService.hasGame())
            //         break;
            // }

            // return this.rpcCall(roomId,)
        }
        catch (e) {
            // console.log(e);
        }
    }

    /**
         * 分布式调用
         * @param roomId 
         */
    static async rpcCall(uid: number, roomId: number, method: string, args: any) {
        //如果在本机，则直接调用
        let game;
        if (game = gameManagerService.hasGame(roomId)) {
            await game[method].apply(game, args);
        }
        else {
            let option = {
                uid,
                SERVER_ID,
                roomId,
                func: method,
                args: args
            };
            let pushKey = "game_controller:" + roomId,
                pushData = JSON.stringify(option);
            let count = await redisService.pub.publish(pushKey, pushData);
            if (count) {
                return;
            }
            //如果没有任何节点接受这个事件，那么自行创建该游戏
            let roomInfo: IRoomInfo = await redisService.get("room:info:" + roomId);
            if (!roomInfo) {
                return;
            }
            let key = "game_controlrer_in_server:" + roomId;
            //争抢线程，最终只有一个可以成功
            count = await redisService.redis.setnx(key, SERVER_ID);
            if (count) {
                await gameManagerService.addNewGame(roomInfo.gameType, roomInfo);
                game = gameManagerService.hasGame(roomId);
                await game[method].apply(game, args);
                await redisService.redis.del(key);
            }
            else {
                await sleep(150);
                await redisService.pub.publish(pushKey, pushData);
            }
        }

    }


    static sendMessageToClient(uid: number, data: string) {
        let ws: WebSocket;
        if (ws = userService.getUserClient(uid)) {
            if (ws.readyState == WebSocket.OPEN) {
                ws.send(data);
            }
            else {
                //用户不存在的时候，清空用户
                userService.deleteUserClient(uid);
                userService.deleteUserInServer(uid);
            }
        };
    }

}