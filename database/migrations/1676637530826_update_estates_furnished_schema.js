'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class UpdateEstatesFurnishedSchema extends Schema {
  async up() {
    await Database.raw(`ALTER TABLE estates
    ALTER COLUMN furnished TYPE smallint USING CASE WHEN furnished THEN 2 ELSE 0 END;`)
  }

  async down() {
    await Database.raw(`ALTER TABLE estates
    ALTER COLUMN furnished TYPE boolean USING CASE WHEN furnished=1 OR furnished=2 THEN true ELSE false END;`)
  }
}

module.exports = UpdateEstatesFurnishedSchema
