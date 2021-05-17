'use strict'

const Schema = use('Schema')
const {
  INCOME_TYPE_EMPLOYEE,
  INCOME_TYPE_UNEMPLOYED,
  INCOME_TYPE_PENSION,
  INCOME_TYPE_SELF_EMPLOYED,
  INCOME_TYPE_STUDENT_TRAINEE,
  INCOME_TYPE_PRIVATE,
} = require('../../app/constants')

class LikeSchema extends Schema {
  up() {
    this.create('likes', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('cascade')
      table.integer('estate_id').unsigned().references('id').inTable('estates').onDelete('cascade')
      table.unique(['user_id', 'estate_id'])
    })

    this.table('incomes', (table) => {
      table.enum('income_type', [
        INCOME_TYPE_EMPLOYEE,
        INCOME_TYPE_UNEMPLOYED,
        INCOME_TYPE_PENSION,
        INCOME_TYPE_SELF_EMPLOYED,
        INCOME_TYPE_STUDENT_TRAINEE,
        INCOME_TYPE_PRIVATE,
      ])
      table.string('company', 255)
    })
  }

  down() {
    this.drop('likes')
  }
}

module.exports = LikeSchema
