"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// var Redis = require('ioredis');
const Redis = require("ioredis");
class RedisService {
    constructor() {
        this.redis = new Redis;
        this.sub = new Redis;
        this.pub = new Redis;
        /**
         * sub只接受游戏事件的转发
         */
        this.sub.on("message", (...args) => {
            console.log("123312");
            console.log(args);
        });
        this.init();
    }
    async init() {
        try {
            // this.redis.subscribe("cubi");
            // this.redis.psubscribe('cubi','guichu',(err : any,count : any) => {
            // });
        }
        catch (e) {
            console.log(e);
        }
    }
    set(key, val, expr) {
        if (!expr)
            expr = 24 * 3600;
        if (typeof val == 'object') {
            val = JSON.stringify(val);
        }
        return this.redis.set(key, val, 'EX', expr);
    }
    async get(key) {
        try {
            let ret = await this.redis.get(key);
            if (ret && ret[0] == '{' || ret[0] == '[') {
                return JSON.parse(ret);
            }
            else {
                return ret;
            }
        }
        catch (e) {
        }
    }
    hset(key, field, val) {
        return this.redis.hset(key, field, val);
    }
    del(key) {
    }
    setWithLock() {
    }
}
exports.RedisService = RedisService;
exports.redisService = new RedisService;
