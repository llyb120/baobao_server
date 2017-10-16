var should = require("should");
var request = require('supertest')("http://127.0.0.1:9000");
const User = require("./user").user;


describe("Account Service", function () {

    var creator = new User(true),
        player1 = new User(),
        player2 = new User(),
        player3 = new User();

    var all_users = [creator,player1,player2,player3];

    /**
     * 登录所有用户
     */
    for(let i = 0; i < 4; i++){
        all_users[i].login();
    }

    /**
     * 创建者创建房间
     */
    all_users[0].createRoom();

    /**
     * 游客加入房间
     */
    for(let i = 1; i < 4; i++){
        all_users[i].joinRoom(all_users[0]);
    }


    /**
     * 游客退出房间
     */
    // for(let i = 1; i < 4; i++){
    //     all_users[i].exitRoom();
    // }

    /**
     * 重新加入房间
     */
    // for(let i = 1; i < 4; i++){
    //     all_users[i].joinRoom(all_users[0]);
    // }

    /**
     * 房主解散房间
     */
    //all_users[0].exitRoom();

    /**
     * 登出
     */
    // for(let i = 0; i < 4; i++){
    //     all_users[i].logout();
    // }

    /**
     * 清除测试用户
     */
    // for(let i = 0; i < 4; i++){
    //     all_users[i].remove();
    // }

});