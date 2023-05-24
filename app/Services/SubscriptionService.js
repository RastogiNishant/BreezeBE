'use strict'

const { STATUS_DELETE, STATUS_DRAFT } = require('../constants')

const Subscription = use('App/Models/Subscription')

class SubscriptionService {
  static async createSubscription(data, trx) {
    await Subscription.createItem(data, trx)
    /*TODO: 
      - create order
      - create bills for that order
      - update order 
    */
  }

  static async updateSubscription({ subscription_id, status }, trx) {
    return await Subscription.query()
      .where('subscription_id', subscription_id)
      .update({ status })
      .transacting(trx)
  }

  static async updateSubscriptionByContractId({ contract_id, status }, trx) {
    return await Subscription.query()
      .where('contract_id', contract_id)
      .update({ status })
      .transacting(trx)
  }

  static async getContractByContract(contract_id) {
    return await Subscription.query()
      .where('contract_id', contract_id)
      .whereNotIn('status', [STATUS_DELETE])
      .first()
  }
  static async getContractBySubcription(subscription_id) {
    return await Subscription.query()
      .where('subscription_id', subscription_id)
      .whereNotIn('status', [STATUS_DELETE])
      .first()
  }
}

module.exports = SubscriptionService
