const GameBase = require("./game_base");
const utils = require('../../common/utils');
const constant = require("../../common/pdk_constant");


class DDZGame extends GameBase {

    constructor(roomId) {
        super(roomId);
        this._winCount = [0, 0, 0, 0];
        this._loseCount = [0, 0, 0, 0];
        this._zhadan = [0, 0, 0, 0];
        this._dizhu = -1;
        this._jiaodizhu = [];
        //this._lastGameScore = [0,0,0,0];
    }

    onMessage(chairId, event, data) {
        switch (event) {
            case 'buchu_pull':
                if (chairId != this._turn) return false;
                if (this._lastChupai == -1) return this.sendToChair(chairId, "chupai_error_push", "请选择牌出牌！");

                this.pushAction({
                    type: "buchu",
                    chairId: chairId
                });
                this.sendToRoom("chupai_push", {
                    chairId: chairId,
                    pai: null
                });
                this.record("chupai_push", {
                    chairId: chairId,
                    pai: null
                });

                this.moveToNextPlayer();

                //this.sync();
                break;
            case 'chupai_pull':
                //不该你出牌，你瞎出啥呢
                if (chairId != this._turn) return false;
                if (!data.cards) return false;
                var cards = data.cards;
                var _cards = cards;
                //检查是否有这些牌
                for (var i = 0; i < cards.length; i++) {
                    if (this._handCards[chairId].indexOf(cards[i]) == -1) {
                        return false;
                    }
                }
                //第一个人出的牌,必须出红桃3
                if (this._handCards[chairId].indexOf(2) > -1
                    && cards.indexOf(2) == -1) {
                    return this.sendToChair(chairId, 'chupai_error_push', "第一次出牌必须出红桃3");
                }

                var paiType = this.getPaixing(cards);

                if (paiType.type == constant.TYPE_NULL) return this.sendToChair(chairId, "chupai_error_push", "选择的牌型不对或者没有上家大！");
                var conti = false;
                if (this._lastPaiType) {
                    if (
                        this.compare(paiType, this._lastPaiType)
                        //相同牌型比大小
                        // (this._lastPaiType.type == paiType.type && Number(paiType.value) > Number(this._lastPaiType.value))
                        // //炸弹通吃
                        // || paiType.type == constant.TYPE_ZHADAN
                    ) {
                        conti = true;
                    }

                }
                else {
                    conti = true;
                }


                if (conti) {
                    //删除牌型
                    for (var i = 0; i < cards.length; i++) {
                        var index = (this._handCards[chairId].indexOf(cards[i]));
                        if (index > -1) {
                            this._handCards[chairId].splice(index, 1);
                        }
                    }
                    this._out[chairId] = this._out[chairId].concat(cards);
                    //如果是炸弹，就保存起来
                    // if (paiType.type == constant.TYPE_ZHADAN) {
                    //     var changed = [0, 0, 0, 0];
                    //     //清空上一个炸弹的分
                    //     if (this._chain.length) {
                    //         // var top = this._chain[this._chain.length - 1];
                    //         var top = this._chain.pop();
                    //         for (var i = 0; i < this._game.players.length; i++) {
                    //             if (i == top) continue;
                    //             changed[top] -= this.calScore(constant.SCORE_ZHADAN);
                    //             changed[i] += this.calScore(constant.SCORE_ZHADAN);
                    //         }
                    //         // changed[top.gong] -= constant.SCORE_ZHADAN;
                    //         // changed[top.shou] += constant.SCORE_ZHADAN;
                    //     }
                    //     this._chain.push(chairId);
                    //     //炸弹数+1
                    //     this._zhadan[chairId]++;
                    //     //这次算分
                    //     for (var i = 0; i < this._game.players.length; i++) {
                    //         if (i == chairId) continue;
                    //         changed[chairId] += this.calScore(constant.SCORE_ZHADAN);
                    //         changed[i] -= this.calScore(constant.SCORE_ZHADAN);
                    //     }
                    //     // changed[chairId] += constant.SCORE_ZHADAN;
                    //     // changed[this._lastChupai] -= constant.SCORE_ZHADAN;

                    //     this.changeScore(changed);
                    // }
                    this._lastPaiType = paiType;
                    this._lastChupai = chairId;
                    this.pushAction({
                        chairId: chairId,
                        cards: _cards,
                        type: "chupai"
                    });
                    this.sendToRoom("chupai_push", {
                        chairId: chairId,
                        pai: paiType
                    });

                    this.record("chupai_push", {
                        chairId: chairId,
                        pai: paiType
                    });

                    var win = this._handCards[chairId].length == 0;
                    if (win) {
                        this._turn = -1;
                    }
                    else {
                        this.moveToNextPlayer();
                    }
                    //this.sync();

                    if (win) {
                        this.sendWinner(chairId);
                    }

                    // this.sendToRoom("chupai_pull",{
                    //     chairId : this._turn,
                    //     cards : data.cards
                    // });
                    //判断是否结束
                    //this.checkWin(chairId);
                }
                else {
                    this.sendToChair(chairId, "chupai_error_push", "选择的牌型不对或者没有上家大！");
                }
                break;


            case 'jiaodizhu_pull':
                if (chairId != this._jiaoTurn) {
                    break;
                }
                //抢地主
                if (data.steal) {
                    this._jiaodizhu[chairId]++;
                }

                //已经结束抢地主
                if (this._qiangTimes == 2) {
                    //选择地主的原则
                    //3.如果都没有抢，那么最开始的人叫地主
                    if (this._jiaodizhu.every((item) => 0)) {
                        return this.confirmDizhu(this._jiaoStart);
                    }
                    else {
                        //1.叫分 > 1
                        var left = this._jiaodizhu.filter((item) => item > 2);
                        if (left.length == 1) {
                            return this.confirmDizhu(left[0]);
                        }

                        //2.没有的情况，选择靠后的抢地主的人
                        var ptr = this._jiaoStart;
                        do {
                            if (ptr-- == 0) {
                                ptr = this._userInfo.length - 1;
                            }
                            if (this._jiaodizhu[ptr] == 1) {
                                return this.confirmDizhu(ptr);
                            }
                        } while (ptr != this._jiaoStart);
                    }
                }

                var next = (this._jiaoTurn + 1) % this._userInfo.length;
                //如果下一个转回来，伦数+1
                if (next == this._jiaoStart) {
                    this._qiangTimes++;
                }
                this._jiaoTurn = next;
                this.pushJiaodizhu();

                //如果你已经叫过了，就不要再叫了
                // if(this._jiaodizhu[chairId] > 0){
                //     break;
                // }
                // this._jiaodizhu[chairId] = data.score;
                // //三分的立刻当地主
                // if(data.score > 2){
                //     this.confirmDizhu(chairId);
                // }
                // else if(this._jiaodizhu.filter((item) => item > 0).length == this._userInfo.length){
                //     var jiaos = this._jiaodizhu.concat();
                //     jiaos = jiaos.sort((a,b) => b - a);
                //     // this.confirmDizhu
                // }
                break;
        }
        return super.onMessage(chairId, event, data);
    }

    confirmDizhu(chairId) {
        //拿到最后的地主牌
        this._dizhu = this._turn = chairId;
        this._dizhuCards = this._cards.concat();
        this._handCards[chairId] = this._handCards.concat(this._cards);

        this.pushGameInfo();
        this.pushHolds();
        this.pushDizhuCards();
        this.pushTurn();
        this.record("turn_push", { turn: this._turn });

    }

    convertToMap(cards) {
        var map = {};
        var self = this;
        cards.forEach(function (item) {
            item = self.getCardRealValue(item);
            map[item] = map[item] || 0;
            map[item]++;
        });
        return map;
    }

    calScore(score) {
        return score;
    }


    getPaixing(cards) {
        var scards = cards;
        cards = this.sortCards(cards);
        var map = {};
        cards.forEach(function (item) {
            map[item] = map[item] || 0;
            map[item]++;
        });
        var len = cards.length;
        var finalType = {
            type: constant.TYPE_NULL,
            value: 0,
            cards: scards
        }
        switch (len) {
            case 1:
                finalType.type = constant.TYPE_DANZHANG;
                finalType.value = cards[0];
                break;

            case 2:
                //王炸
                if(cards[0] == 52 && cards[1] == 53){
                    finalType.type = constant.TYPE_ZHADAN;
                    finalType.value = 998;
                    break;
                }

                if (cards[0] == cards[1]) {
                    finalType.type = constant.TYPE_DUIZI;
                    finalType.value = cards[0];
                }
                break;

            case 4:
                for (var i in map) {
                    if (map[i] == 4) {
                        finalType.type = constant.TYPE_ZHADAN;
                        finalType.value = cards[0];
                        break;
                    }
                    else if (map[i] == 3) {
                        finalType.type = constant.TYPE_SANDAIYI;
                        finalType.value = cards[0];
                        break;
                    }
                }
                break;

            // case 5:
            //     var has3 = false;
            //     var has2 = false;
            //     var val = -1;
            //     for(var i in map){
            //         if(map[i] == 3){
            //             has3 = true;
            //             val = i;
            //         }
            //         else if(map[i] == 2){
            //             has2 = true;
            //         }
            //     }
            //     if(has3){
            //         if(has2){
            //             finalType.type = constant.TYPE_SANDAIYIDUI;
            //         }
            //         else{
            //             finalType.type = constant.TYPE_SANDAIER;
            //         }
            //         finalType.value = val;
            //     }
            //     break;
        }
        //顺子
        if (len >= 5) {
            var conti = true;
            for (var i in map) {
                //不包含2
                if (i > 13) {
                    conti = false;
                    break;
                }
                if (map[i] != 1) {
                    conti = false;
                    break;
                }
            }
            if (conti) {
                if (cards[0] - len + 1 == cards[len - 1]) {
                    finalType.type = constant.TYPE_DANSHUN;
                    finalType.value = cards[0];
                }
            }
        }

        //双顺
        if (len >= 6) {
            var conti = true;
            for (var i in map) {
                //不包含123
                if (i > 13) {
                    conti = false;
                    break;
                }
                if (map[i] != 2) {
                    conti = false;
                    break;
                }
            }
            if (conti) {
                if (cards[0] - (len / 2) + 1 == cards[len - 1]) {
                    finalType.type = constant.TYPE_SHUANGSHUN;
                    finalType.value = cards[0];
                }
            }
        }

        //飞机，飞机至少要有(3 + 2) * 2 = 10 张
        if (len >= 10) {
            do {
                var card3 = [];
                var card2 = [];
                var isConti = false;
                for (var i in map) {
                    var card = Number(i);
                    if (map[card] == 3) card3.push(card);
                    else if (map[card] == 2) card2.push(card);
                    else
                        isConti = false;
                }
                //2不能参加飞机
                if (card3.indexOf(14) > -1) {
                    isConti = false;
                }
                if (card3.length < 2) {
                    isConti = false;
                }
                if (card3.length != card2.length) {
                    isConti = false;
                }
                if (!isConti) {
                    break;
                }
                card3 = card3.sort((a, b) => {
                    return a - b;
                });
                card2 = card2.sort((a, b) => {
                    return a - b;
                });
                if (card3[0] + card3.length - 1 == card3[card3.length - 1]
                    && card2[0] + card2.length - 1 == card2[card2.length - 1]
                ) {
                    finalType.type = constant.TYPE_FEIJI;
                    finalType.value = card3[0];
                }

            } while (0);
        }

        finalType.value = Number(finalType.value);
        return finalType;
    }

    getCardRealValue(val) {
        val %= 13;
        if (val < 2) {
            val += 13;
        }
        return val;
    }

    sortCards(cards) {
        return cards.map(this.getCardRealValue).sort(function (a, b) {
            return b - a;
        });
    }

    moveToNextPlayer() {
        this._turn++;
        this._turn %= this._roomInfo.gameConfig.playerCount;

        // if(this._isChou){
        //     this._chouOk.push(1);
        //     if(this._chouOk.length == this._game.players.length){
        //         this._lastPaiType = null;
        //         this._lastChupai = -1;
        //         this._isChou = 0;
        //         this._turn = this._chouPlayer;
        //     }
        // }

        // if(this._lastChupai == this._turn){
        //     this._lastPaiType = null;
        //     this._lastChupai = -1;
        //     //链锁清空
        //     this._chain = [];
        // }

        this.pushTurn();
        this.record("turn_push", { turn: this._turn });

        //
        // var self = this;
        // var handCards = self._handCards[self._turn];
        // if(handCards.length < 3){
        //     var chairId = this._turn;
        //     var paixing = this.getPaixing(handCards);
        //     //轮到我出牌
        //     if(this._lastChupai == -1){
        //         if(paixing.type != constant.TYPE_NULL){
        //             if(chairId == this._turn){
        //                 this.onMessage(chairId,"chupai_pull")
        //             }
        //         }
        //     }
        //     else{
        //
        //     }
        // }
        //
        // if(self._lastChupai == -1){
        //     setTimeout(function () {
        //         if(handCards.length < 3){
        //
        //         }
        //     },1000);
        // }


    }

    sendWinner(chairId) {
        super.end();
        var changed = [0, 0, 0, 0];
        this._winCount[chairId]++;

        for (var i = 0; i < this._game.players.length; i++) {
            if (i == chairId) {
                continue;
            }
            this._loseCount[i]++;
            var len = this._handCards[i].length;
            //只剩一张不扣分
            if (len == 1) {
                continue;
            }

            else if (len < 17) {
                var score = len * constant.SCORE_BASE;
            }
            else {
                var score = constant.SCORE_BASE * constant.SCORE_CHUNTIAN;
            }
            changed[i] -= score;
            changed[chairId] += score;

            // changed[i] -= this.calScore(this._handCards[i].length);
            // changed[chairId] += this._handCards[i].length;
            // this._gameScore[i] -= this._handCards[i].length;
            // this._gameScore[chairId] += this._handCards[i].length;
        }
        this.changeScore(changed);


        //发送当局分数
        var changed = [0, 0, 0, 0];
        for (var i = 0; i < changed.length; i++) {
            changed[i] = this._gameScore[i] - this._lastGameScore[i];
            this._eachTurnScore[i].push(changed[i]);
        }
        //发送上局分
        for (var i = 0; i < this._gameScore.length; i++) {
            this._lastGameScore[i] = this._gameScore[i];
        }

        // this._state = 'free';
        // for(var i = 0; i < this._ready.length; i++){
        //     this._ready[i] = 'free';
        // }
        //
        // var data = {
        //     winner : chairId,
        //     changed : changed,
        //     gameCount : this._gameCount,
        //     users : this._userInfo,
        //     handCards: this._handCards
        // }

        this._state = 'free';
        for (var i = 0; i < this._ready.length; i++) {
            this._ready[i] = 'free';
        }

        this.record("record_end_push");
        this.sendToRoom("all_cards_push", this._handCards);

        this.sendToRoom("xiaojie_push", {
            winner: chairId,
            gameCount: this._gameCount,
            users: this._userInfo,
            handCards: this._handCards,
            scoreChanged: changed,
            zhaDan: this._zhadan
        });

        if (this._gameCount == 1) {
            this.reduceFangka(this._userInfo[0].id);
        }

        if (this._gameCount == this._roomInfo.gameConfig.playcount) {
            // var total = {
            //     score : this._gameScore,
            //     win : this._winCount,
            //     lose : this._loseCount,
            // }
            // data.total = total;
            this.sendToRoom("zongjie_push", {
                gameScore: this._gameScore,
                winCount: this._winCount,
                loseCount: this._loseCount,
                allScoreInfo: this._eachTurnScore
            });
            //this.onRecord();
            this.forceDismissRoom();
        }
        //else{
        //    var self = this;
        //    setTimeout(function () {
        //        self.start();
        //    },5000);
        //}

        // if(this._gameCount == 8){
        //     this.calTotal();
        // }
        // delete global.Games.rooms[this._roomId];
        // if(this._gameCount == 8){
        //
        // }

        // if(this._handCards[chairId].length == 0){
        //     this.sendToRoom("win_push", {
        //         winner : chairId,
        //         gameScore : this._gameScore
        //     });
        // }
    }

    /**
     * 总结算
     */
    // calTotal(){
    //
    // }

    pushAction(action) {
        this._actions.push(
            action
        );
        if (this._actions.length > 2) {
            this._actions.shift();
        }
    }

    reset() {
        super.reset();
    }

    start() {
        super.start();
        this._cards = [];
        this._handCards = [];
        this._out = [];
        this._lastPaiType = null;
        this._actions = [];
        this._lastChupai = -1;
        this._isChou = 0;
        this._lastZhadan = -1;
        this._lastAction = null;
        //炸弹置空
        this._zhadan = [0, 0, 0, 0];
        //链锁牌
        this._chain = [];

        this._dizhu = -1;
        this._jiaodizhu = [0, 0, 0, 0];
        this._jiaoTurn = -1;
        this._jiaoStart = -1;
        this._qiangTimes = 1;
        this._dizhuCards = [];

        this._chouOk = [];
        this._chouPlayer = -1;
        if (!this._roomInfo.gameConfig.playcount) {
            this._roomInfo.gameConfig.playcount = 8;
        }

        this.xipai();

        //斗地主每人17张牌，保留最后三张牌
        for (var i = 0; i < this._game.players.length; i++) {
            var cards = this._handCards[i] = [];
            this._out[i] = [];
            for (var j = 0; j < 17; j++) {
                cards.push(this._cards.pop());
            }
        }
        this._state = 'game';

        this.sendToRoom("game_start_push", { isChou: this._isChou });
        this.pushHolds();

        //
        this.pushGameInfo();

        this.prepareRecord();
        this.record("holds_push", JSON.parse(JSON.stringify(this._handCards)))

        this._jiaoStart = this._jiaoTurn = utils.rand(0, this._userInfo.length - 1);

        this._turn = -1;
        this.pushTurn();
        // this.record("turn_push", { turn: this._turn });

        this.pushJiaodizhu();

    }

    xipai() {
        //0-12 hongtao
        //13-25 //heitao [132,0]
        //26-38 //meihua
        //39-52 //fankuai
        //53 xiaowang
        //54 dawang
        var limit2 = 3;
        var limit1 = 1;
        for (var i = 1; i < 54; i++) {
            this._cards.push(i);
        }

        var len = this._cards.length;
        var index = len * 3;
        while (--index) {
            var ran1 = utils.rand(0, len - 1);
            var ran2 = utils.rand(0, len - 1);
            if (ran1 == ran2) continue;
            var temp;
            temp = this._cards[ran1];
            this._cards[ran1] = this._cards[ran2];
            this._cards[ran2] = temp;
        }
    }




    /**
     * 推送手牌
     * @param chairId
     */
    pushHolds(chairId = -1) {
        if (chairId == -1) {
            return this._userInfo.forEach(function (u, chairId) {
                if (u === null) return;
                this.pushHolds(chairId)
            }.bind(this));
        }
        var data = [];
        for (var i = 0; i < this._handCards.length; i++) {
            if (i == chairId) {
                data.push(this._handCards[i])
            }
            else {
                data.push(this._handCards[i].length);
            }
        }
        this.sendToChair(chairId, "holds_push", data);
    }

    pushJiaodizhu(chairId = -1) {
        if (chairId == -1) {
            return this._userInfo.forEach((u, c) => (u !== null) && this.pushJiaodizhu(c));
        }
        return this.sendToChair(chairId, "jiaodizhu_push", {
            turn: this._jiaoTurn,
            score: this._jiaodizhu
        });

    }

    pushDizhuCards(chairId = -1) {
        if (chairId == -1) {
            return this._userInfo.forEach((u, c) => (u !== null) && this.pushDizhuCards(c));
        }
        return this.sendToChair(chairId, "dizhu_cards_push", {
            dizhu: this._dizhu,
            cards: this._dizhuCards
        });
    }

    pushTurn(chairId = -1) {
        if (chairId == -1) {
            return this._userInfo.forEach(function (u, chairId) {
                if (u === null) return;
                this.pushTurn(chairId)
            }.bind(this));
        }
        this.sendToChair(chairId, "turn_push", { turn: this._turn });
    }

    pushActions(chairId = -1) {
        if (chairId == -1) {
            return this._userInfo.forEach(function (u, chairId) {
                if (u === null) return;
                this.pushActions(chairId)
            }.bind(this));
        }
        this.sendToChair(chairId, "actions_push", this._actions);
    }

    pushGameInfo(chairId = -1) {
        if (chairId == -1) {
            return this._userInfo.forEach(function (u, chairId) {
                if (u === null) return;
                this.pushGameInfo(chairId)
            }.bind(this));
        }
        this.sendToChair(chairId, "game_info_push", {
            gameCount: this._gameCount,
            state: this._state,
            isChou: this._isChou,
            lastPaiType: this._lastPaiType,
            lastChair: this._lastChupai,
            gameScore: this._gameScore,
            dismiss: this._dismissApply,
            dizhu: _dizhu
        });
    }


    end() {
        return super.end();
    }

    destroy() {
        return super.destroy();
    }


    sync(chairId = -1) {
        this.pushState(chairId);
        this.pushUsers(chairId);
        this.pushGameInfo(chairId);

        var self = this;
        if (this._state == 'free') {
            // this._game.players.forEach(function (userId,index) {
            //     var data = {
            //         state : 'free',
            //         ready : self._ready,
            //         // users : self._userInfo,
            //         chairId : index,
            //         roomInfo : self._roomInfo
            //     };
            //     self.sendToChair(index,'sync_push',data);
            // });
        }
        else if (this._state == 'game') {
            this.pushHolds(chairId);
            this.pushTurn(chairId);
            this.pushActions(chairId);
            this.pushJiaodizhu(chairId);
            if (this._dizhu > -1) {
                this.pushDizhuCards();
            }
        }
    }

    compare(attack, defence) {
        // if(this._isChou && attack.type == constant.TYPE_ZHADAN) return true;
        if (attack.type == constant.TYPE_NULL) return false;
        //特殊规则，三带一对可以打过三带二
        // if(attack.type == constant.TYPE_SANDAIYIDUI && defence.type == constant.TYPE_SANDAIER && attack.value > defence.value){
        //     return true;
        // }
        //相同牌型比大小
        return (attack.type == defence.type && Number(attack.value) > Number(defence.value) && attack.cards.length == defence.cards.length)
            //炸弹通吃
            || (attack.type != defence.type && attack.type == constant.TYPE_ZHADAN)

    }

    hasZha(chairId) {
        var map = this.convertToMap(this._handCards[chairId]);
        var hasZha = false;
        for (var i in map) {
            if (map[i] == 4) return true;
        }
        return false;
    }

}

module.exports = DDZGame;