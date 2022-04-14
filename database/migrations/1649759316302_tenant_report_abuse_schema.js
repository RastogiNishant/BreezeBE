'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class TenantReportAbuseSchema extends Schema {
  up () {
    this.create('tenant_report_abuses', (table) => {
      table.increments()
      table.integer('tenant_id').unsigned().references('id').inTable('users')
      table.integer('estate_id').unsigned().references('id').inTable('estates')      
      table.text('abuse')
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down () {
    this.drop('tenant_report_abuses')
  }  
}

module.exports = TenantReportAbuseSchema
