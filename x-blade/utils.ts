export function success(data = {}){
    let msg = {
        errcode : 0,
        errmsg : 'ok',

    }
    msg = Object.assign(msg,data);
    // msg = {...msg,...data};
    return (msg);
}

export function failed(data : string | {} = {}){
    let msg = {
        errcode : -1,
        errmsg : "failed",
    }
    if(typeof data == 'string'){
        msg.errmsg = data as string;
    }
    else{
        msg = Object.assign(msg,data);
    }
    return msg;
}