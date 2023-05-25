'use strict'

const { STATUS_ACTIVE } = require('../constants')

const PricePlan = use('App/Models/PricePlan')
class PricePlanService {
  static async getAll(price_ids) {
    price_ids = Array.isArray(price_ids) ? price_ids : []
    return (
      await PricePlan.query().where('status', STATUS_ACTIVE).whereIn('price_id', price_ids).fetch()
    ).toJSON()
  }

  static async getPlanByProductId(product_ids) {
    product_ids = Array.isArray(product_ids) ? product_ids : [product_ids]
    return (
      await PricePlan.query()
        .where('status', STATUS_ACTIVE)
        .whereIn('product_id', product_ids)
        .fetch()
    ).toJSON()
  }

  static async getPlanId(price_ids) {
    price_ids = Array.isArray(price_ids) ? price_ids : [price_ids]
    const prices = await this.getAll(price_ids)
    return prices?.[0]?.plan_id
  }

  static async get({ plan_id, type }) {
    let query = PricePlan.query()
    if (plan_id) {
      query.where('plan_id', plan_id)
    }
    if (type) {
      query.where('type', type)
    }
    return await query.first()
  }
}

module.exports = PricePlanService
