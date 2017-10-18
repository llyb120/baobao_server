import * as supertest from 'supertest';
import * as should from "should";
import { app } from '../app';
import { urlencode } from 'locutus/php/url';
import * as WebSocket from 'ws';

const request = supertest(app);

describe("hall test",() => {
    let token;
    let token2,token3,token4;


    it("test login",async () => {
        let res = await request.get("/api/loginVisitor").expect(200);
        let json = JSON.parse(res.text);
        should.exist(json.token); 
        token = json.token;
    });

    it("test login2",async() => {
        let res = await request.get("/api/loginVisitor").expect(200);
        let json = JSON.parse(res.text);
        should.exist(json.token); 
        token2 = json.token; 
    })

    let roomId;
    it("test create room",async() => {
        let option = {
            token,
            gameConfig :{
                gameType : "henanmajiang"
            }
        }
        let res = await request.get("/api/createRoom?option=" + urlencode(JSON.stringify((option))));
        let json = JSON.parse((res.text));
        json.errcode.should.eql(0);
        roomId = json.roomId;
        // console.log(json)
    });

    it("test join room",async() => {
        let option = {
            token : token2,
            roomId,
            gameType : "henanmajiang"
        };
        let res = await request.get("/api/joinRoom?option=" + urlencode(JSON.stringify((option))));
        let json = JSON.parse((res.text)); 
        // json.errcode.should
        should.equal(json.errcode,0);
    });


    it("test check room",async() => {
        let res = await request.get("/api/checkInGame?token=" + token).expect(200);
        let json = JSON.parse(res.text);
        // console.log(json);
        should.equal(json.errcode,0);
        // json.errcode.should.eql(0);

    });


    it("tst rpc",async() => {
        let ws=  new WebSocket("ws://127.0.0.1:9016/game");
        ws.onopen = () => {
            ws.send(JSON.stringify({
                event : "enter_room_pull",
                data : {
                    token : token
                } 
            })) ;  
        }

    })


})