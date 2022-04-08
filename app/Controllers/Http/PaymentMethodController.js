'use strict'

const PaymentMethodService = use('App/Services/PaymentMethodService')
const HttpException = use('App/Exceptions/HttpException')
const AppException = use('App/Exceptions/AppException')

/** @type {typeof import('/providers/Static')} */

class PaymentMethodController {
  
  /**
   *
   */
  async post({ request, auth, response }) {
    try {
      const { ...data } = request.all()
      const resp = await PaymentMethodService.create({
          ...data,
          user_id: auth.current.user.id,
      })

      return response.res(resp)
    } catch (e) {
      throw e
    }
  }
  /**
   *
   */
  async update({ request, auth, response }) {

    try {
      const { id, ...data } = request.all()
      const { resp } = await PaymentMethodService.update(
        id,
        auth.current.user.id,
      )
      return response.res(resp)
    } catch (e) {
      console.log('exception:', e)
      throw e
    }
  }
  /**
   *
   */
  async get({ request, auth, response }) {
    try {
      const resp = await PaymentMethodService.get(auth.current.user.id)
      return response.res(resp)
    } catch (e) {
      throw e
    }
  }

}

module.exports = PaymentMethodController
