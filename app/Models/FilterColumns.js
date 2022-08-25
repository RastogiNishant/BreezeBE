'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class FilterColumns extends Model {
  static get columns() {
    return [
      'id',
      'name',      
      'filterName',
      'tableName',
      'tableAlias',
      'fieldName',
      'status',
      'order',
      'default_visible',
      'used_global_search',
      'is_used_filter',
      'created_at',
      'updated_at',
    ]
  }

  static get Serializer() {
    return 'App/Serializers/FilterColumnsSerializer'
  }

}

module.exports = FilterColumns
