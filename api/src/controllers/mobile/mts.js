const axios = require("axios");
const {getNumberRaw, checkPassword} = require("../../helpers/helper");
const redis = require('../../helpers/redis');
const {launchBrowser, getPage, getCookies, closeBrowser} = require("../../helpers/puppeteer");

const mts = {};

const axiosErrorCallback = (err) => {
    const url = err?.response?.config?.url ? err?.response?.config?.url : '';
    if (err?.response?.data?.message) {
        throw new Error(`[${url}] ${err?.response?.data?.message}`);
    } else if (err?.response?.data?.errorMessage) {
        throw new Error(`[${url}] ${err?.response?.data?.errorMessage}`);
    } else {
        throw new Error(`[${url}] ${err.message}`);
    }
};
const getAuthAndCookie = async ({phone, current_password}, reinit = false) => {
    const rawNumberWith7 = "7" + getNumberRaw(phone);
    const cookieKey = rawNumberWith7 + '_cookie';
    let cookiesArray = await redis.get(cookieKey);
    if (reinit || !cookiesArray || !cookiesArray.length) {
        let browser = await launchBrowser();
        let bodyHTML = "";
        try {
            let page = await getPage(browser);
            await page.goto(`https://login.mts.ru/amserver/UI/Login`);
            await page.waitForNavigation({timeout: 5000}).catch(err => err);
            await page.mainFrame().waitForSelector("input[name='login']")
                .then(element => element.type(rawNumberWith7, {delay: 50}));
            await page.waitForTimeout(500);
            await page.mainFrame().waitForSelector("#submit")
                .then(() => page.$$("#submit"))
                .then(buttons => buttons[1].click());
            await page.waitForNavigation({timeout: 10000}).catch(err => err);
            await page.waitForTimeout(5000);
            bodyHTML = await page.evaluate(() => document.body.innerHTML).catch(()=>"");
            if (bodyHTML.indexOf("неверный номер") !== -1) {
                throw new Error("Неверный номер телефона")
            }
            await page.mainFrame().waitForSelector("#password")
                .then(element => element.click({clickCount: 3}));
            await page.mainFrame().waitForSelector("#password")
                .then(element => element.type(current_password, {delay: 50}));
            await page.waitForTimeout(500);
            await page.mainFrame().waitForSelector("#submit")
                .then(() => page.$$("#submit"))
                .then(buttons => buttons[1].click());
            await page.waitForNavigation({timeout: 10000}).catch(err => err);
            await page.waitForTimeout(5000);
            bodyHTML = await page.evaluate(() => document.body.innerHTML).catch(()=>"");
            if (bodyHTML.indexOf("Неверный пароль") !== -1) {
                throw new Error("Неверный пароль")
            }
            await page.waitForTimeout(1000);
            await page.goto(`https://lk.mts.ru/`);
            await page.waitForNavigation({timeout: 10000}).catch(err => err);
            await page.waitForTimeout(1000);
            cookiesArray = await getCookies(page, ["https://login.mts.ru/", "https://lk.mts.ru/", "https://mts.ru/", "https://profile.mts.ru/"]);

            await page.goto(`https://profile.mts.ru/account/safety/set-password`);
            await page.waitForNavigation({timeout: 10000}).catch(err => err);
            await page.waitForTimeout(1000);
            let cookiesArray2 = await getCookies(page, ["https://profile.mts.ru/"]);

            cookiesArray = cookiesArray.concat(cookiesArray2);

            await redis.set(cookieKey, cookiesArray, 3600 * 20);
        } catch (err) {
            throw new Error("возможно неверный пароль или изменения в системе авторизации мтс. подробная ошибка: " + err.message);
        } finally {
            await closeBrowser(browser)
        }
    }
    return cookiesArray;
}
const getHeaders = (phone, cookieString) => ({
    'cookie': cookieString,
    'X-Login': "7" + getNumberRaw(phone),
    'X-Requested-With': 'XMLHttpRequest',
});
const longTaskRequest = async (hash, uri, headers) => {
    return axios.get(`https://lk.mts.ru/api/longtask/check/${hash}?for=${uri}`, {headers})
        .then(res => {
            if (res.status === 204) {
                return longTaskRequest(hash, uri, headers);
            }
            return res.data;
        })
        .catch(axiosErrorCallback);
};

mts.getProfile = async (phone, cookieString) => {
    if (!cookieString) throw new Error("не переданы куки");
    if (!phone) throw new Error("не передан телефон (phone)");
    return axios.get("https://lk.mts.ru/api/login/profile", {headers: getHeaders(phone, cookieString)})
        .then(res => {
            delete res.data.account.services;
            return res.data;
        })
        .catch(axiosErrorCallback);
};

mts.getBalance = async (phone, cookieString) => {
    if (!cookieString) throw new Error("не переданы куки");
    if (!phone) throw new Error("не передан телефон (phone)");
    return axios.get("https://lk.mts.ru/api/accountInfo/mscpBalance", {headers: getHeaders(phone, cookieString)})
        .then(res => res.data)
        .then(balanceHash => longTaskRequest(balanceHash, "api/accountInfo/mscpBalance", getHeaders(phone, cookieString)))
        .catch(axiosErrorCallback);
};
mts.getTariff = async (phone, cookieString) => {
    if (!cookieString) throw new Error("не переданы куки");
    if (!phone) throw new Error("не передан телефон (phone)");
    return axios.get("https://lk.mts.ru/api/tariff/summary?overwriteCache=false", {headers: getHeaders(phone, cookieString)})
        .then(res => res.data)
        .then(balanceHash => longTaskRequest(balanceHash, "api/tariff/summary", getHeaders(phone, cookieString)))
        .then(data => data.data.current)
        .catch(axiosErrorCallback);
};
mts.getGB = async (phone, cookieString) => {
    if (!cookieString) throw new Error("не переданы куки");
    if (!phone) throw new Error("не передан телефон (phone)");
    return axios.get("https://lk.mts.ru/api/sharing/counters?overwriteCache=false", {headers: getHeaders(phone, cookieString)})
        .then(res => res.data)
        .then(balanceHash => longTaskRequest(balanceHash, "api/sharing/counters", getHeaders(phone, cookieString)))
        .then(data => data.data.counters)
        .catch(axiosErrorCallback);
};
mts.parseAllData = async ({phone, current_password}, errorWas = false) => {
    const cookiesArray = await getAuthAndCookie({phone, current_password}, errorWas);
    const cookiesArrUnique = cookiesArray.reduce((acc,el)=>{
        acc[el.name] = el;
       return acc;
    },{})
    const cookieString = Object.values(cookiesArrUnique).reduce((acc, el) => acc += `${el.name}=${el.value}; `, "");
    try {
        const profile = await mts.getProfile(phone, cookieString);
        const balance = await mts.getBalance(phone, cookieString);
        const tariff = await mts.getTariff(phone, cookieString);
        const GB = await mts.getGB(phone, cookieString);
        return {profile, balance, tariff, GB};
    } catch (err) {
        if (!errorWas && (err.message.indexOf("status code 401") !== -1 || err.message.indexOf("status code 431") !== -1)) {
            return mts.parseAllData({phone, current_password}, true);
        } else {
            throw err;
        }
    }
};

mts.changePasswordRequest = async ({phone, current_password}, newPass, errorWas = false) => {
    if (current_password === newPass) throw new Error("пароли одинаковые");
    checkPassword(newPass);
    const cookiesArray = await getAuthAndCookie({phone, current_password}, errorWas);
    const cookieAuth = cookiesArray.find(el => el.name === "Auth");
    let cookieString = cookiesArray.reduce((acc, el) => acc += `${el.name}=${el.value}; `, "");
    cookieString = `Auth=${cookieAuth.value};` + cookieString;
    try {
        await axios.post("https://profile.mts.ru/api", {
            "call": "verifyPassword",
            "arg": {
                "oldPassword": current_password
            }
        }, {
            headers: {
                cookie: cookieString,
                Host: "profile.mts.ru",
                Origin: "https://profile.mts.ru",
                Referer: "https://profile.mts.ru/account/safety/set-password",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
            }
        })
            .catch(axiosErrorCallback);
        const {requestId} = await axios.post("https://profile.mts.ru/api", {
            "call": "setNewPassword",
            "arg": {
                "oldPassword": current_password,
                "newPassword": newPass,
            }
        }, {
            headers: {
                cookie: cookieString,
                Host: "profile.mts.ru",
                Origin: "https://profile.mts.ru",
                Referer: "https://profile.mts.ru/account/safety/set-password",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
            }
        })
            .then(res => res.data)
            .catch(axiosErrorCallback);
        return requestId;
    } catch (err) {
        if (!errorWas && err.message.indexOf("status code 401") !== -1) {
            return mts.changePasswordRequest({phone, current_password}, newPass, true);
        } else {
            throw err;
        }
    }
};
mts.changePasswordConfirm = async ({phone, current_password}, {code, requestId}, errorWas = false) => {
    const cookiesArray = await getAuthAndCookie({phone, current_password}, errorWas);
    const cookieAuth = cookiesArray.find(el => el.name === "Auth");
    let cookieString = cookiesArray.reduce((acc, el) => acc += `${el.name}=${el.value}; `, "");
    cookieString = `Auth=${cookieAuth.value};` + cookieString;
    try {
        await axios.post("https://profile.mts.ru/api", {
            "call": "confirmPassword",
            "arg": {
                code,
                requestId,
            }
        }, {
            headers: {
                cookie: cookieString,
                Host: "profile.mts.ru",
                Origin: "https://profile.mts.ru",
                Referer: "https://profile.mts.ru/account/safety/set-password",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
            }
        })
            .then(res => res.data)
            .catch(axiosErrorCallback);
    } catch (err) {
        if (!errorWas && err.message.indexOf("status code 401") !== -1) {
            return mts.changePasswordConfirm({phone, current_password}, {code, requestId}, true);
        } else {
            throw err;
        }
    }
};

module.exports = mts;
