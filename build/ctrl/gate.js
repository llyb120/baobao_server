"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const x_engine_1 = require("x-engine");
const user_1 = require("../ml/user");
const x_orm_1 = require("x-orm");
let SocketMap = new WeakMap();
let GameGateController = class GameGateController {
    onConnect() {
        console.log("connected!");
    }
    onClose(ws) {
        SocketMap.delete(ws);
    }
    onError(ws) {
        SocketMap.delete(ws);
    }
    async onMessage(ws, message) {
        try {
            let data = JSON.parse(message);
            if (!data.event) {
                return;
            }
            //如果在这个服务器并且通过了校验，那么不再重新取用户信息
            let user;
            if (SocketMap.has(ws)) {
                user = SocketMap.get(ws);
            }
            else if (data.token) {
                let user = await x_orm_1.X.of(user_1.User).findOne({
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
};
GameGateController = __decorate([
    x_engine_1.V.Controller({
        type: x_engine_1.Connection.WebSocket,
        url: "/game",
    })
], GameGateController);
exports.GameGateController = GameGateController;
