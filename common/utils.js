const db = require("./db");


function sendSuccess(res,data = {}) {
    var sendmsg = {
        errcode : 0,
        errmsg : 'ok',
    }
    for(var i in data){
        sendmsg[i] = data[i];
    }
    return res.send(sendmsg);
}

function sendFailed(res,data = {},code = -100,msg = "") {
    var sendmsg = {
        errcode : code,
        errmsg : msg,
    }
    for(var i in data){
        sendmsg[i] = data[i];
    }
    return res.send(sendmsg);
}


exports.sendSuccess = sendSuccess;
exports.sendFailed = sendFailed;


/**
 * 通过令牌得到用户信息
 */
exports.getUserInfoByToken = (token) => {
    var sql = `select * from user where token = '${token}'`;
    return db.query(sql);
};
/**
 * 扣
 * @param min
 * @param max
 * @returns {*}
 */

exports.rand = function rand (min, max) {
    //  discuss at: http://locutus.io/php/rand/
    // original by: Leslie Hoare
    // bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
    //      note 1: See the commented out code below for a version which
    //      note 1: will work with our experimental (though probably unnecessary)
    //      note 1: srand() function)
    //   example 1: rand(1, 1)
    //   returns 1: 1
    var argc = arguments.length
    if (argc === 0) {
        min = 0
        max = 2147483647
    } else if (argc === 1) {
        throw new Error('Warning: rand() expects exactly 2 parameters, 1 given')
    }
    return Math.floor(Math.random() * (max - min + 1)) + min
}