"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../service/redis");
const user_manager_1 = require("../service/user_manager");
const config_1 = require("../config");
const gate_1 = require("../ctrl/gate");
class QGameBase {
    constructor() {
        this.data = {
            ready: [],
            roomId: -1,
            players: []
        };
        this.redisService = redis_1.redisService;
        this.userService = user_manager_1.userService;
    }
    sendToRoom(event, data) {
        for (const uid of this.data.players) {
            this.sendToUser(uid, event, data);
        }
    }
    sendToChair(cid, event, data) {
        let uid = this.data.players[cid];
        if (!uid) {
            return;
        }
        return this.sendToUser(uid, event, data);
    }
    sendToUser(uid, event, data) {
        try {
            let sendData = JSON.stringify({ event, data });
            let server = user_manager_1.userService.getUserInServer(uid);
            if (!server) {
                return;
            }
            //如果是本机，直接发送
            if (server === config_1.SERVER_ID) {
                gate_1.GameGateController.sendMessageToClient(uid, JSON.stringify({
                    event: event,
                    data: data
                }));
            }
            else {
                redis_1.redisService.pub.publish("push_client:" + server, JSON.stringify({
                    uid: uid,
                    data: {
                        event: event,
                        data: data
                    }
                }));
            }
            // console.log("sent")
            // GameGateController.rpcCall(uid,this.data.roomId,)
        }
        catch (e) {
        }
    }
    /**
     * 被RPC调用所触发
     */
    onRpcCall(uid, event, data) {
        this.data.players.push(uid);
        console.log("rpccall : uid ", uid, event, user_manager_1.userService.getUserInServer(uid), this.data.players);
        this.sendToUser(uid, "pong");
    }
}
exports.QGameBase = QGameBase;
