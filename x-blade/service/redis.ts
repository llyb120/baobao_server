// var Redis = require('ioredis');
import * as Redis from 'ioredis';
import * as Redlock from "redlock";
import { userService } from './user_manager';
import { SERVER_ID } from '../config';
import { gameManagerService, IRoomInfo } from './game_manager';
import { QGameBase } from '../logic/game_base';
import * as WebSocket from 'ws';
import { GameGateController } from '../ctrl/gate';

export class RedisService {
    public redis: Redis.Redis;
    public lock: Redlock;
    public sub: Redis.Redis;
    public pub: Redis.Redis;

    constructor() {
        this.redis = new Redis;
        this.sub = new Redis;
        this.pub = new Redis;

        /**
         * sub只接受游戏事件的转发
         */

        this.init();
    }

    async init() {

        //分布锁
        this.lock = new Redlock([
            this.redis
        ], {
                // the expected clock drift; for more details
                // see http://redis.io/topics/distlock
                driftFactor: 0.01, // time in ms

                // the max number of times Redlock will attempt
                // to lock a resource before erroring
                retryCount: 10,

                // the time in ms between attempts
                retryDelay: 200, // time in ms

                // the max time in ms randomly added to retries
                // to improve performance under high contention
                // see https://www.awsarchitectureblog.com/2015/03/backoff.html
                retryJitter: 200 // time in ms
            }
        );

        this.sub.on("message",async (event :string,data) => {
            //分布式调用
            if(/^game_controller/.test(event)){
                try{
                    let d = JSON.parse(data);
                    //存储uid
                    userService.setUserInServer(d.uid,d.SERVER_ID);
                    //调用
                    let {roomId,func,args} = d;
                    let ctrl : QGameBase;
                    if(ctrl = gameManagerService.hasGame(roomId)){
                        await (ctrl as any)[func].apply(ctrl,args);
                    }

                }
                catch(e){

                }
            }
            //消息推送
            else if(/^push_client/.test(event)){
                console.log("get push client")
                try{
                    let d = JSON.parse(data);
                    if(!d.uid){
                        return;
                    }
                    GameGateController.sendMessageToClient(d.uid,d.data);
                }
                catch(e){

                } 
            }

            console.log("123312");
            // console.log(args);
        });

        this.sub.subscribe('push_client:' + SERVER_ID);

    }

    set(key: string, val: any, expr?: number) {
        if (!expr) expr = 24 * 3600;
        if (typeof val == 'object') {
            val = JSON.stringify(val);
        }
        return this.redis.set(key, val, 'EX', expr);
    }

    async get(key: string) {
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


    hset(key: string, field: string, val: any) {
        return this.redis.hset(key, field, val);
    }

    del(key: string) {

    }

    async setWithLock(key: string, val: any, expr?: number) {
        const resource = 'locks:account:322456';
        const ttl = 1000;
        return new Promise(async (resolve,reject) => {
            try{
                let lock = await this.lock.lock(resource,ttl);
                await this.set(key,val,expr);
                lock.unlock();
                resolve();
            }
            catch(e){
                reject();
                console.log(e);
            }
        });
    }
}

export const redisService = new RedisService;