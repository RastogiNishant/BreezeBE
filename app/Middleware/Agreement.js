'use strict'

const Static = use('Static')
const HttpException = use('App/Exceptions/HttpException')
const { get } = require('lodash')

const { ERROR_AGREEMENT_CONFIRM, ERROR_TERMS_CONFIRM, ROLE_ADMIN } = require('../constants')

class Agreement {
  async handle({ auth }, next) {
    // Skip anonymous routes and admin routes check
    if (!auth || !auth.user || auth.user.role === ROLE_ADMIN) {
      return next()
    }

    const { terms_id, agreements_id } = auth.user
    const data = Static.getData()
    const appAgreementId = get(data, 'agreement.id')
    const appTermsId = get(data, 'terms.id')

throw new HttpException( `Agreement ${appAgreementId}  ${appTermsId} ${agreements_id} ${terms_id}` )    

    if ((appAgreementId || 0) > (agreements_id || 0)) {
      throw new HttpException('User agreement confirmation need', 412, ERROR_AGREEMENT_CONFIRM)
    }

    if ((appTermsId || 0) > (terms_id || 0)) {
      throw new HttpException('User agreement confirmation need', 412, ERROR_TERMS_CONFIRM)
    }

    await next()
  }
}

module.exports = Agreement
