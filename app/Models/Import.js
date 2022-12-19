'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class Import extends Model {
  static get columns() {
    return ['id', 'user_id', 'filename', 'type', 'entity', 'action']
  }
}

module.exports = Import
