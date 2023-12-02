'use strict'

const Payment = use('App/Models/Payment')
const BillingAddressService = use('App/Services/BillingAddressService')
const HttpException = use('App/Exceptions/HttpException')
const AppException = use('App/Exceptions/AppException')

/** @type {typeof import('/providers/Static')} */

class BillingAddressController {
  /**
   *
   */
  async addBillingAddress({ request, auth, response }) {
    const { ...data } = request.all()
    const { billingAddress } = await BillingAddressService.createBillingAddress({
      ...data,
      user_id: auth.current.user.id
    })
    return billingAddress
  }

  /**
   *
   */
  async getUserBillingAddress({ request, auth, response }) {
    const billingAddress = await BillingAddressService.getUserBillingAddress(auth.current.user.id)
    return response.res(billingAddress)
  }

  /**
   *
   */
  async updateBillingAddress({ request, auth, response }) {
    const { id, ...data } = request.all()
    const { billingAddress } = await BillingAddressService.updateBillingAddress(
      id,
      auth.current.user.id,
      data
    )
    return response.res(billingAddress)
  }
}

module.exports = BillingAddressController
