const namepool = require("../common/name_pool");
const should = require("should");
const request = require('supertest')("http://127.0.0.1:9000");
const constant = require("../common/mj_constant");

const io = require("socket.io-client");

class user {
    get token() {
        return this._token;
    }

    set token(val) {
        return this._token = val;
    }

    get name() {
        return this._name;
    }

    set id(val) {
        return this._id = val;
    }

    get id() {
        return this._id;
    }

    get roomId() {
        return this._roomId;
    }


    get address() {
        return this._address;
    }

    set address(value) {
        this._address = value;
    }

    constructor(isCreator = false) {
        this._io = require("socket.io-client");
        this._address = null;
        this._id = null;
        this._name = null;
        this._token = null;
        this._name = namepool.generageName();
        this._socket = null;
        this._chairId = null;
        this._cards = null;

    }

    login() {
        var self = this;
        it(this._name + ` Login`, function (done) {
            request
                .get("/loginVisitor")
                .expect(200)
                .end(function (err, data) {
                    should.not.exist(err);
                    data.body.errmsg.should.eql('ok');
                    self._token = data.body.token;
                    self._id = data.body.userId;
                    done();
                })
        });
    }

    registerAllHandlers() {
        socket.emit("user_auth_pull", {
            token: self._token
        });
    }

    connectGameServer() {
        var self = this;
        describe(`${this._name} play games`, function () {
            this.timeout(0);
            var socket = self._socket = io.connect(`http://${self._address}:${self._port}`);
            if (!global.count) {
                global.count = 0;
            }
            socket.on("enter_success_push", function (data) {
                self._chairId = data.chairId;
                self._name += '(座位' + self._chairId + ')';
            });

            socket.emit("enter_room_push", {
                token: self._token,
                roomId: self._roomId
            });

            /**
             * 游戏开始通知
             */
            socket.on("game_start_push", function (data) {
                console.log(`${self._name}: 开始游戏`);
            });

            /**
             * 得到手牌
             */
            socket.on("hand_card_push",function (data) {
                console.log(`${self._name} ：得到手牌`,data.handCards[self._chairId]);
                var cards = data.handCards[self._chairId];
                self._cards = cards;
            });

            /**
             * 摸牌
             */
            socket.on("mopai_push",function (data) {
                // console.log(typeof data.card);
                // var card = parseInt(data.card);
                var card = data.card;
                if(data.hasOwnProperty('card')){
                    self._cards.push(card);
                    console.log(`${self._name} ：摸牌 "${card}"`);
                }
            });

            socket.on("action_push",function (data) {
                if(data.chairId < 0){
                    return;
                }
                if(!data.hasOwnProperty('action')){
                    return;
                }
                // if((data.action & constant.ACTION_CHUPAI) != 0){
                //     if(data.data.chairId == self._chairId){
                //         console.log(`${self._name} 准备出牌`);
                //         self.chupai();
                //     }
                // }
                // if((data.action & constant.ACTION_PENG) != 0){
                if(data.data.chairId == self._chairId){
                    self.doAction(data.action,data.data.card);
                }
                // }
                // switch (data.action){
                //     case constant.ACTION_CHUPAI:
                //
                //         break;
                // }

            });

            socket.on("action_success_push",function (data) {
                if(!data.hasOwnProperty("action")){
                    return;
                }
                var card = parseInt(data.card);
                if((data.action & constant.ACTION_CHUPAI) != 0){
                    // var card = (data.card);
                    if(data.chairId == self._chairId){
                        var index = self._cards.indexOf(card);
                        if(index == -1){
                            // console.log("fk")
                            return;
                        }
                        self._cards.splice(index,1);

                        console.log(`${self._name}: 座位${data.chairId}出牌`,data.card);
                        console.log(`${self._name}：当前手牌`,self._cards)
                    }
                }
                if((data.action & constant.ACTION_PENG)){
                    if(data.chairId == self._chairId){
                        for(var i = 0; i < 2; i ++){
                            var index = self._cards.indexOf(card);
                            if(index > -1){
                                self._cards.splice(index,1);
                            }
                        }
                        console.log(`${self._name}: 座位${data.chairId}*******【碰牌】*******`,data.card);
                        console.log(`${self._name}：当前手牌`,self._cards)
                    }
                }
            });

            socket.on("game_end_push",function (data) {
                console.log(`${self._name}:第${data.gameCount}局游戏结束`);
                return;
            });

            if (++global.count == 4) {
                it("end", function (done) {
                    setTimeout(function () {
                        done();
                    }, 10000);
                });
            }
        })

    }

    chupai(){
        var card = this.calChupai();
        this.sendMessage("action_pull",{
            card : card,
            action : constant.ACTION_CHUPAI
        });
    }

    doAction(order,card){
        if((order & constant.ACTION_HU)){

        }
        else if((order & constant.ACTION_GANG)){

        }
        else if((order & constant.ACTION_PENG)){
            this.sendMessage("action_pull",{
                action : constant.ACTION_PENG
            });
        }
        else if((order & constant.ACTION_CHUPAI)){
            this.chupai();
        }
    }

    calChupai(){
        var map = {}
        this._cards.forEach(function (card) {
            if(!map[card]){
                map[card] = 0;
            }
            map[card]++;
        });
        var target = -1;
        for(var card in map){
            if(map[card] > 2){
                continue;
            }
            target = parseInt(card);
            break;
        }
        if(target == -1){
            return this._cards[0];
        }
        else{
            return target;
        }
    }

    sendMessage(action,data) {
        var data = {
            event : action,
            data : data,
            roomId : this._roomId
        };
        if (this._socket) {
            this._socket.send(data);
        }
    }

    createRoom() {
        var self = this;
        it(`${this._name} Create Room`, function (done) {
            should.exist(self._token);
            var param = {
                token: self._token,
                gameConfig: {
                    gameType: "majiang",
                    playerCount: 4
                }
            };
            request
                .get(`/createRoom?query=${JSON.stringify(param)}`)
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    var ret = res.body;
                    console.error(res.body);
                    ret.errmsg.should.eql('ok');
                    self._roomId = ret.roomId;
                    self._address = ret.gameServer.server;
                    self._port = ret.gameServer.port;
                    self.connectGameServer();
                    done();
                });
        });
    }

    joinRoom(user) {
        var self = this;
        it(`${this._name} Join Room`, function (done) {
            should.exist(self._token);
            var roomId = user.roomId;
            var params = {
                token: self._token,
                gameType: 'majiang',
                roomId: roomId
            };
            request
                .get(`/joinRoom?query=${JSON.stringify(params)}`)
                .expect(200)
                .end(function (err, data) {
                    should.not.exist(err);
                    data.body.errmsg.should.eql('ok');
                    self._roomId = roomId;
                    var ret = data.body;
                    self._address = ret.address;
                    self._port = ret.port;
                    self.connectGameServer();
                    done();
                })
        });
    }

    exitRoom() {
        var self = this;
        it(`${this._name} Exit Room`, function (done) {
            should.exist(self._token);
            var params = {
                token: self._token
            };
            request
                .get(`/exitRoom?query=${JSON.stringify(params)}`)
                .expect(200)
                .end(function (err, data) {
                    should.not.exist(err);
                    data.body.errmsg.should.eql('ok');
                    done();
                })
        });
    }

    logout() {
        var self = this;
        it(`${this._name} Logout`, function (done) {
            should.exist(self._token);
            var params = {
                token: self._token
            };
            request
                .get("/logout?query=" + JSON.stringify(params))
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    res.body.errmsg.should.eql('ok');
                    done();
                })
        });
    }

    remove() {
        var self = this;
        it(`${this._name} Removed`, function (done) {
            should.exist(self._id);
            var params = {
                userId: self._id
            };
            request
                .get("/deleteUser?query=" + JSON.stringify(params))
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    res.body.errmsg.should.eql('ok');
                    done();
                })
        });
    }

}


module.exports.user = user;