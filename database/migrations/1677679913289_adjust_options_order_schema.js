'use strict'

const {
  BUILDING_AMENITIES_ORDER,
  APARTMENT_AMENITIES_ORDER,
  VINCINITY_AMENITIES_ORDER,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Option = use('App/Models/Option')

class AdjustOptionsOrderSchema extends Schema {
  async up() {
    const options = (await Option.query().fetch()).rows
    let i = 0

    while (i < options.length) {
      const option = options[i]

      let index = -1
      if (option.type === 'apt') {
        index = APARTMENT_AMENITIES_ORDER.findIndex((ba) => {
          console.log(
            'apartment here',
            ba.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}]/g, '_')
          )
          console.log(
            `apartment value = ${option.title}`,
            ba.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}]/g, '_')
          )
          return option.title.includes(ba.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}]/g, '_'))
        })
      } else if (option.type === 'build') {
        index = BUILDING_AMENITIES_ORDER.findIndex((ba) => {
          console.log('building here', ba.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}]/g, '_'))
          console.log(
            `building value = ${option.title}`,
            ba.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}]/g, '_')
          )
          return option.title.includes(ba.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}]/g, '_'))
        })
      } else if (option.type === 'out') {
        index = VINCINITY_AMENITIES_ORDER.findIndex((ba) => {
          console.log(
            'VINCINITY_AMENITIES_ORDER',
            ba.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}]/g, '_')
          )
          console.log(
            `VINCINITY value = ${option.title}`,
            ba.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}]/g, '_')
          )

          return option.title.includes(ba.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}]/g, '_'))
        })
      }

      if (index != -1) {
        option.order = index + 1
        await option.save()
      }

      i++
    }
  }

  down() {}
}

module.exports = AdjustOptionsOrderSchema
