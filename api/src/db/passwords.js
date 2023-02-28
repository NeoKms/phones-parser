const logger = require("../helpers/logger");
const mysql = require("../db/conf");
const cacheModule = require("../helpers/cache");
const DBWrapper = require("../helpers/db.interface");
const maps = require("../helpers/maps");
const HttpError = require("../helpers/HttpError");
const {toTele2, toMts, toMegafon, toBeeline} = require("../controllers/rabbitmq/writers");

module.exports = class Passwords {
    externalDB = {};
    tableName = "passwords";
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
            !options.hasOwnProperty('groupBy') && (options.groupBy = []);
            if (!select.length || select.includes('group by passwords.id')) {
                options.groupBy.push("id")
            }
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
            logger.error(err, "Passwords.filter:");
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

    async #changePassOnPhones(id) {
        const phones = await this.externalDB.phones.__filter(
            {
                select: ["operator", "phone"],
                filter: {password_id: id},
            }).then(({data}) => data);
        await Promise.all(phones.map(el => this.externalDB.messages.create({
            phone: el.phone,
            action_type: "password",
            data: {password_id: id},
        }).then(messageObj => {
            const send = {
                phone: el.phone,
                type: "password",
                message_id: messageObj.id,
                password_id: id,
            }
            if (el.operator==="megafon") {
                return toMegafon(send)
            } else if (el.operator==="mts") {
                return toMts(send)
            } else if (el.operator==="tele2") {
                return toTele2(send)
            } else if (el.operator==="beeline") {
                return toBeeline(send)
            }
        })))
    }

    async update(id, data, con=false) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            await this.getById(id, ["id"], connection);
            const {params, update} = this.#fillUpdate(data);
            params.length && await connection.query(`update passwords set ${update.join("=?, ") + "=? "} where id=?`, [...params, id]);
            if (data.hasOwnProperty("value")) {
                await this.#changePassOnPhones(id);
            }
            res = await this.getById(id, [], connection);
        } catch (err) {
            logger.error(err, "Passwords.update:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async create(data, con=false) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            const [newObj] = await connection.query(`insert into passwords (value,operator,description) values (?,?,?) returning id`,
                [
                    data.value,
                    data.operator,
                    data.description
                ]);
            res = await this.getById(newObj.id, [], connection);
        } catch (err) {
            logger.error(err, "Passwords.create:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }
}
