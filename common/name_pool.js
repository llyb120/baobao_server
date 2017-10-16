var xing = "赵钱孙李周吴郑王冯陈楚魏蒋沈韩杨";

var ming = [
    "粗鄙",
    "鬼畜",
    "疯猴",
    "禽兽",
    "二笔",
    "杨垃圾"
];

function getName() {
    var items = xing.split('');
    var firstName = items[parseInt(Math.random() * 100000) % items.length];
    var secName = ming[parseInt(Math.random() * 100000) % ming.length];
    return firstName + secName;
}

exports.generageName = getName;