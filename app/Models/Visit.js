'use strict'

const Model = require('./BaseModel')

class Visit extends Model {
  static get columns() {
    return ['estate_id', 'date', 'start_date', 'end_date', 'tenant_status', 'lord_status']
  }
}

module.exports = Visit
