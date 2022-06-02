'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const Database = use('Database')
const Promise = require('bluebird')

const mapTypeToLocation = (type) => {
  const typeMap = {
    build: 'building',
    apt: 'apartment',
    out: 'vicinity',
    kitchen: 'room',
    bad: 'room',
    room: 'room',
  }
  return typeMap[type]
}
const getOptions = async () => {
  let options = await Database.from('options')
  options = options.reduce((options, option) => {
    return { ...options, [option.id]: option.type }
  }, {})
  return options
}

class EstateOptionsToAmenitiesSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      let estates = await Estate.query().whereNot('options', null).fetch()
      estates = estates.toJSON()
      let availableOptions = await getOptions()

      try {
        await Promise.all(
          estates.map(async (estate) => {
            let options = estate.options
            let estate_id = estate.id
            await options.map(async (option, index) => {
              let row = {
                estate_id,
                option_id: option,
                status: STATUS_ACTIVE,
                type: 'amenity',
                sequence_order: index,
                location: mapTypeToLocation(availableOptions[option]),
                created_at: Database.fn.now(),
                updated_at: Database.fn.now(),
              }
              await Database.table('amenities').insert(row)
            })
          })
        )
        await trx.commit()
      } catch (err) {
        console.log(err)
        await trx.rollback()
      }
    })
  }

  down() {
    this.table('estate_options_to_amenities', (table) => {
      // reverse alternations
    })
  }
}

module.exports = EstateOptionsToAmenitiesSchema
