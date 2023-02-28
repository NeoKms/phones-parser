const express = require("express");
const router = express.Router();
const db = require("../../db");
const HttpError = require("../../helpers/HttpError");
const ajvShema = require("../../helpers/validate");
const {writeLog, getNumberRaw} = require('../../helpers/helper');

module.exports = () => {
    router.get("", async (req, res, next) => {
            try {
                const result = await db.phones.__filter({});
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    router.post("/list", async (req, res, next) => {
            try {
                const {options,filter,select} = req.body;
                const result = await db.phones.__filter({options,filter,select});
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    router.post("", ajvShema("phones_create"), async (req, res, next) => {
            try {
                const data = req.body;
                const result = await db.phones.create(data);
                writeLog(req, "create", db);
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    router.get("/:phone/auto_pay/on", async (req, res, next) => {
            try {
                const {phone} = req.params;
                await db.phones.update(phone, {auto_pay: true});
                writeLog(req, "auto_pay_change", db);
                res.json({message: "ok"});
            } catch (error) {
                next(error);
            }
        }
    );
    router.get("/:phone/auto_pay/off", async (req, res, next) => {
            try {
                const {phone} = req.params;
                await db.phones.update(phone, {auto_pay: false});
                writeLog(req, "auto_pay_change", db);
                res.json({message: "ok"});
            } catch (error) {
                next(error);
            }
        }
    );
    router.get("/:phone/activate", async (req, res, next) => {
            try {
                const {phone} = req.params;
                await db.phones.update(phone, {is_active: true});
                writeLog(req, "activate", db);
                res.json({message: "ok"});
            } catch (error) {
                next(error);
            }
        }
    );
    router.get("/:phone/deactivate", async (req, res, next) => {
            try {
                const {phone} = req.params;
                await db.phones.update(phone, {is_active: false});
                writeLog(req, "activate", db);
                res.json({message: "ok"});
            } catch (error) {
                next(error);
            }
        }
    );
    router.get("/:phone", async (req, res, next) => {
            try {
                const {phone} = req.params;
                if (getNumberRaw(phone).length < 10) {
                    throw new HttpError("Не найдено", 404)
                }
                const result = await db.phones.getByPhone(phone);
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    router.patch("/:phone", ajvShema("phones_update"), async (req, res, next) => {
            try {
                const {phone} = req.params;
                if (getNumberRaw(phone).length < 10) {
                    throw new HttpError("Не найдено", 404)
                }
                const data = req.body;
                const result = await db.phones.update(phone, data);
                writeLog(req, "update", db);
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    return router;
};
