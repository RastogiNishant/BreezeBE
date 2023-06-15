'use srict'

const Model = require('./BaseModel')
class PricePlan extends Model {
  static get columns() {
    //  PAY_MODE_UPFRONT: 1, PAY_MODE_ONE_TIME: 2, PAY_MODE_RECURRING: 3,
    return [
      'id',
      'name',
      'plan_id',
      'product_id',
      'price_id',
      'description',
      'mode',
      'status',
      'type',
    ]
  }
}

module.exports = PricePlan
