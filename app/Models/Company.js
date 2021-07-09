'use strict'

const Model = require('./BaseModel')

class Company extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'name',
      'address',
      'tax_number',
      'trade_register_nr',
      'umsst',
      'status',
      'type',
    ]
  }
}

module.exports = Company
