'use strict'

const Model = require('./BaseModel')

class PremiumFeature extends Model {
  static get columns() {
    return [
      'id',
      'feature',
      'description',
    ]
  }

  /**
   *
   */
   static get traits() {
    return ['NoTimestamp']
  }  
}

module.exports = PremiumFeature
