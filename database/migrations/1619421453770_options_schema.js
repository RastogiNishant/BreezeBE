'use strict'

const Schema = use('Schema')

class OptionsSchema extends Schema {
  up() {
    this.create('options', (table) => {
      table.increments()
      table.enum('type', ['build', 'apt', 'out'])
      table.string('title', 100)
    })

    this.create('estate_option', (table) => {
      table.increments()
      table.integer('estate_id').unsigned().references('id').inTable('estates').onDelete('cascade')
      table.integer('option_id').unsigned().references('id').inTable('options').onDelete('cascade')
    })
  }

  down() {
    this.drop('estate_option')
    this.drop('options')
  }
}

module.exports = OptionsSchema
