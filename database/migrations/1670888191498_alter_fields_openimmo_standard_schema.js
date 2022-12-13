'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const fields = [
  'firing',
  'energy_type',
  'use_type',
  'marketing_type',
  'ground',
  'parking_space_type',
  'bath_options',
]
const has_defaults = [
  'energy_type',
  'use_type',
  'marketing_type',
  'parking_space_type', //6
]
const Promise = require('bluebird')
const { includes } = require('lodash')

class AlterFieldsOpenimmoStandardSchema extends Schema {
  async up() {
    Promise.map(fields, async (field) => {
      if (includes(has_defaults, field)) {
        await Database.raw(`ALTER TABLE estates
        ALTER COLUMN ${field}
        DROP DEFAULT`)
      }

      await Database.raw(`ALTER TABLE estates
      ALTER COLUMN ${field} TYPE INTEGER[]
      USING array[${field}]::INTEGER[]`)
    })
  }

  async down() {
    Promise.map(fields, async (field) => {
      await Database.raw(
        `ALTER TABLE estates ALTER COLUMN ${field} TYPE INTEGER USING ${field}[1]::INTEGER`
      )
      if (includes(has_defaults, field)) {
        if (field === 'parking_space_type') {
          await Database.raw(`ALTER TABLE estates
            ALTER COLUMN ${field}
            SET DEFAULT 6`)
        } else {
          await Database.raw(`ALTER TABLE estates
            ALTER COLUMN ${field}
            SET DEFAULT 1`)
        }
      }
    })
  }
}

module.exports = AlterFieldsOpenimmoStandardSchema
