const utils = require('../common/utils');

var res = {
    send(data){
        return data;
    }
};

describe("testUtils",function () {
    it("test sendSuccess",function (done) {
        var ret = utils.sendSuccess(res);
        ret.errcode.should.eql(0);
        done();
    })

    it("test sendFailed",function (done) {
        var ret = utils.sendFailed(res);
        ret.errcode.should.not.eql(0);
        done();
    })
});