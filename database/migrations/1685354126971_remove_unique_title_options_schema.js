'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemoveUniqueTitleOptionsSchema extends Schema {
  up() {
    this.table('options', (table) => {
      table.dropUnique('title')
    })
  }

  down() {
    this.table('options', (table) => {
      table.unique('title')
    })
  }
}

module.exports = RemoveUniqueTitleOptionsSchema
