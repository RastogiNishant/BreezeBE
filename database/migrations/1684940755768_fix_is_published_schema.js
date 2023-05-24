'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const { STATUS_DELETE } = require('../../app/constants')
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
class FixIsPublishedSchema extends Schema {
  async up() {
    await Estate.query().where('status', STATUS_DELETE).update({ is_published: false })
  }

  down() {}
}

module.exports = FixIsPublishedSchema
