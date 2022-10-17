'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')
const Database = use('Database')
const {
  INVITATION_LINK_RETRIEVAL_CODE_CHARACTERS,
  INVITATION_LINK_RETRIEVAL_CODE_LENGTH,
} = require('../constants')

class InvitationLinkCode extends Model {
  static get columns() {
    return ['id', 'current_tenant_id', 'code', 'link']
  }

  static generateRandomString(length = 6) {
    let randomString = ''
    let characters = INVITATION_LINK_RETRIEVAL_CODE_CHARACTERS
    for (var i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return randomString
  }

  static async create(current_tenant_id, shortLink) {
    let exists
    let randomString
    do {
      randomString = this.generateRandomString(INVITATION_LINK_RETRIEVAL_CODE_LENGTH)
      exists = await Database.table('invitation_link_codes')
        .where('code', randomString)
        .select('id')
        .first()
    } while (exists)
    await Database.table('invitation_link_codes').insert({
      current_tenant_id,
      code: randomString,
      link: shortLink,
    })
    return randomString
  }
}

module.exports = InvitationLinkCode
