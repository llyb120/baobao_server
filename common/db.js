const dbconfig = require("../config").MYSQL;
const mysql = require('mysql');
const uuid = require('uuid');

var SysConfig = null;

function query(sql){
    var connection = mysql.createConnection({
        host : dbconfig.host,
        port : dbconfig.port,
        user : dbconfig.user,
        password : dbconfig.pass,
        database : dbconfig.name
    });
    return new Promise((resolve,reject) => {
        connection.connect((err) => {
            if(err){
                console.error("db connection failed");
                resolve(null);
                return;
            }
            connection.query(sql,(err,result) => {
                if(err){
                    console.error(`db query ${sql} error`);
                    connection.end();
                    resolve(null);
                    return;
                }
                connection.end();
                resolve(result);
            });
        });
    });

}


exports.createVisitor = async () => {


    return false;
};

exports.createUser = () => {

};

exports.initSysConfig = async () => {

};

exports.query = query;

