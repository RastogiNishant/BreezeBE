'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { createDynamicLink } = require('../../app/Libs/utils')
const { STATUS_DELETE } = require('../../app/constants')
const Estate = use('App/Models/Estate')
const Promise = require('bluebird')

class AdjustShareLinkSchema extends Schema {
  async up() {
    const estates = (await Estate.query().whereNot('status', STATUS_DELETE).fetch()).toJSON()
    console.log('total length=', estates.length)
    await Promise.map(estates, async (estate, index) => {
      const share_link = await createDynamicLink(
        `${process.env.DEEP_LINK}/invite?code=${estate.hash}`
      )
      await Estate.query().where('id', estate.id).update({ share_link })
      console.log('Storing deep link processing=', index)
    })
  }

  down() {}
}

module.exports = AdjustShareLinkSchema
