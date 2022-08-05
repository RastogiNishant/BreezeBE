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
  CHAT_TYPE_BOT_MESSAGE,
} = require('../constants')
const { min, isBoolean } = require('lodash')
const HttpException = use('App/Exceptions/HttpException')
const AppException = use('App/Exceptions/AppException')

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
        task_id: taskId,
      })
      .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
      .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
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
      .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
      .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
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
      .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
      .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
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
            where "type" in ( '${CHAT_TYPE_MESSAGE}', '${CHAT_TYPE_BOT_MESSAGE}' )
            and "sender_id"='${userId}'
            and task_id='${taskId}'
            order by created_at desc
            limit 1)`
        )
      )
      .where('task_id', taskId)
      .whereIn('type', [CHAT_TYPE_MESSAGE, CHAT_TYPE_BOT_MESSAGE])
      .whereNot('edit_status', CHAT_EDIT_STATUS_DELETED)
      .first()
    if (unreadByLastSent) {
      counts.push(parseInt(unreadByLastSent.unread_messages))
    }
    const unreadMessagesCount = min(counts)
    return unreadMessagesCount
  }

  static async getChatMessageAge(id) {
    let ret = await Chat.query()
      .select(Database.raw(`extract(EPOCH from (now() - created_at)) as difference`))
      .where('id', id)
      .first()
    return ret
  }

  static async updateChatMessage({ id, message, attachments }, trx) {
    const query = Chat.query()
      .where('id', id)
      .where('type', CHAT_TYPE_MESSAGE)
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

  static async editMessage({ message, attachments, id }) {
    const trx = await Database.beginTransaction()
    try {
      const chat = await ChatService.getChatMessageAge(id)
      const messageAge = chat?.difference || false

      if (isBoolean(messageAge) && !messageAge) {
        throw new AppException('Chat message not found.')
      }
      if (messageAge > CONNECT_MESSAGE_EDITABLE_TIME_LIMIT) {
        throw new AppException('Chat message not editable anymore.')
      }
      await ChatService.updateChatMessage({ id, message, attachments })
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e)
    }
  }
}

module.exports = ChatService
