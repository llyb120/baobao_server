const uuid = require('uuid');
const db = require("../common/db");
const namepool = require('../common/name_pool');
const utils = require('../common/utils');
const config = require('../config');
var http = require("http")


function sendUserInfo(res, userId, needToken) {
    (async() => {
        var sql = `select * from user where id = '${userId}'`;
        var result = await db.query(sql);
        if (!result || !result.length) {
            return utils.sendFailed(res, {}, -1, "can't find user " + userId);
        }
        var info = {
            nickname: result[0].nickname,
            fangka: result[0].fangka,
            face: result[0].face,
            userId: result[0].id,
            zuan : result[0].zuan,
            ip : result[0].ip,
            sex : result[0].sex
        };
        if (needToken) {
            info.token = result[0].token
        }
        utils.sendSuccess(res, info);
    })();
}

function sendZhanJiInfo(res, userId, needToken) {
    (async() => {
        var sql = `select * from record where user_id1 = '${userId}' or user_id2 = '${userId}' or user_id3 = '${userId}' or user_id4 = '${userId}'  order by time desc limit 10`;
        var result = await db.query(sql);
        if(!result || !result.length){
            result = [];
        }
        //if (!result || !result.length) {
        //    return utils.sendFailed(res, {}, -1, "can't find user " + userId);
        //}
        //var info = {
        //    nickname: result[0].nickname,
        //    fangka: result[0].fangka,
        //    face: result[0].face,
        //    userId: result[0].id,
        //    zuan : result[0].zuan
        //};
        //if (needToken) {
        //    info.token = result[0].token
        //}
        //utils.sendZhanJi(res, result);
        return res.send(result);
    })();
}


exports.start = (app) => {


    app.get("/loginWeixin",async function(req,res){
        var sql = `
            select id from user where weixin_unionid = '${req.query.unionid}'
        `;
        var result = await db.query(sql);
        if(result && result.length){
            return sendUserInfo(res, result[0].id, true);
        }
        else{
            var sql = `
            insert into user(
                id,
                name,
                password,
                nickname,
                token,
                zuan,
                sex,
                weixin_unionid,
                face,
                ip
            )
            values(
                null,
                'wx_${uuid.v1()}',
                '1q2w3e4r',
                '${req.query.nickname}',
                '${req.query.unionid}',
                100,
                '${req.query.sex}',
                '${req.query.unionid}',
                '${req.query.headimgurl}',
                '${req.ip}'
            )
            `;
            var result = await db.query(sql);
            if (result && result.affectedRows > 0) {
                return sendUserInfo(res, result.insertId, true);
            }
        }
        return sendUserInfo(res, 0);
    });
    /**
     * 登录一个游客
     */
    app.get("/loginVisitor", async function (req, res) {
        var userdata = {
            name: `guest_${uuid.v1()}`,
            nickname: namepool.generageName(),
            token: uuid.v1()
        };

        var sql = `
            insert into user(
                id,
                name,
                password,
                nickname,
                token,
                zuan,
                ip
            )
            values(
                null,
                '${userdata.name}',
                '1q2w3e4r',
                '${userdata.nickname}',
                '${userdata.token}',
                100,
                '${req.ip}'
            )
            `;
        var result = await db.query(sql);
        if (result && result.affectedRows > 0) {
            return sendUserInfo(res, result.insertId, true);
        }
        return sendUserInfo(res, 0);

    });

    app.get('/loginToken',async function (req,res) {
        var ip = req.ip;

        if(!req.query.token){
            return utils.sendFailed(res);
        }
        var userinfo = await utils.getUserInfoByToken(req.query.token);
        if(!userinfo || !userinfo.length){
            return utils.sendFailed(res);
        }
        var user_id = userinfo[0].id;
        var sql = `update user set ip = '${ip}' where id = '${user_id}'`;
        var result = await db.query(sql);

        sendUserInfo(res,userinfo[0].id,true);
    });


    /**
     * 拉取用户信息
     */
    app.get("/getUserInfo", (req, res) => {
        var userId = req.query.userId;
        sendUserInfo(res, userId);
    });

    /**
     * 获取用户战绩
     */
    app.get("/getZhanJi", (req, res) => {
        var userId = req.query.userId;
        sendZhanJiInfo(res, userId);
    });

    app.get("/getNews",async function (req,res){
        var sql = `
            select * from systemstatusinfo
        `;
        var result = await db.query(sql);
        return res.send(result);
    });

    app.get("/getVersion",async function (req,res){
        var sql = `
            select * from systemstatusinfo where StatusValue = 106
        `;
        var result = await db.query(sql);
        return res.send(result);
    });


    /**
     * 用户登出
     */
    app.get("/logout", async function (req, res) {
        var query = JSON.parse(req.query.query),
            token = query.token;
        var userinfo = await utils.getUserInfoByToken(token);
        if (!userinfo || !userinfo.length) {
            return utils.sendFailed(res, {}, -1, "invalid user");
        }
        var ret = await db.query(`update user set token = null where token = '${token}'`);
        if (ret && ret.affectedRows) {
            return utils.sendSuccess(res);
        }
        return utils.sendFailed(res);
    });

    app.get("/getWechatImg",async function (req,ress){
        var img = req.query.img;

        http.get(img, function(res){
            var imgData = "";

            res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开

            res.on("data", function(chunk){
                imgData+=chunk;
            });

            res.on("end", function(){
                ress.send(JSON.stringify(new Buffer(imgData,'binary')));
                //var str = "data:png;base64," + (new Buffer(imgData,'binary').toString("base64"));
                //ress.send(imgData)
            });
        });

    });


    /**
     * 测试用，删除用户
     */
    if (config.DEBUG_MODE) {
        app.get("/deleteUser", async function (req, res) {
            var query = JSON.parse(req.query.query),
                userId = query.userId;
            var ret = await db.query(`delete from user where id = '${userId}'`);
            if (ret && ret.affectedRows) {
                return utils.sendSuccess(res);
            }
            return utils.sendFailed(res);
        });
    }


};




