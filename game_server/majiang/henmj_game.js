const config = require('./config');
const utils = require("../../common/utils");
const constant = require('../../common/mj_constant');
const GameBase = require("./game_base");
const mjutils = require('./mjutils');
const db = require("../../common/db");
const mjhu = require('./hu.js');

class HENMJGame extends GameBase {

    constructor(roomId) {
        super(roomId);
        //this._game = global.Games.rooms[roomId];
        this._zhuang = 0;
        // this._gameCount = 0;
        // this._roomId = roomId;

        this._cards = [];
        this._handCards = [];
        this._handCardsMap = [];
        this._lastCard = -1;
        this._lastChair = -1;
        this._combo = {};
        this._turn = 0;
        this._actions = [];
        this._actionCache = {};
        this._userActions = {};
        this._tingMap = {};
        this._pao = null;
        // this._magic = 31;
        this._magic = 33;
        this._zimoCard = -1;
        this._tongji = [];
        this._mopai = -1;
        this._record = {};
        for (var i = 0; i < 4; i++) {
            this._tongji.push({
                zimo: 0,
                jiepao: 0,
                angang: 0,
                dianpao: 0,
                minggang: 0
            })
        }
    }


    /**
     * 预设游戏规则
     *
     * feng : 带风牌 true/false
     * hongzhong : 红中玩法 true/false
     * hu : 普通平胡，只炸不胡 0/1
     * jiang258 : 只能用258做将 true/false
     * hu258fan : 胡258加番 true/false
     * jiang258fan : 将258加番 true/false
     * 7duifan : 不许胡，可胡7对（加番），不加番 0/1/2
     * qingyise : 清一色加番 true/false
     *
     */



    start() {
        super.start();
        // this._gameCount++;
        this._game = global.Games.rooms[this._roomId];
        this._fan = 0;

        //庄家随机
        //第一轮需要初始化的数据
        if (this._gameCount == 1 || this._lastWinner == -1) {
            //this._zhuang = utils.rand(0,this._game.players.length - 1);
            this._zhuang = 0;
            //for(var i = 0; i < this._game.players.length; i++){
            //    this._gameScore[i] = 0;
            //}
        }
        else {
            this._zhuang = this._lastWinner;
        }


        //this.sendToRoom("game_start_push");
        this._turn = this._zhuang;
        this._cards = [];
        this._lastCard = -1;
        this._lastChair = -1;
        this._lastWinner = -1;
        this._zimoCard = -1;
        this._combo = {};
        this._actions = {};
        this._userActions = {};
        this._actionCache = {
            peng: [],
            gang: [],
            hu: []
        }
        this._outCards = {};
        this._showAllCards = 0;
        this._scoreChanged = {}
        this._hua = [];
        for (var i = 0; i < this._game.players.length; i++) {
            //this._actions.push(constant.ACTION_NULL);
            // this._userActions[i] = constant.ACTION_NULL;
            this._combo[i] = [];
            this._hua[i] = [];
            this._handCardsMap[i] = {};
            this._handCards[i] = [];
            this._outCards[i] = [];
            this._tingMap[i] = {};
            for (var j = 0; j < 34; j++) {
                this._handCardsMap[i][j] = 0;
            }
            this._scoreChanged[i] = 0;
        }

        //统计点杠和暗杠以及明杠
        this._xjtongji = [];
        for (var i = 0; i < 4; i++) {
            this._xjtongji.push({
                diangang: 0,
                minggang: 0,
                angang: 0
            });
        }


        //洗牌
        this.xipai();

        this._state = 'game';

        //@yang
        //给所有用户发牌
        for(var j = 0; j < this._game.players.length; j++){
            for(var i = 0; i < config.DEFAULT_HAND_CARDS; i++){
                this.mopai(j,false,false);
            }
            //this.updateTing(j);
        }

        this.sendToRoom("game_start_push");
        this.pushState();
        this.pushGameInfo();

        this.prepareRecord();

        this._turn = this._zhuang;
        this.pushHolds();
        this.record("holds_push", JSON.parse(JSON.stringify(this._handCards)));
        this.pushTurn();
        this.record("turn_push", { turn: this._turn });


        this.mopai(this._turn, true, true);

        //下炮子
        // this._pao = {};
        // this._turn = -1;

        // this.pushTurn();
        //this.record("turn_push",{turn : this._turn});

        // this.pushPao();
        // this.sync();
        // this.notifyChupai();
    }

    /**
     * 推送手牌
     * @param chairID
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

    /**
     * 推送已经出过的牌
     * @param chairId
     * @param undefined
     */
    pushOut(chairId = -1) {
        if (chairId == -1) {
            return this._userInfo.forEach(function (u, chairId) {
                if (u === null) return;
                this.pushOut(chairId)
            }.bind(this));
        }
        this.sendToChair(chairId, "out_cards_push", this._outCards);
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
            zhuang: this._zhuang,
            gameScore: this._gameScore,
            leftCardCount: this._cards.length,
            dismiss: this._dismissApply,
            roomInfo: this._roomInfo,
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

    // pushPao(chairId = -1) {
    //     if (chairId == -1) {
    //         return this._userInfo.forEach(function (u, chairId) {
    //             if (u === null) return;
    //             this.pushPao(chairId)
    //         }.bind(this));
    //     }
    //     this.sendToChair(chairId, "pao_push", this._pao);
    // }

    pushCombo(chairId = -1) {
        if (chairId == -1) {
            return this._userInfo.forEach(function (u, chairId) {
                if (u === null) return;
                this.pushCombo(chairId)
            }.bind(this));
        }
        this.sendToChair(chairId, "combo_push", this._combo);
    }

    pushActions(chairId = -1) {
        if (chairId == -1) {
            return this._userInfo.forEach(function (u, chairId) {
                if (u === null) return;
                this.pushActions(chairId)
            }.bind(this));
        }
        if (Object.keys(this._actions).length) {
            this.sendToChair(chairId, "action_push", this._actions);
        }
    }

    pushHua(chairId = -1){
        if(chairId === -1){
            return this._userInfo.forEach((u,c) => {
                if(u === null) return;
                this.pushHua(c);
            });
        }
        this.sendToChair(chairId,'hua_push',this._hua[chairId]);
    }

    // pushLastChupai(chairId,undefined){
    //
    // }


    sync(chairId = -1) {
        this.pushState(chairId);
        this.pushUsers(chairId);
        this.pushGameInfo(chairId);


        //chairId = undefined;
        var self = this;
        //super.sync(chairId);
        if (this._state == 'game') {

            this.pushCombo(chairId);
            this.pushHolds(chairId);
            this.pushTurn(chairId);
            this.pushOut(chairId);
            this.pushActions(chairId);
            this.pushHua(chairId);
            // this.pushPao(chairId);
        }

    }


    onMessage(chairId, event, data) {
        var self = this;
        switch (event) {
            case 'chupai_pull':
                if (chairId != this._turn) return false;
                var card = data.card;
                if (this._handCardsMap[chairId][card] == 0) return false;
                //删除出牌
                var index = this._handCards[chairId].indexOf(card);
                if (index > -1) {
                    this._handCards[chairId].splice(index, 1);
                }
                this._handCardsMap[chairId][card]--;
                this._lastCard = card;
                this._lastChair = chairId;
                this._outCards[chairId].push(card);
                //更新听牌
                this._game.players.forEach(function (player, index) {
                    self.updateTing(index);
                });

                this.sendToRoom("chupai_push", {
                    chairId: chairId,
                    card: card
                });
                this.record("chupai_push", {
                    chairId: chairId,
                    card: card
                });
                //self.updateTing(i);

                this._actions = {};
                this._actionCache = {
                    peng: [],
                    gang: [],
                    hu: []
                };
                this._userActions = {};
                //检查动作
                for (var i = 0; i < this._game.players.length; i++) {
                    if (i == chairId) {
                        continue;
                    }
                    var action = {
                        peng: 0,
                        gang: 0,
                        hu: 0,
                        diangang: 0,
                        angang: 0,
                        penggang: 0
                    };
                    if (self.checkPeng(i, card)) {
                        action.peng = 1;
                    }
                    if (self.checkDianGang(i, card) !== false) {
                        action.gang = 1;
                        //action.diangang = 1;
                        //this._actionCache[i].diangang.push(card);
                    }
                    if (self.checkHu(i, card, true)) {
                        action.hu = 1;
                    }
                    // if(self.checkGang(i,card)){
                    // }
                    // if(self.updateTing(i,card)){
                    //     action.hu = 1;
                    // }
                    
                    if(this.getNextPlayer(chairId) == i){
                        let chi = this.checkChi(i,card);
                        if(chi){
                            let ret = chi.filter(item => !item.includes(this._magic));
                            action.chi = ret;
                        }
                    }


                    if (!action.hu
                        && !action.peng
                        && !action.gang
                        && (!action.chi || !action.chi.length)) {
                        continue;
                    }
                    this._actions[i] = action;
                }
                //等待执行动作
                if (Object.keys(this._actions).length) {
                    this._turn = -1;
                    this.pushTurn();
                    this.pushActions();

                    this.record("turn_push", { turn: this._turn });
                    // this.sendToRoom("chupai_success_push",{
                    //     chairId:chairId,
                    //     card : card,
                    //     actions : this._actions,
                    //     turn : -1
                    // });
                }
                else {
                    this.moveToNextPlayer();
                    this.mopai(this._turn, true, true);
                }
                //this.sync();
                break;
            case 'peng_pull':
                //不是你碰，你碰什么呢
                if (!this._actions[chairId]) {
                    return;
                }
                if (!this._actions[chairId].peng) {
                    return;
                }
                if (!this.checkPeng(chairId, this._lastCard)) {
                    return;
                }
                this._actionCache.peng.push(chairId);
                this._actions[chairId] = null;

                //检查是否需要等待
                for (var i in this._actions) {
                    if (!this._actions[i]) continue;

                    if (this._actions[i].peng || this._actions[i].gang || this._actions[i].hu) {
                        return;
                    }
                }
                this.doAction();
                break;
            case 'gang_pull':
                //不是你碰，你碰什么呢
                if (!this._actions[chairId] || !this._actions[chairId].gang) {
                    return;
                }

                this._actionCache.gang.push(chairId);
                this._actions[chairId] = null;

                for (var i in this._actions) {
                    if (!this._actions[i]) continue;
                    if (this._actions[i].gang || this._actions[i].hu) {
                        return;
                    }
                }



                this.doAction();
                break;
            case 'hu_pull':
                if (!this._actions[chairId] || !this._actions[chairId].hu) {
                    return;
                }
                // if(!this.checkGang(chairId,this._lastCard)){
                //     return;
                // }
                //删除自己的行为
                this._actionCache.hu.push(chairId);
                this._actions[chairId] = null;
                //检查是否需要等待
                for (var i in this._actions) {
                    if (!this._actions[i]) continue;
                    if (this._actions[i].hu) {
                        return;
                    }
                }
                this.doAction();
                break;

            /**
             * 吃牌
             */
            case 'chi_pull':
                if(!this._actions[chairId] 
                    || !this._actions[chairId].chi
                    || !this._actions[chairId].chi.length
                ){
                    return;
                }
                let card1 = data.cards[0],
                    card2 = data.cards[1];
                // let matched = false;
                let matched = this._actions[chairId].chi.filter(item => {
                    return item.includes(card1) && item.includes(card2);
                });
                if(!matched.length){
                    return;
                }
                this._actionCache.chi = this._actionCache.chi || [];
                this._actionCache.chi.push([chairId,matched[0]]);
                this._actions[chairId] = null;
                for(let ch in this._actions){
                    const action = this._actions[ch]; 
                    if(!action){
                        continue;
                    }
                    if(action.peng || action.gang || action.hu){
                        return;
                    }
                }
                this.doAction();
                break;

            case 'guo_pull':
                this._actions[chairId] = null;
                for (var i in this._actionCache) {
                    var index = this._actionCache[i].indexOf(chairId);
                    if (chairId > -1) {
                        this._actionCache[i].splice(index, 1);
                    }
                }
                //this._actionCache = {
                //    peng : [],
                //    gang : [],
                //    hu : []
                //};
                for (var i in this._actions) {
                    if (!this._actions[i]) {
                        continue;
                    }
                    if (this._actions[i].peng
                        || this._actions[i].gang
                        || this._actions[i].hu) {
                        return;
                    }
                }
                this.doAction();
                // this._turn = this.searchTurn();
                // this.sync();
                break;


            // case 'pao_pull':
            //     if (this._pao.hasOwnProperty(chairId)) return;
            //     if (data.pao < 0) data.pao = 0;
            //     if (data.pao > 4) data.pao = 4;
            //     this._pao[chairId] = data.pao;
            //     if (Object.keys(this._pao).length == this._game.players.length) {
            //         //给所有用户发牌
            //         for (var j = 0; j < this._game.players.length; j++) {
            //             for (var i = 0; i < config.DEFAULT_HAND_CARDS; i++) {
            //                 this.mopai(j, false, false);
            //             }
            //             //this.updateTing(j);
            //         }

            //         this._turn = this._zhuang;
            //         this.pushPao();

            //         this.pushHolds();
            //         this.pushGameInfo();
            //         this.record("holds_push", JSON.parse(JSON.stringify(this._handCards)));
            //         this.pushTurn();
            //         this.record("turn_push", { turn: this._turn });

            //         this.mopai(this._turn, true, true);
            //     }
            //     else {
            //         this._turn = -1;
            //         this.pushPao();
            //     }
            //     //this.sync();
            //     break;

        }

    }

    end() {
        //this.sync();
    }


    /**
     * 摸牌
     * @param chairId
     */
    mopai(chairId, checkAnGang = false, isSend = false) {
        if (!this._cards.length) {
            return this.sendXiaojie(-1);
        }
        this._mopai = chairId;

        var card = this._cards.pop();
        //如果是花牌
        // if(card >= 34){
        //     this._hua[chairId].push(card);
        //     this.sendToRoom("hua_mopai_push",{
        //         chairId : chairId,
        //         card :card
        //     });
        //     // this.record("hua_mopai_push", {
        //     //     chairId: chairId,
        //     //     card: card
        //     // }); 
        //     return this.mopai(chairId.checkAnGang,isSend);
        // }

        this._handCards[chairId].push(card);
        this._handCardsMap[chairId][card]++;
        this._actions = {};
        this._zimoCard = -1;

        if (!checkAnGang) return;
        var action = {
            peng: 0,
            gang: 0,
            hu: 0
        }
        var gangCard = this.checkAnGang(chairId);
        if (gangCard === false) {
            gangCard = this.checkPengGang(chairId);
        }
        if (gangCard !== false) {
            action.gang = 1;
            this._actions[chairId] = action;
        }

        if (isSend) {
            this.sendToRoom("mopai_push", {
                chairId: chairId,
                card: card
            });

            this.record("mopai_push", {
                chairId: chairId,
                card: card
            });
        }

        //hu
        if (this.checkHu(chairId, card)) {
            action.hu = 1;
            this._actions[chairId] = action;
            this._zimoCard = card;
        }
        if (Object.keys(this._actions).length) {
            this._turn = -1;
            this.pushTurn();
            this.record("turn_push", { turn: this._turn });
        }
        this.pushActions();
    }

    sendXiaojie(chairId) {
        super.end();
        if (chairId != -1) {
            this._lastWinner = chairId;
            if (this.isHisTurn(chairId)) {
                var card = this._handCards[chairId].pop();
                var dianpao = -1;
            }
            else {
                var card = this._lastCard;
                var dianpao = this._lastChair;
            }
        }
        else {
            this._lastWinner = this._zhuang;
            var card = -1;
            var dianpao = -1
        }

        var self = this;


        var changed = [0, 0, 0, 0];
        if (chairId != -1) {
            for (var i = 0; i < changed.length; i++) {
                changed[i] = this._gameScore[i] - this._lastGameScore[i];
                this._eachTurnScore[i].push(changed[i]);
            }
        }
        else {
            for (var i = 0; i < changed.length; i++) {
                this._eachTurnScore[i].push(changed[i]);
            }
        }

        //this._lastGameScore = this._gameScore;
        if (chairId != -1) {
            for (var i = 0; i < this._gameScore.length; i++) {
                this._lastGameScore[i] = this._gameScore[i];
            }
        }
        else {
            for (var i = 0; i < this._gameScore.length; i++) {
                this._gameScore[i] = this._lastGameScore[i];
                //this._lastGameScore[i] = this._gameScore[i];
            }
        }


        var data = {
            huCard: card,
            huMan: chairId,
            gameScore: this._gameScore,
            gameCount: this._gameCount,
            zhuang: this._zhuang,
            roomInfo: this._roomInfo,
            scoreChanged: changed,
            handCards: self._handCards,
            combo: self._combo,
            dianpao: dianpao,
            pao: self._pao,
            tongji: self._xjtongji
        }

        this._state = 'free';
        for (var i = 0; i < this._ready.length; i++) {
            this._ready[i] = 'free';
        }

        this.record("record_end_push");

        //var all_cards = [];
        //for(var i=0;i<this._game.players.length;i++){
        //    all_cards[i] = this._handCards[i];
        //}
        //all_cards[chairId].push(card);
        this.sendToRoom("all_cards_push", { handCards: this._handCards, huMan: chairId, huCard: card });
        this.sendToRoom("xiaojie_push", data);
        if (this._gameCount == this._roomInfo.gameConfig.playcount) {
            this.sendToRoom("zongjie_push", {
                gameScore: this._gameScore,
                tongji: this._tongji,
                allScoreInfo: this._eachTurnScore
            });

            //this._record =
            this.forceDismissRoom();
        }

        // this.sync();
    }

    doAction() {
        var lastCard = this._lastCard;
        //if(lastCard == -1) return;
        this._userActions = {};
        this._actions = {};
        var self = this;

        if (this._actionCache.hu.length) {
            //应用截胡！
            var chairId = this._actionCache.hu[0];

            for (var i = 1; i < 4; i++) {
                var real = (this._lastChair + i) % this._userInfo.length;
                if (this._actionCache.hu.indexOf(real) > -1) {
                    chairId = real;
                    break;
                }
            }
            //zimo

            this._userActions[chairId] = 'hu';
            // this._showAllCards = 1;
            this._turn = -1;
            //胡牌计算分数
            var fan = 0,
                paixings = null,
                zimo = false;

            var huCard = -1;

            if (this.isHisTurn(chairId)) {
                //hu = this._tingMap[chairId][this._zimoCard];
                huCard = this._zimoCard;
                paixings = this.checkHu(chairId, huCard);
                zimo = true;
            }
            else {
                //hu = this._tingMap[chairId][this._lastCard];
                huCard = this._lastCard;
                paixings = this.checkHu(chairId, huCard, true);
            }
            if (paixings && paixings.type == '7dui' && this._roomInfo.gameConfig.qiduifan == 1) {
                fan++;
            }
            if (paixings && paixings.type != '7dui') {
                if (this._roomInfo.gameConfig.jiang258fan) {
                    for (var i = 0; i < paixings.length; i++) {
                        var iscontinue = true;
                        for (var j = 0; j < paixings[i].length; j++) {
                            if (paixings[i][j].type == mjhu.MJType.jiang && constant.CARD_258.indexOf(paixings[i][j].value) > -1) {
                                fan++;
                                iscontinue = false;
                                break;
                            }
                        }
                        if (!iscontinue) break;
                    }
                }
                if (this._roomInfo.gameConfig.hu258fan
                    && constant.CARD_258.indexOf(huCard) > -1) {
                    fan++;
                }
            }
            //if(hu.type == '7dui' && this._roomInfo.gameConfig.qiduifan == 1){
            //    fan++;
            //}
            //if(hu.type != '7dui'){
            //    if(this._roomInfo.gameConfig.jiang258fan
            //        && constant.CARD_258.indexOf(hu.jiang) > -1){
            //        fan++;
            //    }
            //    if(this._roomInfo.gameConfig.hu258fan
            //        && constant.CARD_258.indexOf(huCard) > -1){
            //        fan++;
            //    }
            //}

            var changed = [0, 0, 0, 0];
            var selfPao = 0,
                otherPao = 0;
            var others = 0;
            this._game.players.forEach(function (player, index) {
                if (index == chairId) return;
                var score =
                    //炮子分
                    (
                        //普通平胡不变,只炸不胡炮子分*2
                        constant.SCORE_BASE
                        //自摸翻倍
                        * (zimo ? 2 : 1)
                        +
                        constant.SCORE_BASE * (zimo ? 2 : 1) * Math.pow(2, fan)
                        //庄家翻倍
                        * (chairId == self._zhuang ? 2 : (index == self._zhuang ? 2 : 1))
                    )
                    //基础分
                    //*(self._roomInfo.gameConfig.hu+1)
                    //*
                    //点炮其他人不扣分
                    * (!zimo && index != self._lastChair ? 0 : 1)



                //var score = constant.SCORE_BASE * ((index == self._zhuang?2:1)*(zimo?2:1)
                //    +(zimo?(self._pao[index]+self._pao[chairId]):(index == self._lastChair?self._pao[self._lastChair]+self._pao[chairId]:0)))
                //    * Math.pow(2,fan);
                //var score = 0;
                //if(zimo){
                //    score = constant.SCORE_BASE * ((index == self._zhuang?2:1)*2+(self._pao[index]+self._pao[chairId]))*Math.pow(2,fan);
                //}
                //else{
                //    if(self._lastChair == index){
                //        score = constant.SCORE_BASE * ((index == self._zhuang?2:1)+(self._pao[self._lastChair]+self._pao[chairId]))*Math.pow(2,fan);
                //    }
                //}

                changed[chairId] += score;
                changed[index] -= score;
            });
            this.changeScore(changed);

            if (zimo) this._tongji[chairId].zimo++;
            else {
                this._tongji[chairId].jiepao++;
                this._tongji[this._lastChair].dianpao++;
            }

            this.pushTurn();
            this.record("turn_push", { turn: this._turn });
            this.sendToRoom("action_result_push", {
                chairId: chairId,
                action: "hu",
                card: huCard
            });
            this.record("action_result_push", {
                chairId: chairId,
                action: "hu",
                card: huCard
            });

            //this.sync();


            this.sendXiaojie(chairId);

            // for(var i = 0; i < this._actionCache.hu.length; i++){
            //     var chairId = this._actionCache.hu[i];
            //     this._userActions[chairId] = constant.ACTION_HU;
            // }
            // this.end();
        }
        else if (this._actionCache.gang.length) {
            // for(var i = 0; i < this._actionCache.gang.length; i++) {
            var i = this._actionCache.gang[0];
            //如果是我的回合，必然是暗杠或者碰杠
            if (this.isHisTurn(i)) {
                var angang = this.checkAnGang(i);
                var penggang = this.checkPengGang(i);
                if (angang !== false) {
                    //增加组合
                    this._combo[i].push({
                        type: "angang",
                        card: angang
                    });
                    //删除手牌
                    this.removeHandCard(i, angang, 4);

                    //赢家收取其他玩家两倍底分
                    var changed = [0, 0, 0, 0];
                    this._game.players.forEach(function (player, index) {
                        if (i == index) return;
                        changed[i] += constant.SCORE_BASE * 2;
                        changed[index] -= constant.SCORE_BASE * 2;
                    });
                    this.changeScore(changed);

                    this._tongji[i].angang++;
                    this._xjtongji[i].angang++;

                    this.sendToRoom("action_result_push", {
                        chairId: i,
                        action: "angang",
                        card: angang
                    });
                    this.record("action_result_push", {
                        chairId: i,
                        action: "angang",
                        card: angang
                    });

                }
                else if (penggang !== false) {
                    for (var j = 0; j < this._combo[i].length; j++) {
                        var combo = this._combo[i][j];
                        if (combo.type == 'peng' && combo.card == penggang) {
                            combo.type = 'gang';
                            this.removeHandCard(i, penggang, 1);
                            //收取其他玩家一倍底分
                            var changed = [0, 0, 0, 0];
                            this._game.players.forEach(function (player, index) {
                                if (i == index) return;
                                changed[i] += constant.SCORE_BASE;
                                changed[index] -= constant.SCORE_BASE;
                            });
                            this.changeScore(changed);

                            this._tongji[i].minggang++;
                            this._xjtongji[i].minggang++;

                            this.sendToRoom("action_result_push", {
                                chairId: i,
                                action: "penggang",
                                card: penggang
                            });
                            this.record("action_result_push", {
                                chairId: i,
                                action: "penggang",
                                card: penggang
                            });

                            break;
                        }
                    }
                }

            }
            //点杠
            else {
                var card = this.checkDianGang(i, this._lastCard);
                //增加组合
                this._combo[i].push({
                    type: "gang",
                    card: lastCard
                });
                //删除手牌
                this.removeHandCard(i, lastCard, 3);
                //删除打过的牌
                var index = this._outCards[this._lastChair].lastIndexOf(lastCard);
                if (index > -1) {
                    this._outCards[this._lastChair].splice(index, 1);
                }
                //收取点杠者一倍底分
                var changed = [0, 0, 0, 0];
                changed[this._lastChair] -= constant.SCORE_BASE;
                changed[i] += constant.SCORE_BASE;

                this.changeScore(changed);

                this._tongji[this._lastChair].diangang++;
                this._tongji[i].minggang++;
                this._xjtongji[this._lastChair].diangang++;
                this._xjtongji[i].minggang++;

                this.sendToRoom("action_result_push", {
                    chairId: i,
                    action: "diangang",
                    card: lastCard
                });
                this.record("action_result_push", {
                    chairId: i,
                    action: "diangang",
                    card: lastCard
                });
            }
            this._userActions[i] = 'gang';
            this._turn = i;
            this.pushTurn();
            this.record("turn_push", { turn: this._turn });

            //this.updateTing(i);

            this.mopai(i, true, true);
            //this.sync();

        }

        else if (this._actionCache.peng.length) {
            //因为涉及到出牌，所以先碰的人生效（事实上不会出现两个同时碰的情况)
            var chairId = this._actionCache.peng[0];
            this._userActions[chairId] = 'peng';
            //删除手牌
            this.removeHandCard(chairId, lastCard, 2);

            //删除上一个出牌
            this._outCards[this._lastChair].pop();
            //增加组合
            this._combo[chairId].push({
                type: 'peng',
                card: lastCard
            });
            this._turn = chairId;

            this.pushTurn();
            this.record("turn_push", { turn: this._turn });

            this.sendToRoom("action_result_push", {
                chairId: chairId,
                action: "peng",
                card: lastCard
            });
            this.record("action_result_push", {
                chairId: chairId,
                action: "peng",
                card: lastCard
            });

            if (this.checkPengGang(chairId) !== false || this.checkAnGang(chairId) !== false) {
                this._actions[chairId] = {
                    peng: 0,
                    gang: 1,
                    hu: 0,
                }
                this.pushActions();
            }

            //this.sync();
        }

        else if(this._actionCache.chi && this._actionCache.chi.length){
            let [cid,cards] = this._actionCache.chi[0];
            for(let card of cards){
                this.removeHandCard(cid,card,1);
            }
            this._outCards[this._lastChair].pop();
            let combo = {
                type : 'chi',
                value : lastCard,
                source : [cards[0], cards[1], lastCard].sort(function (a, b) { return a - b; }),
                from : this._lastChair
            }
            this._combo[cid].push(combo)
            this._turn = cid;
            this.pushTurn();
            this.sendToRoom("action_result_push", {
                chairId: cid,
                action: "chi",
                card: lastCard,
                cost: cards,
                from: this._lastChair
            });
            this.record("action_result_push", {
                chairId: cid,
                action: "chi",
                card: lastCard,
                cost: cards,
                from: this._lastChair
            });

            if (this.checkPengGang(cid) !== false || this.checkAnGang(cid) !== false) {
                this._actions[cid] = {
                    peng: 0,
                    gang: 1,
                    hu: 0,
                }
                this.pushActions();
            }
        }

        //guo
        else {
            this._turn = this.searchTurn();
            if (this._turn == -1) {
                this._turn = this._lastChair;
                this.moveToNextPlayer();
            }
            if (this._handCards[this._turn].length % 3 != 2) {
                this.mopai(this._turn, true, true);
            }
            else {
                this.pushTurn();
            }
            //this.sync();
        }

    }


    /**
     *  洗牌
     */
    xipai() {
        //0-8 wan
        for (let j = 0; j < 9; j++) {
            for (let i = 0; i < 4; i++) {
                this._cards.push(j);
            }
        }
        //9-17 tong
        for (let i = 9; i < 18; i++) {
            for (let j = 0; j < 4; j++) {
                this._cards.push(i);
            }
        }
        //18-26 tiao
        for (let i = 18; i < 27; i++) {
            for (let j = 0; j < 4; j++) {
                this._cards.push(i);
            }
        }

        //是否包含风牌
        // if (this._roomInfo.gameConfig.feng) {
            for (let i = 27; i < 34; i++) {
                for (let j = 0; j < 4; j++) {
                    this._cards.push(i);
                }
            }
        // }

        //追加花牌
        //34 - 41
        // for(let i = 0; i < 8; i++){
        //     this._cards.push(i + 34);
        // }

        //红中玩法需要加入红中
        //红中是31
        //财神改为白板３３
        // if (!this._roomInfo.gameConfig.feng && this._roomInfo.gameConfig.hongzhong) {
        //     for (let i = 0; i < 4; i++) {
        //         this._cards.push(33);
        //     }
        // }

        //xipai
        for (var i = 0, len = this._cards.length; i < len; i++) {
            var rand1 = utils.rand(0, len - 1);
            var rand2 = utils.rand(0, len - 1);
            var temp = this._cards[rand1];
            this._cards[rand1] = this._cards[rand2];
            this._cards[rand2] = temp;
            //this._cards[rand1] ^= this._cards[rand2];
            //this._cards[rand2] ^= this._cards[rand1];
            //this._cards[rand1] ^= this._cards[rand2];
        }

    }


    moveToNextPlayer() {
        this._turn++;
        this._turn %= this._game.players.length;

        this.pushTurn();
        this.record("turn_push", { turn: this._turn });

    }

    checkPeng(chairId, card) {
        return this._handCardsMap[chairId][card] > 1;
    }

    // checkChi(chairId, card) {

    // }

    checkAnGang(chairId) {
        for (var i = 0; i < 34; i++) {
            if (this._handCardsMap[chairId][i] > 3) {
                return parseInt(i);
            }
        }
        return false;
    }

    checkDianGang(chairId, card) {
        return this._handCardsMap[chairId][card] > 2;
    }

    checkPengGang(chairId) {
        for (var i = 0; i < this._combo[chairId].length; i++) {
            var combo = this._combo[chairId][i];
            if (combo.type == 'peng') {
                if (this._handCardsMap[chairId][combo.card] > 0) {
                    return combo.card;
                }
            }
        }
        return false;
    }

    checkGang(chairId, card, undefined) {
        if (card === undefined) {
            //暗杠
            for (var i = 0; i < 34; i++) {
                if (this._handCardsMap[chairId][i] > 3) {
                    return true;
                }
            }
            //点杠
            if (this._lastCard > -1) {
                if (this._handCardsMap[chairId][i] > 2) {
                    return true;
                }
            }
            return false;
        }
        //碰杠
        for (var i = 0; i < this._combo[chairId].length; i++) {
            if (this._combo[chairId][i].type == 'peng'
                && this._combo[chairId][i].card == card
            ) {
                return true;
            }
        }
        return this._handCardsMap[chairId][card] > 2;
    }

    checkHu(chairId, card, add = false) {
        var flag = true;
        //只能自摸胡
        if (this._roomInfo.gameConfig.hu > 0 && !this.isHisTurn(chairId)) {
            //flag = this.isHisTurn(chairId);
            return false;
        }

        if (!this._roomInfo.gameConfig.hongzhong) {
            var magic = -100;
        }
        else {
            var magic = this._magic;
        }

        //4个直接胡
        if(this._handCardsMap[chairId][magic] >= 4){
            return true;
        }
        //3个以上必须自模胡
        //持有魔术牌的时候只能自摸胡
        if(this._handCardsMap[chairId][magic] > 3){
        	if(!this.isHisTurn(chairId)){
        		return false;
        	}
        }
        //1-2个看情况自模胡
        if(this._handCardsMap[chairId][magic] <= 2 && this._handCardsMap[chairId][magic] > 0){
            //强制自摸的情况
            if(this._roomInfo.gameConfig.forceZimo && !this.isHisTurn(chairId)){
                return false;
            }
        }

        var holds = Object.assign([], this._handCards[chairId]);
        var map = Object.assign({}, this._handCardsMap[chairId]);
        if (add) {
            holds.push(card);
            map[card]++;
        }

        
        //7dui
        if (this._roomInfo.gameConfig.qiduifan > 0) {
            if (holds.length == 14) {
                var duizi = 0;
                for (var i in map) {
                    if (i == magic) continue;

                    if (map[i] == 2) {
                        duizi++;
                    }
                }
                var left = 14 - duizi * 2;
                if (left <= 2 * map[magic]) {
                    return {
                        type: '7dui'
                    };
                }
            }
        }


        var ret = mjhu.calPaiXing(holds, map, magic);
        if (ret && ret.length) {
            if (this._roomInfo.gameConfig.jiang258) {
                var canhu = false;
                for (var i = 0; i < ret.length; i++) {
                    for (var j = 0; j < ret[i].length; j++) {
                        if (ret[i][j].type == mjhu.MJType.jiang && constant.CARD_258.indexOf(ret[i][j].value) > -1) {
                            canhu = true;
                        }
                    }
                }
                if (!canhu) {
                    return false;
                }
            }
            return ret;
        }
        return false;

    }


    updateTing(chairId) {
        this._tingMap[chairId] = {};
        //检查7对
        do {
            if (this._roomInfo.gameConfig.qiduifan > 0) {
                var cards = this._handCards[chairId],
                    map = this._handCardsMap[chairId];

                var miss = [];
                for (var i in map) {
                    var index = parseInt(i);
                    if (this._roomInfo.gameConfig.hongzhong && index == this._magic) {
                        continue;
                    }
                    if (map[i] != 2) {
                        miss.push(i);
                    }
                }

                //红中癞子玩法
                if (
                    (this._roomInfo.gameConfig.hongzhong
                        && this._handCardsMap[this._magic] >= miss.length
                    )
                    ||
                    (!this._roomInfo.gameConfig.hongzhong
                        && miss.length == 0
                    )
                ) {
                    var self = this;
                    miss.forEach(function (card) {
                        self._tingMap[chairId][card] = {
                            jiang: -1,
                            type: '7dui'
                        }
                    })
                }
            }
        } while (0);

        if (Object.keys(this._tingMap[chairId]).length) {
            return;
        }

        //正常判断
        var item = {
            holds: Object.assign([], this._handCards[chairId]),
            countMap: Object.assign({}, this._handCardsMap[chairId]),
            tingMap: {},
        };

        var hongzhong = this._roomInfo.gameConfig.hongzhong;
        var jiang258 = this._roomInfo.gameConfig.jiang258;
        var jiang258Card = jiang258 ? [
            1, 4, 7,
            10, 13, 16,
            19, 22, 25
        ] : null;
        var hongzhongCard = hongzhong ? this._magic : -100;
        mjutils.checkTingPai(item, 0, 9, hongzhongCard);
        mjutils.checkTingPai(item, 9, 18, hongzhongCard);
        mjutils.checkTingPai(item, 18, 27, hongzhongCard);

        //风牌
        if (this._roomInfo.gameConfig.feng) {
            //红中
            if (this._roomInfo.gameConfig.hongzhong) {
	            //@yang 2017/10/16
	            //mjutils.checkTingPai(item, 27, 31, hongzhongCard);
                mjutils.checkTingPai(item, 27, 33, hongzhongCard);
                mjutils.checkTingPai(item, 32, 34, hongzhongCard);
            }
            else {
                mjutils.checkTingPai(item, 27, 34, hongzhongCard);
            }
        }

        this._tingMap[chairId] = item.tingMap;
        //return Object.keys(item.tingMap).length > 0;
    }

    /**
     * 查找该出牌的人
     */
    searchTurn() {
        for (var i = 0; i < this._handCards.length; i++) {
            if (this._handCards[i].length % 3 == 2) {
                return i;
            }
        }
        return -1;
    }

    isHisTurn(chairId) {
        return this._handCards[chairId].length % 3 == 2;
    }

    isZhuang(chairId) {
        return chairId == this._zhuang;
    }

    removeHandCard(chairId, card, times = 1) {
        for (var i = 0; i < times; i++) {
            var index = this._handCards[chairId].indexOf(card);
            if (index == -1) break;

            this._handCards[chairId].splice(index, 1);
            this._handCardsMap[chairId][card]--;
        }

    }


    /**
     * 检测是否可以吃
     * @param {*} holds 
     * @param {*} card 
     */
    checkChi(chairId, card){
        if (card > 26) return null;
        var map = this._handCardsMap[chairId];

        var ret = [];
        var mod = card % 9;

        //chiwei
        if (mod > 1) {
            if (map[card - 1] && map[card - 2]) {
                ret.push([card - 1, card - 2]);
            }
        }
        //chizhong
        if (mod > 0 && mod < 8) {
            if (map[card - 1] && map[card + 1]) {
                ret.push([card - 1, card + 1]);
            }
        }
        //chitou
        if (mod < 7) {
            if (map[card + 1] && map[card + 2]) {
                ret.push([card + 1, card + 2]);
            }
        }
        return ret.length ? ret : null;
    }


    getNextPlayer(chairId = -1) {
        var turn;
        if (chairId == -1) {
            turn = this._turn + 1;
        }
        else {
            turn = chairId + 1;
        }
        return turn %= this._game.players.length;
    }

}

module.exports = HENMJGame;
