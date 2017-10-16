const db = require('../common/db');

(async () => {
    var ret = await db.createVisitor();
    console.error(ret)
})();

