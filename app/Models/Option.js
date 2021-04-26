'use strict'

const Model = require('./BaseModel')

class Option extends Model {
  static get columns() {
    return ['id', 'type', 'title']
  }

  static get traits() {
    return ['NoTimestamp']
  }

  static get readonly() {
    return ['id']
  }

  estates() {
    return this.belongsToMany('App/Models/Estate').pivotTable('estate_option')
  }
}

module.exports = Option
