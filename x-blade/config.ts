import {XOrmConfig} from 'x-orm';
import * as uuid from 'uuid';

export const HTTP_PORT = 9050;
export const DATABASE : XOrmConfig = {
    type: 'mysql',
    name: "default",
    host: '192.168.1.222',
    port: 3306,
    username: 'root',
    password: '1234',
    database: 'sanmengame',
    tablesPrefix: '',
    // debug?: boolean
}


export const SERVER_ID = process.pid + uuid.v1();

export const WORKER_LENGTH = 4;