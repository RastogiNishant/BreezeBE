'use strict'
const BuildingService = use('App/Services/BuildingService')

class BuildingController {
  async create({ request, auth, response }) {
    const data = request.all()
    response.res(await BuildingService.create({ user_id: auth.user.id, data }))
  }

  async delete({ request, auth, response }) {
    const { id } = request.all()
    response.res(await BuildingService.delete({ id, user_id: auth.user.id }))
  }

  async get({ request, auth, response }) {
    const { id } = request.all()
    response.res(await BuildingService.get({ id, user_id: auth.user.id }))
  }

  async getAll({ request, auth, response }) {
    response.res(await BuildingService.getAll(auth.user.id))
  }
}

module.exports = BuildingController
