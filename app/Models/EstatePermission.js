'use strict'

const Model = require('./BaseModel')

class EstatePermission extends Model {

  static boot () {
    if (this.booted) {
      return
    }

    super.boot()
  }

  static get columns() {
    return ['id', 'property_manager_id', 'landlord_id','status']
  }
  propertyManager() {
    return this.belongsTo('App/Models/User', 'property_manager_id', 'id')
  }
  landlord() {
    return this.belongsTo('App/Models/User', 'landlord_id', 'id')
  }

  /**
   *
   */
   static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = EstatePermission
