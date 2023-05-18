'use strict'

const Order = use('App/Models/Order')

class OrderService {
  static async createOrder(data, trx) {
    return await Order.createItem(data, trx)
  }

  static async updateOrder(data, trx) {
    return await Order.query().where('contract_id', data.contract_id).update(data).transacting(trx)
  }
}

module.exports = OrderService
