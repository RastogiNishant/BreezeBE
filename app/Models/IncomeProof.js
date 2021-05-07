'use strict'

const Model = require('./BaseModel')

class IncomeProof extends Model {
  static get columns() {
    return ['id', 'income_id', 'file', 'expire_date']
  }

  static get readonly() {
    return ['id', 'income_id']
  }

  static get traits() {
    return ['NoTimestamp']
  }

  income() {
    return this.belongsTo('App/Models/Income', 'income_id', 'id')
  }
}

module.exports = IncomeProof
