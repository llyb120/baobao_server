import { User } from '../ml/user';
import * as WebSocket from 'ws';
class UserManager{
    private map = new Map<number,User>();
    private serverMap = new Map<number,string>();
    private clientMap = new Map<number,WebSocket>();

    setUser(uid : number,userInfo :User){
        this.map.set(uid,userInfo);
    }

    getUser(uid : number){
        return this.map.get(uid);
    }

    setUserInServer(uid : number,serverId : string){
        this.serverMap.set(uid,serverId);
    }

    getUserInServer(uid : number){
        return this.serverMap.get(uid);
    }

    deleteUserInServer(uid : number){
        return this.serverMap.delete(uid);
    }


    setUserClient(uid : number,ws : WebSocket){
        this.clientMap.set(uid,ws);
    }
    getUserClient(uid :number){
        return this.clientMap.get(uid);
    }
    deleteUserClient(uid : number){
        return this.clientMap.delete(uid);
    }
}

export const userService = new UserManager;