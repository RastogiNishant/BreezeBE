'use strict'

const Schema = use('Schema')
const Database = use('Database')

const sql = `
INSERT INTO options (type, title)
VALUES ('build', 'Bicycle Storage Room'),
       ('build', 'Common Room'),
       ('build', 'High Quality Entrance Hall'),
       ('build', 'Mirror'),
       ('build', 'Marble'),
       ('build', 'Exclusive Lighting'),
       ('build', 'Renewed Facade'),
       ('build', 'Intercom System With Electric Door Opener'),
       ('build', 'Elevator (<5 Floors)'),
       ('build', 'Thermal Insulation'),
       ('build', 'Cellar'),
       ('build', 'House Entrance Door Not Lockable'),
       ('build', 'Garage'),
       ('build', 'Parking Space'),
       ('build', 'Elevator'),
       ('apt', 'Storage Room'),
       ('apt', 'Balcony'),
       ('apt', 'Loggia'),
       ('apt', 'Winter/roof Garden'),
       ('apt', 'Mainly Underfloor Heating'),
       ('apt', 'Roller Shutters'),
       ('apt', 'Stucco'),
       ('apt', 'Wainscoting'),
       ('apt', 'Heating Pipes Not Visible'),
       ('apt', 'Poor Cut'),
       ('apt', 'Additional Burglar Alarm'),
       ('apt', 'Thermal Insulation Glazing'),
       ('apt', 'Single Glazing'),
       ('apt', 'Washing Machine Not Placeable'),
       ('apt', 'High Quality Parquet'),
       ('apt', 'Natural/artificial Stone'),
       ('apt', 'Tiles'),
       ('apt', 'Soundproof Windows'),
       ('apt', 'Low-barrier Cut'),
       ('apt', 'Fireplace'),
       ('apt', 'Panoramic View'),
       ('apt', 'South Facing'),
       ('apt', 'Bright'),
       ('apt', 'Roof Floor'),
       ('apt', 'Exclusive/high Quality/luxury'),
       ('out', 'Preferred City Location'),
       ('out', 'Quiet'),
       ('out', 'Polluted By Traffic Noise'),
       ('out', 'Heavily Neglected'),
       ('out', 'Odorous'),
       ('out', 'Childrens Playground'),
       ('out', 'Benches'),
       ('out', 'Rest Areas'),
       ('out', 'Sidewalk Paving'),
       ('out', 'In Green'),
       ('out', 'Lighting'),
       ('out', 'Car Parking'),
       ('out', 'Garden'),
       ('out', 'Bicycle Parking'),
       ('out', 'Courtyard');
`

class OptionsSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      await Database.raw(sql)
    })
  }

  down() {}
}

module.exports = OptionsSchema
