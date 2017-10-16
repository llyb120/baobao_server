const GameBase = require("./game_base");
const utils = require('../../common/utils');
const constant = require("../../common/sd_constant");


class SDGame extends GameBase{

    constructor(roomId){
        super(roomId);
        this._winCount = [0,0,0,0];
        this._loseCount = [0,0,0,0];
        this._zhadan = [0,0,0,0];

        //this._lastGameScore = [0,0,0,0];
    }

    onMessage(chairId, event, data) {
        switch (event){
            case 'buchu_pull':
                if(chairId != this._turn) return false;
                if(this._lastChupai == -1) return this.sendToChair(chairId,"chupai_error_push","请选择牌出牌！");
                //特殊规则，对2后一定要接对3
                if(this._lastPaiType.type == constant.TYPE_DUIZI && this._lastPaiType.value == 14){
                    var map = this.convertToMap(this._handCards[chairId]);
                    if(map[15] > 1){
                        return this.sendToChair(chairId,"chupai_error_push","你一定要出对3！");
                    }
                }
                //如果下家只剩一张牌，必须出手中最大的牌
                var nextChair = (chairId+1)%3;
                if(this._lastPaiType.type == constant.TYPE_DANZHANG && this._handCards[nextChair].length == 1){
                    var lastcard = this.getCardRealValue(this._lastPaiType.value);
                    for(var i=0;i<this._handCards[chairId].length;i++){
                        var val = this.getCardRealValue(this._handCards[chairId][i]);
                        if(val>lastcard){
                            return this.sendToChair(chairId,"chupai_error_push","你一定要出手中最大的牌！");
                        }
                    }
                }
                this.pushAction({
                    type : "buchu",
                    chairId : chairId
                });
                this.sendToRoom("chupai_push",{
                   chairId :chairId,
                   pai :null
                });
                this.record("chupai_push",{
                    chairId :chairId,
                    pai :null
                });

                this.moveToNextPlayer();

                //this.sync();
                break;
            case 'chupai_pull':
                //不该你出牌，你瞎出啥呢
                if(chairId != this._turn) return false;
                if(!data.cards) return false;
                var cards = data.cards;
                var _cards = cards;
                //检查是否有这些牌
                for(var i = 0; i < cards.length; i++){
                    if(this._handCards[chairId].indexOf(cards[i]) == -1){
                        return false;
                    }
                }
                //第一个人出的牌,必须出红桃4
                if(this._handCards[chairId].indexOf(3) > -1
                    && cards.indexOf(3) == -1){
                    return this.sendToChair(chairId,'chupai_error_push',"第一次出牌必须出红桃4");
                }


                var paiType = this.getPaixing(cards);

                //臭蛋情况下，如果手里有炸弹，就必须使用炸弹
                if(this._isChou){
                    var hasZha = this.hasZha(chairId);
                    if(hasZha && paiType.type != constant.TYPE_ZHADAN){
                        return false;
                    }
                }
                if(paiType.type == constant.TYPE_NULL) return this.sendToChair(chairId,"chupai_error_push","选择的牌型不对或者没有上家大！");
                var conti = false;
                if(this._lastPaiType){
                    if(
                        this.compare(paiType,this._lastPaiType)
                        //相同牌型比大小
                        // (this._lastPaiType.type == paiType.type && Number(paiType.value) > Number(this._lastPaiType.value))
                        // //炸弹通吃
                        // || paiType.type == constant.TYPE_ZHADAN
                    ){
                        conti = true;
                    }

                }
                else{
                    conti = true;
                }


                //如果下家只剩一张牌，必须出手中最大的牌
                var nextChair = (chairId+1)%3;
                if(this._handCards[nextChair].length == 1 && _cards.length == 1){
                    var thisCard = this.getCardRealValue(_cards[0]);
                    for(var i = 0; i < this._handCards[chairId].length; i++){
                        var val = this.getCardRealValue(this._handCards[chairId][i]);
                        if(val > thisCard){
                            return this.sendToChair(chairId,"chupai_error_push","你一定要出手中最大的牌！");
                        }
                    }
                }

                //特殊情况，最后剩余4张炸弹不可以空投
                if(this._handCards[chairId].length == 4){
                    if(paiType.type == constant.TYPE_ZHADAN){
                        return this.sendToChair(chairId,"chupai_error_push","炸弹不能最后出！");
                    }
                }
                //特殊情况，炸弹不能炸自己
                if(this._lastChupai == -1){
                    if(paiType.type == constant.TYPE_ZHADAN && paiType.value != 3 && !this._isChou){
                        return this.sendToChair(chairId,"chupai_error_push","炸弹不能空投！");
                    }
                }

                if(conti){
                    //删除牌型
                    for(var i = 0; i < cards.length; i++){
                        var index = (this._handCards[chairId].indexOf(cards[i]));
                        if(index > -1){
                            this._handCards[chairId].splice(index,1);
                        }
                    }
                    this._out[chairId] = this._out[chairId].concat(cards);
                    //如果是炸弹，就保存起来
                    if(paiType.type == constant.TYPE_ZHADAN){
                        var changed = [0,0,0,0];
                        //清空上一个炸弹的分
                        if(this._chain.length){
                            // var top = this._chain[this._chain.length - 1];
                            var top = this._chain.pop();
                            for(var i = 0; i < this._game.players.length; i++){
                                if(i == top) continue;
                                changed[top] -= this.calScore(constant.SCORE_ZHADAN);
                                changed[i] += this.calScore(constant.SCORE_ZHADAN);
                            }
                            // changed[top.gong] -= constant.SCORE_ZHADAN;
                            // changed[top.shou] += constant.SCORE_ZHADAN;
                        }
                        this._chain.push(chairId);
                        //炸弹数+1
                        this._zhadan[chairId]++;
                        //这次算分
                        for(var i = 0; i < this._game.players.length; i++){
                            if(i == chairId) continue;
                            changed[chairId] += this.calScore(constant.SCORE_ZHADAN);
                            changed[i] -= this.calScore(constant.SCORE_ZHADAN);
                        }
                        // changed[chairId] += constant.SCORE_ZHADAN;
                        // changed[this._lastChupai] -= constant.SCORE_ZHADAN;

                        this.changeScore(changed);
                    }
                    this._lastPaiType = paiType;
                    this._lastChupai = chairId;
                    this.pushAction({
                        chairId : chairId,
                        cards : _cards,
                        type : "chupai"
                    });
                    this.sendToRoom("chupai_push",{
                        chairId :chairId,
                        pai : paiType
                    });

                    this.record("chupai_push",{
                        chairId :chairId,
                        pai :paiType
                    });

                    var win = this._handCards[chairId].length == 0;
                    if(win){
                        this._turn = -1;
                    }
                    else{
                        this.moveToNextPlayer();
                    }
                    //this.sync();

                    if(win){
                        this.sendWinner(chairId);
                    }

                    // this.sendToRoom("chupai_pull",{
                    //     chairId : this._turn,
                    //     cards : data.cards
                    // });
                    //判断是否结束
                    //this.checkWin(chairId);
                }
                else{
                    this.sendToChair(chairId,"chupai_error_push","选择的牌型不对或者没有上家大！");
                }
                break;
        }
        return super.onMessage(chairId, event, data);
    }

    convertToMap(cards){
        var map = {};
        var self = this;
        cards.forEach(function (item) {
            item = self.getCardRealValue(item);
            map[item] = map[item] || 0;
            map[item]++;
        });
        return map;
    }

    calScore(score){
        return this._isChou ? 0 : score;
    }


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

    moveToNextPlayer(){
        if(this._turn >= 0 && this._isChou && this.hasZha(this._turn)){

        }
        else{
            this._turn++;
            this._turn %= this._roomInfo.gameConfig.playerCount;

            if(this._isChou){
                this._chouOk.push(1);
                if(this._chouOk.length == this._game.players.length){
                    this._lastPaiType = null;
                    this._lastChupai = -1;
                    this._isChou = 0;
                    this._turn = this._chouPlayer;
                }
            }

            if(this._lastChupai == this._turn){
                this._lastPaiType = null;
                this._lastChupai = -1;
                //链锁清空
                this._chain = [];
            }
        }

        this.pushTurn();
        this.record("turn_push",{turn : this._turn});

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

    sendWinner(chairId){
        super.end();
        var changed = [0,0,0,0];
        this._winCount[chairId]++;

        for(var i = 0; i < this._game.players.length; i++){
            if(i == chairId){
                continue;
            }
            this._loseCount[i]++;
            var len = this._handCards[i].length;
            //只剩一张不扣分
            if(len == 1){
                continue;
            }

            else if(len < 17){
                var score = len * constant.SCORE_BASE;
            }
            else{
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
        var changed = [0,0,0,0];
        for(var i=0;i<changed.length;i++){
            changed[i] = this._gameScore[i] - this._lastGameScore[i];
            this._eachTurnScore[i].push(changed[i]);
        }
        //发送上局分
        for(var i = 0;i<this._gameScore.length;i++){
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
        for(var i = 0; i < this._ready.length; i++){
            this._ready[i] = 'free';
        }

        this.record("record_end_push");
        this.sendToRoom("all_cards_push",this._handCards);

        this.sendToRoom("xiaojie_push",{
            winner : chairId,
            gameCount : this._gameCount,
            users : this._userInfo,
            handCards: this._handCards,
            scoreChanged : changed,
            zhaDan : this._zhadan
        });

        if(this._gameCount == 1){
            this.reduceFangka(this._userInfo[0].id);
        }

        if(this._gameCount == this._roomInfo.gameConfig.playcount){
            // var total = {
            //     score : this._gameScore,
            //     win : this._winCount,
            //     lose : this._loseCount,
            // }
            // data.total = total;
            this.sendToRoom("zongjie_push",{
                gameScore : this._gameScore,
                winCount : this._winCount,
                loseCount : this._loseCount,
                allScoreInfo : this._eachTurnScore
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

    pushAction(action){
        this._actions.push(
            action
        );
        if(this._actions.length > 2){
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
        this._zhadan = [0,0,0,0];
        //链锁牌
        this._chain = [];

        this._chouOk = [];
        this._chouPlayer = -1;
        if(!this._roomInfo.gameConfig.playcount){
            this._roomInfo.gameConfig.playcount = 8;
        }

        this.xipai();

        for(var i = 0; i < this._game.players.length; i++){
            var cards = this._handCards[i] = [];
            this._out[i] = [];
            for(var j = 0; j < 17; j++){
                cards.push(this._cards.pop());
            }
        }
        this._state = 'game';

        //@yang
        //查询出牌
        //红桃4是3
        for(var i = 0; i < this._game.players.length; i++){
            //判定先出
            if(this._handCards[i].indexOf(3) > -1){
                this._turn = i;
                //break;
            }
            var map = this.convertToMap(this._handCards[i]);
            if(map[3] == 4){
                this._isChou = 1;
                this._chouPlayer = i;
            }
            // if(this._handCards[i].indexOf(3) > -1
            //     && this._handCards[i].indexOf(17) > -1
            //     && this._handCards[i].indexOf(30) > -1
            //     && this._handCards[i].indexOf(43) > -1
            // ){
            // }
        }

        this.sendToRoom("game_start_push",{isChou:this._isChou});
        this.pushHolds();

        //
        this.pushGameInfo();

        this.prepareRecord();
        this.record("holds_push",JSON.parse(JSON.stringify(this._handCards)))
        // for(var i = 0; i < this._game.players.length; i++){
        //     this.pushHandCards(i);
        // }

        //chupai
        // this._turn = utils.rand(0,this._roomInfo.gameConfig.playerCount - 1);
        //@yang origin

        this.pushTurn();
        this.record("turn_push",{turn : this._turn})

        //this.sync();

        //test
    }

    xipai(){
        //0-12 hongtao
        //13-25 //heitao [132,0]
        //26-38 //meihua
        //39-52 //fankuai
        for(var i = 0; i < 52; i++){
           //三代没有方块3
           if(i == 41) continue;
           this._cards.push(i);
        }
        //test
        // for(var j = 0; j < 13; j++){
        //     for(var i = 0; i < 4; i++){
        //         var card = j + i * 13;
        //         //if(card == 42) continue;
        //         if(card == 41) continue;
        //         this._cards.push(card);
        //     }
        // }
        // return;

        var len = this._cards.length;
        var index = len * 3;
        while(--index){
            var ran1 = utils.rand(0,len - 1);
            var ran2 = utils.rand(0,len - 1);
            if(ran1 == ran2) continue;
            var temp;
            temp = this._cards[ran1];
            this._cards[ran1] = this._cards[ran2];
            this._cards[ran2] = temp;
            //this._cards[ran1] ^= this._cards[ran2];
            //this._cards[ran2] ^= this._cards[ran1];
            //this._cards[ran1] ^= this._cards[ran2];
        }
    }




    /**
     * 推送手牌
     * @param chairId
     */
    pushHolds(chairId = -1){
        if(chairId == -1){
            return this._userInfo.forEach(function (u,chairId) {
                if(u === null) return;
                this.pushHolds(chairId)
            }.bind(this));
        }
        var data = [];
        for(var i = 0; i < this._handCards.length; i++){
            if(i == chairId){
                data.push(this._handCards[i])
            }
            else{
                data.push(this._handCards[i].length);
            }
        }
        this.sendToChair(chairId,"holds_push",data);
    }



    pushTurn(chairId = -1){
        if(chairId == -1){
            return this._userInfo.forEach(function (u,chairId) {
                if(u === null) return;
                this.pushTurn(chairId)
            }.bind(this));
        }
        this.sendToChair(chairId,"turn_push",{turn : this._turn});
    }

    pushActions(chairId = -1){
        if(chairId == -1){
            return this._userInfo.forEach(function (u,chairId) {
                if(u === null) return;
                this.pushActions(chairId)
            }.bind(this));
        }
        this.sendToChair(chairId,"actions_push",this._actions);
    }

    pushGameInfo(chairId = -1){
        if(chairId == -1){
            return this._userInfo.forEach(function (u,chairId) {
                if(u === null) return;
                this.pushGameInfo(chairId)
            }.bind(this));
        }
        this.sendToChair(chairId,"game_info_push",{
            gameCount : this._gameCount,
            state : this._state,
            isChou : this._isChou,
            lastPaiType : this._lastPaiType,
            lastChair: this._lastChupai,
            gameScore : this._gameScore,
            dismiss : this._dismissApply,
        });
    }


    end() {
        return super.end();
    }

    destroy() {
        return super.destroy();
    }


    sync(chairId = -1){
        this.pushState(chairId);
        this.pushUsers(chairId);
        this.pushGameInfo(chairId);

        var self = this;
        if(this._state == 'free'){
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
        else if(this._state == 'game'){
            this.pushHolds(chairId);
            this.pushTurn(chairId);
            this.pushActions(chairId);

            this._game.players.forEach(function (userId,index) {
                var data = {
                    state : 'game',
                    users : self._userInfo,
                    chairId : index,
                    roomInfo : self._roomInfo,
                    handCards : [],
                    turn : self._turn,
                    actions : self._actions,
                    gameCount: self._gameCount,
                    dismiss : self._dismissApply,
                    //本局发送上局的分数
                    gameScore : self._lastGameScore,
                    isChou : self._isChou,
                    lastPaiType : self._lastPaiType,
                };
                for(var i = 0; i < self._handCards.length; i++){
                    if(i == index){
                        data.handCards.push(self._handCards[i]);
                    }
                    else{
                        data.handCards.push(self._handCards[i].length);
                    }
                }
                //self.sendToChair(index,'sync_push',data);
            });

            // this.sendWinner(0)
        }
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

    hasZha(chairId){
        var map = this.convertToMap(this._handCards[chairId]);
        var hasZha = false;
        for(var i in map){
            if(map[i] == 4) return true;
        }
        return false;
    }

}

module.exports = SDGame;