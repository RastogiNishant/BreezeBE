'use strict'

const Schema = use('Schema')

class VisitSchema extends Schema {
  up() {
    this.create('visits', (table) => {
      table
        .integer('estate_id')
        .unsigned()
        .references('id')
        .inTable('estates')
        .notNullable()
        .onDelete('cascade')
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .notNullable()
        .onDelete('cascade')
      table.datetime('date', { useTz: false }).notNullable()
      table.unique(['estate_id', 'date'])
    })

    this.table('matches', (table) => {
      table.boolean('share').defaultTo(false)
    })
  }

  down() {
    this.drop('visits')

    this.table('matches', (table) => {
      table.dropColumn('share')
    })
  }
}

module.exports = VisitSchema
