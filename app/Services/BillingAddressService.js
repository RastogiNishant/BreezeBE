'use strict'
const BillingAddress = use('App/Models/BillingAddress')

class BillingAddressService {
  /**
   * Create Billing Address flow
   */
  static async createBillingAddress(data) {
    const address = await BillingAddress.createItem(data)
    return { address }
  }
  /**
   *
   */
  static async updateBillingAddress(billingId, userId, data) {

    const billingAddress = await BillingAddress.query().where({ user_id: userId,  id: billingId}).first()
    if (!billingAddress) {
      throw new AppException('BillingAddress not exists')
    }

    await billingAddress.updateItem(data)

    return billingAddress
  }
  /**
   *
   */
  static async getUserBillingAddress(userId) {
    return await BillingAddress.query()
      .where('user_id', userId)
      .orderBy('updated_at', 'desc')
      .first()
  }
}

module.exports = BillingAddressService
