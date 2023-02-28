const config = require('../../config/index');
const rabbitmq = require('./module');

const readerFromTele2 = (func) => rabbitmq.createReader(config.RABBIT.QUERIES.tele2, func);
const readerFromMts = (func) => rabbitmq.createReader(config.RABBIT.QUERIES.mts, func);
const readerFromMegafon = (func) => rabbitmq.createReader(config.RABBIT.QUERIES.megafon, func);
const readerFromBeeline = (func) => rabbitmq.createReader(config.RABBIT.QUERIES.beeline, func);
const readerFromQiwi = (func) => rabbitmq.createReader(config.RABBIT.QUERIES.qiwi, func);

module.exports = {
    readerFromTele2,
    readerFromMts,
    readerFromMegafon,
    readerFromBeeline,
    readerFromQiwi
};
