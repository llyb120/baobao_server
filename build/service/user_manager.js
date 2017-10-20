"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserManager {
    constructor() {
        this.map = new Map();
        this.serverMap = new Map();
        this.clientMap = new Map();
    }
    setUser(uid, userInfo) {
        this.map.set(uid, userInfo);
    }
    getUser(uid) {
        return this.map.get(uid);
    }
    setUserInServer(uid, serverId) {
        this.serverMap.set(uid, serverId);
    }
    getUserInServer(uid) {
        return this.serverMap.get(uid);
    }
    deleteUserInServer(uid) {
        return this.serverMap.delete(uid);
    }
    setUserClient(uid, ws) {
        this.clientMap.set(uid, ws);
    }
    getUserClient(uid) {
        return this.clientMap.get(uid);
    }
    deleteUserClient(uid) {
        return this.clientMap.delete(uid);
    }
}
exports.userService = new UserManager;
