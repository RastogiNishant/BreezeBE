'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AgreementLocalization extends Schema {
  up() {
    this.table('agreements', (table) => {
      table.text('body_de')
      table.text('title_de')
    })
    this.table('terms', (table) => {
      table.text('body_de')
      table.text('title_de')
    })
  }
}

module.exports = AgreementLocalization
