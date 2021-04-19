'use strict'

const Agreement = use('App/Models/Agreement')
const Term = use('App/Models/Term')

const { STATUS_DRAFT, STATUS_DELETE } = require('../../../constants')

class AgreementController {
  /**
   *
   */
  async getAgreements({ request, response }) {
    const agreements = await Agreement.query().whereNot('status', STATUS_DELETE).fetch()
    response.res(agreements)
  }

  /**
   *
   */
  async createAgreement({ request, response }) {
    const data = request.all()
    const agreement = await Agreement.createItem({
      ...data,
      status: STATUS_DRAFT,
    })
    response.res(agreement)
  }

  /**
   *
   */
  async updateAgreement({ request, response }) {
    const { id, ...data } = request.all()
    const agreement = await Agreement.findOrFail(id)
    await agreement.updateItem(data)

    response.res(agreement)
  }

  /**
   *
   */
  async deleteAgreement({ request, response }) {
    const { id } = request.all()
    await Agreement.query().update('status', STATUS_DELETE).where('id', id)

    response.res(true)
  }

  /**
   *
   */
  createTerm({ request, response }) {
    response.res(true)
  }

  /**
   *
   */
  updateTerm({ request, response }) {
    response.res(true)
  }

  /**
   *
   */
  deleteTerm({ request, response }) {
    response.res(true)
  }
}

module.exports = AgreementController
