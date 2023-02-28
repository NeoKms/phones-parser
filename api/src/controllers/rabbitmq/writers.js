const config = require('../../config/index');
const rabbitmq = require('./module');

const toTele2 = rabbitmq.createWriter(config.RABBIT.QUERIES.tele2);
const toMts = rabbitmq.createWriter(config.RABBIT.QUERIES.mts);
const toMegafon = rabbitmq.createWriter(config.RABBIT.QUERIES.megafon);
const toBeeline = rabbitmq.createWriter(config.RABBIT.QUERIES.beeline);
const toQiwi = rabbitmq.createWriter(config.RABBIT.QUERIES.qiwi);

module.exports = {
    toTele2,
    toMts,
    toMegafon,
    toBeeline,
    toQiwi
};
