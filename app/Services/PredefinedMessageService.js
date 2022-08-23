'use strict'

const {
  STATUS_DELETE,
  CHAT_TYPE_MESSAGE,
  STATUS_ACTIVE,
  PREDEFINED_MSG_MULTIPLE_ANSWER_CUSTOM_CHOICE,
  CHAT_TYPE_BOT_MESSAGE
} = require('../constants')

const PredefinedMessage = use('App/Models/PredefinedMessage')
const Chat = use('App/Models/Chat')
const PredefinedMessageChoice = use('App/Models/PredefinedMessageChoice')
const PredefinedMessageAnswer = use('App/Models/PredefinedMessageAnswer')
const l = use('Localize')
const HttpException = require('../Exceptions/HttpException')

class PredefinedMessageService {
  static async get(id) {
    return await PredefinedMessage.query()
      .with('choices')
      .where('id', id)
      .whereNot('status', STATUS_DELETE)
      .firstOrFail()
  }

  static async getAll({ type }) {
    const query = PredefinedMessage.query()
      .with('choices')
      .whereNot('status', STATUS_DELETE)

    if (type) {
      query.whereIn('type', Array.isArray(type) ? type : [type])
    }
    return (await query.whereNot('status', STATUS_DELETE)
      .orderBy('step', 'id')
      .fetch()).rows
  }

  static async create(data) {
    return await PredefinedMessage.createItem({ ...data })
  }

  static async update(data) {
    return await PredefinedMessage.query()
      .where({ id: data.id })
      .whereNot('status', STATUS_DELETE)
      .update({
        ...data,
      })
  }

  static async delete(id) {
    return await PredefinedMessage.query().where({ id: id }).update('status', STATUS_DELETE)
  }

  static async handleMessageWithChoice(
    { answer, title, task, predefinedMessage, predefined_message_choice_id, lang },
    trx
  ) {
    let nextPredefinedMessage, choice

    if (predefined_message_choice_id) {
      choice = await PredefinedMessageChoice.query()
        .where({ id: predefined_message_choice_id, predefined_message_id: predefinedMessage.id })
        .whereNot({ status: STATUS_DELETE })
        .first()

      if (!choice) throw new HttpException('Wrong choice selected')

      // Create predefined message answer from tenant's answer
    }

    await PredefinedMessageAnswer.createItem(
      {
        task_id: task.id,
        predefined_message_choice_id,
        predefined_message_id: predefinedMessage.id,
        text: choice ? l.get(choice.text, lang) : answer,
      },
      trx
    )

    // Create chat message from tenant's answer
    const tenantMessage = await Chat.createItem(
      {
        task_id: task.id,
        sender_id: task.tenant_id,
        text: choice ? l.get(choice.text, lang) : answer,
        type: CHAT_TYPE_MESSAGE,
      },
      trx
    )

    if (predefinedMessage.variable_to_update) {
      task[predefinedMessage.variable_to_update] = choice?.value || answer
    }

    if( title ) {
      task.title = title
    }

    // Find the next predefined message
    if (choice && choice.next_predefined_message_id) {
      nextPredefinedMessage = await PredefinedMessage.query()
        .where('id', choice.next_predefined_message_id)
        .firstOrFail()
    } else {
      //if there is not choice, we need to find one to get next predefined message
      nextPredefinedMessage = await PredefinedMessage.query()
        .where({
          step: predefinedMessage.step + 1,
          type: PREDEFINED_MSG_MULTIPLE_ANSWER_CUSTOM_CHOICE,
          status: STATUS_ACTIVE,
        })
        .first()
    }

    return {
      nextPredefinedMessage,
      tenantMessage,
      task,
    }
  }

  static async handleOpenEndedMessage({ task, predefinedMessage, answer, attachments }, trx) {
    // Create predefined message answer from tenant's answer
    await PredefinedMessageAnswer.createItem(
      {
        task_id: task.id,
        predefined_message_id: predefinedMessage.id,
        text: answer,
      },
      trx
    )

    // Create chat message from tenant's answer
    const tenantMessage = await Chat.createItem(
      {
        task_id: task.id,
        sender_id: task.tenant_id,
        text: answer,
        attachments: attachments ? JSON.stringify(attachments) : null,
        type: CHAT_TYPE_MESSAGE,
      },
      trx
    )

    if (predefinedMessage.variable_to_update) {
      task[predefinedMessage.variable_to_update] = answer
    }

    return {
      tenantMessage,
      task,
    }
  }
}

module.exports = PredefinedMessageService
