const logger = require("../../helpers/logger");

module.exports.start = function (server) {
  const io = require("socket.io")(server);

  io.on("connection", (socket) => {
    logger.info(`Кто-то подключился к вебсокету`,socket.id);
    socket.on("disconnect", () => {
      logger.info("Кто-то отключился от вебсокета",socket.id);
    });

    socket.on("all", (data) => {
      logger.debug("в канале all новое сообщение");
      io.emit("all", data);
    });

  });
};
