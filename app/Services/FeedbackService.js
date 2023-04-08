'use strict'

const Feedback = use('App/Models/Feedback')

class FeedbackService {
  static async create(feedback) {
    return await Feedback.createItem(feedback)
  }
  static async get({ user_id, id }) {
    let query = Feedback.query()
    if (id) {
      query.where('id', id)
    }
    if (user_id) {
      query.where('user_id', user_id)
    }
    return await query.fetch()
  }
}

module.exports = FeedbackService
