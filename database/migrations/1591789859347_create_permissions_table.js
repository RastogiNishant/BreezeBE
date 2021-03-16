'use strict'

const Schema = use('Schema')

class PermissionsTableSchema extends Schema {
  up() {
    this.create('permissions', (table) => {
      table.increments()
      table.string('slug').notNullable().unique()
      table.string('name').notNullable().unique()
      table.text('description').nullable()
      table.timestamps()
    })

    this.create('roles', (table) => {
      table.increments()
      table.string('slug').notNullable().unique()
      table.string('name').notNullable().unique()
      table.text('description').nullable()
      table.timestamps()
    })

    this.create('permission_role', (table) => {
      table.increments()
      table.integer('permission_id').unsigned().index()
      table.foreign('permission_id').references('id').on('permissions').onDelete('cascade')
      table.integer('role_id').unsigned().index()
      table.foreign('role_id').references('id').on('roles').onDelete('cascade')
      table.timestamps()
    })

    this.create('permission_user', (table) => {
      table.increments()
      table.integer('permission_id').unsigned().index()
      table.foreign('permission_id').references('id').on('permissions').onDelete('cascade')
      table.integer('user_id').unsigned().index()
      table.foreign('user_id').references('id').on('users').onDelete('cascade')
      table.timestamps()
    })

    this.create('role_user', (table) => {
      table.increments()
      table.integer('role_id').unsigned().index()
      table.foreign('role_id').references('id').on('roles').onDelete('cascade')
      table.integer('user_id').unsigned().index()
      table.foreign('user_id').references('id').on('users').onDelete('cascade')
      table.timestamps()
    })
  }

  down() {
    console.log(__filename)
    this.drop('role_user')
    this.drop('permission_user')
    this.drop('permission_role')
    this.drop('roles')
    this.drop('permissions')
  }
}

module.exports = PermissionsTableSchema
