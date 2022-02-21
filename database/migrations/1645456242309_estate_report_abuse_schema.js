'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EstateResportAbuseSchema extends Schema {
  up () {
    this.create('estate_report_abuses', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('estate_id').unsigned().references('id').inTable('estates')
      table.text('abuse')
      table.timestamps()
    })
  }

  down () {
    this.drop('estate_report_abuses')
  }
}

module.exports = EstateResportAbuseSchema
