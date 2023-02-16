'use strict'

const PredefinedMessageService = use('App/Services/PredefinedMessageService')

class PredefinedMessageController {
  async get({ request, response }) {
    const { id } = request.all()
    response.res(await PredefinedMessageService.get(id))
  }

  async getAll({ request, response }) {
    const { type } = request.all()
    response.res(await PredefinedMessageService.getAll({ type }))
  }

  async create({ request, response }) {
    const { ...data } = request.all()
    response.res(await PredefinedMessageService.create(data))
  }

  async update({ request, response }) {
    const { ...data } = request.all()
    response.res(await PredefinedMessageService.update(data))
  }

  async delete({ request, response }) {
    const { id } = request.all()
    response.res(await PredefinedMessageService.delete(id))
  }
}

module.exports = PredefinedMessageController
