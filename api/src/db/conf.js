const mysql = require("mysql");
const util = require("util");
const config = require("../config");
const logger = require("../helpers/logger");

const pool = mysql.createPool(config.DB);
pool.query = util.promisify(pool.query);

const connection = () =>
    new Promise((resolve, reject) => {
        pool.getConnection((err, con) => {
            if (err) {
                logger.error(err, "Ошибка подключения к БД:");
                reject(err);
            }
            const query = (sql, binding) =>
                new Promise((resolve, reject) => {
                    con.query(sql, binding, (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                });
            const release = () =>
                new Promise((resolve, reject) => {
                    if (err) reject(err);
                    resolve(con.release());
                });
            const beginTransaction = () =>
                util.promisify(con.beginTransaction).call(con);
            const commit = () => util.promisify(con.commit).call(con);
            const rollback = () => util.promisify(con.rollback).call(con);
            resolve({
                query,
                release,
                beginTransaction,
                commit,
                rollback,
            });
        });
    });

const query = (sql, binding) =>
    new Promise((resolve, reject) => {
        pool.query(sql, binding, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });

module.exports = { pool, connection, query };
