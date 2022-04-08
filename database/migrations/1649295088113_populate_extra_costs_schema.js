'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class PopulateExtraCostsSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      await Database.raw(
        'update estates set extra_costs = e.ec from (select (additional_costs + heating_costs) as ec, id from estates) as e where e.id=estates.id'
      )
    })
  }

  down() {}
}

module.exports = PopulateExtraCostsSchema
