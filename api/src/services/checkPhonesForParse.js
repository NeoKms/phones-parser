const logger = require('../helpers/logger');
const db = require('../db');
const {getTimestampNow} = require("../helpers/helper");
const {TIMEOUTS, PERIOD_PARSE} = require("../config");

async function run() {
    try {
        logger.trace("[checkPhonesForParse] Новый цикл парсинга телефонов");
        const systemIsOnline = await db.appConfig.working();
        if (!systemIsOnline) return logger.trace("[checkPhonesForParse] Система выключена");
        const sixHoursAgo = getTimestampNow() - PERIOD_PARSE;
        const phones = await db.phones.__filter({
            filter: {
                is_active: 1,
                status: 0,
                "!!current_password": 0,
                0: {
                    'logic': "OR",
                    0: {"<=last_pars_timestamp": sixHoursAgo},
                    1: {"!!!last_pars_timestamp": sixHoursAgo},
                }
            }
        }).then(({data}) => data);
        logger.trace(`[checkPhonesForParse] Телефонов на парсинг: ${phones.length}`);
        for (let i = 0, c = phones.length; i < c; i++) {
            const el = phones[i];
            await db.phones.sendPhoneToParse(el.phone, el);
        }
    } catch (e) {
        logger.error(e.message);
    } finally {
        setTimeout(() => run(), 1000 * TIMEOUTS.TIMEOUT_PARSE);
    }
}

run();
