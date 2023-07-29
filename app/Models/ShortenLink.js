'use strict'
const Model = require('./BaseModel')

class ShortenLink extends Model {
  static get columns() {
    //  PAY_MODE_UPFRONT: 1, PAY_MODE_ONE_TIME: 2, PAY_MODE_RECURRING: 3,
    return ['id', 'hash', 'link']
  }
}

module.exports = ShortenLink
