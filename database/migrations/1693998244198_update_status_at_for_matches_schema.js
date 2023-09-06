'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Match = use('App/Models/Match')
const Database = use('Database')

class UpdateStatusAtForMatchesSchema extends Schema {
  async up() {
    await Database.raw('UPDATE matches set status_at = updated_at where status_at is null')
  }

  down() {}
}

module.exports = UpdateStatusAtForMatchesSchema
