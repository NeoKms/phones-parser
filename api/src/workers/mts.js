const logger = require("../helpers/logger");
const db = require('../db');
const mtsController = require("../controllers/mobile/mts");
const {readerFromMts} = require("../controllers/rabbitmq/readers");
const {sleep} = require("../helpers/helper");

/**
 *  слушает очередь mts и парсит или меняет пароль
 *
 *  @param phone [string]
 *  @param message_id [number]
 *  @param type [string] "parsing" | "password" | "passwordConfirm"
 *  @param password_id [number] новый пароль
 */
readerFromMts(async function (msg, data) {
    let self = this;
    let msgtoerr = JSON.stringify(msg, null, 2)
    try {
        const systemIsOnline = await db.appConfig.working();
        if (!systemIsOnline) {
            logger.info('rabbit readerFromMts', "Система выключена");
            await sleep(1000*60);
            return self.nack(data);
        }
        logger.info(msg, 'rabbit readerFromMts');
        if (!msg.message_id) throw new Error("не передан номер ивента (message_id)");
        if (!msg.phone) throw new Error("не передан номер телефона (phone)");
        if (!msg.type) throw new Error("не передан тип сообщения (type)");
        await db.messages.update(msg.message_id, {status: 1});
        const phoneObj = await db.phones.getByPhone(msg.phone);
        if (msg.type === "parse") {
            const {profile, balance, tariff, GB} = await mtsController.parseAllData(phoneObj);
            await db.phones.updateFromParsing(phoneObj, {profile, balance, tariff, GB});
            await db.messages.finished(msg.message_id,{});
        } else if (msg.type==="password") {
            if (parseInt(msg.password_id)<=0) throw new Error("не передан новый пароль (password_id)");
            const passObj = await db.passwords.getById(msg.password_id);
            const requestId = await mtsController.changePasswordRequest(phoneObj,passObj.value);
            await db.messages.update(msg.message_id, {
                data: {requestId,password_id:msg.password_id}
            });
        } else if (msg.type==="passwordConfirm") {
            const [messageObj] = await db.messages.__filter({filter:{id: msg.message_id}}).then(({data})=>data);
            if (!messageObj.data.hasOwnProperty("code")) {
                throw new Error("Подтверждения смены пароля не имеет код от смс");
            }
            await mtsController.changePasswordConfirm(phoneObj,messageObj.data);
            await db.phones.update(phoneObj.phone, {password_id: messageObj.data.password_id});
            await db.messages.finished(msg.message_id,{});
        }
        self.ack(data)
    } catch (e) {
        logger.error(e, msgtoerr)
        await db.messages.finished(msg.message_id,{}, e.message).catch(()=>{});
        self.ack(data)
    } finally {
        logger.info('finished readerFromMts')
    }
});
