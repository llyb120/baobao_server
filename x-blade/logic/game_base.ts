import { redisService } from '../service/redis';
import { userService } from '../service/user_manager';
import { SERVER_ID } from '../config';
import { GameGateController } from '../ctrl/gate';

export interface IGameData {
    ready : string[];
    roomId : number;
    players : number[];
}


export abstract class QGameBase{
    protected data : IGameData = {
        ready : [],
        roomId : -1,
        players : []
    };

    public redisService = redisService;
    public userService = userService;

    sendToRoom(event,data?){
        for(const uid of this.data.players){
            this.sendToUser(uid,event,data);
        }
    }

    sendToChair(cid : number,event : string,data?){
        let uid = this.data.players[cid];
        if(!uid){
            return;
        }
        return this.sendToUser(uid,event,data);
    }

    sendToUser(uid : number,event:string,data?){
        try{
            let sendData = JSON.stringify({event,data});
            let server = userService.getUserInServer(uid);
            if(!server){
                return;
            }
            //如果是本机，直接发送
            if(server === SERVER_ID){
                GameGateController.sendMessageToClient(uid,JSON.stringify({
                    event : event,
                    data : data 
                }));
            }
            else{
                redisService.pub.publish("push_client:" + server,JSON.stringify({
                    uid : uid,
                    data : {
                        event : event,
                        data : data
                    }
                }));
            }
            
            // console.log("sent")
            // GameGateController.rpcCall(uid,this.data.roomId,)
        }catch(e){
            
        }
    }


    /**
     * 被RPC调用所触发
     */
    onRpcCall(uid : number,event : string,data?){
        console.log("rpccall : uid ",uid,event,userService.getUserInServer(uid));
        this.sendToUser(uid,"pong");
    }
} 