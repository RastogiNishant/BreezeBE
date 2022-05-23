'use strict'

const { DISLIKE_REASON_MANUAL } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DislikeReason extends Schema {
  up() {
    this.table('dislikes', (table) => {
      table.string('reason').default(DISLIKE_REASON_MANUAL)
    })
  }

  down() {
    this.table('dislikes', (table) => {
      table.dropColumn('reason')
    })
  }
}

module.exports = DislikeReason
