const express = require("express");
const router = express.Router();
const db = require("../../db");
const HttpError = require("../../helpers/HttpError");
const ajvShema = require("../../helpers/validate");
const {writeLog} = require('../../helpers/helper');
const qiwiController = require("../../controllers/qiwi");

module.exports = () => {
    router.get("", async (req, res, next) => {
            try {
                const result = await db.qiwi.__filter({});
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    router.post("", ajvShema("qiwi_create"), async (req, res, next) => {
            try {
                const data = req.body;
                const [isExist] = await db.qiwi.__filter({select:['id'],filter:{token:data.token}})
                    .then(({data})=>data);
                if (isExist) {
                    throw new HttpError("Такой токен уже добавлен",400);
                }
                data.balance = await qiwiController.balance(data.token);
                const result = await db.qiwi.create(data);
                writeLog(req, "create", db);
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    router.get("/:id/activate", async (req, res, next) => {
            try {
                const {id} = req.params;
                if (!+id) {
                    throw new HttpError("Не найдено", 404)
                }
                await db.qiwi.update(+id, {is_active: true});
                writeLog(req, "activate", db);
                res.json({message: "ok"});
            } catch (error) {
                next(error);
            }
        }
    );
    router.get("/:id/deactivate", async (req, res, next) => {
            try {
                const {id} = req.params;
                if (!+id) {
                    throw new HttpError("Не найдено", 404)
                }
                await db.qiwi.update(+id, {is_active: false});
                writeLog(req, "deactivate", db);
                res.json({message: "ok"});
            } catch (error) {
                next(error);
            }
        }
    );
    router.get("/:id", async (req, res, next) => {
            try {
                const {id} = req.params;
                if (!+id) {
                    throw new HttpError("Не найдено", 404)
                }
                const result = await db.qiwi.getById(+id);
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    router.patch("/:id", ajvShema("qiwi_update"), async (req, res, next) => {
            try {
                const {id} = req.params;
                if (!+id) {
                    throw new HttpError("Не найдено", 404)
                }
                const data = req.body;
                const result = await db.qiwi.update(+id, data);
                writeLog(req, "update", db);
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    return router;
};
