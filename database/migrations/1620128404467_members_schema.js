'use strict'

const Schema = use('Schema')
const { GENDER_MALE } = require('../../app/constants')

class MembersSchema extends Schema {
  up() {
    this.create('members', (table) => {
      table.increments()
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .notNullable()
        .onDelete('cascade')
      table.string('firstname', 254)
      table.string('secondname', 254)
      table.boolean('child')
      table.string('phone', 30)
      table.date('birthday', { useTz: false })
      table.integer('sex').unsigned().defaultTo(GENDER_MALE)
      table.string('avatar', 512)
      table.string('profession', 60)
      table.string('company_logo', 512)
      table.date('hiring_date', { useTz: false })
      table.integer('employment_type').unsigned()
      table.decimal('major_income', 10, 2)
      table.decimal('extra_income', 10, 2)
      table.timestamps()
    })
  }

  down() {
    this.drop('members')
  }
}

module.exports = MembersSchema
