'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class SeedLandlordPlanSchema extends Schema {
  async up() {
    await Database.raw(`
      -- Auto-generated SQL script #202305222226
      INSERT INTO public."plans" (id,"name",description,"role",landlord_free_plan,status)
        VALUES (3,'Basic landlord plan','This is a landlord basic plan',1,true,true);
        -- Auto-generated SQL script #202305222226
        INSERT INTO public."plans" (id,"name",description,"role",landlord_free_plan,status)
          VALUES (4,'Premium landlord plan','This is a landlord premiumn plan',1,true,true);        
    `)
  }

  down() {}
}

module.exports = SeedLandlordPlanSchema
