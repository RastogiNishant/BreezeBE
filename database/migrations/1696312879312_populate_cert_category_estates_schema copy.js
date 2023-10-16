'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class PopulateCertCategoryEstatesSchema extends Schema {
  async up() {
    await Database.raw(
      `UPDATE estates set cert_category = ARRAY[cert_category_2] where cert_category_2 is not null`
    )
  }

  down() {}
}

module.exports = PopulateCertCategoryEstatesSchema
