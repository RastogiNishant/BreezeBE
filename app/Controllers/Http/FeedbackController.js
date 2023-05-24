'use strict'

const FeedbackService = require('../../Services/FeedbackService')

class FeedbackController {
  async create({ request, auth, response }) {
    const { description, device, point } = request.all()
    response.res(
      await FeedbackService.create({
        user_id: auth.user.id,
        description,
        device,
        point,
      })
    )
  }

  async getAll({ request, auth, response }) {
    response.res(await FeedbackService.get({}))
  }
}

module.exports = FeedbackController
