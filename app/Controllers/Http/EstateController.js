'use strict'
const EstateService = use('App/Services/EstateService')

const {} = require

class EstateController {
  /**
   *
   */
  async createEstate({ request, auth, response }) {
    const estate = await EstateService.createEstate(request.all(), auth.user.id)
    response.res(estate)
  }

  /**
   *
   */
  async updateEstate({ request, response }) {
    // TODO: estate
  }

  /**
   *
   */
  async getEstates({ request, response }) {
    const { filters } = request.all()
    const result = await EstateService.getEstates(filters)

    response.res(result)
  }
}

module.exports = EstateController
