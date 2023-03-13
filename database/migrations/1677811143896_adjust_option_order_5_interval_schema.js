'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const Option = use('App/Models/Option')

class AdjustOptionOrder5IntervalSchema extends Schema {
  async up() {
    let options = (
      await Option.query()
        .where('type', 'apt')
        .whereNot('order', 10000)
        .orderBy('order', 'asc')
        .fetch()
    ).rows
    options.map((option, index) => {
      option.order = (index + 1) * 10
      option.save()
    })

    options = (
      await Option.query()
        .where('type', 'build')
        .whereNot('order', 10000)
        .orderBy('order', 'asc')
        .fetch()
    ).rows
    options.map((option, index) => {
      option.order = (index + 1) * 10
      option.save()
    })

    options = (
      await Option.query()
        .where('type', 'out')
        .whereNot('order', 10000)
        .orderBy('order', 'asc')
        .fetch()
    ).rows
    options.map((option, index) => {
      option.order = (index + 1) * 10
      option.save()
    })
  }

  down() {}
}

module.exports = AdjustOptionOrder5IntervalSchema
