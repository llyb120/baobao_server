import { V, Connection } from 'x-engine';
import { X } from 'x-orm';
import { User } from '../ml/user';
import { success, failed } from '../utils';
import { Request } from 'express';
import * as uuid from 'uuid';
import { redisService } from '../service/redis';
import { rand } from 'locutus/php/math';
import { gameManagerService, IRoomInfo } from '../service/game_manager';
import { SERVER_ID } from '../config';

@V.Controller({
    type: Connection.HTTP,
    dataType: 'json',
    url: "/api/:method"
})
export class AccountController {


    test(){
        console.log("access server " + SERVER_ID)
    }
    /**
     * 微信登录
     * @param unionid 
     */
    async loginWeixin(
        unionid
    ) {
        let item = await X.of(User).findOne({
            where: {
                weixin_unionid: unionid
            }
        });
        if (!item) {
            item = new User;
        }
        else {
            return success(item);
        }
    }


    /**
     * 游客登录 
     * @param req 
     */
    async loginVisitor(req: Request) {
        let user = new User;
        user.name = 'guest_' + uuid.v1();
        user.password = '1q2w3e4r';
        user.nickname = getName();
        user.token = uuid.v1();
        user.ip = req.ip;
        user.zuan = 100;
        await X.save(user);
        return success(user);
    }


    async createRoom(
        option
    ) {

        if (!option) {
            return failed({
            });
        }

        try {
            let qs = JSON.parse(option);
            let { token, gameConfig } = qs;
            if (!token || !gameConfig) {
                return failed("参数错误");
            }

            let user = await X.of(User).findOne({
                where: {
                    token: token
                }
            });
            if (!user) {
                return failed("不存在的用户");
            }
            //查找房间
            //如果用户已经在房间里，禁止他再创建房间
            let room = await redisService.get("user_in_room:" + user.id);
            let roomInfo : IRoomInfo;
            if (room && (roomInfo = await redisService.get("room:" + room))) {
                return success(roomInfo);
            }
            let roomId;
            while(true){
                // console.log("1");
                roomId = rand(100000,999999);
                //如果已经存在，那么继续
                if(await redisService.get("room:" + token)){
                    continue
                }
                break;
            }
            
            //验证人数
            // const playerCount = gameConfig.playercount || 0;
            let costList = {
                8 : 1,
                16 : 2
            };
            let playCount = gameConfig.playcount;
            if(user.zuan < costList[playCount]){
                return failed("钻石不够，请充值");
            }

            roomInfo = {
                roomId : roomId,
                creator : user.id,
                gameServer : {
                    server : '192.168.1.207',
                    port :9018
                },
                gameConfig,
                gameType : gameConfig.gameType,
                players : [user.id]
            };
            await redisService.set("user_in_room:" + user.id,roomId);
            // console.log(roomInfo);
            // console.log(JSON.stringify(roomInfo));
            await redisService.set("room:" + roomId,roomInfo);

            //注册监听器
            // redisService.sub.subscribe("room:" + roomId);

            // //启动游戏逻辑
            // gameManagerService.addNewGame(gameConfig.gameType,roomInfo);


            return success(roomInfo);
            
        }
        catch (e) {
            console.log(e);
            return failed("解析错误");
        }

    }

    async joinRoom(
        option
    ){
        try{
            let qs = JSON.parse(option);
            let {gameType,roomId,token} = qs;
            if(!token || !gameType || !roomId){
                return failed("参数错误");
            }
            let user = await X.of(User).findOne({
                where : {
                    token : token
                }
            }) ;
            if(!user){
                return failed("用户不存在");
            }
            //检查用户是否在房间内
            let roomInfo : IRoomInfo;
            let roomNum = await redisService.get("user_in_room:" + user.id);
            if(roomNum){
                roomInfo = await redisService.get("room:" + roomNum);
                if(roomInfo){
                    return success(roomInfo);
                }
            }
            roomInfo = await redisService.get("room:" + roomId);
            if(!roomInfo){
                return failed("游戏房间不存在");
            }
            //检查游戏人数
            if(roomInfo.players.length + 1 > roomInfo.gameConfig.playerCount){
                return failed("游戏人数已满");
            }

            //加入房间
            roomInfo.players.push(user.id);
            await redisService.setWithLock("room:" + roomId,roomInfo);
            await redisService.set("user_in_room:" + user.id,roomId);
            return success(roomInfo);

        }
        catch(e){
            console.log(e);
            return failed("解析失败");
        }
    }


    /**
     * 检查用户是否在房间内，用于断线重连
     */
    async checkInGame(token){
        if(!token){
            return failed("no token")
        }
        let user = await X.of(User).findOne({
            where : {
                token
            }
        });
        if(!user){
            return failed("no user");
        }
        let roomNum = await redisService.get("user_in_room:" + user.id);
        if(!roomNum){
            return failed("no roomId");
        }
        let roomInfo = await redisService.get("room:" + roomNum);
        if(!roomInfo){
            return failed("no roomInfo");
        }
        return success(roomInfo);
    }


}


var xing = "赵钱孙李周吴郑王冯陈楚魏蒋沈韩杨";
var ming = [
    // "粗鄙",
    // "鬼畜",
    // "疯猴",
    // "禽兽",
    "司徒",
    "村夫",
    "扫清六合",
    "席卷八荒",
    "万姓倾心",
    "四方仰德",
    "神文胜武",
    "继承大统"
    // "二笔",
    // "杨垃圾"
];

function getName() {
    var items = xing.split('');
    var firstName = items[Math.floor(Math.random() * 100000) % items.length];
    var secName = ming[Math.floor(Math.random() * 100000) % ming.length];
    return firstName + secName;
}