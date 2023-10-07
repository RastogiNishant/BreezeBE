'use strict'

const Model = require('./BaseModel')

class Building extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'name',
      'building_id',
      'house_number',
      'street',
      'zip',
      'city',
      'country',
      'extra_address',
      'marketplace_estate_ids',
      'published',
    ]
  }
  static get traits() {
    return ['NoTimestamp']
  }

  estates() {
    return this.hasMany('App/Models/Estate', 'id', 'build_id')
  }

  static get Serializer() {
    return 'App/Serializers/BuildingSerializer'
  }

  categories() {
    return this.hasMany('App/Models/UnitCategory', 'id', 'build_id')
  }

  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }
}

module.exports = Building
