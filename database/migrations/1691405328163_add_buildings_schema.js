'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddBuildingsSchema extends Schema {
  up() {
    this.create('buildings', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.string('name', 255)
      table.string('building_id', 255).notNullable()
      table.string('house_number')
      table.string('street', 255).notNullable()
      table.string('zip', 60).notNullable()
      table.string('city', 355).notNullable()
      table.string('country', 255).notNullable()
      table.string('extra_address', 255)
      table.timestamps()

      table.unique('building_id')
      table.index('user_id')
      table.index('building_id')
      table.index('city')
      table.index('country')
    })
  }

  down() {
    this.drop('buildings')
  }
}

module.exports = AddBuildingsSchema
