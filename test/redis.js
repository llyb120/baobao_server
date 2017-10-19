let ioredis = require("ioredis");
let redis = new ioredis;
let sub = new ioredis;
(async () => {
    await sub.subscribe("game_controller");
    let o = await redis.publish("game_controller",123);
console.log(o)


let keys = await redis.hkeys("cubi222");
console.log(keys);

})()
