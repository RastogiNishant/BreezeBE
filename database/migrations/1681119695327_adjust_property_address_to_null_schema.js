'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Task = use('App/Models/Task')

class AdjustPropertyAddressToNullSchema extends Schema {
  async up() {
    await Task.query().update({ property_address: null })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AdjustPropertyAddressToNullSchema
