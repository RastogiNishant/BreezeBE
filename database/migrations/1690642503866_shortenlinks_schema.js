'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ShortenlinksSchema extends Schema {
  up() {
    this.create('shorten_links', (table) => {
      table.increments()
      table.string('hash', 255).notNullable()
      table.index('hash')
      table.unique('hash')
      table.string('link', 255).notNullable()

      table.timestamps()
    })
  }

  down() {
    this.drop('shortenlinks')
  }
}

module.exports = ShortenlinksSchema
