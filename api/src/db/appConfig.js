const mysql = require("../db/conf");
const logger = require("../helpers/logger");

module.exports = class AppConfig {
    externalDB = {};

    setExternalDB(external) {
        this.externalDB = external;
    }

    async working(con) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            [res] = await connection.query("select `value` from app_config where `key`=?", ["working"]);
            res = !!parseInt(res.value);
        } catch (err) {
            logger.error(err, "AllConfig.working:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }
    async getByKey(key, con=false) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            [res] = await connection.query("select `value` from app_config where `key`=?", [key]);
            res = res.value;
        } catch (err) {
            logger.error(err, "AllConfig.getByKey:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
        return res;
    }

    async updateByKey(key,value, con=false) {
        let connection, res;
        try {
            connection = con || (await mysql.connection());
            await connection.query("update app_config set `value`=? where `key`=?", [value, key]);
        } catch (err) {
            logger.error(err, "AllConfig.updateByKey:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
    }
};
