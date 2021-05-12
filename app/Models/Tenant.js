'use strict'

const Model = require('./BaseModel')

class Tenant extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'private_use',
      'pets',
      'pets_species',
      'parking_space',
      'coord',
      'dist_type',
      'dist_min',
      'budget_min',
      'budget_max',
      'include_utility',
      'rooms_min',
      'rooms_max',
      'floor_min',
      'floor_max',
      'space_min',
      'space_max',
      'apt_type',
      'house_type',
      'garden',
    ]
  }

  /**
   *
   */
  static get traits() {
    return ['NoTimestamp']
  }

  /**
   *
   */
  static get readonly() {
    return ['id', 'user_id']
  }

  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }
}

module.exports = Tenant
