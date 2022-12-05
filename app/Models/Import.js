'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class Import extends Model {
  static get columns() {
    return ['id', 'user_id', 'file_name', 'type', 'entity']
  }
}

module.exports = Import
