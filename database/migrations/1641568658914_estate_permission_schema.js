'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class EstatePermissionSchema extends Schema {
  up () {
    this.create('estate_permissions', (table) => {
      table.increments()
      table.integer('property_manager_id').unsigned().index()
      table.integer('landlord_id').unsigned().index()
      table.foreign('property_manager_id').references('id').on('users').onDelete('SET NULL')
      table.foreign('landlord_id').references('id').on('users').onDelete('SET NULL')
      table.integer('status').unsigned().index()
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down () {
    this.drop('estate_permissions')
  }
}

module.exports = EstatePermissionSchema