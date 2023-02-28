const axios = require("axios");
const {getNumberRaw, checkPassword} = require("../../helpers/helper");
const redis = require('../../helpers/redis');
const qs = require("qs");
const RuCaptchaClient = require("../../helpers/rucaptcha");
const logger = require("../../helpers/logger");

const megafon = {};

const axiosErrorCallback = (err) => {
    const url = err?.response?.config?.url ? err?.response?.config?.url : '';
    if (err?.response?.data?.message) {
        throw new Error(`[${url}] ${err?.response?.data?.message}`);
    } else {
        throw new Error(`[${url}] ${err.message}`);
    }
};
const getHeaders = (cookieString) => ({
    'X-Cabinet-Capabilities': "web-2020",
    cookie: cookieString,
});
const downloadCaptchaToBuffer = async (cookie) => {
    let file = {
        data: [],
        mimetype: "",
        size: 0,
    };
    return axios({
        url: "https://lk.megafon.ru/api/captcha/next",
        responseType: "stream",
        headers: getHeaders(cookie),
    }).then((response) => {
        file.mimetype = response.headers["content-type"];
        file.size = parseInt(response.headers["content-length"]);
        return new Promise((resolve, reject) => {
            response.data.on("data", function (chunk) {
                file.data.push(chunk);
            });
            response.data.on("error", (e) => reject(e));
            response.data.on("end", () => {
                file.data = Buffer.concat(file.data);
                resolve(file);
            });
        });
    });
}
const decodeCaptcha = async (cookie) => {
    const captchaImage = await downloadCaptchaToBuffer(cookie);
    return RuCaptchaClient.decode({
        buffer: captchaImage.data,
    }).then(response => response.text).catch(err => "");
}

megafon.getCookieString = async ({phone, current_password}, captcha = null, reinit = false) => {
    if (!phone || !current_password) throw new Error("нет данных для аутентификации");
    const rawNumberWith7 = "7" + getNumberRaw(phone);
    const cookieKey = rawNumberWith7 + "_cookie";
    let cookieString = await redis.get(cookieKey);
    if (reinit || !cookieString) {
        let qsData = qs.stringify({
            login: rawNumberWith7,
            password: current_password,
        });
        if (captcha) {
            qsData = qs.stringify({
                login: rawNumberWith7,
                password: current_password,
                captcha,
            });
        }
        cookieString = await axios.post(
            "https://lk.megafon.ru/api/login",
            qsData,
            {headers: getHeaders("")})
            .then(res => res.headers['set-cookie'].reduce((acc, c) => {
                    const splitted = c.split("=");
                    acc += `${splitted[0].trim()}=${splitted[1].split(";")[0].trim()}; `;
                    return acc;
                }, "")
            )
            .catch((err) => {
                if (err?.response?.data?.message.indexOf("код с картинки") !== -1) {
                    let cookie = "";
                    if (err?.response?.headers['set-cookie'] && err.response.headers['set-cookie'].length) {
                        cookie = err.response.headers['set-cookie'].reduce((acc, c) => {
                            const splitted = c.split("=");
                            acc += `${splitted[0].trim()}=${splitted[1].split(";")[0].trim()}; `;
                            return acc;
                        }, "");
                    }
                    return decodeCaptcha(cookie)
                        .then(text => megafon.getCookieString({phone, current_password}, text));
                } else {
                    throw err;
                }
            })
            .catch(axiosErrorCallback);
        await redis.set(cookieKey, cookieString, 3600 * 20)
    }
    return cookieString;
};
megafon.getInfo = async (cookieString) => {
    if (!cookieString) throw new Error("не переданы куки");
    return axios.get(
        "https://lk.megafon.ru/api/profile/info",
        {headers: getHeaders(cookieString)})
        .then(res => res.data)
        .catch(axiosErrorCallback);
};
megafon.getBalance = async (cookieString) => {
    if (!cookieString) throw new Error("не переданы куки");
    return axios.get(
        "https://lk.megafon.ru/api/main/balance",
        {headers: getHeaders(cookieString)})
        .then(res => res.data)
        .catch(axiosErrorCallback);
};
megafon.getGB = async (cookieString) => {
    if (!cookieString) throw new Error("не переданы куки");
    return axios.get(
        "https://lk.megafon.ru/api/options/v2/remainders/mini",
        {headers: getHeaders(cookieString)})
        .then(res => res.data.remainders)
        .catch(axiosErrorCallback);
};
megafon.getTariff = async (cookieString) => {
    if (!cookieString) throw new Error("не переданы куки");
    return axios.get(
        "https://lk.megafon.ru/api/tariff/2019-3/current",
        {headers: getHeaders(cookieString)})
        .then(res => {
            delete res.data.info.params;
            delete res.data.info.sections;
            delete res.data.info.features;
            delete res.data.info.secondParameters;
            return res.data;
        })
        .catch(axiosErrorCallback);
};
megafon.changePassword = async ({phone, current_password}, newPass, errorWas = false) => {
    if (current_password === newPass) throw new Error("пароли одинаковые");
    checkPassword(newPass);
    const cookieString = await megafon.getCookieString({phone, current_password}, null, errorWas);
    const CSRF_TOKEN = cookieString.split(";").find(el => el.indexOf("CSRF-TOKEN")!==-1).trim();
    try {
        await axios.post(
            "https://lk.megafon.ru/api/profile/password",
            qs.stringify({
                currentPassword: current_password,
                newPassword: newPass,
            }),
            {
                headers: {
                    ...getHeaders(cookieString),
                    'X-CSRF-TOKEN': CSRF_TOKEN.split("=")[1],
                }
            })
            .catch(axiosErrorCallback);
    } catch (err) {
        if (!errorWas && err.message.indexOf("Неавторизованный доступ")!==-1) {
            return megafon.changePassword({phone, current_password}, newPass, true);
        } else {
            throw err;
        }
    }
};
megafon.parseAllData = async ({phone, current_password}, errorWas = false) => {
    const cookieString = await megafon.getCookieString({phone, current_password}, null, errorWas);
    try {
        const balance = await megafon.getBalance(cookieString);
        const profile = await megafon.getInfo(cookieString);
        const tariff = await megafon.getTariff(cookieString);
        const GB = await megafon.getGB(cookieString);
        return {profile, balance, tariff, GB};
    } catch (err) {
        if (!errorWas && err.message.indexOf("Неавторизованный доступ")!==-1) {
            return megafon.parseAllData({phone, current_password}, true);
        } else {
            throw err;
        }
    }
}

module.exports = megafon;
