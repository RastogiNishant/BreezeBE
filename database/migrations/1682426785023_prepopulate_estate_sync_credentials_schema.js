'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateSyncCredential = use('App/Models/EstateSyncCredential')
const { ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE } = require('../../app/constants')

class PrepopulateEstateSyncCredentialsSchema extends Schema {
  async up() {
    await EstateSyncCredential.createItem({
      user_id: null,
      type: ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE,
    })
  }

  down() {}
}

module.exports = PrepopulateEstateSyncCredentialsSchema
