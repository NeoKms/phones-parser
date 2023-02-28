const {getTimestampNow, getNumberRaw, checkPassword} = require("../../helpers/helper");
const axios = require("axios");
const qs = require("qs");
const redis = require('../../helpers/redis');
const tele2 = {};


const axiosErrorCallback = (err) => {
    const url = err?.response?.config?.url ? err?.response?.config?.url : '';
    throw new Error(`[${url}] ${err.message}`);
};

tele2.getAuthHeader = async (phone, current_password, reinit = false) => {
    if (!phone || !current_password) throw new Error("нет данных для аутентификации");
    const rawNumberWith7 = "7" + getNumberRaw(phone);
    const cacheKey = rawNumberWith7 + '_bearer';
    let bearerToken = await redis.get(cacheKey);
    if (reinit || !bearerToken) {
        const firstCookies = await axios.post("https://spb.tele2.ru/ad4e4aae845022f3a530c0b9367c48fb")
            .then(res => res.headers['set-cookie'].reduce((acc, c) => {
                    const splitted = c.split("=");
                    acc[splitted[0].trim()] = splitted[1].split(";")[0].trim();
                    return acc;
                }, {})
            );
        const bearerObj = await axios.post(
            "https://spb.tele2.ru/auth/realms/tele2-b2c/protocol/openid-connect/token",
            qs.stringify({
                client_id: 'digital-suite-web-app',
                grant_type: "password",
                username: rawNumberWith7,
                password: current_password,
                password_type: "password"
            }),
            {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'cookie': `${firstCookies['csrf-token-name']}=${firstCookies['csrf-token-value']}`
                }
            }
        )
            .then(req => req.data)
            .then(tokenData => ({
                access_token: tokenData.access_token,
                expires_in: tokenData.expires_in,
                expires_time: getTimestampNow() + tokenData.expires_in,
            }))
            .catch(err => {
                if (err?.response?.data?.error_description) {
                    throw new Error(err?.response?.data?.error_description);
                } else {
                    throw err;
                }
            })
        bearerToken = `Bearer ${bearerObj.access_token}`;
        await redis.set(cacheKey, bearerToken, 3600 * 20);
    }
    return {'Authorization': bearerToken};
};
tele2.getBalance = async (phone, headers) => {
    if (!headers.Authorization) throw new Error("tele2.getBalance не передан заголовок авторизации");
    return axios.get(`https://spb.tele2.ru/api/subscribers/7${getNumberRaw(phone)}/balance`, {headers})
        .then(res => res.data)
        .then(res => {
            if (res?.meta?.status === "OK") {
                return res.data;
            } else if (res?.meta?.status === "ERROR") {
                throw new Error(res.meta.message);
            } else {
                throw new Error("ошибка " + JSON.stringify(res))
            }
        })
        .catch(axiosErrorCallback);
};
tele2.getProfile = async (phone, headers) => {
    if (!headers.Authorization) throw new Error("tele2.getProfile не передан заголовок авторизации");
    return axios.get(`https://spb.tele2.ru/api/subscribers/7${getNumberRaw(phone)}/profile`, {headers})
        .then(res => res.data)
        .then(res => {
            if (res?.meta?.status === "OK") {
                return res.data;
            } else if (res?.meta?.status === "ERROR") {
                throw new Error(res.meta.message);
            } else {
                throw new Error("ошибка " + JSON.stringify(res))
            }
        })
        .catch(axiosErrorCallback);
};
tele2.getTariff = async (phone, headers, siteId = "siteSPB") => {
    if (!headers.Authorization) throw new Error("tele2.getTariff не передан заголовок авторизации");
    return axios.get(`https://spb.tele2.ru/api/subscribers/7${getNumberRaw(phone)}/${siteId}/rests`, {headers})
        .then(res => res.data)
        .then(res => {
            if (res?.meta?.status === "OK") {
                delete res.data.unlimitedRolloverHistoryTexts;
                delete res.data.rests;
                return res.data;
            } else if (res?.meta?.status === "ERROR") {
                throw new Error(res.meta.message);
            } else {
                throw new Error("ошибка " + JSON.stringify(res))
            }
        })
        .catch(axiosErrorCallback);
};
tele2.getTariffRealCost = async (phone, headers) => {
    if (!headers.Authorization) throw new Error("tele2.getTariff не передан заголовок авторизации");
    return axios.get(`https://spb.tele2.ru/api/subscribers/7${getNumberRaw(phone)}/tariff?extended=true`, {headers})
        .then(res => res.data)
        .then(res => {
            if (res?.meta?.status === "OK") {
                return res.data.currentAbonentFee;
            } else if (res?.meta?.status === "ERROR") {
                throw new Error(res.meta.message);
            } else {
                throw new Error("ошибка " + JSON.stringify(res))
            }
        })
        .catch(axiosErrorCallback);
};
tele2.parseAllData = async ({phone, current_password}, errorWas = false) => {
    const headers = await tele2.getAuthHeader(phone, current_password, errorWas);
    try {
        const profile = await tele2.getProfile(phone, headers);
        const balance = await tele2.getBalance(phone, headers);
        const tariff = await tele2.getTariff(phone, headers, profile.siteId);
        const realCost = await tele2.getTariffRealCost(phone, headers);
        tariff.currentAbonentFee = realCost;
        return {profile, balance, tariff, GB: tariff.tariffPackages ?? {}};
    } catch (err) {
        if (!errorWas && (err.message.indexOf("status code 403") !== -1 || err.message.indexOf("status code 401") !== -1)) {
            return tele2.parseAllData({phone, current_password}, true);
        } else {
            throw err;
        }
    }
};
tele2.changePassword = async ({phone, current_password}, newPass, errorWas = false) => {
    if (current_password === newPass) throw new Error("пароли одинаковые");
    checkPassword(newPass);
    const headers = await tele2.getAuthHeader(phone, current_password, errorWas);
    try {
        await axios.post("https://spb.tele2.ru/auth/realms/tele2-b2c/account/credentials/password",
            {currentPassword: current_password, newPassword: newPass, confirmation: newPass}, {headers}
        )
            .catch(err => {
                if (err?.response?.data?.error_description) {
                    throw new Error(err?.response?.data?.error_description);
                } else {
                    throw err;
                }
            })
            .catch(axiosErrorCallback)
    } catch (err) {
        if (!errorWas && err.message.indexOf("with status code 401") !== -1) {
            return tele2.changePassword({phone, current_password}, newPass, true);
        } else {
            throw err;
        }
    }
};

module.exports = tele2;
