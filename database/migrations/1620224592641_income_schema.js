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
      table.string('email', 255)
      table.date('birthday', { useTz: false })
      table.integer('sex').unsigned().defaultTo(GENDER_MALE)
      table.string('avatar', 512)
      // Last rental data
      table.string('landlord_name', 255)
      table.string('landlord_phone', 30)
      table.string('landlord_email', 255)
      table.string('last_address', 255)
      table.string('rent_arrears_doc', 255)
      // Member credit data
      table.integer('credit_score').unsigned()
      table.string('debt_proof', 255)
      // Member arrests
      table.boolean('unpaid_rental')
      table.boolean('insolvency_proceed')
      table.boolean('arrest_warranty')
      table.boolean('clean_procedure')
      table.boolean('income_seizure')
      // External duties
      table.specificType('external_duties', 'INT[]')
      table.decimal('duties_amount', 10, 2)
      table.timestamps()
    })

    this.create('incomes', (table) => {
      table.increments()
      table.enum('employment_type', [HIRING_TYPE_FULL_TIME, HIRING_TYPE_PART_TIME])
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
      table.decimal('income', 10, 2)
    })
  }

  down() {}
}

module.exports = IncomeSchema
