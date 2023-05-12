'use srict'

const Model = require('./BaseModel')
class PricePlan extends Model {
  static get columns() {
    return [
      'id',
      'name',
      'plan_id',
      'product_id',
      'price_id',
      'description',
      'one_time_pay',
      'status',
    ]
  }
}

module.exports = PricePlan
