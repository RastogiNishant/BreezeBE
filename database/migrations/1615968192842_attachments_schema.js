'use strict'

const Schema = use('Schema')

const { ATTACHMENT_PICTURE, STATUS_ACTIVE } = require('../../app/constants')

class AttachmentsSchema extends Schema {
  up () {
    this.create('attachments', (table) => {
      table.increments()
      table.integer('type').unsigned().defaultTo(ATTACHMENT_PICTURE)
      table.string('link', 512)
      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
    })
  }

  down () {
    this.drop('attachments')
  }
}

module.exports = AttachmentsSchema
