'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCommentsMatchesSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      table
        .integer('profile_status')
        .unsigned()
        .defaultTo(0)
        .comment(
          `share profile request status,
          0 - share profile not requested, 
          1 - share profile requested,
          2 - share profile approved,
          3 - share profile declined`
        )
        .alter()
      table
        .boolean('share')
        .defaultTo(false)
        .comment(`whether prospect allows to share profile or not`)
        .alter()
    })
  }

  down() {
    this.table('matches', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddCommentsMatchesSchema
