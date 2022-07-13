'use strict'

const PredefinedMessageChoice = use('App/Models/PredefinedMessageChoice')

class PredefinedMessageChoiceService {
  static async get(id) {
    return await PredefinedMessageChoice.query().where('id', id).firstOrFail()
  }

  static async getWithPredefinedMessageId({ id, predefined_message_id }) {
    return await PredefinedMessageChoice.query()
      .where('id', id)
      .where('predefined_message_id', predefined_message_id)
      .firstOrFail()
  }

  static async getAll(filter) {
    let query = PredefinedMessageChoice.query()

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
      .update({ ...data })
  }

  static async delete(id) {
    return await PredefinedMessageChoice.query().where('id', id).delete()
  }
}

module.exports = PredefinedMessageChoiceService
