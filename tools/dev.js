let tsnode = require('ts-node');
// let watch = require('watch');
const child_process = require('child_process');
let path = require('path');
let child;
var chokidar = require('chokidar');
let timer;
// One-liner for current directory, ignores .dotfiles
chokidar.watch(path.resolve(__dirname, '../x-blade'), {
    ignored: /(^|[\/\\])\../
}).on('all', (event, path) => {

    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    timer = setTimeout(function () {
        if(child){
            killPid(child.pid);
        }
        console.log("服务正在重启中");
        child = child_process.spawn("node", ["./node_modules/ts-node/dist/bin.js", "./x-blade/app.ts"]);
        child.stdout.on("data", (data) => {
            console.log(data.toString())
        });
        child.stdout.on("error",err => console.error(err.message));
        child.stderr.on("data",data => console.log(data.toString()));
    }, 0);
    //   console.log(event, path);
});


function killPid(pid, signal) {
    try {
        process.kill(parseInt(pid, 10), signal);
    } catch (error) {
        if (error.code !== 'ESRCH') throw error;
    }
}