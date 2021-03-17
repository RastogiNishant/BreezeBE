'use strict'

const Schema = use('Schema')
const Database = use('Database')

const {
  OCCUPATION_TYPE_NOT_OCCUPIED,
  USE_TYPE_RESIDENTIAL,
  OWNERSHIP_TYPE_FREEHOLDER,
  MARKETING_TYPE_PURCHASE,
  PROPERTY_TYPE_APARTMENT,
  ENERGY_TYPE_LOW_ENERGY,
  BUILDING_STATUS_FIRST_TIME_OCCUPIED,
  GENDER_ANY,
  APARTMENT_TYPE_MAISONETTE,
  PARKING_SPACE_TYPE_GARAGE,
  STATUS_ACTIVE,
} = require('../../app/constants')

class UsersSchema extends Schema {
  up() {
    /**
     *
     */
    this.create('companies', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.string('name', 255)
      table.string('address', 255)
      table.string('tax_number', 255)
      table.string('trade_register_nr', 255)
      table.string('umsst', 255)
      table.json('contact') // typeof App/Classes/Contact
      table.json('contact2') // typeof App/Classes/Contact
      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
      table.timestamps()
    })

    /**
     *
     */
    this.create('estates', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('property_type').unsigned().defaultTo(PROPERTY_TYPE_APARTMENT)
      table.integer('type').unsigned().defaultTo(APARTMENT_TYPE_MAISONETTE)
      table.string('description', 500)
      table.string('category', 20)
      table.specificType('coord', 'geometry(point, 4326)')
      table.string('street')
      table.string('house_number')
      table.string('country')
      table.integer('floor').unsigned().defaultTo(1)
      table.integer('number_floors').unsigned().defaultTo(1)

      table.decimal('prices').defaultTo(0)
      table.decimal('net_rent').defaultTo(0)
      table.decimal('cold_rent').defaultTo(0)
      table.decimal('rent_including_heating').defaultTo(0)
      table.decimal('additional_costs').defaultTo(0)
      table.decimal('heating_costs_included').defaultTo(0)
      table.decimal('heating_costs').defaultTo(0)
      table.decimal('rent_per_sqm').defaultTo(0)
      table.decimal('deposit').defaultTo(0)
      table.decimal('stp_garage').defaultTo(0)
      table.decimal('stp_parkhaus').defaultTo(0)
      table.decimal('stp_tiefgarage').defaultTo(0)
      table.string('currency', 3)

      table.decimal('area').defaultTo(0)
      table.decimal('living_space').defaultTo(0)
      table.decimal('usable_area').defaultTo(0)
      table.integer('rooms_number').unsigned().defaultTo(1)
      table.integer('bedrooms_number').unsigned().defaultTo(1)
      table.integer('bathrooms_number').unsigned().defaultTo(1)
      table.integer('kitchen_options').unsigned().unsigned()
      table.integer('bath_options').unsigned().unsigned()
      table.integer('wc_number').unsigned().defaultTo(1)
      table.integer('balconies_number').unsigned().defaultTo(1)
      table.integer('terraces_number').unsigned().defaultTo(1)
      table.integer('occupancy').unsigned().defaultTo(OCCUPATION_TYPE_NOT_OCCUPIED)
      table.integer('use_type').unsigned().defaultTo(USE_TYPE_RESIDENTIAL)
      table.integer('ownership_type').unsigned().defaultTo(OWNERSHIP_TYPE_FREEHOLDER)
      table.integer('marketing_type').unsigned().defaultTo(MARKETING_TYPE_PURCHASE)
      table.integer('energy_type').unsigned().defaultTo(ENERGY_TYPE_LOW_ENERGY)
      table.date('available_date', { useTz: false })
      table.date('from_date', { useTz: false })
      table.date('to_date', { useTz: false })
      table.integer('min_lease_duration').unsigned().defaultTo(0)
      table.integer('max_lease_duration').unsigned().defaultTo(0)

      table.boolean('non-smoker').defaultTo(false)
      table.boolean('pets').defaultTo(false)
      table.integer('gender').unsigned().defaultTo(GENDER_ANY)
      table.boolean('monumental_protection').defaultTo(false)

      table.integer('parking_space_type').unsigned().defaultTo(PARKING_SPACE_TYPE_GARAGE)

      table.date('construction_year', { useTz: false })
      table.date('last_modernization', { useTz: false })
      table.integer('building_status').unsigned().defaultTo(BUILDING_STATUS_FIRST_TIME_OCCUPIED)
      table.integer('building_age').unsigned()
      table.integer('firing').unsigned()
      table.integer('heating_type').unsigned()
      table.integer('equipment').unsigned()
      table.integer('equipment_standard').unsigned()
      table.integer('ground').unsigned()
      table.integer('energy_efficiency').unsigned()
      table.json('energy_pass')

      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
      table.timestamps()
    })
  }

  down() {
    this.drop('estates')
    this.drop('companies')
  }
}

module.exports = UsersSchema
