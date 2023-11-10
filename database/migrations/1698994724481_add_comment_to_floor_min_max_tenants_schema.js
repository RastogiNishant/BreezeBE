'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCommentToFloorMinMaxTenantsSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table
        .integer('floor_min')
        .unsigned()
        .comment('the minimum nth floor the prosperty is located on building.')
        .alter()
      table
        .integer('floor_max')
        .unsigned()
        .comment('the maximum nth floor the prosperty is located on building.')
        .alter()
    })
  }

  down() {}
}

module.exports = AddCommentToFloorMinMaxTenantsSchema
