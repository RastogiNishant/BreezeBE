'use strict'

const Schema = use('Schema')

class DislikeSchema extends Schema {
  up() {
    this.create('dislikes', (table) => {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('cascade')
      table.integer('estate_id').unsigned().references('id').inTable('estates').onDelete('cascade')
      table.unique(['user_id', 'estate_id'])
    })

    this.drop('likes')
    this.create('likes', (table) => {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('cascade')
      table.integer('estate_id').unsigned().references('id').inTable('estates').onDelete('cascade')
      table.unique(['user_id', 'estate_id'])
    })
  }

  down() {
    this.drop('dislikes')
  }
}

module.exports = DislikeSchema
