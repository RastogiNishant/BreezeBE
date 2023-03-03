'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')

class ChangeHeatingTypeOrderSchema extends Schema {
  up() {
    this.table('change_heating_type_orders', (table) => {
      // alter table
      this.table('estates', async (table) => {
        // alter table
        const estates = (await Estate.query().fetch()).rows
        let i = 0
        while (i < estates.length) {
          const estate = estates[i]
          if (estate.heating_type && estate.heating_type.length) {
            estate.heating_type = estate.heating_type.map((h) => {
              if (h === 1) {
                h = 4
              } else if (h === 3) {
                h = 1
              } else if (h === 4) {
                h = 3
              }
              return h
            })
            await estate.save()
          }
          i++
        }
      })
    })
  }

  down() {
    this.table('change_heating_type_orders', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ChangeHeatingTypeOrderSchema
