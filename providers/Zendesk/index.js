class Zendesk {
  constructor() {
  }

  static storeRawBody(req, res, buf) {
    if (buf && buf.length) {
      req.rawBody = buf.toString("utf8");
    }
  }
}

module.exports = Zendesk