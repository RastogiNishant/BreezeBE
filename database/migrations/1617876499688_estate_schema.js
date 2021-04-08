'use strict'

const Schema = use('Schema')

class EstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.boolean('repair_need').defaultTo(false)
      table.string('cover', 254)
      table.json('plan')
      table.string('city', 40)
      table.string('zip', 7)
      table.integer('budget').unsigned().defaultTo(25)
      table.integer('credit_score').unsigned().defaultTo(96)
      table.boolean('rent_arrears').defaultTo(false)
      table.boolean('full_address').defaultTo(true)
      table.integer('adult_age_class').unsigned()
      table.integer('kids_type').unsigned().defaultTo(0)
      table.boolean('photo_require')
      table.boolean('furnished')
      table.integer('source_person').unsigned().defaultTo(0)
      table.integer('pets').unsigned().alter()
      table.integer('household_type').unsigned().defaultTo(0)
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('cover')
      table.dropColumn('plan')
      table.dropColumn('city')
      table.dropColumn('zip')
      table.dropColumn('budget')
      table.dropColumn('credit_score')
      table.dropColumn('rent_arrears')
      table.dropColumn('full_address')
      table.dropColumn('adult_age_class')
      table.dropColumn('kids_type')
      table.dropColumn('photo_require')
      table.dropColumn('furnished')
      table.dropColumn('source_person')
      table.dropColumn('repair_need')
      table.dropColumn('household_type')
    })
  }
}

module.exports = EstateSchema
