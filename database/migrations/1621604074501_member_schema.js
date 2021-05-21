'use strict'

const Schema = use('Schema')

class MemberSchema extends Schema {
  up () {
    this.table('members', (table) => {
      table.boolean('execution')
    })
  }

  down () {
    this.table('members', (table) => {
      table.dropColumn('execution')
    })
  }
}

module.exports = MemberSchema
