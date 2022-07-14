'use strict'

const PredefinedMessageChoice = use('App/Models/PredefinedMessageChoice')
const { STATUS_DELETE } = require('../constants')

class PredefinedMessageChoiceService {
  static async get(id) {
    return await PredefinedMessageChoice.query()
      .where('id', id)
      .whereNot('status', STATUS_DELETE)
      .firstOrFail()
  }

  static async getWithPredefinedMessageId({ id, predefined_message_id }) {
    return await PredefinedMessageChoice.query()
      .where('id', id)
      .where('predefined_message_id', predefined_message_id)
      .whereNot('status', STATUS_DELETE)
      .firstOrFail()
  }

  static async getAll(filter) {
    let query = PredefinedMessageChoice.query().whereNot('status', STATUS_DELETE)

    if (filter.predefined_message_id) {
      query.where('predefined_message_id', filter.predefined_message_id)
    }

    if (filter.next_predefined_message_id) {
      query.where('next_predefined_message_id', filter.next_predefined_message_id)
    }

    return (await query.fetch()).rows
  }

  static async create(data) {
    return await PredefinedMessageChoice.createItem({ ...data })
  }

  static async update(data) {
    return await PredefinedMessageChoice.query()
      .where('id', data.id)
      .whereNot('status', STATUS_DELETE)
      .update({ ...data })
  }

  static async delete(id) {
    return await PredefinedMessageChoice.query().where('id', id).update('status', STATUS_DELETE)
  }
}

module.exports = PredefinedMessageChoiceService
