import { V, Connection } from 'x-engine';
import { X } from 'x-orm';
import { User } from '../ml/user';
import { success, failed } from '../utils';
import { Request } from 'express';
import * as uuid from 'uuid';
import { redisService } from '../service/redis';
import { rand } from 'locutus/php/math';

@V.Controller({
    type: Connection.HTTP,
    dataType: 'json',
    url: "/api/:method"
})
export class AccountController {

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
            const gConfig = JSON.parse(gameConfig);
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
            let room = await redisService.get("user_in_room:" + token);
            if (room) {
                return success(room);
            }
            let roomId;
            while(true){
                roomId = rand(100000,999999);
                //如果已经存在，那么继续
                if(await redisService.get("user_in_room" + token)){
                    continue
                }
                break;
            }
            
            // redisService.set("user_in_room" + token,)
            // let room = redisService.get("lk_")
        }
        catch (e) {
            return failed("解析错误");
        }

    }

}


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