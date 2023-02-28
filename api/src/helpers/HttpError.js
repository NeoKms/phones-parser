module.exports = class HttpError extends Error {
  statusCode = 400;
  constructor(message, sc = 400) {
    super(message);
    this.name = "HttpError";
    this.statusCode = sc;
  }
};
