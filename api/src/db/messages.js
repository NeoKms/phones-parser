const logger = require("../helpers/logger");
const mysql = require("../db/conf");
const cacheModule = require("../helpers/cache");
const DBWrapper = require("../helpers/db.interface");
const maps = require("../helpers/maps");
const HttpError = require("../helpers/HttpError");
const {getTimestampNow} = require("../helpers/helper");
const {toMts} = require("../controllers/rabbitmq/writers");
const wss = require("../helpers/io");
const db = require("./index");

module.exports = class Messages {
    externalDB = {};
    tableName = "messages";
    mapDB = maps[this.tableName];

    setExternalDB(external) {
        this.externalDB = external;
    }

    #fillUpdate(data) {
        const params = [];
        const update = [];
        for (const key in data) {
            if (key === "id") continue;
            if (this.mapDB.map.hasOwnProperty(key)) {
                update.push(`\`${key}\``);
                params.push(typeof data[key] === "object" && data[key]!==null  ? JSON.stringify(data[key]) : data[key]);
            }
        }
        return {params, update};
    }

    async __filter(
        {
            select = [], filter = {}, hastest = [], options = {
            sortBy: [],
            sortDesc: [],
        }, debug = false
        },
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
            res = {
                page: res.pagination.page,
                maxPages: res.pagination.maxPages,
                allCount: res.pagination.all,
                data: res.queryResult
            };
        } catch (err) {
            logger.error(err, "Messages.filter:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async getById(id, select = [], con = false) {
        const [result] = await this.__filter({select, filter: {id: +id}}, con)
            .then(({data}) => data);
        if (!result) {
            throw new HttpError("Не найдено", 404);
        }
        return result;
    }

    async cancelOldPayMessages(phone) {
        const isExistOldMessages = await this.__filter({
            filter: {
                phone: phone,
                "&action_type": ["pay", "pay_tariff"],
                "~data": {
                    path: "auto",
                    sign: "=",
                    num: "false",
                },
                status: 0
            }
        }).then(({data}) => data);
        for (let i = 0, c = isExistOldMessages.length; i < c; i++) {
            const msg = isExistOldMessages[i];
            await this.update(msg.id, {status: 4});
        }
    }

    async finished(id, data, err = null, con=false) {
        if (!id) return;
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            const mesById = await this.getById(id, ["id", "phone", "action_type"], connection);
            data.finished_at = getTimestampNow();
            const updPhoneObj = {}
            if (err) {
                data.status = 3;
                data.error = err;
                updPhoneObj.last_error = err;
            } else {
                data.status = 2;
            }
            if (mesById.action_type === "parse") {
                updPhoneObj.status = 0;
                if (!err) {
                    updPhoneObj.last_pars_timestamp = getTimestampNow();
                }
            } else if (["pay","pay_tariff"].includes(mesById.action_type)) {
                updPhoneObj.in_pay = 0;
            }
            if (Object.keys(updPhoneObj)) {
                await this.externalDB.phones.update(mesById.phone, updPhoneObj, connection);
            }
            const {params, update} = this.#fillUpdate(data);
            params.length && await connection.query(`update messages set ${update.join("=?, ") + "=? "} where id=?`, [...params, id]);
            res = await this.getById(id, [], connection);
            wss.getConnection().then(IOClient=>IOClient.all({
                type: "messages:update",
                data: res,
            })).catch(err=>logger.error(err));
        } catch (err) {
            logger.error(err, "Messages.finished:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async update(id, data, con=false) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            const oldObj = await this.getById(id, ["id","data"], connection);
            if (data.hasOwnProperty("data")) {
                data.data = Object.assign(oldObj.data,data.data);
            }
            const {params, update} = this.#fillUpdate(data);
            await connection.query(`update messages set ${update.join("=?, ") + "=? "} where id=?`, [...params, id]);
            res = await this.getById(id, [], connection);
            wss.getConnection().then(IOClient=>IOClient.all({
                type: "messages:update",
                data: res,
            })).catch(err=>logger.error(err));
        } catch (err) {
            logger.error(err, "Messages.update:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async create({phone, action_type, data}, con=false) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            const [newObj] = await connection.query(`insert into messages (phone,created_at,action_type,data) values (?,?,?,?) returning id`,
                [
                    phone,
                    getTimestampNow(),
                    action_type,
                    JSON.stringify(data||{})
                ]);
            res = await this.getById(newObj.id, [], connection);
            wss.getConnection().then(IOClient=>IOClient.all({
                type: "messages:create",
                data: res,
            })).catch(err=>logger.error(err));
        } catch (err) {
            logger.error(err, "Messages.create:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async setCode(id,code) {
        await this.update(+id, {data: {code}});
        const messObj = await this.getById(id);
        await toMts({
            phone: messObj.phone,
            type:"passwordConfirm",
            message_id: id,
        })
    }
}
