'use strict'

const PredefinedMessageChoice = use('App/Models/PredefinedMessageChoice')
const { STATUS_DELETE } = require('../constants')
const Database = use('Database')

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

    const columns = PredefinedMessageChoice.columns.map(c => `predefined_message_choices.${c}`)
    let query = PredefinedMessageChoice.query()
      .select(columns)
      .whereNot('predefined_message_choices.status', STATUS_DELETE).orderBy('predefined_message_choices.id')

    if (filter.predefined_message_id) {
      query.where('predefined_message_id', filter.predefined_message_id)
    }

    if (filter.next_predefined_message_id) {
      query.where('next_predefined_message_id', filter.next_predefined_message_id)
    }

    let predefinedMessageChoiceList

    if (filter.include_reason) {
      query.innerJoin({ _pdm: 'predefined_messages' }, function () {
        this.on('_pdm.id', 'predefined_message_choices.predefined_message_id').onNotIn('_pdm.status', [STATUS_DELETE]).on('_pdm.step', 1)
      })
      predefinedMessageChoiceList = (await query.fetch()).rows

      const nextPredefinedMesasageIds = predefinedMessageChoiceList.map(choice => choice.next_predefined_message_id)
      const allReasons = (await PredefinedMessageChoice.query()
        .whereIn('predefined_message_id', nextPredefinedMesasageIds)
        .whereNot('status', STATUS_DELETE)
        .orderBy('predefined_message_choices.predefined_message_id').fetch()).rows

      predefinedMessageChoiceList = predefinedMessageChoiceList.map(choice => {
        let choiceReasons = allReasons.filter(r => r.predefined_message_id === choice.next_predefined_message_id)
        return {
          ...choice.toJSON(),
          reasons: choiceReasons
        }
      })
    } else {
      predefinedMessageChoiceList = (await query.fetch()).rows
    }

    return predefinedMessageChoiceList
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
