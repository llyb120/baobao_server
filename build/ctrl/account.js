"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const x_engine_1 = require("x-engine");
const x_orm_1 = require("x-orm");
const user_1 = require("../ml/user");
const utils_1 = require("../utils");
const uuid = require("uuid");
const redis_1 = require("../service/redis");
const math_1 = require("locutus/php/math");
const game_manager_1 = require("../service/game_manager");
let AccountController = class AccountController {
    /**
     * 微信登录
     * @param unionid
     */
    async loginWeixin(unionid) {
        let item = await x_orm_1.X.of(user_1.User).findOne({
            where: {
                weixin_unionid: unionid
            }
        });
        if (!item) {
            item = new user_1.User;
        }
        else {
            return utils_1.success(item);
        }
    }
    /**
     * 游客登录
     * @param req
     */
    async loginVisitor(req) {
        let user = new user_1.User;
        user.name = 'guest_' + uuid.v1();
        user.password = '1q2w3e4r';
        user.nickname = getName();
        user.token = uuid.v1();
        user.ip = req.ip;
        user.zuan = 100;
        await x_orm_1.X.save(user);
        return utils_1.success(user);
    }
    async createRoom(option) {
        if (!option) {
            return utils_1.failed({});
        }
        try {
            let qs = JSON.parse(option);
            let { token, gameConfig } = qs;
            if (!token || !gameConfig) {
                return utils_1.failed("参数错误");
            }
            let user = await x_orm_1.X.of(user_1.User).findOne({
                where: {
                    token: token
                }
            });
            if (!user) {
                return utils_1.failed("不存在的用户");
            }
            //查找房间
            //如果用户已经在房间里，禁止他再创建房间
            let room = await redis_1.redisService.get("user_in_room:" + token);
            let roomInfo;
            if (room && (roomInfo = await redis_1.redisService.get("room:" + room))) {
                return utils_1.success(roomInfo);
            }
            let roomId;
            while (true) {
                // console.log("1");
                roomId = math_1.rand(100000, 999999);
                //如果已经存在，那么继续
                if (await redis_1.redisService.get("room:" + token)) {
                    continue;
                }
                break;
            }
            //验证人数
            // const playerCount = gameConfig.playercount || 0;
            let costList = {
                8: 1,
                16: 2
            };
            let playCount = gameConfig.playcount;
            if (user.zuan < costList[playCount]) {
                return utils_1.failed("钻石不够，请充值");
            }
            roomInfo = {
                roomId: roomId,
                creator: user.id,
                gameServer: {
                    server: '192.168.1.207',
                    port: 9018
                },
                gameConfig,
                gameType: gameConfig.gameType,
                players: [user.id]
            };
            redis_1.redisService.set("user_in_room:" + user.token, roomId);
            // console.log(roomInfo);
            // console.log(JSON.stringify(roomInfo));
            redis_1.redisService.set("room:" + roomId, roomInfo);
            //注册监听器
            redis_1.redisService.sub.subscribe("room:" + roomId);
            //启动游戏逻辑
            game_manager_1.gameManagerService.addNewGame(gameConfig.gameType, roomInfo);
            return utils_1.success(roomInfo);
        }
        catch (e) {
            console.log(e);
            return utils_1.failed("解析错误");
        }
    }
    async joinRoom(option) {
        try {
            let qs = JSON.parse(option);
            let { gameType, roomId, token } = qs;
            if (!token || !gameType || !roomId) {
                return utils_1.failed("参数错误");
            }
            let user = await x_orm_1.X.of(user_1.User).findOne({
                where: {
                    token: token
                }
            });
            if (!user) {
                return utils_1.failed();
            }
        }
        catch (e) {
            return utils_1.failed("解析失败");
        }
    }
};
AccountController = __decorate([
    x_engine_1.V.Controller({
        type: x_engine_1.Connection.HTTP,
        dataType: 'json',
        url: "/api/:method"
    })
], AccountController);
exports.AccountController = AccountController;
var xing = "赵钱孙李周吴郑王冯陈楚魏蒋沈韩杨";
var ming = [
    "粗鄙",
    "鬼畜",
    "疯猴",
    "禽兽",
    "二笔",
    "杨垃圾"
];
function getName() {
    var items = xing.split('');
    var firstName = items[Math.floor(Math.random() * 100000) % items.length];
    var secName = ming[Math.floor(Math.random() * 100000) % ming.length];
    return firstName + secName;
}
