'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Promise = require('bluebird')
const Estate = use('App/Models/Estate')
const Database = use('Database')
const EstateService = use('App/Services/EstateService')
const { STATUS_DELETE } = require('../../app/constants')
const { orderBy } = require('lodash')
const HttpException = use('App/Exceptions/HttpException')
class ReAdjustEstateCoverSchema extends Schema {
  async up() {
    try {
      await Estate.query().update({ cover: null })   
      
      const estates = await Estate.query()
        .whereNot('estates.status', STATUS_DELETE)
        .with('rooms', function (r) {
          r.with('images')
        })
        .fetch()

      await Promise.map(estates.toJSON(), async (estate) => {
        const rooms = orderBy(estate.rooms, 'favorite')
        await Promise.map(rooms, async (room) => {
          await EstateService.updateCover({ room: room })
        })
      })
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ReAdjustEstateCoverSchema
