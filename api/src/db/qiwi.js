const mysql = require("../db/conf");
const logger = require("../helpers/logger");
const maps = require("../helpers/maps");
const DBWrapper = require("../helpers/db.interface");
const cacheModule = require("../helpers/cache");
const HttpError = require("../helpers/HttpError");
const {getTimestampNow} = require("../helpers/helper");
const {getUnixTime} = require("../helpers/dates");
const qiwiController = require("../controllers/qiwi");
const db = require("./index");

module.exports = class Qiwi {
    externalDB = {};
    tableName = "qiwi_tokens";
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
            res = {
                page: res.pagination.page,
                maxPages: res.pagination.maxPages,
                allCount: res.pagination.all,
                data: res.queryResult
            };
        } catch (err) {
            logger.error(err, "Qiwi.filter:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }


    async addTransaction({id,token}, val, con=null) {
        let connection;
        try {
            connection = con || (await mysql.connection());
            await connection.query(`INSERT INTO qiwi_transactions (qid, timestamp, val) VALUES (?, ?, ?)`, [
                id,
                getTimestampNow(),
                val
            ]);
            const balance = await qiwiController.balance(token);
            await this.update(id,{balance});
        } catch (err) {
            logger.error(err, "Qiwi.addTransaction:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
    }

    async getAnyToken(sum, con=null) {
        let connection, res = null;
        try {
            connection = con || (await mysql.connection());
            const date = new Date();
            const firstDayOfMonth = getUnixTime(new Date(date.getUTCFullYear(), date.getUTCMonth(), 1).toISOString().split("T")[0] + " 00:00:00");
            const lastDayOfMonth = getUnixTime(new Date(date.getUTCFullYear(), date.getUTCMonth() + 1, 0).toISOString().split("T")[0] + " 00:00:00");
            [res] = await connection.query("SELECT id, token,`limit`, \
                ( SELECT sum( val ) FROM qiwi_transactions WHERE `timestamp` >= ? AND `timestamp` <= ? AND qid = id) AS val_in_month, \
                ( SELECT MAX(`timestamp`) FROM qiwi_transactions WHERE qid = id) AS last_trans_ts \
            FROM  qiwi_tokens WHERE \
            balance > ? \
            having if(val_in_month is null,0,val_in_month) < if (`limit` is null, 999999999, `limit`) \
            order by last_trans_ts ASC limit 1", [firstDayOfMonth, lastDayOfMonth, sum])
            if (!res) {
                [res] = await connection.query(
                    "SELECT id,token,`limit`, ( SELECT MAX(`timestamp`) FROM qiwi_transactions WHERE qid = id) AS last_trans_ts  FROM  qiwi_tokens WHERE balance > ?  order by last_trans_ts ASC limit 1",
                    [sum])
            }
            if (!res) {
                throw new Error("Не найден киви токен с доступным количеством денег")
            }
        } catch (err) {
            logger.error(err, "Qiwi.getAnyToken:");
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

    async update(id, data, con=null) {
        await this.getById(id, ["id"]);
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            const {params, update} = this.#fillUpdate(data);
            params.length && await connection.query(`update qiwi_tokens set ${update.join("=?, ") + "=? "} where id=?`, [...params, id]);
            res = await this.getById(id, [], connection);
        } catch (err) {
            logger.error(err, "Qiwi.update:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async create(data, con=null) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            const [isExist] = await this.__filter(
                {
                    select: ["id"],
                    filter: {token: data.token}
                },
                connection).then(({data}) => data);
            if (isExist) {
                throw new HttpError("Такой токен уже есть в базе", 400);
            }
            const [newObj] = await connection.query("insert into qiwi_tokens (`token`,`is_active`,`balance`,`limit`) values (?,?,?,?) returning `id`",
                [
                    data.token,
                    1,
                    parseInt(data.balance),
                    data.limit
                ]);
            res = await this.getById(newObj.id, [], connection);
        } catch (err) {
            logger.error(err, "Qiwi.create:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }
};
