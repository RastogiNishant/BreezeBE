'use strict'

const { STATUS_DELETE } = require('../constants')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UnitCategory extends Model {
  static get columns() {
    return [
      'id',
      'building_id',
      'name',
      'rooms',
      'area_min',
      'area_max',
      'rent_min',
      'rent_max',
      'income_level',
      'household_size',
    ]
  }

  estates() {
    this.hasMany('App/Models/Estate', 'id', 'unit_category_id').whereNot('status', STATUS_DELETE)
  }
}

module.exports = UnitCategory
