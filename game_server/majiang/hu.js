var PaiType = {};
PaiType[PaiType["none"] = 0] = "none";
PaiType[PaiType["duizi"] = 1] = "duizi";
PaiType[PaiType["sanzhang"] = 2] = "sanzhang";
PaiType[PaiType["shunzi"] = 3] = "shunzi";
PaiType[PaiType["peng"] = 4] = "peng";
PaiType[PaiType["minggang"] = 5] = "minggang";
PaiType[PaiType["angang"] = 6] = "angang";
PaiType[PaiType["jiang"] = 7] = "jiang";

function C(arr, num) {
    var r = [];
    (function f(t, a, n) {
        if (n == 0) {
            return r.push(t);
        }
        for (var i = 0, l = a.length; i <= l - n; i++) {
            f(t.concat(a[i]), a.slice(i + 1), n - 1);
        }
    })([], arr, num);
    return r;
}

function A(arr, size) {
    if (size > arr.length) {
        return;
    }
    var allResult = [];
    (function aa(arr, size, result) {
        if (result.length == size) {
            allResult.push(result);
        }
        else {
            for (var i = 0, len = arr.length; i < len; i++) {
                var newArr = [].concat(arr), curItem = newArr.splice(i, 1);
                aa(newArr, size, [].concat(result, curItem));
            }
        }
    })(arr, size, []);
    return allResult;
}

function calPaiXing2(holds, map, magicCard) {
    var combos = [];
    var total = holds.length;
    holds = holds.sort(function (a, b) {
        return a - b;
    });
    var groups = C(holds, 3);
    var indexMap = {};
    groups.forEach(function (item) {
        var _item = item.filter(function (card) {
            return card != magicCard;
        });
        var c = {
            type: PaiType.none,
            value: -1,
            source: item
        };
        do {
            if (_item.length == 3) {
                if (_item[0] == _item[1] && _item[1] == _item[2]) {
                    c.type = PaiType.sanzhang;
                    c.value = _item[0];
                }
                else if (Math.floor(_item[0] / 9) != Math.floor(_item[1] / 9) ||
                    Math.floor(_item[1] / 9) != Math.floor(_item[2] / 9)) {
                    break;
                }
                else if (_item[1] - _item[0] == 1 && _item[2] - _item[1] == 1 && _item[0] < 27 && _item[1] < 27 && _item[2] < 27) {
                    c.type = PaiType.shunzi;
                    c.value = _item[0];
                }
            }
            else if (_item.length == 2) {
                if (_item[1] == item[0]) {
                    c.type = PaiType.sanzhang;
                    c.value = _item[0];
                }
                else if (Math.floor(_item[0] / 9) != Math.floor(_item[1] / 9)) {
                    break;
                }
                else if (_item[1] - _item[0] < 2 && _item[1] < 27 && _item[0] < 27) {
                    c.type = PaiType.shunzi;
                    c.value = _item[0];
                }
            }
            else if (_item.length == 1) {
                c.type = PaiType.sanzhang;
                c.value = _item[0];
            }
            else {
                c.type = PaiType.sanzhang;
                c.value = magicCard;
            }
        } while (0);
        if (c.type != PaiType.none) {
            if (!indexMap[c.source.toString()]) {
                indexMap[c.source.toString()] = 1;
                combos.push(c);
            }
        }
    });
    var allCombos = A(combos, Math.floor(total / 3));
    var result = [];
    if(!allCombos) return [];
    allCombos.forEach(function (combos) {
        var newMap = Object.assign({}, map);
        for (var i = 0; i < combos.length; i++) {
            for (var j = 0; j < combos[i].source.length; j++) {
                if (--newMap[combos[i].source[j]] < 0) {
                    return;
                }
            }
        }
        var arr = [];
        for (let i in newMap) {
            while (newMap[i]--) {
                arr.push(Number(i));
            }
        }
        if (arr[0] == arr[1] || arr[0] == magicCard || arr[1] == magicCard) {
            var c = {
                type: PaiType.jiang,
                value: -1,
                source: []
            };
            if (arr[0] == magicCard && arr[1] != magicCard) {
                c.value = arr[1];
                c.source = [arr[1], magicCard];
            }
            else if (arr[0] != magicCard && arr[1] == magicCard) {
                c.value = arr[0];
                c.source = [magicCard, arr[0]];
            }
            else {
                c.value = arr[0];
                c.source = [arr[0], arr[0]];
            }
            combos.push(c);
            result.push(combos);
        }
    });
    return result;
}

function calPaiXing(holds, map, magicCard) {
    if(magicCard < 0) map[magicCard] = 0;
    var combos = [];
    var total = holds.length;
    for (var card in map) {
        var index = Number(card);
        if (index == magicCard) {
            continue;
        }
        var magicCount = map[magicCard];
        if (index < 27 && index % 9 < 7) {
            if (map[index] || map[index + 1] || map[index + 2]) {
                var max = Math.floor((map[index] + map[index + 1] + map[index + 2] + magicCount) / 3);
                var c1 = map[index], c2 = map[index + 1], c3 = map[index + 2], cm = map[magicCard];
                while (max--) {
                    var c = {
                        type: PaiType.shunzi,
                        value: index,
                        source: []
                    };
                    if (c1 > 0) {
                        c1--;
                        c.source.push(index);
                    }
                    else {
                        cm--;
                        c.source.push(magicCard);
                    }
                    if (c2 > 0) {
                        c2--;
                        c.source.push(index + 1);
                    }
                    else {
                        cm--;
                        c.source.push(magicCard);
                    }
                    if (c3 > 0) {
                        c3--;
                        c.source.push(index + 2);
                    }
                    else {
                        cm--;
                        c.source.push(magicCard);
                    }
                    if (c1 < 0 || c2 < 0 || c3 < 0 || cm < 0) {
                        continue;
                    }
                    combos.push(c);
                }
            }
        }
        //sanzhang
        if (map[index] > 0) {
            var max = Math.floor((map[index] + magicCount)), c1 = map[index], cm = magicCount;
            while (max--) {
                var c = {
                    type: PaiType.sanzhang,
                    value: index,
                    source: []
                };
                var count = 3;
                while (count--) {
                    if (c1 > 0) {
                        c.source.push(index);
                        c1--;
                    }
                    else {
                        c.source.push(magicCard);
                        cm--;
                    }
                }
                if (c1 < 0 || cm < 0) {
                    continue;
                }
                combos.push(c);
            }
        }
    }
    var allCombos = C(combos, Math.floor(total / 3));
    console.log(allCombos.length);
    var result = [];
    allCombos.forEach(function (combos) {
        var newMap = Object.assign({}, map);
        for (var i = 0; i < combos.length; i++) {
            for (var j = 0; j < combos[i].source.length; j++) {
                if (--newMap[combos[i].source[j]] < 0) {
                    return;
                }
            }
        }
        var arr = [];
        for (let i in newMap) {
            while (newMap[i]--) {
                arr.push(Number(i));
            }
        }
        if (arr[0] == arr[1] || arr[0] == magicCard || arr[1] == magicCard) {
            var c = {
                type: PaiType.jiang,
                value: -1,
                source: []
            };
            if (arr[0] == magicCard && arr[1] != magicCard) {
                c.value = arr[1];
                c.source = [arr[0], magicCard];
            }
            else if (arr[0] != magicCard && arr[1] == magicCard) {
                c.value = arr[0];
                c.source = [magicCard, arr[1]];
            }
            else {
                c.value = arr[0];
                c.source = [arr[0], arr[0]];
            }
            combos.push(c);
            result.push(combos);
        }
    });

    return result;
}

//exports.calPaixing = calPaiXing2;
exports.calPaiXing = calPaiXing;
exports.MJType = PaiType