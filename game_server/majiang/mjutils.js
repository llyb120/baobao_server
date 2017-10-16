const hu = require('./hu.js');
function checkTingPai(seatData,begin,end,magicCard){
    for(var i = begin; i < end; ++i){
        //如果这牌已经在和了，就不用检查了
        if(seatData.tingMap[i] != null){
            continue;
        }
        //将牌加入到计数中
        var old = seatData.countMap[i];
        if(old == null){
            old = 0;
            seatData.countMap[i] = 1;
        }
        else{
            seatData.countMap[i] ++;
        }

        seatData.holds.push(i);
        kanzi = [];
        //逐个判定手上的牌
        var ret = checkCanHu(seatData,magicCard);
        if(ret){
            //平胡 0番
            seatData.tingMap[i] = {
                type:"normal",
                fan:0,
                jiang : ret[0]
            };
        }

        //搞完以后，撤消刚刚加的牌
        seatData.countMap[i] = old;
        seatData.holds.pop();
    }
}

var kanzi = [];
var record = false;
function debugRecord(pai){
    kanzi.push(pai);
}

function matchSingle(seatData,selected,magicCard){
    var useMagicCard = [];
    var notUseMagicCard = [];
    var hasMagicCard = seatData.countMap[magicCard] || 0;
    //分开匹配 A-2,A-1,A
    var matched = true;
    var v = selected % 9;
    if(v < 2){
        matched = false;
    }
    else{
        for(var i = 0; i < 3; ++i){
            var t = selected - 2 + i;
            var cc = seatData.countMap[t];
            if(cc == null || cc == 0){
                //如果有魔术牌的存在
                if(magicCard && hasMagicCard){
                    hasMagicCard--;
                    useMagicCard.push(t);
                }
                else{
                    matched = false;
                    break;
                }
            }
            else{
                notUseMagicCard.push(t);
            }
        }
    }



    //匹配成功，扣除相应数值
    if(matched){
        for(var i = 0; i < notUseMagicCard.length; i++){
            seatData.countMap[notUseMagicCard[i]]--;
        }
        for(var i = 0; i < useMagicCard.length; i++){
            seatData.countMap[magicCard]--;
        }
        // seatData.countMap[selected - 2] --;
        // seatData.countMap[selected - 1] --;
        // seatData.countMap[selected] --;
        var ret = checkSingle(seatData,magicCard);
        // seatData.countMap[selected - 2] ++;
        // seatData.countMap[selected - 1] ++;
        // seatData.countMap[selected] ++;
        for(var i = 0; i < notUseMagicCard.length; i++){
            seatData.countMap[notUseMagicCard[i]]++;
        }
        for(var i = 0; i < useMagicCard.length; i++){
            seatData.countMap[magicCard]++;
        }
        if(ret == true){
            debugRecord(selected - 2);
            debugRecord(selected - 1);
            debugRecord(selected);
            return true;
        }
    }

    //分开匹配 A-1,A,A + 1
    matched = true;
    useMagicCard = [];
    notUseMagicCard = [];
    hasMagicCard = seatData[magicCard] || 0;

    if(v < 1 || v > 7){
        matched = false;
    }
    else{
        for(var i = 0; i < 3; ++i){
            var t = selected - 1 + i;
            var cc = seatData.countMap[t];
            if(cc == null || cc == 0){
                //如果有魔术牌的存在
                if(magicCard && hasMagicCard){
                    hasMagicCard--;
                    useMagicCard.push(t);
                }
                else{
                    matched = false;
                    break;
                }
            }
            else{
                notUseMagicCard.push(t);
            }
        }
    }

    //匹配成功，扣除相应数值
    if(matched){
        // seatData.countMap[selected - 1] --;
        // seatData.countMap[selected] --;
        // seatData.countMap[selected + 1] --;
        for(var i = 0; i < notUseMagicCard.length; i++){
            seatData.countMap[notUseMagicCard[i]]--;
        }
        for(var i = 0; i < useMagicCard.length; i++){
            seatData.countMap[magicCard]--;
        }
        var ret = checkSingle(seatData,magicCard);
        // seatData.countMap[selected - 1] ++;
        // seatData.countMap[selected] ++;
        // seatData.countMap[selected + 1] ++;
        for(var i = 0; i < notUseMagicCard.length; i++){
            seatData.countMap[notUseMagicCard[i]]++;
        }
        for(var i = 0; i < useMagicCard.length; i++){
            seatData.countMap[magicCard]++;
        }
        if(ret == true){
            debugRecord(selected - 1);
            debugRecord(selected);
            debugRecord(selected + 1);
            return true;
        }
    }


    //分开匹配 A,A+1,A + 2
    matched = true;
    useMagicCard = [];
    notUseMagicCard = [];
    hasMagicCard = seatData[magicCard] || 0;

    if(v > 6){
        matched = false;
    }
    else{
        for(var i = 0; i < 3; ++i){
            var t = selected + i;
            var cc = seatData.countMap[t];
            if(cc == null || cc == 0){
                //如果有魔术牌的存在
                if(magicCard && hasMagicCard){
                    hasMagicCard--;
                    useMagicCard.push(t);
                }
                else{
                    matched = false;
                    break;
                }
            }
            else{
                notUseMagicCard.push(t);
            }
        }
    }

    //匹配成功，扣除相应数值
    if(matched){
        // seatData.countMap[selected] --;
        // seatData.countMap[selected + 1] --;
        // seatData.countMap[selected + 2] --;
        for(var i = 0; i < notUseMagicCard.length; i++){
            seatData.countMap[notUseMagicCard[i]]--;
        }
        for(var i = 0; i < useMagicCard.length; i++){
            seatData.countMap[magicCard]--;
        }
        var ret = checkSingle(seatData,magicCard);
        // seatData.countMap[selected] ++;
        // seatData.countMap[selected + 1] ++;
        // seatData.countMap[selected + 2] ++;
        for(var i = 0; i < notUseMagicCard.length; i++){
            seatData.countMap[notUseMagicCard[i]]++;
        }
        for(var i = 0; i < useMagicCard.length; i++){
            seatData.countMap[magicCard]++;
        }
        if(ret == true){
            debugRecord(selected);
            debugRecord(selected + 1);
            debugRecord(selected + 2);
            return true;
        }
    }
    return false;
}

function checkSingle(seatData,magicCard){
    var holds = seatData.holds;
    var selected = -1;
    var c = 0;
    for(var i = 0; i < holds.length; ++i){
        var pai = holds[i];
        //魔术牌不计入
        if(magicCard && pai == magicCard){
            continue;
        }
        c = seatData.countMap[pai];
        if(c != 0){
            selected = pai;
            break;
        }
    }
    //如果没有找到剩余牌，则表示匹配成功了
    if(selected == -1){
        return true;
    }
    //否则，进行匹配
    if(c >= 3){
        //直接作为一坎
        seatData.countMap[selected] -= 3;
        debugRecord(selected);
        debugRecord(selected);
        debugRecord(selected);
        var ret = checkSingle(seatData,magicCard);
        //立即恢复对数据的修改
        seatData.countMap[selected] = c;
        if(ret == true){
            return true;
        }
    }
    if(c >= 2 && seatData.countMap[magicCard] > 0){
        seatData.countMap[selected] -= 2;
        seatData.countMap[magicCard] -= 1;
        var ret = checkSingle(seatData,magicCard);
        seatData.countMap[selected] = c;
        seatData.countMap[magicCard] += 1;
        if(ret == true){
            return true;
        }
    }
    if(c >= 1 && seatData.countMap[magicCard] > 1){
        seatData.countMap[selected] -= 1;
        seatData.countMap[magicCard] -= 2;
        var ret = checkSingle(seatData,magicCard);
        seatData.countMap[selected] = c;
        seatData.countMap[magicCard] += 2;
        if(ret == true){
            return true;
        }
    }

    if(c == 4){
        //直接作为一坎
        seatData.countMap[selected] = 1;
        debugRecord(selected);
        debugRecord(selected);
        debugRecord(selected);
        var ret = checkSingle(seatData,magicCard);
        //立即恢复对数据的修改
        seatData.countMap[selected] = c;
        //如果作为一坎能够把牌匹配完，直接返回TRUE。
        if(ret == true){
            return true;
        }
    }

    //风牌不参与顺子运算
    if(selected > 26){
        return false;
    }

    //按单牌处理
    return matchSingle(seatData,selected,magicCard);
}

function checkCanHu(seatData,magicCard){
    for(var k in seatData.countMap){
        k = parseInt(k);
        var c = seatData.countMap[k];
        var useMagicCard = false;
        if(magicCard){
            if(c < 1){
                continue;
            }
            //如果有一张，可以用一张魔术牌当将
            else if(c < 2){
                if(seatData.countMap[magicCard] > 0){
                    useMagicCard = true;
                }
            }
        }
        else if(c < 2){
            continue;
        }
        // if(c < 2){
        // 	continue;
        // }
        //为了处理258做将
        //if(exceptEyes && exceptEyes.indexOf(k) == -1){
        //    continue;
        //}
        if(useMagicCard){
            seatData.countMap[k] -= 1;
            seatData.countMap[magicCard] -= 1;
        }
        else{
            //如果当前牌大于等于２，则将它选为将牌
            seatData.countMap[k] -= 2;
        }

        //逐个判定剩下的牌是否满足　３Ｎ规则,一个牌会有以下几种情况
        //1、0张，则不做任何处理
        //2、2张，则只可能是与其它牌形成匹配关系
        //3、3张，则可能是单张形成 A-2,A-1,A  A-1,A,A+1  A,A+1,A+2，也可能是直接成为一坎
        //4、4张，则只可能是一坎+单张
        kanzi = [];
        var ret = checkSingle(seatData,magicCard);
        if(useMagicCard){
            seatData.countMap[k] += 1;
            seatData.countMap[magicCard] += 1;
        }
        else{
            seatData.countMap[k] += 2;
        }
        if(ret){
            //kanzi.push(k);
            //kanzi.push(k);
            //console.log(kanzi);

            return [k];
        }
    }
}


function checkTingPai1(seatData,begin,end,magicCard){
    for(var i = begin; i < end; ++i){
        //如果这牌已经在和了，就不用检查了
        if(seatData.tingMap[i] != null){
            continue;
        }
        //将牌加入到计数中
        var old = seatData.countMap[i];
        if(old == null){
            old = 0;
            seatData.countMap[i] = 1;
        }
        else{
            seatData.countMap[i] ++;
        }

        seatData.holds.push(i);
        kanzi = [];
        //@yang
        //逐个判定手上的牌
        //判断停牌
        var ret = hu.calPaixing(seatData.holds,seatData.countMap,magicCard);
        var jiang = -2;

        console.log(ret);
        if(ret.length>0){
            for(var k=0;k<ret.length;k++){
                for(var j=0;j<ret[k].length;j++){
                    if(ret[k][j].type == 7){
                        jiang = ret[k][j].value;
                    }
                }
                seatData.tingMap[i]={
                    type:"normal",
                    fan:0,
                    jiang : jiang
                };
            }
        }
        //@yang
        //var ret = checkCanHu(seatData,magicCard);
        //if(ret){
        //    //平胡 0番
        //    seatData.tingMap[i] = {
        //        type:"normal",
        //        fan:0,
        //        jiang : ret[0]
        //    };
        //}

        //搞完以后，撤消刚刚加的牌
        seatData.countMap[i] = old;
        seatData.holds.pop();
    }
}

/*
 console.log(Date.now());
 //检查筒子
 checkTingPai(seatData,0,9);
 //检查条子
 checkTingPai(seatData,9,18);
 //检查万字
 checkTingPai(seatData,18,27);
 console.log(Date.now());

 for(k in seatData.tingMap){
 console.log(nameMap[k]);
 }
 */

exports.checkTingPai = checkTingPai;
exports.checkTingPai1 = checkTingPai1;

exports.getMJType = function(pai){
    if(id >= 0 && id < 9){
        return 0;
    }
    else if(id >= 9 && id < 18){
        return 1;
    }
    else if(id >= 18 && id < 27){
        return 2;
    }
}