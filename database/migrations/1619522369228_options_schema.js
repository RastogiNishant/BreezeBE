'use strict'

const Schema = use('Schema')
const Database = use('Database')

const sql = `
INSERT INTO options (type, title)
VALUES ('kitchen', 'With Window'),
       ('kitchen', 'Sufficient Ventilation'),
       ('kitchen', 'Separate Kitchen'),
       ('kitchen', 'Fitted Kitchen'),
       ('kitchen', 'Ceramic Hob'),
       ('kitchen', 'Induction Hob'),
       ('kitchen', 'Refrigerator'),
       ('kitchen', 'Sink'),
       ('kitchen', 'Gas/electric Stove With Oven'),
       ('kitchen', 'High Quality Tiles'),
       ('kitchen', 'High Quality Linoleum'),
       ('kitchen', 'Parquet'),
       ('kitchen', 'Terrazzo'),
       ('kitchen', 'High Quality Laminate'),
       ('kitchen', 'Central Hot Water Supply'),
       ('kitchen', 'Extractor Fan'),
       ('kitchen', 'Dishwasher'),
       ('kitchen', 'Wood/coal Heating'),
       ('bad', 'Large Washbasin'),
       ('bad', 'High Quality Bathroom Furniture'),
       ('bad', 'Corner Bath'),
       ('bad', 'Round Tub'),
       ('bad', 'Bath With Ventilation'),
       ('bad', 'Second Wc'),
       ('bad', 'Underfloor Heating'),
       ('bad', 'Wall Covering'),
       ('bad', 'Floor Covering'),
       ('bad', 'Wall Hung Wc'),
       ('bad', 'Towel Warmer'),
       ('bad', 'Shower Tray'),
       ('bad', 'Shower Cubicle'),
       ('bad', 'Central Hot Water'),
       ('bad', 'With Window'),
       ('room', 'Balcony'),
       ('room', 'Bath'),
       ('room', 'Bathroom'),
       ('room', 'Bedroom'),
       ('room', 'Checkroom'),
       ('room', 'Childrens Room'),
       ('room', 'Corridors'),
       ('room', 'Dining Room'),
       ('room', 'Entrance Hall'),
       ('room', 'Gym'),
       ('room', 'Ironing Room'),
       ('room', 'Kitchen'),
       ('room', 'Living Room'),
       ('room', 'Lobby'),
       ('room', 'Massage Room'),
       ('room', 'Office'),
       ('room', 'Pantry'),
       ('room', 'Storage Room'),
       ('room', 'Place For Games'),
       ('room', 'Sauna'),
       ('room', 'Shower'),
       ('room', 'Staff Room'),
       ('room', 'Swimming Pool'),
       ('room', 'Technical Room'),
       ('room', 'Terrace'),
       ('room', 'Toilet'),
       ('room', 'Washing Room')
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
