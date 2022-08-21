'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class FilterColumns extends Model {
  static get columns() {
    return [
      'id',
      'filterName',
      'tableName',
      'tableAlias',
      'fieldName',
      'status',
      'order',
      'created_at',
      'updated_at',
    ]
  }
}

module.exports = FilterColumns
