'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThirdPartyOffersSchema extends Schema {
  up() {
    this.create('third_party_offers', (table) => {
      table.increments()
      table.string('source')
      table.integer('source_id')
      table.specificType('coord', 'geometry(point, 4326)')
      table.string('description')
      table.string('url')
      table.string('house_number', 10)
      table.string('street', 100)
      table.string('city', 100)
      table.string('zip', 10)
      table.string('country', 50)
      table.string('address')
      table.smallint('floor').unsigned()
      table.smallint('floor_count').unsigned()
      table.smallint('bathrooms').unsigned()
      table.decimal('rooms', 3, 1)
      table.smallint('area').unsigned()
      table.smallint('construction_year').unsigned()
      table.json('images')
      table.string('energy_efficiency_class', 5)
      table.date('rent_start')
      table.date('visit_from')
      table.date('visit_to')
      table.timestamps()
      table.unique(['source', 'source_id'])
    })
  }

  down() {
    this.drop('third_party_offers')
  }
}

module.exports = ThirdPartyOffersSchema
