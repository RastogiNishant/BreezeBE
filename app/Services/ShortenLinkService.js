'use strict'
const ShortenLink = use('App/Models/ShortenLink')

class ShortenLinkService {
  static async create(data, trx) {
    await ShortenLink.createItem(data, trx)
  }

  static async update(data, trx) {
    if (trx) {
      await ShortenLink.query().update(data).where('hash', data.hash).transacting(trx)
    } else {
      await ShortenLink.query().update(data).where('hash', data.hash)
    }
  }

  static async get(hash) {
    return await ShortenLink.query().where('hash', hash).first()
  }
}

module.exports = ShortenLinkService
