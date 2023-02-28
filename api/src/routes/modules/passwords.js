const express = require("express");
const router = express.Router();
const db = require("../../db");
const HttpError = require("../../helpers/HttpError");
const ajvShema = require("../../helpers/validate");
const {writeLog} = require('../../helpers/helper');

module.exports = () => {
    router.get("", async (req, res, next) => {
            try {
                const result = await db.passwords.__filter({});
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    router.post("", ajvShema("passwords_create"), async (req, res, next) => {
            try {
                const data = req.body;
                const result = await db.passwords.create(data);
                writeLog(req, "create", db);
                res.json({message: "ok", result});
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
                const result = await db.passwords.getById(+id);
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    router.patch("/:id", ajvShema("passwords_update"), async (req, res, next) => {
            try {
                const {id} = req.params;
                if (!+id) {
                    throw new HttpError("Не найдено", 404)
                }
                const data = req.body;
                const result = await db.passwords.update(+id, data);
                writeLog(req, "update", db);
                res.json({message: "ok", result});
            } catch (error) {
                next(error);
            }
        }
    );
    return router;
};
