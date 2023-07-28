'use strict'
const fs = require('fs')
const path = require('path')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const countries = {
  de: {
    country: 'Germany',
    other_name: 'Deutschland',
    alpha2: 'de',
  },
  ch: {
    country: 'Switzerland',
    other_name: 'Schweiz',
    alpha2: 'ch',
  },
  at: {
    country: 'Austria',
    other_name: 'Österreich',
    alpha2: 'at',
  },
}

const City = use('App/Models/City')

class PopulateCitiesSchema extends Schema {
  async up() {
    for (const [key, value] of Object.entries(countries)) {
      const { country, other_name, alpha2 } = value
      const allFileContents = fs.readFileSync(
        path.resolve(__dirname, `../cities-${alpha2}.txt`),
        'utf-8'
      )
      let cities = []
      allFileContents.split(/\r?\n/).forEach((line) => {
        cities = [...cities, { country, other_name, alpha2, city: line }]
      })
      City.createMany(cities)
    }
  }

  down() {
    this.table('populate_cities', (table) => {
      // reverse alternations
    })
  }
}

module.exports = PopulateCitiesSchema
