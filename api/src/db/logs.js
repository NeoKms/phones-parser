const mysql = require("../db/conf");
const logger = require("../helpers/logger");
const {getTimestampNow} = require("../helpers/helper");

module.exports = class Logs {
    externalDB = {};

    setExternalDB(external) {
        this.externalDB = external;
    }

    async insert(data, con=false) {
        let connection;
        try {
            connection = con || (await mysql.connection());
            await connection.query("SET NAMES utf8mb4;");
            await connection.query(
                "INSERT INTO `logs` (`timestamp`, `route`, `data`, `action_type`) values (?,?,?,?)",
                [
                    getTimestampNow(),
                    data.route,
                    JSON.stringify(data.data),
                    data.action_type,
                ]
            );
        } catch (err) {
            logger.error(err, "Logs.insert:");
            throw err;
        } finally {
            if (connection && !con) await connection.release();
        }
    }
};
