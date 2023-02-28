const amqp = require('amqp-connection-manager');
const {RABBIT} = require('../../config');
const logger = require('../../helpers/logger');
const connection = amqp.connect([RABBIT.URL]);

connection.on('connect', () => logger.info('RabbitMQ подключился!'));
connection.on('disconnect', err => logger.error(err,'RabbitMQ отключился'));

function createWriter(name) {
    const writer = connection.createChannel({
        json: true,
        setup(channel) {
            return channel.assertQueue(name, {durable: true});
        },
    });
    return async function (msg) {
        try {
            writer.sendToQueue(name, msg);
        } catch (error) {
            logger.error(error,`[${name}]: ошибка отправки сообщения ${JSON.stringify(msg)}`);
        }
    };
}

function createReader(name, callback, colMessages = 1) {
    const wrap = function (data) {
        const message = JSON.parse(data.content.toString());
        try {
            callback.call(channelReader, message, data);
        } catch (error) {
            console.error('createReader:callback', error);
        }
    };
    var channelReader = connection.createChannel({
        setup(channel) {
            return Promise.all([
                channel.assertQueue(name, {durable: true}),
                channel.prefetch(colMessages),
                channel.consume(name, wrap),
            ]);
        },
    });
    channelReader.waitForConnect()
        .then(() => {
            logger.info(`[${name}] читается очередь`);
        });
    return channelReader;
}

module.exports = {
    createWriter,
    createReader,
};
