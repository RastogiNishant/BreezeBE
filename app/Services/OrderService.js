'use strict'

const HttpException = require('../Exceptions/HttpException')
const Logger = use('Logger')
const Database = use('Database')
const Order = use('App/Models/Order')
const moment = require('moment')
const { DAY_FORMAT, DATE_FORMAT } = require('../constants')
const ContractService = require('./ContractService')
const BillService = require('./BillService')
class OrderService {
  static async createOrder(data, trx) {
    return await Order.createItem(data, trx)
  }

  static async updateOrder(data, trx) {
    return await Order.query()
      .where('subscription_id', data.subscription_id)
      .where('start_at', data.start_at)
      .update(data)
      .transacting(trx)
  }

  static async getOrder({ subscription_id, start_at }) {
    let query = Order.query()

    if (subscription_id) {
      query.where('subscription_id', subscription_id)
    }

    if (start_at) {
      query.where('start_at', start_at)
    }

    return await query.first()
  }

  static async addInvoice(data, trx) {
    if (!data.subscription || !data.id) {
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

    const order = await this.getOrder({ subscription_id: data.subscription, start_at })
    const trx = await Database.beginTransaction()
    try {
      if (!order) {
        const contract = await ContractService.getContractBySubcription(order.subscription_id)
        await this.createOrder(
          {
            user_id: contract?.user_id,
            subscription_id: data.subscription,
            invoice_id: data.id,
            date: moment.utc(data.created * 1000).format(DATE_FORMAT),
            start_at,
            end_at,
            livemode: data.livemode,
          },
          trx
        )
      } else {
        await this.updateOrder(
          {
            subscription_id: data.subscription,
            invoice_id: data.id,
            start_at,
            end_at,
          },
          trx
        )
      }
      //TODO: create bill here
      await BillService.createBill({ invoide_id, boughtItems }, trx)
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      Logger.error(`Failed to create invoice ${e.message}`)
    }
  }
}

module.exports = OrderService
