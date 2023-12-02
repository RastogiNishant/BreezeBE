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
    const { ...data } = request.all()
    const resp = await PaymentMethodService.create({
      ...data,
      user_id: auth.current.user.id
    })

    return response.res(resp)
  }

  /**
   *
   */
  async update({ request, auth, response }) {
    const { id } = request.all()
    const { resp } = await PaymentMethodService.update(id, auth.current.user.id)
    return response.res(resp)
  }

  /**
   *
   */
  async get({ auth, response }) {
    const resp = await PaymentMethodService.get(auth.current.user.id)
    return response.res(resp)
  }
}

module.exports = PaymentMethodController
