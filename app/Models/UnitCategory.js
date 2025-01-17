'use strict'

const { STATUS_DELETE } = require('../constants')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class UnitCategory extends Model {
  static get columns() {
    return [
      'id',
      'build_id',
      'name',
      'rooms',
      'area',
      'rent',
      'income_level',
      'household_size',
      'property_id'
    ]
  }

  estates() {
    this.hasMany('App/Models/Estate', 'id', 'unit_category_id').whereNot('status', STATUS_DELETE)
  }

  building() {
    this.belongsTo('App/Models/Building', 'build_id', 'id')
  }
}

module.exports = UnitCategory
