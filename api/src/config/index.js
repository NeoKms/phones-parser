const pathModule = require("path");
const fsSync = require("fs");
const {env} = process;
const config = {};

const checkStaticDirSync = (dir) => {
    if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, {recursive: true, mode: "0777"});
    }
    return dir;
};

config.PRODUCTION = String(env.PRODUCTION || false).toLowerCase() == "true";

//only dev//
if (!config.PRODUCTION) {
    const dotenv = require('dotenv');
    dotenv.config();
}
//

config.RABBIT = {
    URL: `amqp://${env.RABBIT_USER}:${env.RABBIT_PASSWORD}@${env.RABBIT_HOST}?heartbeat=60`,
    QUERIES: {
        "tele2": "tele2",
        "mts": "mts",
        "megafon": "megafon",
        "beeline": "beeline",
        "qiwi": "qiwi",
    },
};
config.REDIS = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
};

config.RUCAPTCHA_API = env.RUCAPTCHA_API;

config.DB = {
    type: "mysql",
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 50,
    acquireTimeout: 10000,
};

config.SENTRY = env.SENTRY_KEY || false;


config.UPLOAD = checkStaticDirSync(
    env.UPLOAD || pathModule.resolve(__dirname + "/../../upload") + "/"
);

config.U_DIRS = {
    tmp: checkStaticDirSync(config.UPLOAD + "tmp/"),
};

config.WS = {
    HOST: env.WS_HOST,
    PORT: env.WS_PORT || 9000,
    EXT: env.WS_PORT_EXT || env.WS_PORT || 9000,
};

config.PORT = env.PORT;

config.TIMEOUTS = {
    //запускается воркер на оплату телефонов раз в 2 мин
    TIMEOUT_PAY: env.TIMEOUT_PAY ?? 120,
    //запускается воркер на оплату телефонов раз в 2 мин
    TIMEOUT_PARSE: env.TIMEOUT_PARSE ?? 120,
    //запускается воркер на сброс статуса парсинга раз в 3 мин
    TIMEOUT_RESET_PARSE: env.TIMEOUT_RESET_PARSE ?? 180,
    //запускается воркер на сброс статуса оплаты раз в 3 мин
    TIMEOUT_RESET_PAY: env.TIMEOUT_RESET_PAY ?? 180,
};
//обновляются данные по телефонам раз в 2ч
config.PERIOD_PARSE = env.PERIOD_PARSE ?? 7200;
//сбрасываются статусы оплаты если оплаты не было 4ч
config.PERIOD_RESET_PAY = env.PERIOD_RESET_PAY ?? 14400;
//сбрасываются статусы парсинга если парсинга не было 4ч
config.PERIOD_RESET_PARSE = env.PERIOD_RESET_PARSE ?? 14400;

module.exports = config;
