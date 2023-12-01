'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Notice = use('App/Models/Notice')

class DeleteProspectLandlordInviteDataFromNoticeSchema extends Schema {
  async up() {
    await Notice.query().where('type', null).orWhere('type', 67).delete()
  }

  down() {}
}

module.exports = DeleteProspectLandlordInviteDataFromNoticeSchema
