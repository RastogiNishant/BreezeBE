const Agreement = use('App/Models/Agreement')
const Term = use('App/Models/Term')

const { STATUS_ACTIVE } = require('../constants')

class AgreementService {
  /**
   *
   */
  static async getLatestActive() {
    return Agreement.query().where('status', STATUS_ACTIVE).orderBy('id', 'desc').first()
  }

  /**
   *
   */
  static async getActiveTerms() {
    return Term.query().where('status', STATUS_ACTIVE).orderBy('id', 'desc').first()
  }
}

module.exports = AgreementService
