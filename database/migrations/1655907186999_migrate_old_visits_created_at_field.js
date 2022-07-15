'use strict'

const { Promise } = require('bluebird')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Visit = use('App/Models/Visit')

class UpdateOldVisitsCreatedAtField extends Schema {
  async up() {
    const visits = await Visit.query().fetch()
    await Promise.map(visits.toJSON(), async (visit) => {
      await Visit.query()
        .where('estate_id', visit.estate_id)
        .where('user_id', visit.user_id)
        .where('date', visit.date)
        .update({ created_at: visit.updated_at })
    })
  }

  down() {}
}

module.exports = UpdateOldVisitsCreatedAtField
