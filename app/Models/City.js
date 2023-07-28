'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class City extends Model {
  static get columns() {
    return ['id', 'country', 'other_name', 'alpha2', 'city']
  }
  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = City
