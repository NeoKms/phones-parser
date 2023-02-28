const io = require("socket.io-client");
const {WS} = require("../config/index");
const logger = require("./logger");
const { sleep } = require("../helpers/helper");

class IoConnection {
  socket = null;
  dbModule = null;

  async waitConnect() {
    for (let i = 0; i < 100; i++) {
      if (this.socket) return true;
      await sleep(200);
    }
    return false;
  }

  setDb(db) {
    this.dbModule = db;
    return this;
  }

  async getConnection() {
    if (!this.dbModule)
      console.warn(
        "IO: DbModule не был инициализирован. Исрользуйте setDb(db)"
      );
    const self = this;
    if (this.socket) return this.socket;

    const connUri = WS.HOST+":"+WS.EXT;
    this.socket = io(connUri, {transports: ["websocket"]});

    this.socket.on("connect", () => {
      logger.info("Вебсокет подключен к",connUri);
    });

    this.socket.on("connect_error", async (err) => {
      logger.error(`Ошибка в вебсокете: ${err.message}`);
      this.socket && this.socket.close();
      this.socket = null;
      await sleep(1000);
      this.getConnection();
    });

    this.socket.on("disconnect", async () => {
      logger.debug("socket disconnect");
      this.socket && this.socket.close();
      this.socket = null;
      await sleep(100);
      this.getConnection();
    });

    /* type
    messages:create
    messages:update
     */
    this.socket.all = async function (data) {
      let connected = await self.waitConnect();
      connected && self.socket.emit("all", data);
    };

    return this.socket;
  }
}

module.exports = new IoConnection();
