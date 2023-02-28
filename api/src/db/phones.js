const logger = require("../helpers/logger");
const {getTimestampNow} = require("../helpers/helper");
const mysql = require("./conf");
const DBWrapper = require("../helpers/db.interface");
const cacheModule = require("../helpers/cache");
const maps = require("../helpers/maps");
const HttpError = require("../helpers/HttpError");
const {getUnixTime, formatDateJS} = require("../helpers/dates");
const {PERIOD_RESET_PARSE, PERIOD_RESET_PAY} = require("../config");
const {toMegafon, toMts, toTele2, toBeeline} = require("../controllers/rabbitmq/writers");

module.exports = class Phones {
    externalDB = {};
    tableName = "phones";
    mapDB = maps[this.tableName];

    setExternalDB(external) {
        this.externalDB = external;
    }

    #fillUpdate(data) {
        const params = [];
        const update = [];
        for (const key in data) {
            if (key === "phone") continue;
            if (this.mapDB.map.hasOwnProperty(key)) {
                if (key === "qiwi_token_id" && data[key] <= 0) {
                    data[key] = null;
                }
                update.push(`\`${key}\``);
                params.push(typeof data[key] === "object" && data[key] !== null ? JSON.stringify(data[key]) : data[key]);
            }
        }
        return {params, update};
    }

    async __filter(
        {select = [], filter = {}, hastest = [], options = {}, debug = false},
        con = false
    ) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            let wrapper = await new DBWrapper(this.tableName, connection, {
                debug,
                cacheModule,
                mapObj: this.mapDB,
            })
                .changeTables(options)
                .selectValue(select, filter, hastest)
                .orderBy(options)
                .groupBy(options);
            if (options?.itemsPerPage) {
                wrapper.paginate(options);
            }
            res = await wrapper.runQuery();
            for (let i = 0, c = res.queryResult.length; i < c; i++) {
                const item = res.queryResult[i];
                if (res.has.qiwi_token_id) {
                    item.qiwi_token_id = item.qiwi_token_id ?? -1;
                }
            }
            res = {
                page: res.pagination.page,
                maxPages: res.pagination.maxPages,
                allCount: res.pagination.all,
                data: res.queryResult
            };
        } catch (err) {
            logger.error(err, "Phones.filter:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async getPhonesResetParseStatus(con = false) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            const nowTimestamp = Math.round(new Date().getTime() / 1000);
            res = await connection.query(
                `select phones.phone, (select messages.created_at from messages where messages.phone=phones.phone and messages.action_type = "parse" and messages.status=0 order by messages.created_at desc limit 1 ) as tms from phones where phones.status=1 having tms < ?`,
                [nowTimestamp - PERIOD_RESET_PARSE]);
        } catch (err) {
            logger.error(err, "Phones.getPhonesResetParseStatus:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async getPhonesResetPayStatus(con = false) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            const nowTimestamp = Math.round(new Date().getTime() / 1000);
            res = await connection.query(
                `select phones.phone, (select messages.created_at from messages where messages.phone=phones.phone and messages.status=0 and (messages.action_type = "pay" or messages.action_type="pay_tariff") order by messages.created_at desc limit 1 ) as tms from phones where phones.in_pay=1 having tms < ?`,
                [nowTimestamp - PERIOD_RESET_PAY]);
        } catch (err) {
            logger.error(err, "Phones.getPhonesResetPayStatus:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async sendPhoneToParse(phone, phoneObj = null) {
        if (phoneObj === null) {
            phoneObj = await this.getByPhone(phone);
        }
        const messageObj = await this.externalDB.messages.create({
            phone: phoneObj.phone,
            action_type: "parse",
        });
        const send = {
            phone: phoneObj.phone,
            type: "parse",
            message_id: messageObj.id,
        }
        try {
            if (phoneObj.operator === "megafon") {
                await toMegafon(send)
            } else if (phoneObj.operator === "mts") {
                await toMts(send)
            } else if (phoneObj.operator === "tele2") {
                await toTele2(send)
            } else if (phoneObj.operator === "beeline") {
                await toBeeline(send)
            }
            await this.update(phoneObj.phone, {status: 1});
        } catch (err) {
            await this.externalDB.finished(messageObj.id, {}, err.message);
        }
    }

    async getPhonesForPay(con = false) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            const phonesNeedPay = await connection.query(`SELECT phone,auto_pay, min_value-balance as sum,passwords.operator FROM \`phones\` left join passwords on passwords.id=phones.password_id  where min_value>0 and is_active=1 and in_pay=0 HAVING sum > 0`);
            const todayTimestamp = getUnixTime(formatDateJS(getTimestampNow(), "YYYY-MM-DD") + " 00:00:00");
            const phonesNeedPayForTarif = await connection.query(`SELECT phone, auto_pay,(tariff_cost - balance) AS sum,passwords.operator  FROM \`phones\` left join passwords on passwords.id=phones.password_id where  is_active=1 and in_pay=0 and if (min_value is null,0,min_value)<tariff_cost and tariff_date = ? HAVING sum>0`,
                [todayTimestamp]);
            phonesNeedPayForTarif.forEach(p => p.byTariff = true)
            res = phonesNeedPay.concat(phonesNeedPayForTarif);
        } catch (err) {
            logger.error(err, "Phones.getPhonesForPay:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async __checkExcelPhones(phonesArr, insert) {
        let connection, res = {
            success: [],
            fail: [],
        };
        try {
            connection = await mysql.connection();
            await connection.beginTransaction();
            for (let i = 0, c = phonesArr.length; i < c; i++) {
                const objProp = Object.values(phonesArr[i]);
                objProp.pop();
                try {
                    if (insert > 0) {
                        await connection.query(
                            `insert ignore into phones (phone,password_id,current_password,is_active,min_value,tariff_date,fio,sip,comment) values (?)`,
                            [objProp]
                        );
                    } else {
                        await connection.query(
                            `insert into phones (phone,password_id,current_password,is_active,min_value,tariff_date,fio,sip,comment) values (?)`,
                            [objProp]
                        );
                    }
                    res.success.push(phonesArr[i]);
                } catch (err) {
                    if (err.message.indexOf("ER_DUP_ENTRY") !== -1) {
                        phonesArr[i].error = "Дубликат"
                    } else {
                        phonesArr[i].error = err.message;
                    }
                    res.fail.push(phonesArr[i])
                }
            }
            if (insert > 0) {
                await connection.commit();
            }
        } catch (err) {
            logger.error(err, "Phones.__checkExcelPhones:");
            throw err;
        } finally {
            if (connection) {
                if (insert <= 0) await connection.rollback();
                await connection.release();
            }
        }
        return res;
    }

    async getByPhone(phone, select = [], con = false) {
        const [result] = await this.__filter({select, filter: {phone}}, con)
            .then(({data}) => data);
        if (!result) {
            throw new HttpError("Не найдено", 404);
        }
        return result;
    }

    async updateFromParsing(phoneObj, {profile, balance, tariff, GB}) {
        const data = {
            fio: "",
            tariff_cost: null,
            balance: null,
            gb_packet: null,
            gb_available: null,
            tariff_date: null,
            last_pars_timestamp: getTimestampNow(),
            status: 0,
            allData: {profile, balance, tariff, GB}
        }
        if (phoneObj.operator === "megafon") {
            if (profile.hasOwnProperty("name")) {
                data.fio = profile.name
            }
            if (tariff.hasOwnProperty("ratePlanCharges")) {
                data.tariff_cost = parseInt(
                    tariff.ratePlanCharges?.nextCharge?.price?.value ||
                    tariff.ratePlanCharges?.totalMonthlyPrice?.price?.value ||
                    tariff.ratePlanCharges?.price?.price?.value || 0
                );
                const chargeDate = (tariff.ratePlanCharges?.nextCharge?.chargeDate || tariff.ratePlanCharges?.chargeDate || "").split(" ")[0];
                data.tariff_date = getUnixTime(chargeDate + " 00:00:00", "DD.MM.YYYY hh:mm:ss");
            }
            if (balance.hasOwnProperty("balance")) {
                data.balance = parseInt(balance.balance ?? 0)
            }
            if (GB.length) {
                const GBinternet = GB.find(e => e.remainderType === "INTERNET");
                if (GBinternet) {
                    data.gb_packet = `${GBinternet.totalValue?.value} ${GBinternet.totalValue?.unit}`;
                    data.gb_available = `${GBinternet.availableValue?.value} ${GBinternet.availableValue?.unit}`
                }
            }
        } else if (phoneObj.operator === "mts") {
            if (profile.hasOwnProperty("name")) {
                data.fio = profile.name ?? null
            }
            if (tariff.hasOwnProperty("subscriptionFee")) {
                data.tariff_cost = parseInt(tariff.subscriptionFee.value ?? 0);
            }
            if (
                tariff.hasOwnProperty("tariffication") &&
                tariff.tariffication?.payments?.length &&
                tariff.tariffication.payments[0]?.recurringChargePeriod?.startDateTime
            ) {
                const date = tariff.tariffication.payments[0]?.recurringChargePeriod?.startDateTime?.split("T")[0];
                data.tariff_date = getUnixTime(date + " 00:00:00", "YYYY-MM-DD hh:mm:ss");
            }
            if (balance.hasOwnProperty("amount")) {
                data.balance = parseInt(balance.amount ?? 0)
            }
            if (GB.length) {
                const GBinternet = GB.find(e => e.packageType === "Internet");
                if (GBinternet) {
                    data.gb_packet = `${Math.round10((GBinternet.totalAmount ?? 0) / (1024 * 1024), -2)} ГБ`;
                    const partsNonUsed = GBinternet?.parts?.find(el => el.partType === "NonUsed");
                    if (partsNonUsed) {
                        data.gb_available = `${Math.round10((partsNonUsed.amount ?? 0) / (1024 * 1024), -2)} ГБ`
                    }
                }
            }
        } else if (phoneObj.operator === "tele2") {
            if (profile.hasOwnProperty("fullName") && profile.fullName) {
                data.fio = profile.fullName ?? null
            }
            if (tariff.hasOwnProperty("abonentDate") && tariff.abonentDate) {
                data.tariff_date = getUnixTime(tariff.abonentDate.split("T")[0] + " 00:00:00", "YYYY-MM-DD hh:mm:ss");
            }
            if (tariff.hasOwnProperty("currentAbonentFee") || tariff.hasOwnProperty("tariffCost")) {
                data.tariff_cost = parseInt(tariff?.currentAbonentFee?.amount ?? tariff?.tariffCost?.amount ?? 0);
            }
            if (balance.hasOwnProperty("value")) {
                data.balance = parseInt(balance.value ?? 0)
            }
            if (GB.hasOwnProperty("internet")) {
                data.gb_available = GB.internet;
                data.gb_packet = GB.internet;
            }
        } else if (phoneObj.operator === "beeline") {
            if (profile.length >= 2) {
                data.fio = `${profile[1].fields[0].value} ${profile[1].fields[1].value} ${profile[1].fields[2].value}`
            }
            if (tariff.hasOwnProperty("rcRate")) {
                data.tariff_cost = parseInt(tariff.rcRate ?? 0);
            }
            if (tariff.hasOwnProperty("billingDate")) {
                data.tariff_date = getUnixTime(tariff.billingDate + " 00:00:00", "YYYY-MM-DD hh:mm:ss");
            }
            if (balance.hasOwnProperty("sum")) {
                data.balance = parseInt(balance.sum ?? 0)
            }
            if (GB?.accumulators?.items && GB.accumulators.items.length >= 1) {
                data.gb_packet = Math.round10((((GB.accumulators.items[0].size ?? 0) / 1024) / 1024), -2) + " ГБ";
                data.gb_available = Math.round10((((GB.accumulators.items[0].rest ?? 0) / 1024) / 1024), -2) + " ГБ";
            }
        }
        await this.update(phoneObj.phone, data);
    }

    async update(phone, data, con = false) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            await this.getByPhone(phone, ["id"], connection);
            const {params, update} = this.#fillUpdate(data);
            if (data.hasOwnProperty("password_id") && data.password_id === null) {
                update.push('`is_active`', '`current_password`');
                params.push(0, "")
            } else if (data.hasOwnProperty("password_id") && data.password_id > 0) {
                const curPassObj = await this.externalDB.passwords.getById(data.password_id);
                update.push('`current_password`');
                params.push(curPassObj.value);
            }
            params.length && await connection.query(`update phones set ${update.join("=?, ") + "=? "} where phone=?`, [...params, phone]);
            if (data.allData) {
                const res = await connection.query("update all_data set profile=?,balance=?,GB=?,tariff=? where phone=?",
                    [JSON.stringify(data.allData.profile), JSON.stringify(data.allData.balance), JSON.stringify(data.allData.GB), JSON.stringify(data.allData.tariff), phone]);
                if (!res.affectedRows) {
                    await connection.query("insert into all_data (phone,profile,balance,GB,tariff,additional) values (?,?,?,?,?,?)",
                        [
                            phone,
                            JSON.stringify(data.allData.profile),
                            JSON.stringify(data.allData.balance),
                            JSON.stringify(data.allData.GB),
                            JSON.stringify(data.allData.tariff),
                            JSON.stringify({})
                        ]);
                }
            }
            res = await this.getByPhone(phone, [], connection);
        } catch (err) {
            logger.error(err, "Phones.update:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async create(data, con = false) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            const [isExist] = await this.__filter(
                {
                    select: ["phone"],
                    filter: {phone: data.phone}
                },
                connection).then(({data}) => data);
            if (isExist) {
                throw new HttpError("Такой номер телефона уже есть в базе", 400);
            }
            let curPassObj = {value: ""};
            if (data.password_id > 0) {
                curPassObj = await this.externalDB.passwords.getById(data.password_id);
            }
            data.is_active = 1;
            if (data.hasOwnProperty("password_id") && data.password_id === null) {
                data.is_active = 0;
            }
            const [newObj] = await connection.query(
                `insert into phones (phone,password_id,current_password,min_value,comment,sip,qiwi_token_id,auto_pay,is_active) 
                     values (?,?,?,?,?,?,?,?,?) returning phone`,
                [
                    data.phone,
                    data.password_id,
                    curPassObj.value,
                    data.min_value,
                    data.comment,
                    data.sip,
                    data.qiwi_token_id > 0 ? data.qiwi_token_id : null,
                    data.auto_pay ?? 0,
                    data.is_active,
                ]);
            res = await this.getByPhone(newObj.phone, [], connection);
        } catch (err) {
            logger.error(err, "Phones.create:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }
}
