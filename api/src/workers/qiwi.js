const {readerFromQiwi} = require("../controllers/rabbitmq/readers");
const {sleep} = require("../helpers/helper");
const db = require("../db");
const logger = require("../helpers/logger");
const qiwiController = require("../controllers/qiwi");
const {PRODUCTION} = require('../config');

/**
 *  слушает очередь оплаты qiwi и оплачивает
 *
 *  @param phone [string]
 *  @param message_id [number]
 */
readerFromQiwi(async function (msg, data) {
    let self = this
    let msgtoerr = JSON.stringify(msg, null, 2);
    try {
        const systemIsOnline = await db.appConfig.working();
        if (!systemIsOnline) {
            logger.info('rabbit readerFromQiwi', "Система выключена");
            await sleep(1000*60);
            return self.nack(data);
        }
        logger.info(msg, 'rabbit readerFromQiwi');
        if (!msg.message_id) throw new Error("не передан номер ивента (message_id)");
        if (!msg.phone) throw new Error("не передан номер телефона (phone)");
        const messageObj = await db.messages.update(msg.message_id, {status: 1});
        const phoneObj = await db.phones.getByPhone(msg.phone);
        let tokenObj = null;
        if (phoneObj.qiwi_token_id>0) {
            const qiwiData = await db.qiwi.getById(phoneObj.qiwi_token_id, ["token","id"]);
            tokenObj = qiwiData.token;
        } else {
            tokenObj = await db.qiwi.getAnyToken(messageObj.data.sum)
        }
        PRODUCTION && await qiwiController.payToPhoneNumber(msg.phone,messageObj.data.sum, tokenObj.token);
        await sleep(1000);
        await db.qiwi.addTransaction(tokenObj,messageObj.data.sum)
        await db.messages.finished(msg.message_id,{}).catch(()=>{});
        self.ack(data)
        await db.phones.sendPhoneToParse(msg.phone).catch(err=>logger.error(err,"Ошибка при отправке телефона на перепарсинг после оплаты"));
    } catch (e) {
        logger.error(e, msgtoerr)
        await db.messages.finished(msg.message_id,{}, e.message).catch(()=>{});
        self.ack(data)
    }
})
