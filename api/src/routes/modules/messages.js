const express = require("express");
const router = express.Router();
const db = require("../../db");
const HttpError = require("../../helpers/HttpError");
const ajvShema = require("../../helpers/validate");
const {writeLog} = require('../../helpers/helper');
const {toQiwi} = require("../../controllers/rabbitmq/writers");

module.exports = () => {
    router.post("/list", async (req, res, next) => {
            try {
                const {select, filter, options} = req.body;
                const result = await db.messages.__filter({select, filter, options});
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );

    router.get("/codeRequests", async (req, res, next) => {
            try {
                const result = await db.messages.__filter({
                    filter: {
                        0: {
                            "logic": "AND",
                            0: {
                                "~data": {
                                    path: "requestId",
                                    sign: " is not ",
                                    num: "null",
                                }
                            },
                            1: {
                                "~data": {
                                    path: "code",
                                    sign: " is ",
                                    num: "null",
                                }
                            }
                        },
                    }
                });
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );

    router.post("/:id/setCode", ajvShema("messages_code"), async (req, res, next) => {
            try {
                const {id} = req.params;
                const {code} = req.body;
                await db.messages.setCode(+id, code);
                writeLog(req, "setCode", db);
                res.json({message: "ok"});
            } catch (error) {
                next(error);
            }
        }
    );
    router.get("/:id/pay", async (req, res, next) => {
            try {
                const {id} = req.params;
                await db.messages.update(+id, {data: {auto: true}});
                const msgObj = await db.messages.getById(+id);
                await toQiwi({
                    phone: msgObj.phone,
                    message_id: +id,
                })
                writeLog(req, "pay", db);
                res.json({message: "ok"});
            } catch (error) {
                next(error);
            }
        }
    );
    router.get("/:id/cancel", async (req, res, next) => {
            try {
                const {id} = req.params;
                await db.messages.update(+id, {status: 4});
                const msgObj = await db.messages.getById(+id);
                if (["pay", "pay_tariff"].includes(msgObj.action_type)) {
                    await db.phones.update(msgObj.phone, {in_pay: 0});
                }
                writeLog(req, "cancel_pay", db);
                res.json({message: "ok"});
            } catch (error) {
                next(error);
            }
        }
    );
    router.get("/checkNeedPayAccept", async (req, res, next) => {
            try {
                const [isExist] = await db.messages.__filter({
                    filter: {
                        "&action_type": ["pay","pay_tariff"],
                        "~data": {
                            path: "auto",
                            sign: "=",
                            num: "false",
                        },
                        status: 0
                    },
                    options: {limit: 1, onlyLimit: true}
                }).then(({data})=>data);
                res.json({message: "ok", result: !!isExist});
            } catch (error) {
                next(error);
            }
        }
    );
    return router;
};
