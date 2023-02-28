const logger = require('./src/helpers/logger');
const express = require('express');
const cookieParser = require('cookie-parser');
const {WS} = require("./src/config");
const websockets = require('./src/controllers/websockets');

const app = express();
app
    .use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS,DELETE');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.setHeader('Access-Control-Allow-Headers', 'sentry-trace, Content-Type, Access-Control-Allow-Headers, Access-Control-Allow-Methods, Authorization, X-Requested-With, Access-Control-Allow-Origin, Set-Cookie');
        next();
    })
    .use(cookieParser());

let server = app.listen(WS.PORT, function () {
    logger.info('Вебсокет-сервер запущен на порту: ', server.address().port);
});
websockets.start(server);
