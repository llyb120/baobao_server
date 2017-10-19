import * as supertest from 'supertest';
import * as should from "should";
import { urlencode } from 'locutus/php/url';
import * as WebSocket from 'ws';
import * as http from 'http';
import fetch from 'node-fetch';

const request = supertest(http.createServer());

describe("hall test",() => {
    let token;
    let token2,token3,token4;


    it("test login",async () => {
        let res = await fetch('http://baobao.com/api/loginVisitor');
        let json = await res.json();
        // let res = await request.get("http://baobao.com/api/loginVisitor").expect(200);
        // let json = JSON.parse(res.text);
        should.exist(json.token); 
        token = json.token;
    });

    it("test login2",async() => {
        let res = await fetch("http://baobao.com/api/loginVisitor");
        let json = await res.json();
        // let json = JSON.parse(res.text);
        should.exist(json.token); 
        token2 = json.token; 
    })

    let roomId;
    it("test create room",async() => {
        let option = {
            token,
            gameConfig :{
                gameType : "henanmajiang",
                playerCount :4
            }
        }
        let res = await fetch("http://baobao.com/api/createRoom?option=" + urlencode(JSON.stringify((option))));
        let json = await res.json();
        // let json = JSON.parse((res.text));
        json.errcode.should.eql(0);
        roomId = json.roomId;
        // console.log(json)
    });

    it("test join room",async() => {
        let option = {
            token : token2,
            roomId,
            gameType : "henanmajiang",
        };
        let res = await fetch("http://baobao.com/api/joinRoom?option=" + urlencode(JSON.stringify((option))));
        let json = await res.json();
        console.log(json);
        // let json = JSON.parse((res.text)); 
        // json.errcode.should
        should.equal(json.errcode,0);
    });


    it("test check room",async() => {
        let res = await fetch("http://baobao.com/api/checkInGame?token=" + token);
        let json = await res.json();
        // console.log(json);
        should.equal(json.errcode,0);
        // json.errcode.should.eql(0);

    });

    let ws1,ws2;
    it("tst rpc",(done) => {
        ws1 =  new WebSocket("ws://baobao.com/game");
        ws2 = new WebSocket("ws://baobao.com/game");
        let f1 = false,
            f2 = false;

        ws1.onopen = () => {
            f1 = true;
            if(f1 && f2){
                done();
            }
            // console.log("open");
            // ws.send(JSON.stringify({
            //     event : "enter_room_pull",
            //     data : {
            //         token : token
            //     } 
            // })) ;  
        }
        ws2.onopen = () => {
            f2 = true;
            if(f1 && f2){
                done();
            }
        }


        ws1.onmessage = function(e){
            console.log(e)
        }
        ws2.onmessage = function(e){
            console.log(e);
        }


    });

    it("test rpc call",async() => {
        ws1.send(JSON.stringify({
            event : 'fuck',
            data : {
                token : token
            }
        }))

        ws2.send(JSON.stringify({
            event : 'fuck2',
            data : {
                token : token2
            }
        }))

    });


})