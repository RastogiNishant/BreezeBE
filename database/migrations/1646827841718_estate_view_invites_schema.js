'use strict'

const { table } = require('@adonisjs/lucid/src/Lucid/Model')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EstateViewInvitesSchema extends Schema {
  up () {
    //invited_by could be of any user types...
    this.create('estate_view_invites', (table) => {
      table.increments()
      table.integer('invited_by').unsigned().references('id').inTable('users')
      table.integer('estate_id').unsigned().references('id').inTable('estates').unique()
      table.string('code', 8).unique()
      table.timestamps()
      table.index(['code'])
    })

    //who are invited by the user to view this estate
    this.create('estate_view_invited_emails', (table) => {
      table.increments()
      table.integer('estate_view_invite_id').unsigned().references('id').inTable('estate_view_invites')
      table.string('email', 255)
      table.unique(['estate_view_invite_id', 'email'])
    })

    //holds what estates the user are invited to view
    this.create('estate_view_invited_users', (table) => {
      table.increments()
      table.integer('estate_view_invite_id').unsigned().references('id').inTable('estate_view_invites')
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.unique(['estate_view_invite_id', 'user_id'])
    })
  }

  down () {
    this.drop('estate_view_invited_emails')
    this.drop('estate_view_invited_users')
    this.drop('estate_view_invites')
  }
}

module.exports = EstateViewInvitesSchema
