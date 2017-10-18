const db = require("../../common/db");

class GameBase{

    set game(val){
        this._game = val;
    }
    constructor(roomInfo){
        this._roomId = roomInfo.roomId;
        this._roomInfo = roomInfo;
        this._state = 'free';
        this._ready = [];
        this._userInfo = [];
        this._players = [];
        this._gameScore = [0,0,0,0];
        this._lastGameScore = [0,0,0,0];
        this._isBegin = false;
        this._gameCount = 0;
        this._dismissApply = {};
        this._eachTurnScore = [[],[],[],[]];
        this._records = {
            users : null,
            record : [],
        };

        this._data = {
            ready : [],
            roomId : -1
        };
        this.redisService = null;
        this.userService = null;

        // this._game = global.Games.rooms[roomInfo.roomId];
        // this.reset();
    }

    // sendToUser(userId,action,data = null){
    //     var io = global.IO;
    //     if(!this._game){
    //         return false;
    //     }
    //     var index = this._game.players.indexOf(userId);
    //     if(index == -1){
    //         return false;
    //     }
    //     var socketId = this._game.sockets[index];
    //     if(io.sockets.sockets[socketId]){
    //         io.sockets.sockets[socketId].emit(action,data);
    //     }
    // }

    sendToRoom(action,data = null){
        //var io = global.IO;
        if(!this._game){
            return;
        }
        for(var i = 0; i < this._game.players.length; i++){
            var socket = this._game.sockets[i];
            if(!socket){
                continue;
            }
            try{
                socket.send(JSON.stringify({
                    event: action,
                    data: data
                }));
            }
            catch(e){

            }


            // if(io.sockets.sockets[socketId]){
            //     io.sockets.sockets[socketId].send({
            //         event: action,
            //         data: data
            //     });
            // }

            // io.sockets.sockets[socketId].emit("fuck cocos",1);
        }
    }

    sendToChair(chairId,action,data = null){
        //var io = global.IO;
        if(!this._game){
            return;
        }
        var socket = this._game.sockets[chairId];
        if(!socket){
            return;
        }
        try{
            socket.send(JSON.stringify({
                event: action,
                data: data
            }));
        }
        catch(e){

        }
        // var socketId = this._game.sockets[chairId];
        // if(io.sockets.sockets[socketId]){
        //     io.sockets.sockets[socketId].send({
        //         event: action,
        //         data: data
        //     });
        //     // io.sockets.sockets[socketId].emit("fuck cocos","fuck cocos");
        // }

    }

    sendToUser(uid,action,data = null){

    }


    onMessage(chairId,event,data){

    }

    onRecord(){
        var detail = {
            name : [],
            score : [],
        };
        for(var i=0;i<this._userInfo.length;i++){
            if(this._userInfo[i] == null){
                continue;
            }
            detail.name[i] = (this._userInfo[i].nickname);
            detail.score[i] = this._eachTurnScore[i];
        }
        var time = new Date().getTime() / 1000;
        var result = {
            roomId : this._roomId,
            type :this._roomInfo.gameConfig.gameType,
            time : time,
            detail:JSON.stringify(detail),
            user_id1:this._userInfo[0]?this._userInfo[0].id:0,
            user_id2:this._userInfo[1]?this._userInfo[1].id:0,
            user_id3:this._userInfo[2]?this._userInfo[2].id:0,
            user_id4:this._userInfo[3]?this._userInfo[3].id:0,
        }
        var sql = `
            insert into record(
                id,
                room_id,
                time,
                type,
                detail,
                user_id1,
                user_id2,
                user_id3,
                user_id4,
                info
            )
            values(
                null,
                '${result.roomId}',
                '${result.time}',
                '${result.type}',
                '${result.detail}',
                '${result.user_id1}',
                '${result.user_id2}',
                '${result.user_id3}',
                '${result.user_id4}',
                '${JSON.stringify(this._records)}'
            )
            `;
        db.query(sql);
    }

    /**
     * RPC用户进入
     */
    async onUserEnter(userId){
        console.log('user enter');
        let roomInfo = await this.redisService.get("room:" + this._data.roomId);
        let index = roomInfo.players.indexOf(userId);
        if(index === -1){
            return;
        }
        if(!this._ready[index]){
            this._ready[index] = 'free';
        }
        this.sync(index);
        //通知用户进入
        roomInfo.players.forEach((uid,c) => {
            this.sendToUser(uid,"user_enter_push",{
                chairId : index,
                // ready : 'free'
            });
        });

    }

    /** 
    onUserEnter(chairId,userInfo){
        // var userInfo = await db.query("select * from user where id = " + userId);
        // if(!userInfo || !userInfo.length){
        //     return;
        // }
        this._userInfo[chairId] = userInfo;
        this._ready[chairId] = 'free';
        // this._userInfo.push(userInfo);
        // this._ready.push("ready");
        // this._gameScore.push(0);
        //进入的用户同步
        this.sync(chairId);
        //通知用户进入
        this._userInfo.forEach(function (u,c) {
            if(u === null) return;
            if(c === chairId) return;
            this.sendToChair(c,"user_enter_push",{
                chairId : chairId
                ,
                userInfo : userInfo,
                ready: 'free'
            });
            //this.pushState(c);
            //this.pushUsers(c);

        }.bind(this));

    }
    **/
    onUserExit(chairId){
        this._userInfo.forEach(function (u,c) {
            if(u === null) return;
            if(c === chairId) return;
            this.sendToChair(c,"user_exit_push",{
                chairId : chairId,
            });
        }.bind(this));
        if(!this._userInfo[chairId]){
            return;
        }
        global.RoomServer.emit("user_exit",{
            roomId : this._roomId,
            userId : this._userInfo[chairId].id
        });
        this._userInfo[chairId] = null;
        this._ready[chairId] = null;
    }

    pushUsers(chairId = -1){
        if(chairId == -1){
            return this._userInfo.forEach(function (u,chairId) {
                if(u === null) return;
                this.pushUsers(chairId)
            }.bind(this));
        }
        this.sendToChair(chairId,"users_push",{
            ready : this._ready,
            chairId : chairId,
            users : this._userInfo
        });
    }

    pushState(chairId = -1){
        if(chairId == -1){
            return this._userInfo.forEach(function (u,chairId) {
                if(chairId === null) return;
                this.pushState(chairId)
            }.bind(this));
        }
        var data = {
            roomInfo : this._roomInfo,
            state : this._state
            ,
        };
        this.sendToChair(chairId,'state_push',data);
    }

    sync(chairId,undefined){
        return;
        var self = this;
        if(this._state == 'free'){
            this._game.players.forEach(function (userId,index) {
                if(chairId !== undefined && chairId != userId){
                    return;
                }
                var data = {
                    state : 'free',
                    ready : self._ready,
                    users : self._userInfo,
                    chairId : index,
                    roomInfo : self._roomInfo,
                    gameCount : self._gameCount
                };
                self.sendToChair(index,'sync_push',data);
            });
        }
        else if(this._state == 'game'){

        }
    }

    reset(){

    }

    start(){
        console.log("start")
        this._isBegin = true;
        this._gameCount++;
        this._state = 'game';
    }

    async end(){
        var playCount = this._roomInfo.gameConfig.playcount || 8;
        if(this._gameCount == 1){
            var creator = this._roomInfo.gameConfig.creator;
            var costList = {
                8 : 1,
                16 : 2
            };
            if(creator > 0){
                var sql = `update user set zuan = zuan - ${costList[playCount]} where id = ${creator}`;
                await db.query(sql);
            }
        }
    }

    destroy(){

    }

    forceDismissRoom(){
        if(this._isBegin){
            this.onRecord();
        }
        if(this._gameCount == 1){
            this.reduceFangka(this._userInfo[0].id);
        }
        delete global.Games.rooms[this._roomId];
        global.RoomServer.emit("clear_room",{
            roomId : this._roomId
        });
    }


    getUserByChairId(chairId){
        return this._players[chairId] || null;
    }


    onDismissRoom(chairId,agree){
        //游戏中
        if(!this._isBegin){
            return;
        }
        this._dismissApply[chairId] = agree;
        var count = 0;
        for(var i in this._dismissApply){
            if(this._dismissApply[i]) count++;
        }
        var finishCount = Object.keys(this._dismissApply).length;
        //表决完毕
        if(count > this._userInfo.length / 2){
            this.sendToRoom("zongjie_push",{
                gameScore : this._lastGameScore,
                winCount : this._winCount,
                loseCount : this._loseCount,
                allScoreInfo : this._eachTurnScore
            });
            this.sendToRoom("dismiss_room_success_push");
            return this.forceDismissRoom();
        }
        else if(finishCount - count >= this._userInfo.length / 2){
            this._dismissApply = {};
        }
        this.sendToRoom("dismiss_apply_push",this._dismissApply);

        // this.sync();
    }


    changeScore(changed){
        for(var i = 0; i < this._gameScore.length; i++){
            this._gameScore[i] += changed[i];
        }
        this.sendToRoom("score_changed_push",{
            changed : changed,
            gameScore : this._gameScore
        })
    }

    getThisRecord(){
        return this._records.record[this._records.record.length - 1];
    }

    record(event,data = null){
        this.getThisRecord().push([
            event,data
        ]);
    }

    prepareRecord(){
        if(this._gameCount == 1){
            this._records.users = this._userInfo;
            this._records.roomInfo = this._roomInfo;
        }
        this._records.record.push([]);
        this.record("record_start_push");
    }


    reduceFangka(creator){
        var sql = `
            update user set zuan=zuan-1 where id='${creator}'
            `;
        db.query(sql);
    }

}

module.exports = GameBase;