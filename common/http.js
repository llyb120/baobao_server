const qs = require("querystring");
const http = require('http');

module.exports.get = (host,port,command,data) => {
    var content = qs.stringify(data);
    var options = {
        hostname : host,
        port : port,
        path : '/' + command + '?' + content,
        method : "GET"
    };
    return new Promise((resolve) => {
        var req = http.request(options,(res) => {
            res.setEncoding('utf8');
            res.on('data',(chunk) => {
                resolve(chunk);
            });
        });

        req.on("error",(e) => {
            console.error("problem with get: ",e);
            return resolve(null)
        });

        req.end();
    });

};