'use strict'

const { PETS_SMALL, PETS_NO } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')

class EstateAdjustPetsAllowedSchema extends Schema {
  async up() {
    await Estate.query().where('pets_allowed', 1).update({ pets_allowed: PETS_SMALL })
    await Estate.query().where('pets_allowed', 0).update({ pets_allowed: PETS_NO })
    await Estate.query()
      .where('pets', 1)
      .whereNull('pets_allowed')
      .update({ pets_allowed: PETS_NO })
    await Estate.query()
      .where('pets', 2)
      .whereNull('pets_allowed')
      .update({ pets_allowed: PETS_SMALL })
  }

  down() {}
}

module.exports = EstateAdjustPetsAllowedSchema
