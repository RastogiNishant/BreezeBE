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
    ]
  }
  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = Building
