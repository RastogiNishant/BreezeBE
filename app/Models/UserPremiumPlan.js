'use strict'

const Model = require('./BaseModel')

class UserPremiumPlan extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'premium_id',
    ]
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/CompanySerializer'
  }
}

module.exports = Company
