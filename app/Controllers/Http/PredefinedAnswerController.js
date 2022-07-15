'use strict'

const HttpException = require('../../Exceptions/HttpException')

const PredefinedAnswerService = use('App/Services/PredefinedAnswerService')

class PredefinedAnswerController {
  async createPredefinedAnswer({ request, auth, response }) {
    try {
      const { ...data } = request.all()
      response.res(await PredefinedAnswerService.create(auth.user.id, data))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async updatePredefinedAnswer({ request, auth, response }) {
    try {
      const { ...data } = request.all()
      response.res(await PredefinedAnswerService.update(auth.user.id, data))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async deletePredefinedAnswer({ request, auth, response }) {
    try {
      const { id } = request.all()
      response.res(await PredefinedAnswerService.delete(id, auth.user.id))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }
}

module.exports = PredefinedAnswerController
