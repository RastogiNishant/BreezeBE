'use strict'

const Model = require('./BaseModel')

class Plan extends Model {
  static get columns() {
    return [
      'id',
      'name',
      'description',
      'prices',
    ]
  }

  static get traits() {
    return ['NoTimestamp']
  }  
}

module.exports = Plan
