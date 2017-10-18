import * as supertest from 'supertest';
import * as should from "should";
import { app } from '../app';
import { urlencode } from 'locutus/php/url';

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
        console.log(res.text);
    });


})