const logger = require('../helpers/logger');
const db = require('../db');
const {TIMEOUTS} = require("../config");

async function run() {
    try {
        logger.trace("[resetPayStatus] Новый цикл сброса статуса оплаты телефонов");
        const systemIsOnline = await db.appConfig.working();
        if (!systemIsOnline) return logger.trace("[resetPayStatus] Система выключена");
        const phones = await db.phones.getPhonesResetPayStatus();
        logger.trace(`[resetPayStatus] Телефонов на обнуление статуса оплаты: ${phones.length}`);
        for (let i = 0, c = phones.length;i<c;i++) {
            const el = phones[i];
            await db.messages.cancelOldPayMessages(el.phone);
            await db.phones.update(el.phone, {in_pay: 0});
        }
    } catch (e) {
        logger.error(e.message);
    } finally {
        setTimeout(() => run(), 1000 * TIMEOUTS.TIMEOUT_RESET_PAY);
    }
}

run();
