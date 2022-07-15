'use strict'

const PredefinedMessageService = use('App/Services/PredefinedMessageService')

class PredefinedMessageController {
  async get({ request, auth, response }) {
    const { id } = request.all()
    response.res(await PredefinedMessageService.get(id))
  }

  async getAll({ request, auth, response }) {
    response.res(await PredefinedMessageService.getAll())
  }

  async create({ request, auth, response }) {
    const { ...data } = request.all()
    response.res(await PredefinedMessageService.create(data))
  }

  async update({ request, auth, response }) {
    const { ...data } = request.all()
    response.res(await PredefinedMessageService.update(data))
  }

  async delete({ request, auth, response }) {
    const { id } = request.all()
    response.res(await PredefinedMessageService.delete(id))
  }
}

module.exports = PredefinedMessageController
