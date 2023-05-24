'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')

class RemoveHeatingTypeFloorHeatingSchema extends Schema {
  up() {
    this.table('estates', async (table) => {
      // alter table
      const estates = (await Estate.query().fetch()).rows
      let i = 0
      while (i < estates.length) {
        const estate = estates[i]
        if (estate.heating_type && estate.heating_type.length) {
          if (estate.heating_type.includes(5)) {
            estate.heating_type = estate.heating_type.filter((h) => h !== 5)
            await estate.save()
          }
        }
        i++
      }
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = RemoveHeatingTypeFloorHeatingSchema
