'use strict'

const PredefinedMessageChoiceService = use('App/Services/PredefinedMessageChoiceService')

class PredefinedMessageChoiceController {
  async create({ request, auth, response }) {
    const { ...data } = request.all()
    response.res(await PredefinedMessageChoiceService.create(data))
  }

  async update({ request, auth, response }) {
    const { ...data } = request.all()
    response.res(await PredefinedMessageChoiceService.update(data))
  }

  async delete({ request, auth, response }) {
    const { id } = request.all()
    response.res(await PredefinedMessageChoiceService.delete(id))
  }

  async get({ request, auth, response }) {
    const { id } = request.all()
    response.res(await PredefinedMessageChoiceService.get(id))
  }

  async getAll({ request, auth, response }) {
    const { ...filter } = request.all()
    response.res(await PredefinedMessageChoiceService.getAll(filter))
  }
}

module.exports = PredefinedMessageChoiceController
