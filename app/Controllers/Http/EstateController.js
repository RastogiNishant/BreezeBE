'use strict'
const EstateService = use('App/Services/EstateService')
const Estate = use('App/Models/Estate')
const HttpException = use('App/Exceptions/HttpException')

const { STATUS_ACTIVE, STATUS_DRAFT } = require('../../constants')

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
  async updateEstate({ request, auth, response }) {
    const { id, ...data } = request.all()
    const estate = await Estate.findOrFail(id)
    if (estate.user_id !== auth.user.id) {
      throw new HttpException('Not allow', 403)
    }
    await estate.updateItem(data)

    response.res(estate)
  }

  /**
   *
   */
  async getEstates({ request, response }) {
    const result = await EstateService.getEstates(request.all())

    response.res(result)
  }

  /**
   *
   */
  async publishEstate({ request, auth, response }) {
    const { id, action } = request.all()
    const estate = await Estate.findOrFail(id)
    if (estate.user_id !== auth.user.id) {
      throw new HttpException('Not allow', 403)
    }
    // TODO: validate publish ready
    await estate.updateItem({ status: action === 'publish' ? STATUS_ACTIVE : STATUS_DRAFT }, true)
    response.res(true)
  }
}

module.exports = EstateController
