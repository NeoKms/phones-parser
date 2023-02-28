let toAddDb = [];
const modulesObj = require("fs")
    .readdirSync("./src/db")
    .reduce((db, module) => {
        if (module !== "index.js" && module !== "conf.js") {
            let moduleName = module.replace(".js", "");
            db[moduleName] = require(`./${module}`);
            if (typeof db[moduleName] === "function") {
                db[moduleName] = new db[moduleName]();
                toAddDb.push(moduleName);
            }
        }
        return db;
    }, {});
toAddDb.map((el) => {
    modulesObj[el].setExternalDB(modulesObj);
});
module.exports = modulesObj;
