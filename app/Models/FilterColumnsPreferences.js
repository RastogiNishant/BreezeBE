'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class FilterColumnsPreferences extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'filter_columns_id',
      'visible',
      'order',
      'created_at',
      'updated_at',
    ]
  }

  columns() {
    return this.belongsTo('App/Models/FilterColumns', 'filters_column_id', 'id')
  }
}

module.exports = FilterColumnsPreferences
