import { get } from 'lodash'
import { APP_ROLES } from '../constants'
import * as constants from '../constants'

// @ts-expect-error
const { ERROR_AGREEMENT_CONFIRM, ERROR_TERMS_CONFIRM } = constants

const Static = use('Static')
const HttpException = use('App/Exceptions/HttpException')

class Agreement {
  async handle ({ auth }, next: Function): Promise<any> {
    // Skip anonymous routes and admin routes check
    if (auth?.user === undefined || auth.user.role === APP_ROLES.ADMIN) {
      return next()
    }

    const { terms_id: termsId, agreements_id: agreementsId } = auth.user
    const data = Static.getData()
    const appAgreementId = get(data, 'agreement.id')
    const appTermsId = get(data, 'terms.id')

    if ((appAgreementId ?? 0) > (agreementsId ?? 0)) {
      throw new HttpException('User agreement confirmation need', 412, ERROR_AGREEMENT_CONFIRM)
    }

    if ((appTermsId ?? 0) > (termsId ?? 0)) {
      throw new HttpException('User agreement confirmation need', 412, ERROR_TERMS_CONFIRM)
    }

    await next()
  }
}

module.exports = Agreement
