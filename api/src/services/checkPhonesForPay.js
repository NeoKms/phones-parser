const logger = require('../helpers/logger');
const db = require('../db');
const {toQiwi} = require("../controllers/rabbitmq/writers");
const {TIMEOUTS} = require("../config");

async function run() {
    try {
        logger.trace("[checkPhonesForPay] Новый цикл отправки телефонов на оплату");
        const systemIsOnline = await db.appConfig.working();
        if (!systemIsOnline) return logger.trace("[checkPhonesForPay] Система выключена");
        const phones = await db.phones.getPhonesForPay();
        logger.trace(`[checkPhonesForParse] Телефонов на оплату: ${phones.length}`);
        for (let i = 0, c = phones.length; i < c; i++) {
            const el = phones[i];
            const messageObj = await db.messages.create({
                phone: el.phone,
                action_type: el.byTariff ? "pay_tariff" : "pay",
                data: {
                    sum: parseInt(el.sum),
                    auto: !!el.auto_pay,
                }
            });
            await db.phones.update(el.phone, {in_pay: 1});
            if (!el.auto_pay) continue;
            const send = {
                phone: el.phone,
                message_id: messageObj.id,
            }
            await toQiwi(send);
        }
    } catch (e) {
        logger.error(e.message);
    } finally {
        setTimeout(() => run(), 1000 * TIMEOUTS.TIMEOUT_PAY);
    }
}

run();
