'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const Database = use('Database')

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
      console.log({ availableOptions })
      await Promise.all(
        estates.map(async (estate) => {
          let options = estate.options
          let estate_id = estate.id
          await options.map(async (option, index) => {
            console.log({ option, index, location: mapTypeToLocation(availableOptions[option]) })
          })
        })
      )
    })
  }

  down() {
    this.table('estate_options_to_amenities', (table) => {
      // reverse alternations
    })
  }
}

module.exports = EstateOptionsToAmenitiesSchema
