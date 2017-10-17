import { V, Connection } from 'x-engine';
import { gameManagerService } from '../service/game_manager';
import { User } from '../ml/user';
import * as WebSocket from 'ws';
import { X } from 'x-orm';

let SocketMap = new WeakMap<WebSocket, User>();

@V.Controller({
    type: Connection.WebSocket,
    url: "/game",
})
export class GameGateController {
    onConnect() {
        console.log("connected!");
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
            if (!data.event) {
                return;
            }
            //如果在这个服务器并且通过了校验，那么不再重新取用户信息
            let user: User;
            if (SocketMap.has(ws)) {
                user = SocketMap.get(ws);
            }
            //没有通过校验的，必须使用令牌来进行校验
            else if (data.token) {
                let user = await X.of(User).findOne({
                    where: {
                        token: data.token
                    }
                });
                if (!user) {
                    return;
                }
                SocketMap.set(ws, user);
                return;
            }
            else {
                return;
            }

            switch (data.event) {
                //事件分发
                default:
                    // if(gameManagerService.hasGame())
                    break;
            }
        }
        catch (e) {

        }
        console.log(message);
    }



}