'use strict'

const HttpException = require('../Exceptions/HttpException')
const Logger = use('Logger')
const Database = use('Database')
const Order = use('App/Models/Order')
const moment = require('moment')
const { DAY_FORMAT, DATE_FORMAT } = require('../constants')
const SubscriptionService = require('./SubscriptionService')
const BillService = require('./BillService')
class OrderService {
  static async createOrder(data, trx) {
    return await Order.createItem(data, trx)
  }

  static async updateOrder(data) {
    return await Order.query().where('invoice_id', data.invoice_id).update(data)
  }

  static async getOrderByInvoice(invoice_id) {
    return await Order.query().where('invoice_id', invoice_id).first()
  }

  static async addInvoice(data) {
    if (!data.id) {
      throw new HttpException('Invoice format is wrong', 400)
    }

    const boughtItems = data.lines?.data
    if (!boughtItems?.length) {
      Logger.error(`There is no bought Items, stripe configuration wrong!!!`)
      throw new HttpException('Wrong Stripe configuration', 400)
    }

    const start_at = moment
      .utc((boughtItems[0]?.period?.start || new Date().getTime() / 1000) * 1000)
      .format(DAY_FORMAT)

    const end_at = moment
      .utc(
        (boughtItems[0]?.period?.end ||
          parseInt(moment.utc(new Date()).add(31, 'days').format('x')) / 1000) * 1000
      )
      .format(DAY_FORMAT)

    const trx = await Database.beginTransaction()
    try {
      if (boughtItems[0]?.subscription) {
        const subscription = await SubscriptionService.getContractBySubcription(
          boughtItems[0]?.subscription
        )
      }

      await this.createOrder(
        {
          subscription_id: data.subscription,
          invoice_id: data.id,
          date: moment.utc(data.created * 1000).format(DATE_FORMAT),
          start_at,
          end_at,
          livemode: data.livemode,
        },
        trx
      )
      //TODO: create bill here
      await BillService.createBill({ invoice_id: data.id, data: boughtItems }, trx)
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      Logger.error(`Failed to create invoice ${e.message}`)
    }
  }
}

module.exports = OrderService
