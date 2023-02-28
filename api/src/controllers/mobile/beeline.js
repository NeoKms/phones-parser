const axios = require("axios");
const {getNumberRaw, checkPassword, getCookieFromRes, cookieObjectToString} = require("../../helpers/helper");
const redis = require('../../helpers/redis');
const qs = require("qs");
const logger = require("../../helpers/logger");
const cheerio = require("cheerio");

const beeline = {};

const axiosErrorCallback = (err) => {
    const url = err?.response?.config?.url ? err?.response?.config?.url : '';
    if (err?.response?.data?.message) {
        throw new Error(`[${url}] ${err?.response?.data?.message}`);
    } else {
        throw new Error(`[${url}] ${err.message}`);
    }
};
const getHeaders = (cookieObj) => ({
    cookie: cookieObjectToString(cookieObj),
    "upgrade-insecure-requests": 1,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
});
const getRedirectConfig = (cookieObj) => {
    return {
        maxRedirects: 0,
        headers: getHeaders(cookieObj),
    }
};
beeline.loginAndGetCookie = async ({phone, current_password}, reinit = false) => {
    if (!phone || !current_password) throw new Error("нет данных для аутентификации");
    const rawPhone = getNumberRaw(phone);
    const cookieKey = rawPhone + "_cookie";
    let cookieString = await redis.get(cookieKey);
    if (reinit || !cookieString) {
        let cookieObj = {};
        const modelData = await axios.get(`https://spb.beeline.ru/menu/loginmodel/?CTN=${rawPhone}`, {headers: getHeaders(cookieObj)})
            .then(res => {
                cookieObj = Object.assign(cookieObj, getCookieFromRes(res, true));
                return res.data;
            });
        const redirectCallback = (err) => {
            if (err.response.status === 302) {
                // console.log('is redirect to ', err.response.headers.location)
                if (err.response.headers.hasOwnProperty('set-cookie')) {
                    err.response.headers['set-cookie'].map(row => {
                        const splitted = row.split(";")[0];
                        const [key, value] = splitted.split("=");
                        cookieObj[key] = value;
                    })
                }
                return axios.get(
                    err.response.headers.location,
                    getRedirectConfig(cookieObj)
                )
            } else {
                throw err;
            }
        };
        const tokenHtml = await axios.post(
            "https://identity.beeline.ru/identity/fpcc",
            qs.stringify({
                login: rawPhone,
                password: current_password,
                client_id: modelData.clientId,
                redirect_uri: modelData.returnUrl,
                response_type: "id_token",
                response_mode: "form_post",
                state: modelData.state,
                scope: modelData.requestScope,
                nonce: modelData.nonce,
                remember_me: true
            }),
            getRedirectConfig(cookieObj)
        )
            //редирект на https://identity.beeline.ru/identity/connect
            .catch(redirectCallback)
            //редирект на https://identity.beeline.ru/identity/login
            .catch(redirectCallback)
            //редирект на https://identity.beeline.ru/identity/resumeauth
            .catch(redirectCallback)
            //редирект на https://identity.beeline.ru/identity/return
            .catch(redirectCallback)
            //редирект на https://identity.beeline.ru/identity/connect/authorize
            .catch(redirectCallback)
            .then(res => res.data.toString());
        const $ = await cheerio.load(tokenHtml);
        const tokenObj = {
            id_token: $("input[name='id_token']").attr('value'),
            scope: $("input[name='scope']").attr('value'),
            state: $("input[name='state']").attr('value'),
            session_state: $("input[name='session_state']").attr('value'),
        }
        if (!tokenObj.id_token) {
            throw new Error("неправильный пароль или были изменения в системе авторизации билайна")
        }
        // todo возможно необязательные
        await axios.get(`https://identity.beeline.ru/identity/FinishAuth?state=${modelData.state}`, {headers: getHeaders(cookieObj)})
            .then(res => {
                cookieObj = Object.assign(cookieObj, getCookieFromRes(res, true));
            })
            .catch(err=>err);
        await axios.post(modelData.returnUrl, qs.stringify(tokenObj), {headers: getHeaders(cookieObj)}).catch(err=>err);;
        // todo End
        cookieString = `BISAuthTokenCookie=${tokenObj.id_token}; is-sso-session-established=1;`;
        await redis.set(cookieKey, cookieString, 3600 * 20);
    }
    return cookieString;
};

beeline.getProfile = async (cookie) => {
    if (!cookie) throw new Error("не переданы куки");
    return axios.get("https://spb.beeline.ru/api/profile/settings/abonentform/", {headers: {cookie}})
        .then(res => res.data)
        .catch(axiosErrorCallback);
};

beeline.getBalance = async (cookie) => {
    if (!cookie) throw new Error("не переданы куки");
    return axios.get("https://beeline.ru/api/uni-profile-balances/", {headers: {cookie}})
        .then(res => res.data[0])
        .catch(axiosErrorCallback);
};

beeline.getGB = async (cookie) => {
    if (!cookie) throw new Error("не переданы куки");
    return axios.get("https://spb.beeline.ru/api/uni-profile-mobile/blocks/", {headers: {cookie}})
        .then(res => res.data)
        .catch(axiosErrorCallback);
};

beeline.getTariff = async (cookie) => {
    if (!cookie) throw new Error("не переданы куки");
    return axios.get("https://spb.beeline.ru/api/uni-profile-mobile/tariff-fee/", {headers: {cookie}})
        .then(res => res.data)
        .catch(axiosErrorCallback);
};

beeline.parseAllData = async ({phone, current_password}, errorWas = false) => {
    const cookieString = await beeline.loginAndGetCookie({phone, current_password}, errorWas);
    try {
        const balance = await beeline.getBalance(cookieString);
        const profile = await beeline.getProfile(cookieString);
        const tariff = await beeline.getTariff(cookieString);
        const GB = await beeline.getGB(cookieString);
        return {profile, balance, tariff, GB};
    } catch (err) {
        if (!errorWas && err.message.indexOf("status code 401")!==-1) {
            return beeline.parseAllData({phone, current_password}, true);
        } else {
            throw err;
        }
    }
};

beeline.changePassword = async ({phone, current_password}, newPass, errorWas = false) => {
    if (current_password === newPass) throw new Error("пароли одинаковые");
    checkPassword(newPass);
    const cookieString = await beeline.loginAndGetCookie({phone, current_password}, errorWas);
    try {
        await axios.post(
            "https://spb.beeline.ru/api/profile/settings/changepassword/",
            {
                "newPassword": newPass,
                "oldPassword": current_password,
                "isConvergent": false
            },
            {
                headers: {
                    cookie: cookieString,
                }
            })
            .catch(axiosErrorCallback);
    } catch (err) {
        if (!errorWas && err.message.indexOf("status code 401")!==-1) {
            return beeline.changePassword({phone, current_password}, newPass, true);
        } else {
            throw err;
        }
    }
};

module.exports = beeline;
