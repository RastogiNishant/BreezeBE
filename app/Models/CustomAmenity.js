'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */

const Model = require('./BaseModel')

class CustomAmenity extends Model {
  static get table() {
    return 'room_custom_amenities'
  }
  static get columns() {
    return ['id', 'amenity']
  }
}

module.exports = CustomAmenity
