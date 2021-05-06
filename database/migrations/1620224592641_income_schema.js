'use strict'

const Schema = use('Schema')
const { GENDER_MALE, HIRING_TYPE_FULL_TIME, HIRING_TYPE_PART_TIME } = require('../../app/constants')

class IncomeSchema extends Schema {
  up() {
    this.drop('incomes')
    this.drop('members')

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
      table.timestamps()
    })

    this.create('incomes', (table) => {
      table.increments()
      table.string('document', 254)
      table
        .integer('member_id')
        .unsigned()
        .references('id')
        .inTable('members')
        .onDelete('cascade')
        .notNullable()
      table.string('profession', 120)
      table.string('position', 120)
      table.string('company_logo', 512)
      table.date('hiring_date', { useTz: false })
      table.enum('employment_type', [HIRING_TYPE_FULL_TIME, HIRING_TYPE_PART_TIME])
      table.decimal('major_income', 10, 2)
      table.decimal('extra_income', 10, 2)
    })
  }

  down() {}
}

module.exports = IncomeSchema
