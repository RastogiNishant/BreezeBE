'use strict'

const Schema = use('Schema')

class MembersSchema extends Schema {
  up () {
    this.table('members', (table) => {
      table.index('child')
    })
  }

  down () {
    this.table('members', (table) => {
      table.dropIndex('child')
    })
  }
}

module.exports = MembersSchema
