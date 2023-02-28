const {readdirSync, statSync} = require('fs');
const {exec} = require("child_process");
const helper = {};

helper.getFiles = (dir, files_) => {
    files_ = files_ || {};
    const files = readdirSync(dir);
    for (let i in files) {
        let name = dir + '/' + files[i];
        if (!statSync(name).isDirectory()) {
            let fileName = name.split('/');
            fileName = fileName[fileName.length - 1].replace('.js', '');
            files_[fileName] = name.replace('.js', '');
        }
    }
    return files_;
};
helper.sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
helper.getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
};
helper.getRoundTimestamp = (delta) => {
    delta = delta || 5;
    let datestamp = new Date();
    let stampminutes = datestamp.getMinutes();
    stampminutes = stampminutes - stampminutes % delta;
    datestamp.setMinutes(stampminutes);
    datestamp.setSeconds(0);
    datestamp.setMilliseconds(0);
    return parseInt(datestamp / 1000);
};
helper.getNumberRaw = (phone) => {
    return phone.replace(/[^\d.-]+/g, '').replace(/^[7]/gi, '').replace(/^[8]/gi, '');
};
helper.getTimestampNow = () => Math.round(new Date().getTime() / 1000);
helper.execPromise = async (cmd) => {
    return new Promise(function (resolve, reject) {
        exec(cmd, function (err, stdout) {
            if (err) return reject(err);
            resolve(stdout);
        });
    });
};
helper.checkPassword = (pass) => {
    if (!pass) {
        throw new Error("пароль не передан");
    }
    if (pass.length < 8) {
        throw new Error("в пароле меньше 8 знаков");
    }
    if (pass.match(/\s/gi)) {
        throw new Error("в пароле есть пробелы");
    }
    if (!pass.match(/\d/g)?.length) {
        throw new Error("в пароле нет цифры");
    }
    if (!pass.match(/[A-ZА-ЯЁ]/g)?.length) {
        throw new Error("в пароле нет заглавной буквы");
    }
    if (!pass.match(/[a-zа-яё]/g)?.length) {
        throw new Error("в пароле нет строчной буквы");
    }
    return true;
};
helper.getCookieFromRes = (res, asObject = false) => {
    const cookie = asObject ? {} : "";
    if (res?.headers && res.headers.hasOwnProperty('set-cookie')) {
        res.headers['set-cookie'].reduce((acc, c) => {
            const splitted = c.split("=");
            if (asObject) {
                acc[splitted[0].trim()] = splitted[1].split(";")[0].trim()
            } else {
                acc += `${splitted[0].trim()}=${splitted[1].split(";")[0].trim()}; `;
            }
            return acc;
        }, cookie)
    }
    return cookie;
};
helper.cookieObjectToString = (cookieObj) => Object.entries(cookieObj).reduce((acc, [key, value]) => acc += `${key}=${value}; `, "");
helper.getReqData = (req) => {
    let route = req.originalUrl;
    return {route};
};
helper.writeLog = async (req, action_type, db, extBody = false, ...other) =>
    db.logs
        .insert(
            {
                route: req.originalUrl,
                data: Object.assign(req.params, extBody ? extBody : req.body, ...other),
                action_type,
            }
        )
        .catch(() => {});
module.exports = helper;
