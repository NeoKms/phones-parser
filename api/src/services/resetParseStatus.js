const logger = require('../helpers/logger');
const db = require('../db');
const {TIMEOUTS} = require("../config");

async function run() {
    try {
        logger.trace("[resetParseStatus] Новый цикл сброса статуса парсинга телефонов");
        const systemIsOnline = await db.appConfig.working();
        if (!systemIsOnline) return logger.trace("[resetParseStatus] Система выключена");
        const phones = await db.phones.getPhonesResetParseStatus();
        logger.trace(`[resetParseStatus] Телефонов на обнуление статуса парсинга:  ${phones.length}`);
        for (let i = 0, c = phones.length; i < c; i++) {
            const el = phones[i];
            await db.phones.update(el.phone, {status: 0});
        }
    } catch (e) {
        logger.error(e.message);
    } finally {
        setTimeout(() => run(), 1000 * TIMEOUTS.TIMEOUT_RESET_PARSE);
    }
}

run();
