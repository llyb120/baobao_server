import { User } from '../ml/user';
class UserManager{
    private map = new Map<number,User>();

    setUser(uid : number,userInfo :User){
        this.map.set(uid,userInfo);
    }

    getUser(uid : number){
        return this.map.get(uid);
    }


}

export const userService = new UserManager;