const {REDIS} = require('../config');
const Redis = require("ioredis");
const logger = require('./logger');
const LocalCache = require("./cache");
const RedisClient = new Redis({
    port: REDIS.port,
    host: REDIS.host,
});
let connected = false;
RedisClient.on('connect', () => {
    logger.info("Redis подключился");
    connected = true;
})

RedisClient.on("error", (err) => {
    logger.error(err,"Ошибка redis:");
    connected = false;
});

module.exports = {
    get: async (key) => {
        let data = LocalCache.get(key);
        if (!data && connected) {
            data = await RedisClient.get(key);
            if (data) {
                data = JSON.parse(data);
            }
        }
        return data;
    },
    /**
     *
     * @param key
     * @param value
     * @param expire - в секундах
     * @returns {Promise<void>}
     */
    set: async (key, value, expire = 3600) => {
        LocalCache.set(key, value, expire * 1000);
        if (connected) {
            await RedisClient.set(key, JSON.stringify(value), "EX", expire);
        }
    },
};
