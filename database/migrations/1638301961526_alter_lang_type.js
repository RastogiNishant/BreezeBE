'use strict'

const Schema = use('Schema')

class AlterLangType extends Schema {
  up() {
    this.alter('users', (table) => {
      table.string('lang', 10).alter();
    })
  }

  // reverse modification 
  down() {
    this.table('users', (table) => {
      table.string('lang', 2);
    })
  }
}

module.exports = AlterLangType
