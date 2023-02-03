'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const fields = [
  'firing',
  'energy_type',
  'use_type',
  'marketing_type',
  'ground',
  'parking_space_type',
  'bath_options',
  'heating_type',
]
const has_defaults = [
  'energy_type',
  'use_type',
  'marketing_type',
  'parking_space_type', //6
]
const Promise = require('bluebird')
const { includes } = require('lodash')
const Database = use('Database')

class RemoveNullsOnFieldsSchema extends Schema {
  async up() {
    Promise.map(fields, async (field) => {
      if (!includes(has_defaults, field)) {
        await Database.raw(`UPDATE estates SET ${field}='{}' WHERE ${field}='{null}'`)
      }
    })
  }

  down() {}
}

module.exports = RemoveNullsOnFieldsSchema
