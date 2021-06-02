'use strict'

const Schema = use('Schema')
const Database = use('Database')
const { map } = require('bluebird')

const queries = [
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'additional_burglar_alarm' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'additional_burglar_alarm' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'balcony' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'balcony' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'bright' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'bright' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'exclusive_high_quality_luxury' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'exclusive_high_quality_luxury' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'fireplace' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'fireplace' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'heating_pipes_not_visible' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'heating_pipes_not_visible' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'high_quality_parquet' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'high_quality_parquet' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'loggia' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'loggia' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'low_barrier_cut' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'low_barrier_cut' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'mainly_underfloor_heating' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'mainly_underfloor_heating' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'natural_artificial_stone' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'natural_artificial_stone' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'panoramic_view' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'panoramic_view' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'poor_cut' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'poor_cut' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'roller_shutters' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'roller_shutters' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'roof_floor' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'roof_floor' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'single_glazing' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'single_glazing' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'soundproof_windows' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'soundproof_windows' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'south_facing' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'south_facing' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'storage_room' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'storage_room' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'stucco' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'stucco' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'thermal_insulation_glazing' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'thermal_insulation_glazing' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'tiles' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'tiles' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'wainscoting' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'wainscoting' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'washing_machine_not_placeable' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'washing_machine_not_placeable' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'winter_roof_garden' AND type = 'apt'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'winter_roof_garden' AND type = 'room'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'with_window' AND type = 'bad'",
  "UPDATE options SET title = concat(type, '_', title) WHERE title = 'with_window' AND type = 'kitchen'",
]

class OptionsSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      await map(
        queries,
        (q) => {
          return Database.raw(q).transacting(trx)
        },
        { concurrency: 10 }
      )
    })

    this.table('options', (table) => {
      table.unique('title')
    })
  }

  down() {}
}

module.exports = OptionsSchema
