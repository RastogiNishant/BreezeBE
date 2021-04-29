'use strict'

const Schema = use('Schema')
const Database = use('Database')

const sql = `
INSERT INTO options (type, title)
VALUES 
       ('room', 'Storage Room'),
       ('room', 'Balcony'),
       ('room', 'Loggia'),
       ('room', 'Winter/roof Garden'),
       ('room', 'Mainly Underfloor Heating'),
       ('room', 'Roller Shutters'),
       ('room', 'Stucco'),
       ('room', 'Wainscoting'),
       ('room', 'Heating Pipes Not Visible'),
       ('room', 'Poor Cut'),
       ('room', 'Additional Burglar Alarm'),
       ('room', 'Thermal Insulation Glazing'),
       ('room', 'Single Glazing'),
       ('room', 'Washing Machine Not Placeable'),
       ('room', 'High Quality Parquet'),
       ('room', 'Natural/artificial Stone'),
       ('room', 'Tiles'),
       ('room', 'Soundproof Windows'),
       ('room', 'Low-barrier Cut'),
       ('room', 'Fireplace'),
       ('room', 'Panoramic View'),
       ('room', 'South Facing'),
       ('room', 'Bright'),
       ('room', 'Roof Floor'),
       ('room', 'Exclusive/high Quality/luxury')
`

class OptionsSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      // Delete old room options
      await Database.raw(`DELETE FROM options WHERE type = ?`, 'room')
      // Create new room options
      await Database.raw(sql)
    })
  }

  down() {}
}

module.exports = OptionsSchema
