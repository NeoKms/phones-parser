const express = require("express");
const router = express.Router();
const db = require("../db");
const ajvShema = require("../helpers/validate");
const excelController = require("../controllers/excel");
const {writeLog} = require("../helpers/helper");

module.exports = (app) => {
    router.options("/upload/*", (_, res) => {
        res.sendStatus(200);
    });

    require("fs")
        .readdirSync("./src/routes/modules")
        .map((module) => {
            app.use(
                `/${module.replace(".js", "")}`,
                require(`./modules/${module}`)(app)
            );
        });

    router.get("/checkInitSystem", async (req, res, next) => {
        try {
            const [pass] = await db.passwords.__filter({
                select: ["id"],
                filter: {value: "7777"}
            }).then(({data}) => data);
            const isInitPasswords = !pass;
            const [phone] = await db.phones.__filter({
                select: ["id"],
                options: {onlyLimit: true, limit: 1}
            }).then(({data}) => data);
            const isInitPhones = !!phone;
            const [qiwi] = await db.qiwi.__filter({
                select: ["id"],
                options: {onlyLimit: true, limit: 1}
            }).then(({data}) => data);
            const working = await db.appConfig.working();
            const isInitQiwi = !!qiwi;
            res.json({message: "ok", result: {isInitPasswords, isInitPhones, isInitQiwi, working}});
        } catch (error) {
            next(error);
        }
    });

    router.post("/parseExcel",  ajvShema("parse_excel_phones"),async (req, res, next) => {
        try {
            const {file} = req.files;
            const {insert} = req.body;
            const phonesArr = await excelController.parsePhonesFromExcel(file.data);
            const result = await db.phones.__checkExcelPhones(phonesArr, +insert);
            res.json({message: "ok", result});
        } catch (error) {
            next(error);
        }
    });

    router.get("/start",async (req, res, next) => {
        try {
            await db.appConfig.updateByKey("working", "1");
            writeLog(req, "start", db);
            res.json({message: "ok"});
        } catch (error) {
            next(error);
        }
    });

    router.get("/stop",async (req, res, next) => {
        try {
            await db.appConfig.updateByKey("working", "0");
            writeLog(req, "stop", db);
            res.json({message: "ok"});
        } catch (error) {
            next(error);
        }
    });

    router.get("/excel",async (req, res, next) => {
        try {
            let {excelObject,name} = await excelController.generatePhonesExcel();
            excelObject.write(name, res);
        } catch (error) {
            next(error);
        }
    });

    app.use(router);
};
