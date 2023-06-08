'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Match = use('App/Models/Match')
const Database = use('Database')

class FillUpStatusAtSchema extends Schema {
  async up() {
    await Database.raw(`update matches set status_at = knocked_at`)
  }

  down() {}
}

module.exports = FillUpStatusAtSchema
