'use strict'

const { MONTHLY_PAYMENT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

const Database = use('Database')

class TenantMontlyYearlySchema extends Schema {
  async up () {
    await this.create('tenant_payment_plans', (table) => {
      table.increments()
      table.string('name', 255)
      table.integer('plan_id').unsigned().index()
      table.foreign('plan_id').references('id').on('plans').onDelete('cascade')
      table.decimal('price').defaultTo(0)
      table.integer('plan_option').defaultTo(MONTHLY_PAYMENT)
      table.text('description').nullable()
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })

    // this.schedule(async (trx) => {
    //   await Database.raw(planSql)
    // })    
  }

  down () {
    this.drop('tenant_payment_plan')
  }
}

module.exports = TenantMontlyYearlySchema
