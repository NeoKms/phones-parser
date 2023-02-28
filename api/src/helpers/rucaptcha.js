const {RUCAPTCHA_API} = require("../config");

const Client = require('@infosimples/node_two_captcha');

RuCaptchaClient = new Client(RUCAPTCHA_API, {
    timeout: 60000,
    polling: 5000,
    throwErrors: false
});

module.exports = RuCaptchaClient;
