"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function success(data = {}) {
    let msg = {
        errcode: 0,
        errmsg: 'ok',
    };
    msg = Object.assign(msg, data);
    // msg = {...msg,...data};
    return (msg);
}
exports.success = success;
function failed(data = {}) {
    let msg = {
        errcode: -1,
        errmsg: "failed",
    };
    if (typeof data == 'string') {
        msg.errmsg = data;
    }
    else {
        msg = Object.assign(msg, data);
    }
    return msg;
}
exports.failed = failed;
