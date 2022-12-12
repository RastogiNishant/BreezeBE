'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
class PopulateFiringSchema extends Schema {
  async up() {
    await Database.raw(`Update estates set firing1=array_append(firing1, "firing")`)
  }

  down() {
    this.table('populate_firings', (table) => {
      // reverse alternations
    })
  }
}

module.exports = PopulateFiringSchema
