'use strict'

class EstateController {
  /**
   *
   */
  async createEstate({ request, response }) {
    console.log(request.all())

    return 'done'
  }

  /**
   *
   */
  async updateEstate({ request, response }) {
    // TODO: estate
  }
}

module.exports = EstateController
