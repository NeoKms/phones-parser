const qiwiController = {};
const axios = require("axios");
const HttpError = require("../../helpers/HttpError");
const {getNumberRaw} = require("../../helpers/helper");

const cacheTokenUserId = {};

function getAuth(token) {
    return {
        'Authorization': 'Bearer ' + token
    }
}

qiwiController.accountData = async (token) => {
    return axios.get("https://edge.qiwi.com/person-profile/v1/profile/current", {
        headers: getAuth(token),
    })
        .then(res => {
            cacheTokenUserId[token] = res.data;
        })
        .catch(err => {
            if (err?.response?.status && err.response.status === 401) {
                cacheTokenUserId[token] = -401;
                throw new HttpError("Токен мертв", 200);
            } else {
                throw new Error(err);
            }
        })
}
qiwiController.balance = async (token) => {
    if (!cacheTokenUserId.hasOwnProperty(token)) {
        await qiwiController.accountData(token);
    }
    const account = cacheTokenUserId[token];
    if (account === -401) {
        throw new HttpError("токен мертв", 200);
    }
    return axios.get(`https://edge.qiwi.com/funding-sources/v2/persons/${account.contractInfo.contractId}/accounts`, {
        headers: getAuth(token),
    })
        .then(res => res.data.accounts[0].balance.amount)
        .catch(err => {
            if (err?.response?.status && err.response.status === 401) {
                cacheTokenUserId[token] = -401;
                if (result === -401) {
                    throw new HttpError("токен умер", 200);
                }
            } else {
                throw new Error(err);
            }
        });
}
qiwiController.payToPhoneNumber = async (phone,value, token) => {
    const operatorId = await axios.get(`https://edge.qiwi.com/qw-mobile-providers-resolver/v1/providers?phoneNumber=7${getNumberRaw(phone)}`, {
        headers: getAuth(token),
    })
        .then(res => res.data.mobileOperatorProviderList[0].id);
    return axios.post(`https://edge.qiwi.com/sinap/api/v2/terms/${operatorId}/payments`, {
        "id": Date.now().toString(),
        "sum": {
            "amount": value,
            "currency": "643"
        },
        "paymentMethod": {
            "type": "Account",
            "accountId": "643"
        },
        "fields": {
            "account": getNumberRaw(phone)
        }
    }, {
        headers: getAuth(token),
    })
        .catch(err => {
            if (err?.response?.status && err.response.status === 401) {
                cacheTokenUserId[token] = -401;
                if (result === -401) {
                    throw new HttpError("токен умер", 200);
                }
            } else if (!!err.response && !!err.response?.data) {
                throw new HttpError(err.response.data?.message || "ошибка без текста? обратитесь к админу", 200);
            } else {
                throw new Error(err);
            }
        });
}

module.exports = qiwiController;
