'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateService = use('App/Services/EstateService')
const Estate = use('App/Models/Estate')
const Promise = require('bluebird')

class AdjustPercentageSchema extends Schema {
  async up() {
    const estates = (await Estate.query().fetch()).rows || []

    await Promise.map(estates, async (estate) => {
      await EstateService.updatePercent({ estate_id: estate.estate_id })
    })
  }

  down() {}
}

module.exports = AdjustPercentageSchema
