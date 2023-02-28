const crypto = require("crypto");
let cacheObj = {};
let expires = {};
module.exports = {
  createHash: (string) => crypto.createHash("md5").update(string).digest("hex"),
  get: (key) => {
    if (Object.prototype.hasOwnProperty.call(cacheObj, key) && cacheObj[key]) {
      return JSON.parse(JSON.stringify(cacheObj[key].data));
    } else {
      return false;
    }
  },
  /* 10min default */
  set: (key, data, expire = 600000) => {
    cacheObj[key] = {
      data,
      expire,
    };
    if (Object.prototype.hasOwnProperty.call(expires, key) && expires[key]) {
      try {
        clearTimeout(expires[key]);
      } catch (err) {
        //do nothing
      }
    }
    expires[key] = setTimeout(() => {
      delete cacheObj[key];
    }, expire);
  },
};
