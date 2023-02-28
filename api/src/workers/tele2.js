const logger = require('../helpers/logger');
const db = require('../db');
const tele2Controller = require("../controllers/mobile/tele2");
const {readerFromTele2} = require("../controllers/rabbitmq/readers");
const {toTele2} = require('../controllers/rabbitmq/writers');
const {sleep} = require("../helpers/helper");

/**
 *  слушает очередь теле2 и парсит или меняет пароль
 *
 *  @param phone [string]
 *  @param message_id [number]
 *  @param type [string] "parsing" | "password"
 *  @param password_id [number]
 */
readerFromTele2(async function (msg, data) {
    let self = this;
    let msgtoerr = JSON.stringify(msg, null, 2)
    try {
        const systemIsOnline = await db.appConfig.working();
        if (!systemIsOnline) {
            logger.info('rabbit readerFromTele2', "Система выключена");
            await sleep(1000*60);
            return self.nack(data);
        }
        logger.info(msg, 'rabbit readerFromTele2');
        if (!msg.message_id) throw new Error("не передан номер ивента (message_id)");
        if (!msg.phone) throw new Error("не передан номер телефона (phone)");
        if (!msg.type) throw new Error("не передан тип сообщения (type)");
        await db.messages.update(msg.message_id, {status: 1});
        const phoneObj = await db.phones.getByPhone(msg.phone);
        if (msg.type === "parse") {
            const {profile, balance, tariff, GB} = await tele2Controller.parseAllData(phoneObj);
            await db.phones.updateFromParsing(phoneObj, {profile, balance, tariff, GB});
        } else if (msg.type==="password") {
            if (parseInt(msg.password_id)<=0) throw new Error("не передан новый пароль (password_id)");
            const passObj = await db.passwords.getById(msg.password_id);
            await tele2Controller.changePassword(phoneObj,passObj.value);
            await db.phones.update(phoneObj.phone, {password_id: msg.password_id});
        }
        await db.messages.finished(msg.message_id,{});
        self.ack(data)
    } catch (e) {
        logger.error(e, msgtoerr)
        await db.messages.finished(msg.message_id,{}, e.message).catch(()=>{});
        self.ack(data)
    } finally {
        logger.info('finished readerFromTele2')
    }
});
