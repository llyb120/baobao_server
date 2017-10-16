import {XOrmConfig} from 'x-orm';

export const HTTP_PORT = 9016;
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