'use strict'

const { PAID_PENDING_STATUS } = require('../constants')

const Bill = use('App/Models/Bill')
class BillService {
  static async createBill({ invoice_id, data }, trx) {
    data = Array.isArray(data) ? data : [data]

    const bills = data.map((item) => ({
      invoice_id,
      bill_id: item?.subscription_item,
      price_id: item?.price?.id,
      status: PAID_PENDING_STATUS,
    }))

    await Bill.createMany(bills, trx)
  }

  static async paidBill({ price_id }, trx) {}
}

module.exports = BillService
