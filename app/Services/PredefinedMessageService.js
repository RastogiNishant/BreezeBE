'use strict'

const { STATUS_DELETE } = require('../constants')

const PredefinedMessage = use('App/Models/PredefinedMessage')

class PredefinedMessageService {
  static async get(id) {
    return await PredefinedMessage.query().with('choices').where('id', id).firstOrFail()
  }

  static async getAll() {
    return (
      await PredefinedMessage.query()
        .with('choices')
        .whereNot('status', STATUS_DELETE)
        .orderBy('step', 'id')
        .fetch()
    ).rows
  }

  static async create(data) {
    return await PredefinedMessage.createItem({ ...data })
  }

  static async update(data) {
    return await PredefinedMessage.query()
      .where({ id: data.id })
      .update({
        ...data,
      })
  }

  static async delete(id) {
    return await PredefinedMessage.query().where({ id: id }).update('status', STATUS_DELETE)
  }
}

module.exports = PredefinedMessageService
