require("./src/helpers/rounder");
const express = require("express");
const app = express();
const {execPromise, sleep} = require('./src/helpers/helper');
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const {U_DIRS,PORT,PRODUCTION} = require('./src/config');
const Sentry = require("@sentry/node");

app
    .use((req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
        res.setHeader(
            "Access-Control-Allow-Methods",
            "GET,POST,PUT,PATCH,OPTIONS,DELETE"
        );
        res.setHeader("Access-Control-Allow-Credentials", true);
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
        res.setHeader(
            "Access-Control-Allow-Headers",
            "baggage, sentry-trace, Content-Type, Access-Control-Allow-Headers, Access-Control-Allow-Methods, Authorization, X-Requested-With, Access-Control-Allow-Origin, Set-Cookie"
        );
        next();
    })
    .use(
        morgan(
            ":remote-addr - :remote-user [:date[iso]] ':method :url HTTP/:http-version' :status :res[content-length] ':referrer' - :response-time ms"
        )
    )
    .use(bodyParser.urlencoded({limit: "10mb", extended: true}))
    .use(bodyParser.json({limit: "30mb", extended: true}))
    .use(cookieParser())
    .use(
        fileUpload({
            useTempFiles: false,
            tempFileDir: U_DIRS.tmp,
        })
    );

//init sentry
require("./src/helpers/sentry")(app);
// end

require("./src/routes")(app);
app.use(Sentry.Handlers.errorHandler());
const logger = require('./src/helpers/logger');
app.use((err, req, res, next) => {
    if (!err) next();
    logger.error(err);
    if (err.name === "HttpError") {
        res.status(err.statusCode).json({ error: err.message });
    } else {
        const msg = PRODUCTION ? "Ошибка на стороне сервера" : err.message;
        res.status(400).json({ error: msg });
    }
});

(async () => {
    require("./src/helpers/redis");//инитим редиску чтобы успела подключиться до чтения сообщения из реббита
    await sleep(500);// на всякий случай ждем редиску
    // миграции
    await execPromise("db-migrate up").then(msg => logger.info("\n---db-migrate up---\n"+msg+"---end---"));
    // подключаем вебсокет
    await require("./src/helpers/io").setDb(require("./src/db")).getConnection();
    // воркеры
    require("./src/workers/tele2");
    require("./src/workers/megafon");
    require("./src/workers/mts");
    require("./src/workers/beeline");
    require("./src/workers/qiwi");
    // сервисы
    require("./src/services/checkPhonesForParse");
    require("./src/services/checkPhonesForPay");
    require("./src/services/resetParseStatus");
    require("./src/services/resetPayStatus");
    // апи
    let server = app.listen(PORT, () => {
        logger.info(`Приложение запущено на порту: ${server.address().port}`);
    });
})();
