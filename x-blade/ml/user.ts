import {X} from 'x-orm';


@X.Entity({
    primary :'id'
})
export class User{
    id;
    name;
    password;
    nickname;
    token;
    zuan;
    weixin_unionid;
    ip;
}