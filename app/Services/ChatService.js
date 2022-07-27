'use strict'
const Chat = use('App/Models/Chat')
const Database = use('Database')
const {
  CHAT_TYPE_LAST_READ_MARKER,
  CHAT_TYPE_MESSAGE,
  CONNECT_PREVIOUS_MESSAGES_LIMIT_PER_PULL,
  CONNECT_MESSAGE_EDITABLE_TIME_LIMIT,
  CHAT_EDIT_STATUS_EDITED,
  CHAT_EDIT_STATUS_DELETED,
} = require('../constants')
const { min } = require('lodash')
const HttpException = use('App/Exceptions/HttpException')
const AppException = use('App/Exceptions/AppException')
const PredefinedAnswerService = use('App/Services/PredefinedAnswerService')
const PredefinedMessageService = use('App/Services/PredefinedMessageService')
const PredefinedMessageChoiceService = use('App/Services/PredefinedMessageChoiceService')
const TaskService = use('App/Services/TaskService')
const { isBoolean } = require('lodash')

class ChatService {
  static async markLastRead(userId, taskId) {
    const trx = await Database.beginTransaction()
    try {
      await Chat.query()
        .where({
          type: CHAT_TYPE_LAST_READ_MARKER,
          sender_id: userId,
          task_id: taskId,
        })
        .delete()
        .transacting(trx)

      await Chat.query().insert(
        {
          type: CHAT_TYPE_LAST_READ_MARKER,
          sender_id: userId,
          task_id: taskId,
        },
        trx
      )
      await trx.commit()
    } catch (err) {
      console.log(err)
      await trx.rollback()
    }
  }

  static async save(message, userId, taskId) {
    let data = {}
    if (message.message) {
      data.text = message.message
    } else {
      data.text = message
    }
    if (message.attachments) {
      data.attachments = message.attachments
    }
    data.task_id = taskId
    data.sender_id = userId
    data.type = CHAT_TYPE_MESSAGE
    const chat = await Chat.create(data)
    return chat
  }

  static async getPreviousMessages(taskId, lastId) {
    const query = Chat.query()
      .select('chats.id as id')
      .select('text as message')
      .select('attachments')
      .select('created_at as dateTime')
      .select(Database.raw(`senders.sender`))
      .leftJoin(
        Database.raw(`(select id,
        json_build_object('id', users.id, 'firstname', users.firstname, 
          'secondname', users.secondname, 'avatar', users.avatar
        ) as sender
        from users group by id) as senders`),
        'senders.id',
        'chats.sender_id'
      )
      .where({
        type: CHAT_TYPE_MESSAGE,
        task_id: taskId,
      })
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(CONNECT_PREVIOUS_MESSAGES_LIMIT_PER_PULL)
    if (lastId) {
      query.where('chats.id', '<', lastId)
    }
    let lastMessages = await query.fetch()
    return lastMessages
  }

  static async getUnreadMessagesCount(taskId, userId) {
    //for unread messages
    let counts = []
    const allCount = await Chat.query()
      .select(Database.raw(`count(*) as unread_messages`))
      .where('task_id', taskId)
      .where('type', CHAT_TYPE_MESSAGE)
      .first()

    if (allCount) {
      counts.push(parseInt(allCount.unread_messages))
    }

    const unreadByMarker = await Chat.query()
      .select(Database.raw(`count(*) as unread_messages`))
      .where(
        'created_at',
        '>',
        Database.raw(
          `(select created_at from chats
            where "type"='${CHAT_TYPE_LAST_READ_MARKER}'
            and task_id='${taskId}'
            and sender_id='${userId}'
            order by created_at desc
            limit 1
            )`
        )
      )
      .where('task_id', taskId)
      .where('type', CHAT_TYPE_MESSAGE)
      .first()
    if (unreadByMarker) {
      counts.push(parseInt(unreadByMarker.unread_messages))
    }

    const unreadByLastSent = await Chat.query()
      .select(Database.raw(`count(*) as unread_messages`))
      .where(
        'created_at',
        '>',
        Database.raw(
          `(select created_at from chats
            where "type"='${CHAT_TYPE_MESSAGE}'
            and "sender_id"='${userId}'
            and task_id='${taskId}'
            order by created_at desc
            limit 1)`
        )
      )
      .where('task_id', taskId)
      .where('type', CHAT_TYPE_MESSAGE)
      .first()
    if (unreadByLastSent) {
      counts.push(parseInt(unreadByLastSent.unread_messages))
    }
    const unreadMessagesCount = min(counts)
    return unreadMessagesCount
  }

  static async getChatMessageAge(id) {
    let ret = await Chat.query()
      .select('*', Database.raw(`extract(EPOCH from (now() - created_at)) as difference`))
      .where('id', id)
      .first()
    return ret
  }

  static async updateChatMessage({ id, message, attachments }, trx) {
    const query = Chat.query()
      .where('id', id)
      .update({
        text: message,
        attachments: JSON.stringify(attachments),
        edit_status: CHAT_EDIT_STATUS_EDITED,
      })

    if (!trx) {
      return await query
    }
    return query.transacting(trx)
  }

  static async removeChatMessage(id) {
    const result = await Chat.query()
      .where('id', id)
      .update({ text: '', attachments: null, edit_status: CHAT_EDIT_STATUS_DELETED })
    return result
  }

  static async editMessage({
    user,
    message,
    attachments,
    id,
    predefined_message_answer_id,
    choice_id,
  }) {
    const trx = await Database.beginTransaction()
    try {
      const chat = await this.getChatMessageAge(id)
      const messageAge = chat?.difference || false
      if (isBoolean(messageAge) && !messageAge) {
        /**
         *FIXME: we need to send status code, so we can check in the log system
         * Probably we can check all exceptions to send crtical status code
         */
        throw new AppException('Chat message not found.', 404) // not found
      }
      if (messageAge > CONNECT_MESSAGE_EDITABLE_TIME_LIMIT) {
        throw new AppException('Chat message not editable anymore.', 403) //forbidden
      }

      if (predefined_message_answer_id) {
        const predefinedAnswer = await PredefinedAnswerService.get(predefined_message_answer_id)

        let predefinedMessageChoice = null
        if (choice_id) {
          predefinedMessageChoice =
            await PredefinedMessageChoiceService.getWithPredefinedMessageId({
              id: choice_id,
              predefined_message_id: predefinedAnswer.predefined_message_id,
            })

          await PredefinedAnswerService.update(
            user.id,
            {
              id: predefined_message_answer_id,
              predefined_message_id: predefinedAnswer.predefined_message_id,
              predefined_message_choice_id: choice_id,
              chat_id: id,
              task_id: chat.task_id,
              text: message,
            },
            trx
          )
        }

        const predefinedMessage = await PredefinedMessageService.get(
          predefinedAnswer.predefined_message_id
        )

        if (predefinedMessage.variable_to_update) {
          let task = {
            id: chat.task_id,
          }
          task[predefinedMessage.variable_to_update] = predefinedMessageChoice?.value || message

          await TaskService.update({ user, task }, trx)
        }
      }

      await this.updateChatMessage({ id, message, attachments }, trx)

      await trx.commit()
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e)
    }
  }
}

module.exports = ChatService
