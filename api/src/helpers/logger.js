const log4js = require('log4js');
const Sentry = require('@sentry/node');
const {SENTRY} = require('../config');

log4js.configure({
    appenders: {
        console: {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: '%[[%d{dd.MM.yyyy hh:mm:ss.SSS}] [%p] -%] %m',
            },
        },
    },
    categories: { default: { appenders: ['console'], level: 'all' } },
});
const logger = log4js.getLogger();
logger.loggerError = logger.error;
logger.error = function (error, ...args) {
    logger.loggerError(...args,error);
    try {
        if (SENTRY !== false) {
            if (typeof error === 'string') {
                error = new Error(error)
            }
            Sentry.captureException(error);
        }
    } catch (error) {
        logger.loggerError('logger:toTelegramErrors:', error);
    }
};

module.exports = logger;
