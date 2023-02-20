'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateService = use('App/Services/EstateService')
const Estate = use('App/Models/Estate')
const Promise = require('bluebird')

class AdjustPercentageSchema extends Schema {
  async up() {
    const estates = (await Estate.query().fetch()).rows || []

    let i = 0

    while (i < estates.length) {
      await EstateService.updatePercent({ estate_id: estates[i].id })
      i++
    }
  }

  down() {}
}

module.exports = AdjustPercentageSchema
