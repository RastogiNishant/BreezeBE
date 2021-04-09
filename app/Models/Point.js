'use strict'

const Model = require('./BaseModel')

class Point extends Model {
  static get columns() {
    return ['id', 'lat', 'lon', 'data']
  }

  static get traits() {
    return ['NoTimestamp']
  }

  /**
   *
   */
  set(name, value) {
    if (['lat', 'lon'].includes(name)) {
      value = this.constructor.round(value)
    }

    super.set(name, value)
  }

  /**
   * 0.0003 precision
   */
  static round(n) {
    return parseFloat((Math.round(parseFloat(n) * 3000) / 3000).toFixed(4))
  }
}

module.exports = Point
