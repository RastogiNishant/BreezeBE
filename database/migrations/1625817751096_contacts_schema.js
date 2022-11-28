'use strict'

const Schema = use('Schema')
const {
  COMPANY_TYPE_PRIVATE,
  COMPANY_TYPE_PROPERTY_MANAGER,
  COMPANY_TYPE_PRIVATE_HOUSING,
  COMPANY_TYPE_MUNICIPAL_HOUSING,
  COMPANY_TYPE_HOUSING_COOPERATIVE,
  COMPANY_TYPE_LISTED_HOUSING,
} = require('../../app/constants')

class ContactsSchema extends Schema {
  up() {
    this.create('contacts', (table) => {
      table.increments()
      table.integer('user_id').unsigned().index()
      table.foreign('user_id').references('id').on('users').onDelete('cascade')
      table.integer('company_id').unsigned().index()
      table.foreign('company_id').references('id').on('companies').onDelete('cascade')
      table.string('full_name', 255)
      table.string('email', 255)
      table.string('phone', 30)
      table.string('region', 255)
    })

    this.table('companies', (table) => {
      table.enum('type', [
        COMPANY_TYPE_PRIVATE,
        COMPANY_TYPE_PROPERTY_MANAGER,
        COMPANY_TYPE_PRIVATE_HOUSING,
        COMPANY_TYPE_MUNICIPAL_HOUSING,
        COMPANY_TYPE_HOUSING_COOPERATIVE,
        COMPANY_TYPE_LISTED_HOUSING,
      ])
      table.dropColumn('contact')
      table.dropColumn('contact2')
    })
  }

  down() {
    this.drop('contacts')
  }
}

module.exports = ContactsSchema
