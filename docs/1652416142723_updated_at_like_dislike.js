'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

const Database = use('Database')

class UpdatedAtLikeDislike extends Schema {
  // These columns for added to be able to using these tables with BaseModel

  async up() {
    this.table('dislikes', (table) => {
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
    this.table('likes', (table) => {
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down() {
    this.table('dislikes', (table) => {
      table.dropColumn('updated_at')
    })
    this.table('likes', (table) => {
      table.dropColumn('updated_at')
    })
  }
}

module.exports = UpdatedAtLikeDislike
