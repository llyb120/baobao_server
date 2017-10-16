//var holds = [8,8,12,13,17,18,20,21,21,25,26,26,31];

var constant = require('./common/sd_constant.js');

class test{
    getPaixing(cards){
        var scards = cards;
        cards = this.sortCards(cards);
        var map = {};
        cards.forEach(function (item) {
            map[item] = map[item] || 0;
            map[item]++;
        });
        var len = cards.length;
        var finalType = {
            type : constant.TYPE_NULL,
            value : 0,
            cards : scards
        }
        switch(len){
            case 1:
                finalType.type = constant.TYPE_DANZHANG;
                finalType.value = cards[0];
                break;

            case 2:
                if(cards[0] == cards[1]){
                    finalType.type = constant.TYPE_DUIZI;
                    finalType.value = cards[0];
                }
                break;

            case 4:
                for(var i in map){
                    if(map[i] == 4){
                        finalType.type = constant.TYPE_ZHADAN;
                        finalType.value = cards[0];
                        break;
                    }
                }
                break;

            case 5:
                var has3 = false;
                var has2 = false;
                var val = -1;
                for(var i in map){
                    if(map[i] == 3){
                        has3 = true;
                        val = i;
                    }
                    else if(map[i] == 2){
                        has2 = true;
                    }
                }
                if(has3){
                    if(has2){
                        finalType.type = constant.TYPE_SANDAIYIDUI;
                    }
                    else{
                        finalType.type = constant.TYPE_SANDAIER;
                    }
                    finalType.value = val;
                }
                break;
        }
        //顺子
        if(len >= 5) {
            var conti = true;
            for(var i in map){
                //不包含123
                if(i > 12){
                    conti = false;
                    break;
                }
                if(map[i] != 1){
                    conti = false;
                    break;
                }
            }
            if(conti){
                if(cards[0] - len + 1 == cards[len - 1]){
                    finalType.type = constant.TYPE_DANSHUN;
                    finalType.value = cards[0];
                }
            }
        }
        //双顺
        if(len >= 6){
            var conti = true;
            for(var i in map){
                //不包含123
                if(i > 12){
                    conti = false;
                    break;
                }
                if(map[i] != 2){
                    conti = false;
                    break;
                }
            }
            if(conti){
                if(cards[0] - (len / 2) + 1 == cards[len - 1]){
                    finalType.type = constant.TYPE_SHUANGSHUN;
                    finalType.value = cards[0];
                }
            }
        }
        finalType.value = Number(finalType.value);
        return finalType;
    }

    getCardRealValue(val){
        val %= 13;
        if(val < 3){
            val += 13;
        }
        return val;
    }

    sortCards(cards){
        return cards.map(function (val) {
            val %= 13;
            if(val < 3){
                val += 13;
            }
            return val;
        }).sort(function (a,b) {
            return b - a;
        });
    }

    compare(attack,defence){
        if(this._isChou && attack.type == constant.TYPE_ZHADAN) return true;
        if(attack.type == constant.TYPE_NULL) return false;
        //特殊规则，三带一对可以打过三带二
        if(attack.type == constant.TYPE_SANDAIYIDUI && defence.type == constant.TYPE_SANDAIER && attack.value > defence.value){
            return true;
        }
        //相同牌型比大小
        return (attack.type == defence.type && Number(attack.value) > Number(defence.value) && attack.cards.length == defence.cards.length)
                //炸弹通吃
            || (attack.type != defence.type && attack.type == constant.TYPE_ZHADAN)

    }
}

var t = new test();
var p1 = t.getPaixing([1,1,1,5,5]);
var p2 = t.getPaixing([8,8,8,3,2]);


var flag = t.compare(p1,p2);



console.log(1)




var holds = [1,1,2,3,6,6,7,7,7,18,19,31,31];
var map = {};
for(var i = 0; i < 34; i++){
    map[i] = 0;
}
holds.forEach(function (item) {
    map[item] = map[item] || 0;
    map[item]++;
})
var item = {
    holds : Object.assign([],holds),
    countMap : Object.assign({},map),
    tingMap : {},
};
const mjutils = require("./game_server/majiang/mjutils");
mjutils.checkTingPai1(item,0,9,31);
mjutils.checkTingPai1(item,9,18,31);
mjutils.checkTingPai1(item,18,27,31);

console.log(item)
//
// var io = require("socket.io-client");
// var ioserver = require('socket.io')();
// ioserver.on("connect",function (socket) {
//     console.log(13)
// });
// ioserver.listen("9003")
//
//
// var client1 = io.connect("http://127.0.0.1:9003");
// client1.on("connect",function () {
//     console.log(1)
//     client1.close();
//     client1.open();
// })

// var socketio = require("socket.io");
//
// var io = socketio.listen(10086);
// var i = 0;
// io.on("connection",function (socket) {
//     console.error("connected");
//
//     if(i++ == 0){
//         socket.join("room",function () {
//             io.to("room").emit("fuck",1);
//         });
//     }
//     else{
//         io.to("room").emit("fuck",2);
//     }
//
//     io.on("reconnect",function () {
//         console.log(23321312)
//     })
//
//
//
// });
//
//
// var client = require('socket.io-client')("http://127.0.0.1:10086");
// client.on("connect",function () {
//     console.log("cubi")
// })
// client.on("fuck",function (data) {
//     console.log(data)
// })
//
//
//
//
