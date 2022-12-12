'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const Promise = require('bluebird')
const Database = use('Database')

class ChangeFiringTypeToJsonSchema extends Schema {
  async up() {
    this.table('estates', (table) => {
      table.specificType('firing1', 'INT[]')
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('firing1')
    })
  }
}

module.exports = ChangeFiringTypeToJsonSchema
