'use strict'
const EstateService = use('App/Services/EstateService')

const {} = require

class EstateController {
  /**
   *
   */
  async createEstate({ request, auth, response }) {
    const estate = EstateService.createEstate(request.all(), auth.user.id)

    return estate
  }

  /**
   *
   */
  async updateEstate({ request, response }) {
    // TODO: estate
  }
}

module.exports = EstateController
