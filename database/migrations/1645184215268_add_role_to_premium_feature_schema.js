'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

const { PLAN_FEATURE_COMMON, PLAN_FEATURE_NEW, ROLE_LANDLORD, ROLE_USER } = require('../../app/constants')
class AddRoleToPremiumFeatureSchema extends Schema {
  up () {
    this.table('premium_features', (table) => {
      // alter table
      table.integer('role_id').unsigned()
      table.enum('feature_label', [PLAN_FEATURE_COMMON, PLAN_FEATURE_NEW])
    })
  }

  down () {
    this.table('premium_features', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddRoleToPremiumFeatureSchema
