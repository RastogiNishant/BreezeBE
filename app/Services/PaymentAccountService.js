'use strict'

const HttpException = require('../Exceptions/HttpException')
const { PAYMENT_METHOD_STRIPE, DATE_FORMAT, STATUS_ACTIVE } = require('../constants')

const PaymentAccount = use('App/Models/PaymentAccount')
const UserService = use('App/Services/UserService')

class PaymentAccountService {
  static async saveCustomer({ user_id, account_id, livemode, date }, trx) {
    try {
      const user = await UserService.getById(user_id)
      if (!user) {
        return null
      }

      if (await this.getByUserId({ user_id, account_id })) {
        return
      }

      await PaymentAccount.createItem(
        {
          user_id,
          account_id,
          payment_method: PAYMENT_METHOD_STRIPE,
          livemode,
          date: date || moment.utc(new Date()).format(DATE_FORMAT),
        },
        trx
      )
    } catch (e) {
      console.log('Save customer error', e.message)
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async deleteCustomer({ user_id, account_id }, trx) {
    await PaymentAccount.query()
      .where('user_id', user_id)
      .where('account_id', account_id)
      .transacting(trx)
  }

  static async getByUserId({ user_id, account_id }) {
    return await PaymentAccount.query()
      .where('user_id', user_id)
      .where('account_id', account_id)
      .where('status', STATUS_ACTIVE)
      .first()
  }

  static async getByAccountId(account_id) {
    return await PaymentAccount.query().where('account_id', account_id).first()
  }
}

module.exports = PaymentAccountService
